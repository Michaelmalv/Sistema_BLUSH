import React, { useEffect, useState } from 'react'
import { Plus, Edit3, Trash2, Package, Archive, AlertTriangle, CheckCircle, Calendar, ArrowUpRight, FileSpreadsheet, Search } from 'lucide-react'
import { dataService } from '../dataService'
import XLSX from 'xlsx-js-style'
import { exportExcelJS } from '../excelExporter'

export default function InventarioTab({ activeTab, selectedBranchId }) {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [reposList, setReposList] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  // Formulario
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'insumo',
    stock_actual: 0,
    stock_minimo: 4,
    precio_venta: '',
    proveedor: '',
    proveedor_ruc: '',
    precio_costo: '',
    fecha_compra: new Date().toISOString().split('T')[0]
  })

  const [editingId, setEditingId] = useState(null)
  const [msg, setMsg] = useState({ type: '', text: '' })

  // Modal de Reposición
  const [repositionProduct, setRepositionProduct] = useState(null)
  const [repositionQty, setRepositionQty] = useState('')
  const [repositionDate, setRepositionDate] = useState(new Date().toISOString().split('T')[0])

  const loadData = async () => {
    try {
      setLoading(true)
      const p = await dataService.getProductos()
      setProductos(p)
      
      // Cargar todas las reposiciones en una sola consulta optimizada
      const allRepos = await dataService.getTodasReposiciones()
      const reposMap = {}
      
      // Inicializar el mapa para cada producto
      p.forEach(prod => {
        reposMap[prod.id] = []
      })
      
      // Distribuir en el mapa
      allRepos.forEach(r => {
        if (reposMap[r.producto_id]) {
          reposMap[r.producto_id].push(r)
        }
      })
      
      setReposList(reposMap)
    } catch (err) {
      console.error('Error al cargar inventario:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'inventario') {
      loadData()
    }
  }, [activeTab, selectedBranchId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg({ type: '', text: '' })

    try {
      if (!form.nombre) throw new Error('El nombre del producto es requerido.')
      
      // Validaciones adicionales
      if (form.proveedor_ruc && !/^\d+$/.test(form.proveedor_ruc)) {
        throw new Error('El RUC del proveedor solo debe contener números.')
      }

      const pData = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        tipo: form.tipo,
        stock_actual: Number(form.stock_actual),
        stock_minimo: Number(form.stock_minimo),
        precio_venta: form.tipo === 'reventa' && form.precio_venta ? Number(form.precio_venta) : null,
        proveedor: form.proveedor.trim() || null,
        proveedor_ruc: form.proveedor_ruc.trim() || null,
        precio_costo: form.precio_costo ? Number(form.precio_costo) : null,
        fecha_compra: form.fecha_compra || null,
        fecha_actualizacion_stock: form.editingId ? undefined : (form.fecha_compra || new Date().toISOString().split('T')[0])
      }

      if (editingId) {
        await dataService.actualizarProducto(editingId, pData)
        setMsg({ type: 'success', text: '✅ Producto actualizado con éxito.' })
      } else {
        await dataService.registrarProducto(pData)
        setMsg({ type: 'success', text: '✅ Producto creado con éxito.' })
      }

      setForm({
        nombre: '',
        descripcion: '',
        tipo: 'insumo',
        stock_actual: 0,
        stock_minimo: 4,
        precio_venta: '',
        proveedor: '',
        proveedor_ruc: '',
        precio_costo: '',
        fecha_compra: new Date().toISOString().split('T')[0]
      })
      setEditingId(null)
      loadData()
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error al guardar producto.' })
    }
  }

  const handleEdit = (prod) => {
    setEditingId(prod.id)
    setForm({
      nombre: prod.nombre,
      descripcion: prod.descripcion || '',
      tipo: prod.tipo,
      stock_actual: prod.stock_actual,
      stock_minimo: prod.stock_minimo,
      precio_venta: prod.precio_venta || '',
      proveedor: prod.proveedor || '',
      proveedor_ruc: prod.proveedor_ruc || '',
      precio_costo: prod.precio_costo || '',
      fecha_compra: prod.fecha_compra || new Date().toISOString().split('T')[0]
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este producto del inventario?')) return
    try {
      await dataService.eliminarProducto(id)
      setMsg({ type: 'success', text: '🗑️ Producto eliminado.' })
      loadData()
    } catch (err) {
      setMsg({ type: 'error', text: 'No se pudo eliminar el producto.' })
    }
  }

  const handleSaveReposition = async (e) => {
    e.preventDefault()
    if (!repositionProduct) return
    try {
      const qty = Number(repositionQty)
      if (isNaN(qty) || qty <= 0) {
        throw new Error('La cantidad de reposición debe ser mayor que 0.')
      }

      await dataService.registrarReposicion(repositionProduct.id, qty, repositionDate)
      setMsg({ type: 'success', text: `✅ Stock de ${repositionProduct.nombre} reabastecido (+${qty}).` })
      setRepositionProduct(null)
      setRepositionQty('')
      setRepositionDate(new Date().toISOString().split('T')[0])
      loadData()
    } catch (err) {
      alert(err.message || 'Error al reponer stock.')
    }
  }

  const handleExportExcel = async () => {
    try {
      const branchId = dataService.getSelectedBranchId()
      const branches = await dataService.getSucursales()
      const branchObj = branches.find(b => b.id === branchId)
      const branchName = branchObj ? branchObj.nombre : "Todas las Sucursales"

      const makeCell = (val, type, format = null, style = {}) => {
        const cell = { v: val, t: type }
        if (format) cell.z = format
        cell.s = {
          font: { name: 'Segoe UI', size: 9.5, ...style.font },
          alignment: { vertical: 'middle', ...style.alignment },
          fill: style.fill || undefined,
          border: style.border || undefined
        }
        return cell
      }

      const baseFont = { name: 'Segoe UI', size: 9.5 }
      const subtitleStyle = {
        font: { name: 'Segoe UI', size: 10, italic: true, color: { rgb: '6B7280' } },
        alignment: { horizontal: 'left', vertical: 'middle' }
      }

      const headerStyle = (bgColorHex = '748843') => ({
        font: { name: 'Segoe UI', size: 10, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: bgColorHex } },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: bgColorHex } },
          bottom: { style: 'thin', color: { rgb: bgColorHex } },
          left: { style: 'thin', color: { rgb: bgColorHex } },
          right: { style: 'thin', color: { rgb: bgColorHex } }
        }
      })

      const tableBorder = {
        top: { style: 'thin', color: { rgb: 'D1D5DB' } },
        bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
        left: { style: 'thin', color: { rgb: 'D1D5DB' } },
        right: { style: 'thin', color: { rgb: 'D1D5DB' } }
      }

      const cellStyleTextLeft = { font: baseFont, alignment: { horizontal: 'left', vertical: 'middle' }, border: tableBorder }
      const cellStyleTextCenter = { font: baseFont, alignment: { horizontal: 'center', vertical: 'middle' }, border: tableBorder }
      const cellStyleTextRight = { font: baseFont, alignment: { horizontal: 'right', vertical: 'middle' }, border: tableBorder }

      const rows = []
      const merges = []

      // Cabecera superior decorada (Fila 0, 1 y 2)
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } })
      merges.push({ s: { r: 0, c: 6 }, e: { r: 0, c: 8 } })
      
      const headerRow0 = []
      headerRow0[0] = makeCell("BLUSH BEAUTY STUDIO", 's', null, {
        font: { name: 'Segoe UI', size: 18, bold: true, color: { rgb: '748843' } },
        alignment: { horizontal: 'left', vertical: 'middle' }
      })
      for (let i = 1; i <= 5; i++) headerRow0[i] = makeCell("", 's', null, {})
      headerRow0[6] = makeCell("", 's', null, {})
      headerRow0[7] = makeCell("", 's', null, {})
      headerRow0[8] = makeCell("", 's', null, {})
      rows.push(headerRow0)

      merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 8 } })
      rows.push([makeCell("REPORTE DE INVENTARIO Y CATÁLOGO DE PRODUCTOS", 's', null, {
        font: { name: 'Segoe UI', size: 11, bold: true, color: { rgb: 'BAAB94' } },
        alignment: { horizontal: 'left', vertical: 'middle' }
      })])

      merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 8 } })
      rows.push([makeCell(`Sucursal: ${branchName} | Generado el: ${new Date().toLocaleDateString()}`, 's', null, subtitleStyle)])
      
      rows.push([]) // empty row

      // Headers de la Tabla
      rows.push([
        makeCell("Producto", 's', null, headerStyle("748843")),
        makeCell("Tipo", 's', null, headerStyle("748843")),
        makeCell("Proveedor", 's', null, headerStyle("748843")),
        makeCell("RUC Proveedor", 's', null, headerStyle("748843")),
        makeCell("Precio Costo", 's', null, headerStyle("748843")),
        makeCell("Stock Actual", 's', null, headerStyle("748843")),
        makeCell("Stock Mínimo", 's', null, headerStyle("748843")),
        makeCell("Precio Venta", 's', null, headerStyle("748843")),
        makeCell("Última Actualización", 's', null, headerStyle("748843"))
      ])

      if (productos.length === 0) {
        rows.push([
          makeCell("Sin productos registrados en esta sucursal", 's', null, cellStyleTextCenter),
          makeCell("", 's', null, cellStyleTextCenter),
          makeCell("", 's', null, cellStyleTextCenter),
          makeCell("", 's', null, cellStyleTextCenter),
          makeCell(0, 'n', '"$"#,##0.00', cellStyleTextRight),
          makeCell(0, 'n', '#,##0', cellStyleTextCenter),
          makeCell(0, 'n', '#,##0', cellStyleTextCenter),
          makeCell(0, 'n', '"$"#,##0.00', cellStyleTextRight),
          makeCell("", 's', null, cellStyleTextCenter)
        ])
      } else {
        productos.forEach(p => {
          rows.push([
            makeCell(p.nombre, 's', null, cellStyleTextLeft),
            makeCell(p.tipo === 'insumo' ? 'Insumo' : 'Reventa', 's', null, cellStyleTextCenter),
            makeCell(p.proveedor || 'N/A', 's', null, cellStyleTextLeft),
            makeCell(p.proveedor_ruc || 'N/A', 's', '@', cellStyleTextCenter),
            makeCell(p.precio_costo ? Number(p.precio_costo) : 0, 'n', '"$"#,##0.00', cellStyleTextRight),
            makeCell(Number(p.stock_actual), 'n', '#,##0', cellStyleTextCenter),
            makeCell(Number(p.stock_minimo), 'n', '#,##0', cellStyleTextCenter),
            makeCell(p.precio_venta ? Number(p.precio_venta) : 0, 'n', '"$"#,##0.00', cellStyleTextRight),
            makeCell(p.fecha_actualizacion_stock || p.fecha_compra || 'N/A', 's', null, cellStyleTextCenter)
          ])
        })
      }

      // Watermark footer at the bottom of the worksheet
      const lastRowIdx = rows.length
      merges.push({ s: { r: lastRowIdx, c: 0 }, e: { r: lastRowIdx, c: 8 } })
      const footerRow = [makeCell("★ DOCUMENTO OFICIAL GENERADO POR EL SISTEMA BLUSH BEAUTY STUDIO - REPORTE DE INVENTARIO CONFIDENCIAL ★", 's', null, {
        font: { name: 'Segoe UI', size: 8, italic: true, color: { rgb: 'D1D5DB' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      })]
      for (let i = 1; i <= 8; i++) footerRow.push(makeCell("", 's', null, {}))
      rows.push(footerRow)

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(rows)
      ws['!merges'] = merges
      ws['!cols'] = [
        { wch: 28 }, // Producto
        { wch: 12 }, // Tipo
        { wch: 22 }, // Proveedor
        { wch: 18 }, // RUC Proveedor
        { wch: 15 }, // Precio Costo
        { wch: 14 }, // Stock Actual
        { wch: 14 }, // Stock Mínimo
        { wch: 15 }, // Precio Venta
        { wch: 20 }  // Última Actualización
      ]
      ws['!rows'] = [
        { hpt: 45 } // Row 0 is taller to fit the logo image nicely!
      ]
      
      XLSX.utils.book_append_sheet(wb, ws, "Inventario")
      const safeBranchName = branchName.replace(/\s+/g, '_').replace(/\//g, '-')
      
      // Escribir y descargar usando XLSX estándar convertido a ExcelJS
      await exportExcelJS(wb, `Inventario_Blush_${safeBranchName}_${new Date().toISOString().split('T')[0]}.xlsx`, { sheetName: "Inventario", col: 6, row: 0 })
    } catch (err) {
      console.error('Error al exportar inventario:', err)
      alert('Hubo un error al generar el archivo Excel de inventario.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit">
          <h3 className="text-lg font-bold text-blush-palmLeaf mb-1 flex items-center gap-2">
            <Package size={18} />
            {editingId ? 'Editar Producto' : 'Crear Producto'}
          </h3>
          <p className="text-xs text-gray-400 mb-6">Administra insumos técnicos o productos retail de reventa</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Nombre</label>
              <input
                type="text"
                placeholder="Ej. Lima OPI 100/180"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:border-blush-palmLeaf outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Descripción</label>
              <textarea
                placeholder="Detalle o marca..."
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blush-palmLeaf outline-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="insumo">Insumo Local</option>
                  <option value="reventa">Reventa (Retail)</option>
                </select>
              </div>

              {form.tipo === 'reventa' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Precio Venta</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.precio_venta}
                    onChange={(e) => setForm({ ...form, precio_venta: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Precio Costo</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.precio_costo}
                    onChange={(e) => setForm({ ...form, precio_costo: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Proveedor</label>
                <input
                  type="text"
                  placeholder="Ej. Belleza S.A."
                  value={form.proveedor}
                  onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:border-blush-palmLeaf outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">RUC del Proveedor</label>
                <input
                  type="text"
                  placeholder="Ej. 1792..."
                  value={form.proveedor_ruc}
                  onChange={(e) => setForm({ ...form, proveedor_ruc: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:border-blush-palmLeaf outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Fecha Compra</label>
                <input
                  type="date"
                  value={form.fecha_compra}
                  onChange={(e) => setForm({ ...form, fecha_compra: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Stock Mínimo</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock_minimo}
                  onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-amber-700"
                  required
                />
              </div>
            </div>

            {!editingId && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Stock Inicial</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock_actual}
                  onChange={(e) => setForm({ ...form, stock_actual: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold"
                  required
                />
              </div>
            )}

            {msg.text && (
              <div className={`p-3 rounded-2xl text-xs font-semibold ${msg.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {msg.text}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-sm cursor-pointer"
              >
                {editingId ? 'Actualizar' : 'Crear Producto'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null)
                    setForm({
                      nombre: '',
                      descripcion: '',
                      tipo: 'insumo',
                      stock_actual: 0,
                      stock_minimo: 4,
                      precio_venta: '',
                      proveedor: '',
                      proveedor_ruc: '',
                      precio_costo: '',
                      fecha_compra: new Date().toISOString().split('T')[0]
                    })
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Grid del Listado */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
          <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-blush-palmLeaf flex items-center gap-2">
                <Archive size={18} />
                Catálogo de Inventario
              </h3>
              <p className="text-xs text-gray-400">Listado de productos y control de stock crítico</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Buscar por producto o proveedor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full !pl-10 pr-4 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold focus:bg-white focus:border-blush-palmLeaf outline-none transition-all"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              </div>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-slate-800/10 justify-center"
              >
                <FileSpreadsheet size={14} />
                Descargar Excel
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">Cargando inventario...</div>
          ) : productos.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-gray-400">No hay productos en inventario.</div>
          ) : (() => {
            const filtered = productos.filter(p => {
              const q = searchQuery.toLowerCase().trim()
              if (!q) return true
              return (
                p.nombre.toLowerCase().includes(q) ||
                (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
                (p.proveedor && p.proveedor.toLowerCase().includes(q))
              )
            })

            if (filtered.length === 0) {
              return (
                <div className="flex items-center justify-center py-20 text-gray-400 text-sm font-medium">
                  No se encontraron productos que coincidan con la búsqueda.
                </div>
              )
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[600px] pr-2">
                {filtered.map((prod) => {
                  const isLow = prod.stock_actual <= prod.stock_minimo
                  const history = reposList[prod.id] || []
                  return (
                    <div 
                      key={prod.id} 
                      className={`p-4 rounded-2xl border transition-luxury flex flex-col justify-between ${
                        isLow 
                          ? 'bg-rose-50/30 border-rose-200 ring-1 ring-rose-200 hover:bg-rose-50/50' 
                          : 'bg-gray-50/40 border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className={`px-2 py-0.5 text-xxs font-bold uppercase rounded-md ${
                            prod.tipo === 'insumo' ? 'bg-slate-100 text-slate-700' : 'bg-blush-olivine/20 text-blush-palmLeaf'
                          }`}>
                            {prod.tipo === 'insumo' ? 'Insumo' : 'Venta'}
                          </span>
                          {isLow && (
                            <span className="flex items-center gap-1 text-xxs font-black text-rose-600 animate-pulse bg-rose-100/50 px-2 py-0.5 rounded-md">
                              <AlertTriangle size={10} /> STOCK MÍNIMO
                            </span>
                          )}
                        </div>
                        
                        <h4 className="text-sm font-bold text-gray-800">{prod.nombre}</h4>
                        {prod.descripcion && <p className="text-xs text-gray-400 mt-1">{prod.descripcion}</p>}
                        
                        {/* Campos Adicionales */}
                        <div className="mt-2.5 space-y-1 text-xxs text-gray-500 font-medium bg-white/50 p-2 rounded-xl border border-gray-100">
                          {prod.proveedor && (
                            <div>
                              <span className="font-bold text-gray-400">Prov:</span> {prod.proveedor} 
                              {prod.proveedor_ruc && <span className="text-[10px] text-gray-400"> ({prod.proveedor_ruc})</span>}
                            </div>
                          )}
                          {prod.precio_costo !== null && (
                            <div><span className="font-bold text-gray-400">Costo:</span> ${Number(prod.precio_costo).toFixed(2)}</div>
                          )}
                          {prod.fecha_compra && (
                            <div><span className="font-bold text-gray-400">F. Compra:</span> {prod.fecha_compra}</div>
                          )}
                          <div>
                            <span className="font-bold text-gray-400">F. Stock Actualizado:</span> {prod.fecha_actualizacion_stock || prod.fecha_compra || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-xs text-gray-500">
                              Stock: <span className={`font-black ${isLow ? 'text-rose-600' : 'text-gray-800'}`}>{prod.stock_actual}</span>
                              <span className="text-xxs text-gray-400"> / min {prod.stock_minimo}</span>
                            </div>
                            {prod.precio_venta && (
                              <div className="text-xs text-blush-palmLeaf font-bold mt-0.5">Venta: ${Number(prod.precio_venta).toFixed(2)}</div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setRepositionProduct(prod)
                                setRepositionQty('')
                                setRepositionDate(new Date().toISOString().split('T')[0])
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xxs font-black flex items-center gap-0.5 border border-amber-200 transition-colors cursor-pointer"
                              title="Registrar Reposición"
                            >
                              <ArrowUpRight size={12} />
                              Reponer
                            </button>
                            <button 
                              onClick={() => handleEdit(prod)}
                              className="p-1.5 hover:bg-gray-200/50 text-gray-500 hover:text-gray-800 rounded-lg transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button 
                              onClick={() => handleDelete(prod.id)}
                              className="p-1.5 hover:bg-rose-100/50 text-rose-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Timeline de Historial de Reposición */}
                        {history.length > 0 && (
                          <div className="mt-3 bg-gray-50/70 p-2 rounded-xl border border-gray-150 text-[10px] space-y-1">
                            <div className="font-bold text-gray-400 uppercase tracking-widest text-[8px] mb-1">Historial de Reposiciones</div>
                            <div className="max-h-24 overflow-y-auto space-y-1 divide-y divide-gray-100">
                              {history.map((rep) => (
                                <div key={rep.id} className="flex justify-between items-center py-1 first:pt-0 last:pb-0 text-gray-600">
                                  <span>{rep.fecha_reposicion}: <strong>+{rep.cantidad_reposicion} u.</strong></span>
                                  <span className="text-[9px] text-gray-400 font-medium">(Ant: {rep.stock_anterior} u. al {rep.fecha_anterior})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Modal de Reposición */}
      {repositionProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 max-w-sm w-full space-y-4">
            <div>
              <h3 className="text-base font-bold text-blush-palmLeaf flex items-center gap-1.5">
                <ArrowUpRight size={18} />
                Registrar Reposición
              </h3>
              <p className="text-xs text-gray-700 font-bold mt-1">{repositionProduct.nombre}</p>
              
              <div className="mt-3 bg-amber-50 text-amber-800 border border-amber-100 p-3 rounded-2xl text-xs font-semibold leading-relaxed">
                📈 Stock Actual: <strong className="text-sm text-amber-900">{repositionProduct.stock_actual} unidades</strong>
                <span className="block text-[10px] text-amber-600 font-medium">Última actualización: {repositionProduct.fecha_actualizacion_stock || repositionProduct.fecha_compra || 'N/A'}</span>
              </div>
            </div>

            <form onSubmit={handleSaveReposition} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Cantidad a Reponer</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Ej. 6"
                  value={repositionQty}
                  onChange={(e) => setRepositionQty(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:border-blush-palmLeaf outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Fecha de la Reposición</label>
                <input
                  type="date"
                  required
                  value={repositionDate}
                  onChange={(e) => setRepositionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Guardar Reposición
                </button>
                <button
                  type="button"
                  onClick={() => setRepositionProduct(null)}
                  className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

