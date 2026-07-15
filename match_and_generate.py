import os
import re
import json
import unicodedata
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
GASTOS_EXCEL = "gastos.xlsx"

MANUAL_OVERRIDES = {
    'drill': 29.74, 
    'ablandador de callos': 6.50, 
    'mascara ploma': 1.80, 
    'parches funda ploma': 2.20,
    'discos reemplazable sandig': 4.50,
    'glue bolm 15 gr inconsign': 3.13, 
    'pinceles estuche rosado': 5.50,
    'punteros': 1.74, 
    'perfiladores largos 3 paquetes': 2.50,
    'perfiladores mediano 3 unidades': 1.80,
    'imanes': 2.17, 
    'paquete  de repunjador metalico': 3.50,
    'gotas astricare mollie': 3.50,
    'nail glue the original': 3.13, 
    'solon pro hair bonding glue': 3.13, 
    'fundas de sacheto pps': 2.80,
    'beauty tool cuchillas': 1.50,
    'glan nail profesional tools': 0.61, 
    'perfiladores de beauty eyebrow razo': 1.80,
    'demert nail enamel dryer tarro rojo': 7.50,
    'sandalias paquete + 8 pares': 6.80,
    'cofias': 4.50,
    'glan nails pink': 0.61, 
    'xeijayi': 3.50,
    'caja de peitn de temo': 4.20,
    'piedreria': 3.50
}

def normalize_text(text):
    if not text or pd.isna(text):
        return ""
    t = str(text).lower().strip()
    t = "".join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn')
    t = re.sub(r'[^a-z0-9]', ' ', t)
    return " ".join(t.split())

def get_tokens(text):
    text_norm = normalize_text(text)
    stopwords = {'de', 'para', 'con', 'el', 'la', 'los', 'las', 'un', 'una', 'y', 'o', 'en', 'del', 'al', 'los'}
    tokens = [w for w in text_norm.split() if w not in stopwords and len(w) > 1]
    cleaned = []
    for tok in tokens:
        if tok.endswith('s') and len(tok) > 3:
            cleaned.append(tok[:-1])
        else:
            cleaned.append(tok)
    return set(cleaned)

def compute_similarity(tokens_a, tokens_b):
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = tokens_a.intersection(tokens_b)
    containment = len(intersection) / min(len(tokens_a), len(tokens_b))
    jaccard = len(intersection) / len(tokens_a.union(tokens_b))
    return 0.6 * containment + 0.4 * jaccard

def get_provider_for_product(name, matched_prov=None, matched_ruc=None):
    if matched_prov and matched_prov != 'None' and matched_prov != 'nan' and matched_prov != 'Distribuidor General':
        return matched_prov, matched_ruc
        
    n_lower = name.lower()
    
    # Pre-defined mappings for the 3 main ones
    if 'gel pro' in n_lower or 'esmaltes gel pro' in n_lower:
        return 'OPI Distribuidor', '1792938475001'
    if 'removedor' in n_lower and 'premium' in n_lower:
        return 'Belleza Total S.A.', '1792223334001'
    if 'cuticula coco' in n_lower:
        return 'Cosméticos Ec', '1794445556001'
        
    return None, None

def main():
    print("1. Fetching products from Supabase...")
    res = supabase.from_("productos").select("*").execute()
    db_products = res.data
    print(f"Found {len(db_products)} products.")

    print("2. Reading gastos.xlsx sheet 'Gastos'...")
    df_gastos = pd.read_excel(GASTOS_EXCEL, sheet_name='Gastos')
    df_gastos = df_gastos.dropna(subset=['concepto'])

    # Build reference price dictionary
    ref_prices = {}
    for idx, row in df_gastos.iterrows():
        concept = str(row['concepto']).strip()
        val_unit = row.get('Valor unitario') or row.get('valor_unitario') or row.get('valor')
        fecha = row.get('fecha')
        
        fecha_str = None
        if fecha and not pd.isna(fecha):
            try:
                fecha_str = pd.to_datetime(fecha).strftime('%Y-%m-%d')
            except:
                pass

        try:
            val_unit = float(val_unit)
        except:
            continue

        concept_lower = concept.lower()
        if concept_lower not in ref_prices or (fecha_str and not ref_prices[concept_lower]['fecha']):
            ref_prices[concept_lower] = {
                'concept': concept,
                'price': val_unit,
                'fecha': fecha_str,
                'ruc': str(row.get('RUC PROVEEDOR')) if 'RUC PROVEEDOR' in row else None,
                'proveedor': str(row.get('PROVEEDOR / DISTRIBUIDOR')) if 'PROVEEDOR / DISTRIBUIDOR' in row else None
            }

    print(f"Extracted {len(ref_prices)} unique price references from Excel.")

    # Fetch from database gastos table for additional references
    print("3. Querying Supabase 'gastos' table...")
    try:
        res_gastos = supabase.from_("gastos").select("*").execute()
        for row in res_gastos.data:
            concept = str(row['concepto']).strip()
            val_unit = row.get('valor_unitario')
            fecha = row.get('fecha')
            try:
                val_unit = float(val_unit)
            except:
                continue
            concept_lower = concept.lower()
            if concept_lower not in ref_prices:
                ref_prices[concept_lower] = {
                    'concept': concept,
                    'price': val_unit,
                    'fecha': str(fecha) if fecha else None,
                    'ruc': None,
                    'proveedor': None
                }
    except Exception as e:
        print(f"Error querying database expenses: {e}")

    # Match and calculate prices
    matched_updates = []

    for p in db_products:
        p_name = p['nombre']
        p_tokens = get_tokens(p_name)
        
        # Check manual overrides first
        matched_override = False
        p_name_lower = p_name.lower().strip()
        for ov_key, ov_val in MANUAL_OVERRIDES.items():
            if ov_key == p_name_lower or ov_key in p_name_lower:
                prov_name, prov_ruc = get_provider_for_product(p_name)
                matched_updates.append({
                    'product': p,
                    'price': ov_val,
                    'fecha': '2026-06-01',
                    'score': 1.0,
                    'concept': f"Manual override: {ov_key}",
                    'ruc': prov_ruc,
                    'proveedor': prov_name
                })
                matched_override = True
                break

        if matched_override:
            continue

        best_match = None
        best_score = 0.0

        for ref_key, ref_data in ref_prices.items():
            ref_tokens = get_tokens(ref_data['concept'])
            score = compute_similarity(p_tokens, ref_tokens)
            if score > best_score:
                best_score = score
                best_match = ref_data

        # Custom threshold: 0.35 is good for short/partial terms
        if best_match and best_score >= 0.35:
            prov_name, prov_ruc = get_provider_for_product(p_name, best_match['proveedor'], best_match['ruc'])
            matched_updates.append({
                'product': p,
                'price': best_match['price'],
                'fecha': best_match['fecha'],
                'score': best_score,
                'concept': best_match['concept'],
                'ruc': prov_ruc,
                'proveedor': prov_name
            })
        else:
            # Absolute fallback
            prov_name, prov_ruc = get_provider_for_product(p_name)
            matched_updates.append({
                'product': p,
                'price': 1.50,
                'fecha': '2026-06-01',
                'score': 0.0,
                'concept': "Fallback General",
                'ruc': prov_ruc,
                'proveedor': prov_name
            })

    print(f"\nCompleted pricing configuration for all {len(matched_updates)} database products.")

    # Generate SQL files
    print("\n4. Generating SQL update script...")
    sql_lines = []
    sql_lines.append("-- ========================================================================")
    sql_lines.append("-- SCRIPT DE ACTUALIZACIÓN DE PRECIOS DE COSTO, PROVEEDORES Y RUC EN PRODUCTOS")
    sql_lines.append("-- ========================================================================\n")
    
    for m in matched_updates:
        p_name_escaped = m['product']['nombre'].replace("'", "''")
        cost = m['price']
        fecha = f"'{m['fecha']}'" if m['fecha'] else "NULL"
        prov = f"'{m['proveedor']}'" if m['proveedor'] and m['proveedor'] != 'None' and m['proveedor'] != 'nan' else "NULL"
        ruc = f"'{m['ruc']}'" if m['ruc'] and m['ruc'] != 'None' and m['ruc'] != 'nan' else "NULL"
        
        sql_lines.append(
            f"UPDATE productos SET precio_costo = {cost:.2f}, fecha_compra = {fecha}, "
            f"proveedor = {prov}, proveedor_ruc = {ruc} "
            f"WHERE nombre = '{p_name_escaped}';"
        )
    
    with open("update_productos_prices.sql", "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
    print("Saved 'update_productos_prices.sql'.")

    # Generate MOCK_PRODUCTOS JS code to write into dataService.js
    print("\n5. Generating new MOCK_PRODUCTOS list...")
    new_mock_products = []
    for idx, p in enumerate(db_products):
        match_info = next((m for m in matched_updates if m['product']['id'] == p['id']), None)
        
        cost_val = 1.50
        if match_info:
            cost_val = match_info['price']
        
        prov_name, prov_ruc = get_provider_for_product(p['nombre'])
        if match_info and match_info['proveedor'] and match_info['proveedor'] != 'nan' and match_info['proveedor'] != 'None':
            prov_name = match_info['proveedor']
        if match_info and match_info['ruc'] and match_info['ruc'] != 'nan' and match_info['ruc'] != 'None':
            prov_ruc = match_info['ruc']
            
        fecha_val = p.get('fecha_compra') or "2026-06-01"
        if match_info and match_info['fecha']:
            fecha_val = match_info['fecha']

        new_mock_products.append({
            "id": p['id'],
            "nombre": p['nombre'],
            "descripcion": p.get('descripcion') or f"Insumo para {p['nombre']}",
            "tipo": p['tipo'],
            "stock_actual": p.get('stock_actual', 10),
            "stock_minimo": p.get('stock_minimo', 4),
            "precio_venta": p.get('precio_venta'),
            "proveedor": prov_name,
            "proveedor_ruc": prov_ruc,
            "precio_costo": cost_val,
            "fecha_compra": fecha_val,
            "fecha_actualizacion_stock": "2026-06-01",
            "sucursal_id": p.get('sucursal_id') or "11111111-1111-1111-1111-111111111111"
        })

    with open("new_mock_products.json", "w", encoding="utf-8") as f:
        json.dump(new_mock_products, f, ensure_ascii=False, indent=2)
    print("Saved 'new_mock_products.json'.")

if __name__ == "__main__":
    main()
