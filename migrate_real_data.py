import os
import re
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Cargar variables de entorno
load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: No se encontraron credenciales de Supabase en el archivo .env.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

DATA_DIR = r'c:\Users\User\Desktop\SISTEMA_BLUSH\data'
PLANTILLA_FILE = os.path.join(DATA_DIR, 'Plantillas_Carga_Masiva_Blush_Beauty.xlsx')
VENTAS_FILE = os.path.join(DATA_DIR, 'Ventaspara sistema.xlsx')
INFORMACION_FILE = os.path.join(DATA_DIR, 'Informacio\u0301n sistema.xlsx') # Excel con la 'o\u0301'
if not os.path.exists(INFORMACION_FILE):
    INFORMACION_FILE = os.path.join(DATA_DIR, 'Informacion sistema.xlsx')

# Matriz Central Branch ID
SUCURSAL_CENTRAL = '11111111-1111-1111-1111-111111111111'

def clean_string(val):
    if pd.isna(val):
        return ""
    return str(val).strip()

def clean_phone(val):
    if pd.isna(val) or val is None:
        return None
    val_str = str(val).strip()
    if val_str.endswith('.0'):
        # Quitar el decimal .0 que agrega pandas cuando lee celdas numericas
        val_str = val_str[:-2]
    cleaned = re.sub(r'\D', '', val_str)
    if len(cleaned) < 7:
        return None
    # Si tiene 9 digitos y empieza con 9, agregar el 0 inicial (para formato Ecuador: 09...)
    if len(cleaned) == 9 and cleaned.startswith('9'):
        cleaned = '0' + cleaned
    return cleaned

def clean_cedula(val):
    if pd.isna(val) or val is None:
        return None
    val_str = str(val).strip()
    if val_str.endswith('.0'):
        val_str = val_str[:-2]
    cleaned = re.sub(r'\D', '', val_str)
    if len(cleaned) < 9 or len(cleaned) > 13:
        return None
    if len(cleaned) == 9:
        cleaned = '0' + cleaned
    return cleaned

def clean_frequency(val):
    if pd.isna(val) or val is None:
        return None
    val_str = str(val).strip()
    if val_str.endswith('.0'):
        val_str = val_str[:-2]
    # Extraer digitos (ej. '15 dias' -> 15)
    digits = re.sub(r'\D', '', val_str)
    return int(digits) if digits else None

def safe_int(val, default=0):
    if pd.isna(val) or val is None:
        return default
    val_str = str(val).strip()
    if val_str.endswith('.0'):
        val_str = val_str[:-2]
    digits = re.sub(r'\D', '', val_str)
    try:
        return int(digits) if digits else default
    except:
        return default

def safe_float(val, default=None):
    if pd.isna(val) or val is None:
        return default
    val_str = str(val).strip()
    val_str = val_str.replace(',', '.')
    cleaned = re.sub(r'[^\d\.]', '', val_str)
    try:
        return float(cleaned) if cleaned else default
    except:
        return default

def map_forma_pago(val):
    val_clean = clean_string(val).lower()
    if 'efec' in val_clean:
        return 'Efectivo'
    elif 'deuna' in val_clean or 'de una' in val_clean:
        return 'Deuna'
    elif 'transf' in val_clean:
        return 'Transferencia'
    elif 'tarj' in val_clean or 'cred' in val_clean or 'deb' in val_clean:
        return 'Tarjeta'
    return 'Efectivo'

def chunk_list(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

def truncate_tables():
    print("Limpiando base de datos existente...")
    tables_to_clear = [
        "registro_reposiciones_inventario",
        "citas_ventas",
        "gastos",
        "productos",
        "clientes",
        "personal",
        "servicios"
    ]
    for table in tables_to_clear:
        try:
            print(f"  Borrando tabla '{table}'...")
            supabase.from_(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        except Exception as e:
            # Algunas tablas pueden no existir en el esquema y es seguro continuar
            pass
    print("Base de datos limpia.")

def main():
    truncate_tables()
    
    personal_map = {}
    servicios_map = {}
    clientes_map = {}
    
    print("\nCargando archivos de Excel...")
    xl_plantilla = pd.ExcelFile(PLANTILLA_FILE)
    xl_ventas = pd.ExcelFile(VENTAS_FILE)
    xl_info = pd.ExcelFile(INFORMACION_FILE)
    
    # ==========================================
    # 1. Migrar Personal (Manicuristas)
    # ==========================================
    print("\nExtrayendo y migrando personal...")
    df_sales_plantilla = xl_plantilla.parse('5. Citas y Ventas', header=1)
    personal_names = set(df_sales_plantilla['personal'].dropna().astype(str).str.strip())
    
    for sh in xl_ventas.sheet_names:
        if sh == 'Resumen de ventas': continue
        df_v = xl_ventas.parse(sh)
        if 'Manicurista' in df_v.columns:
            personal_names.update(df_v['Manicurista'].dropna().astype(str).str.strip())
            
    personal_names = {n for n in personal_names if n and n.lower() != 'nan' and n.lower() != 'personal'}
    
    for p_name in personal_names:
        try:
            res = supabase.from_("personal").insert({
                "nombre": p_name,
                "cargo": "Manicurista",
                "activo": True
            }).execute()
            if res.data:
                personal_map[p_name.lower()] = res.data[0]["id"]
                print(f"  Manicurista insertada: {p_name}")
        except Exception as e:
            print(f"  Error al insertar personal '{p_name}': {e}")
            
    # ==========================================
    # 2. Migrar Servicios (EXCLUSIVO CATALOGOS)
    # ==========================================
    print("\nMigrando catalogo oficial de servicios...")
    df_serv1 = xl_plantilla.parse('2. Servicios', header=1).dropna(subset=['nombre'])
    df_serv2 = xl_info.parse('Servicios', header=1).dropna(subset=['nombre'])
    
    catalog_services = {}
    for df_s in [df_serv1, df_serv2]:
        for idx, row in df_s.iterrows():
            s_name = clean_string(row['nombre'])
            if not s_name or s_name.lower() == 'nan':
                continue
            
            p_base = safe_float(row.get('precio_base'), 10.0)
            dur = safe_int(row.get('duracion_minutos'), 45)
            freq = clean_frequency(row.get('frecuencia_recomendada_dias'))
            
            s_key = s_name.lower()
            if s_key not in catalog_services:
                catalog_services[s_key] = {
                    "nombre": s_name,
                    "precio_base": p_base,
                    "duracion_minutos": dur,
                    "frecuencia_recomendada_dias": freq
                }
                
    # Insertar servicios en la base de datos
    for s_key, s_data in catalog_services.items():
        try:
            res = supabase.from_("servicios").insert(s_data).execute()
            if res.data:
                servicios_map[s_key] = res.data[0]["id"]
                print(f"  Servicio catalogo insertado: {s_data['nombre']}")
        except Exception as e:
            print(f"  Error al insertar servicio '{s_data['nombre']}': {e}")

    # ==========================================
    # 3. Migrar Clientes (Deduplicados por cedula)
    # ==========================================
    print("\nMigrando catalogo de clientes...")
    df_clients_plantilla = xl_plantilla.parse('3. Clientes', header=1).dropna(subset=['Nombre'])
    
    clientes_procesados = {}
    cedula_to_key = {}
    name_to_key = {}
    
    for idx, row in df_clients_plantilla.iterrows():
        nombre = clean_string(row['Nombre'])
        if not nombre or nombre.lower() == 'nan':
            continue
        cedula = clean_cedula(row.get('Cédula'))
        celular = clean_phone(row.get('celular'))
        correo = clean_string(row.get('correo'))
        if not correo or correo.lower() == 'nan' or '@' not in correo:
            correo = None
        medio = clean_string(row.get('medio_contacto'))
        
        if not celular and medio:
            phone_check = re.sub(r'\D', '', medio)
            if phone_check.isdigit() and len(phone_check) >= 7:
                celular = clean_phone(medio)
                medio = "WhatsApp"
                
        if not medio:
            medio = "WhatsApp"
            
        # Determinar clave unica
        target_key = None
        if cedula and cedula in cedula_to_key:
            target_key = cedula_to_key[cedula]
        elif nombre.lower() in name_to_key:
            target_key = name_to_key[nombre.lower()]
            
        if target_key:
            # Consolidar en registro existente
            c_existing = clientes_procesados[target_key]
            if not c_existing["cedula"] and cedula:
                c_existing["cedula"] = cedula
                cedula_to_key[cedula] = target_key
            if not c_existing["celular"] and celular:
                c_existing["celular"] = celular
            if not c_existing["correo"] and correo:
                c_existing["correo"] = correo
        else:
            # Nuevo registro
            new_key = cedula if cedula else f"NOM_{nombre.lower()}"
            clientes_procesados[new_key] = {
                "nombre": nombre,
                "cedula": cedula,
                "celular": celular,
                "correo": correo,
                "medio_contacto": medio
            }
            name_to_key[nombre.lower()] = new_key
            if cedula:
                cedula_to_key[cedula] = new_key

    # Insertar clientes en lotes
    clientes_list = list(clientes_procesados.values())
    print(f"Insertando {len(clientes_list)} clientes unicos (deduplicados)...")
    for chunk in chunk_list(clientes_list, 100):
        try:
            res = supabase.from_("clientes").insert(chunk).execute()
            if res.data:
                for c_inserted in res.data:
                    c_name_lower = c_inserted["nombre"].lower()
                    clientes_map[c_name_lower] = c_inserted["id"]
                    if c_inserted.get("cedula"):
                        clientes_map[c_inserted["cedula"]] = c_inserted["id"]
        except Exception as e:
            print(f"  Error en lote de insercion de clientes: {e}")

    # ==========================================
    # 4. Migrar Productos (INVENTARIO COMPLETO)
    # ==========================================
    print("\nMigrando catalogo de productos de ambos excels...")
    df_prod1 = xl_plantilla.parse('1. Productos', header=1).dropna(subset=['nombre'])
    df_prod2 = xl_info.parse('Productos', header=1).dropna(subset=['nombre'])
    
    productos_procesados = {}
    for df_p in [df_prod1, df_prod2]:
        for idx, row in df_p.iterrows():
            p_name = clean_string(row['nombre'])
            if not p_name or p_name.lower() == 'nan':
                continue
            p_desc = clean_string(row.get('descripcion'))
            p_tipo = clean_string(row.get('tipo', 'insumo')).lower()
            if p_tipo not in ['insumo', 'reventa']:
                p_tipo = 'insumo'
                
            stock = safe_int(row.get('stock_actual'), 0)
            stock_min = safe_int(row.get('stock_minimo'), 4)
            p_venta_val = safe_float(row.get('precio_venta'), None)
            
            p_key = p_name.lower()
            if p_key not in productos_procesados:
                productos_procesados[p_key] = {
                    "nombre": p_name,
                    "descripcion": p_desc if p_desc else None,
                    "tipo": p_tipo,
                    "stock_actual": stock,
                    "stock_minimo": stock_min,
                    "precio_venta": p_venta_val,
                    "sucursal_id": SUCURSAL_CENTRAL
                }
                
    productos_list = list(productos_procesados.values())
    print(f"Insertando {len(productos_list)} productos en inventario para Matriz Central...")
    for chunk in chunk_list(productos_list, 100):
        try:
            supabase.from_("productos").insert(chunk).execute()
        except Exception as e:
            print(f"  Error al insertar lote de productos: {e}")

    # ==========================================
    # 5. Migrar Gastos (Egresos)
    # ==========================================
    print("\nMigrando registro de gastos...")
    df_gastos = xl_plantilla.parse('4. Gastos', header=1)
    df_gastos['fecha'] = df_gastos['fecha'].ffill()
    df_gastos['factura'] = df_gastos['factura'].ffill()
    df_gastos['forma_pago'] = df_gastos['forma_pago'].ffill()
    df_gastos['cuenta'] = df_gastos['cuenta'].ffill()
    df_gastos = df_gastos.dropna(subset=['fecha', 'concepto'])
    gastos_batch = []
    
    for idx, row in df_gastos.iterrows():
        g_fecha = None
        try:
            g_fecha = pd.to_datetime(row['fecha']).strftime('%Y-%m-%d')
        except:
            continue
            
        fact = clean_string(row.get('factura'))
        cant = safe_float(row.get('cantidad'), 1.0)
        if cant <= 0:
            cant = 1.0
        concp = clean_string(row['concepto'])
        
        v_unit = safe_float(row.get('valor_unitario'), 0.0)
        tot = safe_float(row.get('total'), 0.0)
        
        if tot <= 0 and v_unit > 0:
            tot = v_unit * cant
        elif v_unit <= 0 and tot > 0:
            v_unit = tot / cant
            
        f_pago = clean_string(row.get('forma_pago', 'Efectivo'))
        if not f_pago:
            f_pago = 'Efectivo'
        ct = clean_string(row.get('cuenta', 'Caja Chica'))
        if not ct:
            ct = 'Caja Chica'
            
        gastos_batch.append({
            "fecha": g_fecha,
            "factura": fact if fact else None,
            "cantidad": cant,
            "concepto": concp,
            "valor_unitario": v_unit,
            "total": tot,
            "forma_pago": f_pago,
            "cuenta": ct,
            "sucursal_id": SUCURSAL_CENTRAL # Asignar a Matriz Central
        })
        
    print(f"Insertando {len(gastos_batch)} gastos en Matriz Central...")
    for chunk in chunk_list(gastos_batch, 100):
        try:
            supabase.from_("gastos").insert(chunk).execute()
        except Exception as e:
            print(f"  Error al insertar lote de gastos: {e}")

    # ==========================================
    # 6. Migrar y Unificar Citas y Ventas
    # ==========================================
    print("\nUnificando y migrando citas y ventas...")
    
    # A. Cargar ventas de Plantilla
    df_sales_p = xl_plantilla.parse('5. Citas y Ventas', header=1).dropna(subset=['cliente', 'servicio', 'fecha_hora'])
    sales_list = []
    
    for idx, row in df_sales_p.iterrows():
        c_name = clean_string(row['cliente'])
        s_name = clean_string(row['servicio'])
        p_name = clean_string(row['personal'])
        
        f_hora = pd.to_datetime(row['fecha_hora'], errors='coerce')
        if pd.isna(f_hora):
            continue
        if f_hora.year == 2028:
            f_hora = f_hora.replace(year=2026)
        if f_hora.year < 2025:
            continue
            
        val = safe_float(row.get('valor_pagado'), 0.0)
        f_pago = map_forma_pago(row.get('forma_pago'))
        no_trans = clean_string(row.get('no_transferencia(si existe)'))
        
        if f_pago in ['Deuna', 'Transferencia'] and not no_trans:
            no_trans = 'TRANSF_REG'
            
        sales_list.append({
            "cliente": c_name,
            "servicio": s_name,
            "personal": p_name,
            "fecha_hora": f_hora,
            "valor_pagado": val,
            "forma_pago": f_pago,
            "no_transferencia": no_trans if no_trans else None
        })
        
    # B. Cargar ventas de Ventaspara
    for sh in xl_ventas.sheet_names:
        if sh == 'Resumen de ventas': continue
        df_v = xl_ventas.parse(sh)
        date_col = 'Fecha' if 'Fecha' in df_v.columns else ('4' if '4' in df_v.columns else None)
        if 'Cliente' in df_v.columns and 'Servicios' in df_v.columns and date_col:
            df_v = df_v.dropna(subset=['Cliente', 'Servicios', date_col])
            for idx, row in df_v.iterrows():
                c_name = clean_string(row['Cliente'])
                s_name = clean_string(row['Servicios'])
                p_name = clean_string(row['Manicurista'])
                
                f_hora = pd.to_datetime(row[date_col], errors='coerce')
                if pd.isna(f_hora):
                    continue
                if f_hora.year == 2028:
                    f_hora = f_hora.replace(year=2026)
                if f_hora.year < 2025:
                    continue
                    
                val = safe_float(row.get('Valor'), 0.0)
                f_pago = map_forma_pago(row.get('Forma de pago'))
                
                tx_col = 'No. Transferencia' if 'No. Transferencia' in df_v.columns else ('No. Transferencia(si existe)' if 'No. Transferencia(si existe)' in df_v.columns else None)
                no_trans = clean_string(row[tx_col]) if tx_col else ""
                
                if f_pago in ['Deuna', 'Transferencia'] and not no_trans:
                    no_trans = 'TRANSF_REG'
                    
                sales_list.append({
                    "cliente": c_name,
                    "servicio": s_name,
                    "personal": p_name,
                    "fecha_hora": f_hora,
                    "valor_pagado": val,
                    "forma_pago": f_pago,
                    "no_transferencia": no_trans if no_trans else None
                })
                
    df_sales_all = pd.DataFrame(sales_list)
    print(f"Total ventas antes de deduplicacion: {len(df_sales_all)}")
    
    # Crear claves de comparación
    df_sales_all['key_cliente'] = df_sales_all['cliente'].str.lower().str.replace(r'\s+', '', regex=True)
    df_sales_all['key_servicio'] = df_sales_all['servicio'].str.lower().str.replace(r'\s+', '', regex=True)
    df_sales_all['key_personal'] = df_sales_all['personal'].str.lower().str.replace(r'\s+', '', regex=True)
    df_sales_all['key_fecha'] = df_sales_all['fecha_hora'].dt.strftime('%Y-%m-%d')
    df_sales_all['key_valor'] = df_sales_all['valor_pagado'].round(2)
    
    df_sales_dedup = df_sales_all.drop_duplicates(subset=['key_cliente', 'key_servicio', 'key_fecha', 'key_valor'])
    print(f"Total ventas unicas a insertar: {len(df_sales_dedup)}")
    
    # Mapear e insertar
    sales_final_batch = []
    
    def find_service_id(txn_s_name):
        t_clean = txn_s_name.lower().strip()
        if t_clean in servicios_map:
            return servicios_map[t_clean]
        for cat_name, s_id in servicios_map.items():
            if cat_name in t_clean or t_clean in cat_name:
                return s_id
        if servicios_map:
            return list(servicios_map.values())[0]
        return None

    for idx, row in df_sales_dedup.iterrows():
        c_name = row['cliente']
        s_name = row['servicio']
        p_name = row['personal']
        
        c_key = c_name.lower()
        p_key = p_name.lower()
        
        if c_key not in clientes_map:
            try:
                res = supabase.from_("clientes").insert({
                    "nombre": c_name,
                    "medio_contacto": "WhatsApp"
                }).execute()
                if res.data:
                    c_id = res.data[0]["id"]
                    clientes_map[c_key] = c_id
                else:
                    continue
            except:
                continue
        else:
            c_id = clientes_map[c_key]
            
        s_id = find_service_id(s_name)
        p_id = personal_map.get(p_key)
        
        if not s_id or not p_id:
            continue
            
        val_val = float(row['valor_pagado'])
        if pd.isna(val_val) or val_val != val_val:
            val_val = 0.0
            
        no_trans_val = row['no_transferencia']
        if pd.isna(no_trans_val) or no_trans_val is None or str(no_trans_val).lower() == 'nan' or not str(no_trans_val).strip():
            no_trans_val = None
        else:
            no_trans_val = str(no_trans_val).strip()
            
        sales_final_batch.append({
            "cliente_id": c_id,
            "servicio_id": s_id,
            "personal_id": p_id,
            "fecha_hora": row['fecha_hora'].strftime('%Y-%m-%dT%H:%M:%S+00:00'),
            "valor_pagado": val_val,
            "forma_pago": row['forma_pago'],
            "no_transferencia": no_trans_val,
            "sucursal_id": SUCURSAL_CENTRAL # Asignar a Matriz Central
        })
        
    print(f"Insertando {len(sales_final_batch)} ventas mapeadas en Matriz Central...")
    inserted_sales_count = 0
    for chunk in chunk_list(sales_final_batch, 100):
        try:
            res = supabase.from_("citas_ventas").insert(chunk).execute()
            if res.data:
                inserted_sales_count += len(res.data)
        except Exception as e:
            print(f"  Error al insertar lote de citas/ventas: {e}")
            
    print(f"Migracion completada exitosamente. Total ventas insertadas: {inserted_sales_count}")

if __name__ == "__main__":
    main()
