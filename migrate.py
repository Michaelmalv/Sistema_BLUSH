import os
import sys
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

# Cargar variables de entorno
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")  # Se recomienda usar la Service Role Key para migración masiva

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ Error: Las variables de entorno SUPABASE_URL y SUPABASE_KEY son requeridas.")
    print("Por favor, crea un archivo .env en la raíz del proyecto o configúralas en tu terminal.")
    sys.exit(1)

# Inicializar cliente de Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configuración de archivos
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
VENTAS_FILE = os.path.join(DATA_DIR, "Ventaspara sistema.xlsx")
CONTABLE_FILE = os.path.join(DATA_DIR, "Archivo contable para sistema.xlsx")

def check_files_exist():
    if not os.path.exists(VENTAS_FILE):
        print(f"❌ No se encontró el archivo de ventas en: {VENTAS_FILE}")
        sys.exit(1)
    if not os.path.exists(CONTABLE_FILE):
        print(f"❌ No se encontró el archivo contable en: {CONTABLE_FILE}")
        sys.exit(1)

def clean_string(val):
    if pd.isna(val):
        return None
    val_str = str(val).strip()
    if val_str.endswith(".0"):
        val_str = val_str[:-2]
    if val_str == "" or val_str.lower() == "nan" or val_str.lower() == "none":
        return None
    return val_str

def map_forma_pago(val):
    val_clean = clean_string(val)
    if not val_clean:
        return "Efectivo" # Fallback por defecto
    val_lower = val_clean.lower()
    if "tarjeta" in val_lower or "tc" in val_lower:
        return "Tarjeta"
    elif "deuna" in val_lower or "de una" in val_lower:
        return "Deuna"
    elif "transf" in val_lower or "banco" in val_lower:
        return "Transferencia"
    else:
        return "Efectivo"

def main():
    check_files_exist()
    print("🚀 Iniciando migración de datos para Blush...")
    
    # ==========================================
    # 1. Cargar y consolidar ventas (Historial)
    # ==========================================
    print("📂 Leyendo archivo de ventas...")
    xls_ventas = pd.ExcelFile(VENTAS_FILE)
    sheet_names = xls_ventas.sheet_names
    print(f"Hojas encontradas: {sheet_names}")
    
    all_sales = []
    for sheet in sheet_names:
        # Se asume que las hojas son los meses
        df = pd.read_excel(VENTAS_FILE, sheet_name=sheet)
        if df.empty:
            continue
        # Renombrar columnas para estandarizar en caso de ligeras variaciones
        df.columns = [c.strip() for c in df.columns]
        df["Hoja_Origen"] = sheet
        all_sales.append(df)
        
    df_sales = pd.concat(all_sales, ignore_index=True)
    print(f"Total registros cargados de ventas: {len(df_sales)}")
    
    # Limpieza básica
    df_sales["Cliente"] = df_sales["Cliente"].apply(clean_string)
    df_sales["Cédula"] = df_sales["Cédula"].apply(clean_string)
    df_sales["Correo"] = df_sales["Correo"].apply(clean_string)
    df_sales["Medio de contacto"] = df_sales["Medio de contacto"].apply(clean_string)
    df_sales["Servicios"] = df_sales["Servicios"].apply(clean_string)
    df_sales["Manicurista"] = df_sales["Manicurista"].apply(clean_string)
    df_sales["Valor"] = pd.to_numeric(df_sales["Valor"], errors="coerce").fillna(0.0)
    df_sales["Forma de pago_Mapeada"] = df_sales["Forma de pago"].apply(map_forma_pago)
    df_sales["No. Transferencia"] = df_sales["No. Transferencia"].apply(clean_string)
    
    # Estandarizar Fechas
    df_sales["Fecha"] = pd.to_datetime(df_sales["Fecha"], errors="coerce")
    # Filtrar registros sin fecha o sin cliente
    df_sales = df_sales.dropna(subset=["Fecha", "Cliente"])
    print(f"Registros de ventas válidos después de limpieza de fecha/cliente: {len(df_sales)}")

    # ==========================================
    # 2. Extraer y migrar Personal (Manicuristas)
    # ==========================================
    print("\n👥 Migrando Personal...")
    manicuristas_unicas = df_sales["Manicurista"].dropna().unique()
    personal_db_map = {}
    
    for staff_name in manicuristas_unicas:
        # Verificar si ya existe o crearlo
        try:
            res = supabase.table("personal").select("id").eq("nombre", staff_name).execute()
            if res.data:
                personal_db_map[staff_name] = res.data[0]["id"]
            else:
                insert_res = supabase.table("personal").insert({
                    "nombre": staff_name,
                    "cargo": "Manicurista",
                    "activo": True
                }).execute()
                personal_db_map[staff_name] = insert_res.data[0]["id"]
        except Exception as e:
            print(f"⚠️ Error al migrar manicurista '{staff_name}': {e}")
            
    print(f"Personal migrado/mapeado: {len(personal_db_map)}")

    # ==========================================
    # 3. Extraer y migrar Servicios (Normalización)
    # ==========================================
    print("\n💅 Migrando Servicios (Ingeniería Inversa)...")
    # Agrupamos por nombre de servicio para encontrar el precio base más común (moda)
    servicios_unicos = df_sales.dropna(subset=["Servicios"])
    servicio_precios = servicios_unicos.groupby("Servicios")["Valor"].agg(lambda x: x.mode()[0] if not x.mode().empty else x.mean()).to_dict()
    
    servicios_db_map = {}
    for svc_name, base_price in servicio_precios.items():
        try:
            res = supabase.table("servicios").select("id").eq("nombre", svc_name).execute()
            if res.data:
                servicios_db_map[svc_name] = res.data[0]["id"]
            else:
                # Frecuencia sugerida por defecto
                frecuencia_dias = None
                svc_lower = svc_name.lower()
                if "acrílic" in svc_lower or "acrilic" in svc_lower or "rubber" in svc_lower:
                    frecuencia_dias = 21 # 21 días para retoques comunes
                elif "permanente" in svc_lower:
                    frecuencia_dias = 15
                elif "keratina" in svc_lower or "alisado" in svc_lower:
                    frecuencia_dias = 90
                
                insert_res = supabase.table("servicios").insert({
                    "nombre": svc_name,
                    "precio_base": float(base_price),
                    "duracion_minutos": 45, # Duración por defecto estimada
                    "frecuencia_recomendada_dias": frecuencia_dias
                }).execute()
                servicios_db_map[svc_name] = insert_res.data[0]["id"]
        except Exception as e:
            print(f"⚠️ Error al migrar servicio '{svc_name}': {e}")
            
    print(f"Servicios migrados/mapeados: {len(servicios_db_map)}")

    # ==========================================
    # 4. Extraer y migrar Clientes
    # ==========================================
    print("\n👤 Migrando Clientes...")
    # Agrupar clientes para evitar duplicados. Preferimos agrupar por Cédula si existe, si no por Nombre.
    clientes_unicos = {}
    for idx, row in df_sales.iterrows():
        nombre = clean_string(row["Cliente"])
        cedula = clean_string(row["Cédula"])
        correo = clean_string(row["Correo"])
        medio = clean_string(row["Medio de contacto"])
        
        key = cedula if cedula else f"NOM_{nombre}"
        if key not in clientes_unicos:
            clientes_unicos[key] = {
                "nombre": nombre,
                "cedula": cedula,
                "correo": correo,
                "medio_contacto": medio
            }
        else:
            # Rellenar información si estaba incompleta en el primer registro
            if not clientes_unicos[key]["cedula"] and cedula:
                clientes_unicos[key]["cedula"] = cedula
            if not clientes_unicos[key]["correo"] and correo:
                clientes_unicos[key]["correo"] = correo
            if not clientes_unicos[key]["medio_contacto"] and medio:
                clientes_unicos[key]["medio_contacto"] = medio

    clientes_db_map = {}
    for key, c_info in clientes_unicos.items():
        try:
            # Buscar por cédula si existe
            res = None
            if c_info["cedula"]:
                res = supabase.table("clientes").select("id").eq("cedula", c_info["cedula"]).execute()
            
            if res and res.data:
                clientes_db_map[key] = res.data[0]["id"]
            else:
                # Buscar por nombre si no tiene cédula
                res_name = supabase.table("clientes").select("id").eq("nombre", c_info["nombre"]).execute()
                if res_name.data:
                    clientes_db_map[key] = res_name.data[0]["id"]
                else:
                    insert_res = supabase.table("clientes").insert({
                        "nombre": c_info["nombre"],
                        "cedula": c_info["cedula"],
                        "correo": c_info["correo"],
                        "medio_contacto": c_info["medio_contacto"]
                    }).execute()
                    clientes_db_map[key] = insert_res.data[0]["id"]
        except Exception as e:
            print(f"⚠️ Error al migrar cliente '{c_info['nombre']}': {e}")
            
    print(f"Clientes migrados/mapeados: {len(clientes_db_map)}")

    # ==========================================
    # 5. Insertar Citas / Ventas Históricas
    # ==========================================
    print("\n📅 Migrando Historial de Citas y Ventas...")
    citas_batch = []
    for idx, row in df_sales.iterrows():
        nombre_cli = clean_string(row["Cliente"])
        cedula_cli = clean_string(row["Cédula"])
        key_cli = cedula_cli if cedula_cli else f"NOM_{nombre_cli}"
        
        cliente_id = clientes_db_map.get(key_cli)
        servicio_id = servicios_db_map.get(clean_string(row["Servicios"]))
        personal_id = personal_db_map.get(clean_string(row["Manicurista"]))
        
        if not cliente_id or not servicio_id or not personal_id:
            # Omitir si no se mapeó correctamente alguna de las relaciones requeridas
            continue
            
        forma_pago = row["Forma de pago_Mapeada"]
        no_ref = clean_string(row["No. Transferencia"])
        
        # Evitar fallo de restricción check_digital_reference
        if forma_pago in ["Deuna", "Transferencia"] and (not no_ref or no_ref.strip() == ""):
            no_ref = f"MIG_REF_{idx}"  # Referencia ficticia para auditoría de migración
            
        citas_batch.append({
            "cliente_id": cliente_id,
            "servicio_id": servicio_id,
            "personal_id": personal_id,
            "fecha_hora": row["Fecha"].isoformat(),
            "valor_pagado": float(row["Valor"]),
            "forma_pago": forma_pago,
            "no_transferencia": no_ref
        })
        
        # Insertar en lotes de 100
        if len(citas_batch) >= 100:
            try:
                supabase.table("citas_ventas").insert(citas_batch).execute()
                citas_batch = []
            except Exception as e:
                print(f"⚠️ Error al insertar lote de ventas: {e}")
                
    # Insertar remanente
    if citas_batch:
        try:
            supabase.table("citas_ventas").insert(citas_batch).execute()
        except Exception as e:
            print(f"⚠️ Error al insertar último lote de ventas: {e}")
            
    print("Ventas migradas con éxito.")

    # ==========================================
    # 6. Migrar Gastos (Archivo Contable)
    # ==========================================
    print("\n💸 Migrando Gastos...")
    try:
        df_gastos = pd.read_excel(CONTABLE_FILE, sheet_name="Gastos")
        df_gastos.columns = [c.strip() for c in df_gastos.columns]
        
        # Limpieza de gastos
        df_gastos["fecha"] = pd.to_datetime(df_gastos["fecha"], errors="coerce")
        df_gastos = df_gastos.dropna(subset=["fecha", "concepto"])
        
        gastos_batch = []
        for idx, row in df_gastos.iterrows():
            total = pd.to_numeric(row["Total"], errors="coerce")
            if pd.isna(total) or total <= 0:
                continue
                
            qty = pd.to_numeric(row["Cantidad"], errors="coerce")
            qty = float(qty) if not pd.isna(qty) else 1.0
            
            unit_val = pd.to_numeric(row["Valor unitario"], errors="coerce")
            unit_val = float(unit_val) if not pd.isna(unit_val) else float(total)
            
            gastos_batch.append({
                "fecha": row["fecha"].date().isoformat(),
                "factura": clean_string(row["Factura"]),
                "cantidad": qty,
                "concepto": clean_string(row["concepto"]),
                "valor_unitario": unit_val,
                "total": float(total),
                "forma_pago": clean_string(row["FORMA DE PAGO"]) or "Efectivo",
                "cuenta": clean_string(row["CUENTA"]) or "Caja Principal"
            })
            
            if len(gastos_batch) >= 100:
                supabase.table("gastos").insert(gastos_batch).execute()
                gastos_batch = []
                
        if gastos_batch:
            supabase.table("gastos").insert(gastos_batch).execute()
            
        print(f"Gastos migrados con éxito: {len(df_gastos)} registros procesados.")
        
    except Exception as e:
        print(f"⚠️ Error al procesar o migrar gastos: {e}")

    print("\n✨ Migración finalizada con éxito. ¡Blush ahora está centralizado en Supabase! ✨")

if __name__ == "__main__":
    main()
