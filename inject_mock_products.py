import json

def main():
    # Read the formatted new mock products
    with open("new_mock_products.json", "r", encoding="utf-8") as f:
        products = json.load(f)

    # Format as JS array content
    js_lines = []
    js_lines.append("const MOCK_PRODUCTOS = [")
    for p in products:
        # Format keys nicely
        desc = p['descripcion'].replace("'", "\\'") if p['descripcion'] else ""
        nombre = p['nombre'].replace("'", "\\'")
        prov = p['proveedor'].replace("'", "\\'") if p['proveedor'] else "Distribuidor General"
        
        line = (
            f"  {{ id: '{p['id']}', nombre: '{nombre}', descripcion: '{desc}', "
            f"tipo: '{p['tipo']}', stock_actual: {p['stock_actual']}, stock_minimo: {p['stock_minimo']}, "
            f"precio_venta: {p['precio_venta'] if p['precio_venta'] is not None else 'null'}, "
            f"proveedor: '{prov}', proveedor_ruc: '{p['proveedor_ruc']}', "
            f"precio_costo: {p['precio_costo']:.2f}, fecha_compra: '{p['fecha_compra']}', "
            f"fecha_actualizacion_stock: '{p['fecha_actualizacion_stock']}', sucursal_id: '{p['sucursal_id']}' }},"
        )
        js_lines.append(line)
    js_lines.append("]")

    js_array_code = "\n".join(js_lines)

    # Read current dataService.js
    with open("src/dataService.js", "r", encoding="utf-8") as f:
        content = f.read()

    # Locate MOCK_PRODUCTOS and replace it
    start_marker = "const MOCK_PRODUCTOS = ["
    end_marker = "]"
    
    start_idx = content.find(start_marker)
    if start_idx == -1:
        print("Error: could not find MOCK_PRODUCTOS in dataService.js")
        return

    # Find the closing brace after the start marker
    # Since mock products has multiple lines, look for the first ']' after start_marker that is followed by 'const MOCK_SUCURSALES' or similar
    end_idx = content.find("const MOCK_SUCURSALES", start_idx)
    if end_idx == -1:
        print("Error: could not find MOCK_SUCURSALES after MOCK_PRODUCTOS")
        return
        
    # Walk backward to find the ']' before MOCK_SUCURSALES
    brace_idx = content.rfind("]", start_idx, end_idx)
    if brace_idx == -1:
        print("Error: could not find closing brace of MOCK_PRODUCTOS")
        return

    new_content = content[:start_idx] + js_array_code + content[brace_idx + 1:]

    with open("src/dataService.js", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully injected new MOCK_PRODUCTOS into src/dataService.js!")

if __name__ == "__main__":
    main()
