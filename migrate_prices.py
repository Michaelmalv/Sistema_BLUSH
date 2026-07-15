import os
import re
import unicodedata
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment
load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found. Make sure .env is configured.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Paths
GASTOS_EXCEL = r"c:\Users\User\Desktop\SISTEMA_BLUSH\gastos.xlsx"

def normalize_text(text):
    if not text or pd.isna(text):
        return ""
    # Convert to lowercase and normalize unicode accents
    t = str(text).lower().strip()
    t = "".join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn')
    # Replace special characters with spaces
    t = re.sub(r'[^a-z0-9]', ' ', t)
    return t

def get_tokens(text):
    text_norm = normalize_text(text)
    # Filter out short or noisy words (de, para, con, etc.)
    stopwords = {'de', 'para', 'con', 'el', 'la', 'los', 'las', 'un', 'una', 'y', 'o', 'en', 'del'}
    tokens = [w for w in text_norm.split() if w not in stopwords and len(w) > 1]
    # Simple singularization (remove final 's' if token length > 3)
    cleaned_tokens = []
    for tok in tokens:
        if tok.endswith('s') and len(tok) > 3:
            cleaned_tokens.append(tok[:-1])
        else:
            cleaned_tokens.append(tok)
    return set(cleaned_tokens)

def compute_containment(tokens_a, tokens_b):
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = tokens_a.intersection(tokens_b)
    # Return how much of the smaller set is contained in the larger set
    return len(intersection) / min(len(tokens_a), len(tokens_b))

def main():
    print("1. Fetching products from Supabase database...")
    res_prod = supabase.from_("productos").select("*").execute()
    db_products = res_prod.data
    print(f"   Found {len(db_products)} products in database.")
    
    # 2. Extract price reference items from Excel
    excel_prices = {}
    if os.path.exists(GASTOS_EXCEL):
        print(f"2. Reading {GASTOS_EXCEL} sheet 'Gastos'...")
        try:
            df = pd.read_excel(GASTOS_EXCEL, sheet_name='Gastos')
            df = df.dropna(subset=['concepto'])
            for idx, row in df.iterrows():
                concept = str(row['concepto']).strip()
                val_unit = row.get('Valor unitario') or row.get('valor_unitario')
                fecha = row.get('fecha')
                
                # Try to parse date
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
                # Store the most recent purchase price or first found
                if concept_lower not in excel_prices or (fecha_str and not excel_prices[concept_lower]['fecha']):
                    excel_prices[concept_lower] = {
                        'concept': concept,
                        'price': val_unit,
                        'fecha': fecha_str
                    }
            print(f"   Found {len(excel_prices)} price references in Excel.")
        except Exception as e:
            print(f"   Error reading Excel file: {e}")
    else:
        print(f"2. Excel file '{GASTOS_EXCEL}' not found. Skipping Excel price source.")

    # 3. Extract price reference items from Database Expenses table
    db_expenses_prices = {}
    try:
        print("3. Querying Supabase 'gastos' table for additional references...")
        res_gastos = supabase.from_("gastos").select("concepto, valor_unitario, fecha").execute()
        for row in res_gastos.data:
            concept = str(row['concepto']).strip()
            val_unit = row.get('valor_unitario')
            fecha = row.get('fecha')
            try:
                val_unit = float(val_unit)
            except:
                continue
            
            concept_lower = concept.lower()
            if concept_lower not in db_expenses_prices:
                db_expenses_prices[concept_lower] = {
                    'concept': concept,
                    'price': val_unit,
                    'fecha': str(fecha) if fecha else None
                }
        print(f"   Found {len(db_expenses_prices)} price references in database expenses.")
    except Exception as e:
        print(f"   Error querying database expenses: {e}")

    # Combine price sources (Excel has priority)
    combined_prices = {}
    # Load database expenses references first
    for k, v in db_expenses_prices.items():
        combined_prices[k] = v
    # Load Excel references (overwrites or adds)
    for k, v in excel_prices.items():
        combined_prices[k] = v

    print(f"\nTotal unique price reference items consolidated: {len(combined_prices)}")

    # 4. Perform match and update
    print("\n4. Matching database products and updating prices...")
    updates_count = 0
    
    for p in db_products:
        p_name = p['nombre']
        p_id = p['id']
        p_tokens = get_tokens(p_name)
        
        best_match = None
        best_score = 0.0
        
        # Check against combined reference list
        for ref_key, ref_data in combined_prices.items():
            ref_name = ref_data['concept']
            ref_tokens = get_tokens(ref_name)
            
            score = compute_containment(p_tokens, ref_tokens)
            if score > best_score:
                best_score = score
                best_match = ref_data
                
        # We accept matches with a high containment score (e.g. >= 0.7)
        if best_match and best_score >= 0.7:
            cost_price = best_match['price']
            fecha_compra = best_match['fecha']
            
            print(f"   Match Found: '{p_name}' <===> '{best_match['concept']}' (Score: {best_score:.2f})")
            print(f"                Setting Price: ${cost_price:.2f} | Date: {fecha_compra}")
            
            # Perform update in Supabase
            try:
                update_payload = {
                    "precio_costo": cost_price
                }
                if fecha_compra:
                    update_payload["fecha_compra"] = fecha_compra
                    
                supabase.from_("productos").update(update_payload).eq("id", p_id).execute()
                updates_count += 1
            except Exception as e:
                print(f"      Error updating product '{p_name}': {e}")
        else:
            # Print unmatched products for logging
            pass
            
    print(f"\nMigration completed! Successfully updated {updates_count} out of {len(db_products)} products with cost prices.")

if __name__ == "__main__":
    main()
