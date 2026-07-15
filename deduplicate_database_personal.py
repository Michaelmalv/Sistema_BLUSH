import os
import unicodedata
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def get_standard_name(name):
    if not name:
        return ""
    # Normalize string by removing accents and converting to lowercase
    n = name.lower().strip()
    n = "".join(c for c in unicodedata.normalize('NFD', n) if unicodedata.category(c) != 'Mn')
    n = n.replace('\ufffd', 'i').replace('?', 'i') # replace encoding error replacements
    
    # Elizabeth / Eli
    if n in ['eli', 'elizabet', 'elizabeth']:
        return 'Eli'
        
    # Luci / Lu / Lucia
    if n in ['lu', 'luc', 'luci', 'lucy', 'lucia', 'uci', 'luce']:
        return 'Luci'
        
    # Caro / Carito
    if n in ['caro', 'carito']:
        return 'Caro'
        
    # Andre / Andreita
    if n in ['andre', 'andreita']:
        return 'Andre'
        
    # Mary
    if n in ['mary']:
        return 'Mary'
        
    # Blush / Bush
    if n in ['blush', 'bush']:
        return 'Blush'
        
    # Fallback capitalized
    return name.strip().capitalize()

def main():
    print("1. Fetching all personal from Supabase...")
    res = supabase.from_("personal").select("*").execute()
    all_personal = res.data
    print(f"Found {len(all_personal)} total personal rows in database.")

    # Group by standard name
    groups = {}
    for p in all_personal:
        std_name = get_standard_name(p['nombre'])
        if std_name not in groups:
            groups[std_name] = []
        groups[std_name].append(p)

    print(f"\nGrouped into {len(groups)} unique standard employees.")
    for name, members in groups.items():
        print(f"  - '{name}': {len(members)} entries {[m['nombre'] for m in members]}")

    print("\n2. Executing database deduplication...")
    for name, members in groups.items():
        if len(members) <= 1:
            p = members[0]
            # Make sure it's standardized capitalized name
            if p['nombre'] != name:
                print(f"   Renaming '{p['nombre']}' ===> '{name}'")
                supabase.from_("personal").update({"nombre": name}).eq("id", p['id']).execute()
            continue

        # Choose the representative row (first one)
        rep = members[0]
        rep_id = rep['id']
        duplicates = members[1:]
        
        print(f"\nConsolidating group '{name}' into representative id: {rep_id} ('{rep['nombre']}')")
        
        # Move citations and delete duplicates
        for dup in duplicates:
            dup_id = dup['id']
            print(f"   Merging '{dup['nombre']}' (id: {dup_id}) -> '{rep['nombre']}'...")
            
            # Step A: Update citas_ventas references
            try:
                res_citas = supabase.from_("citas_ventas").select("id").eq("personal_id", dup_id).execute()
                citas_count = len(res_citas.data)
                if citas_count > 0:
                    print(f"     Updating {citas_count} appointments...")
                    supabase.from_("citas_ventas").update({"personal_id": rep_id}).eq("personal_id", dup_id).execute()
            except Exception as e:
                print(f"     Error updating appointments: {e}")
                
            # Step B: Delete the duplicate row from personal
            try:
                supabase.from_("personal").delete().eq("id", dup_id).execute()
                print(f"     Deleted duplicate employee row '{dup['nombre']}' successfully.")
            except Exception as e:
                print(f"     Error deleting duplicate employee: {e}")

        # Rename the representative to standard name
        print(f"   Setting standard name for representative: '{name}'")
        supabase.from_("personal").update({"nombre": name}).eq("id", rep_id).execute()

    print("\nDeduplication process completed successfully!")

if __name__ == "__main__":
    main()
