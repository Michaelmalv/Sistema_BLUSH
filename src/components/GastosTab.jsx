import React, { useEffect, useState, useMemo } from 'react'
import { 
  Plus, 
  Trash2, 
  Calendar, 
  ShoppingCart, 
  DollarSign, 
  Wallet, 
  Search, 
  FileSpreadsheet, 
  Percent, 
  ArrowRight,
  TrendingDown,
  Info,
  Scale,
  Edit3
} from 'lucide-react'
import { dataService } from '../dataService'
import * as XLSX from 'xlsx-js-style'
import { exportExcelJS } from '../excelExporter'

export default function GastosTab({ activeTab, selectedBranchId }) {
  // Sub-pestañas: 'egresos', 'comparativa', 'retenciones'
  const [subTab, setSubTab] = useState('egresos')

  const [gastos, setGastos] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)

  // Buscadores
  const [searchGasto, setSearchGasto] = useState('')
  const [searchProduct, setSearchProduct] = useState('')
  const [searchRetencion, setSearchRetencion] = useState('')

  // Estados del Formulario de Egresos
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    factura: '',
    concepto: '',
    categoria: 'Otros',
    cantidad: 1,
    valor_unitario: '',
    total: '',
    forma_pago: 'Efectivo',
    cuenta: 'Caja Principal',
    producto_id: '',
    items: [
      { producto_id: '', concepto: '', cantidad: 1, valor_unitario: '', total: '' }
    ]
  })

  // Estados de Retenciones (Manuales)
  const [retenciones, setRetenciones] = useState([])
  const [formRetencion, setFormRetencion] = useState({
    fecha: new Date().toISOString().split('T')[0],
    ruc_emisor: '',
    ruc_retenido: '',
    no_retencion: '',
    tipo_impuesto: 'Renta',
    porcentaje: '1.75',
    base_imponible: '',
    valor_retenido: ''
  })

  const [msg, setMsg] = useState({ type: '', text: '' })
  const [msgRet, setMsgRet] = useState({ type: '', text: '' })

  const [editingProduct, setEditingProduct] = useState(null)
  const [editProductForm, setEditProductForm] = useState({
    nombre: '',
    tipo: 'insumo',
    proveedor: '',
    proveedor_ruc: '',
    precio_costo: '',
    precio_venta: '',
    fecha_compra: ''
  })
  const [editProductMsg, setEditProductMsg] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      const [g, p] = await Promise.all([
        dataService.getGastos(),
        dataService.getProductos()
      ])
      setGastos(g)
      setProductos(p)

      // Cargar Retenciones locales
      const savedRet = localStorage.getItem('blush_retenciones')
      if (savedRet) {
        setRetenciones(JSON.parse(savedRet))
      } else {
        // Data inicial vacía o mockup
        setRetenciones([])
      }
    } catch (err) {
      console.error('Error al cargar datos de egresos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedBranchId])

  const handleSelectProduct = (e) => {
    const prodId = e.target.value
    if (!prodId) {
      setForm(prev => ({
        ...prev,
        producto_id: '',
        concepto: '',
        valor_unitario: '',
        total: ''
      }))
      return
    }
    const prod = productos.find(p => p.id === prodId)
    if (prod) {
      const vUnit = prod.precio_costo ? Number(prod.precio_costo).toFixed(2) : ''
      const tot = vUnit ? (Number(form.cantidad) * Number(vUnit)).toFixed(2) : ''
      setForm(prev => ({
        ...prev,
        producto_id: prodId,
        concepto: `Compra de: ${prod.nombre}`,
        valor_unitario: vUnit,
        total: tot
      }))
    }
  }

  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { producto_id: '', concepto: '', cantidad: 1, valor_unitario: '', total: '' }
      ]
    }))
  }

  const handleRemoveItem = (index) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleItemFieldChange = (index, field, value) => {
    setForm(prev => {
      const newItems = [...prev.items]
      newItems[index] = {
        ...newItems[index],
        [field]: value
      }
      if (field === 'cantidad' || field === 'valor_unitario') {
        const qty = Number(newItems[index].cantidad || 0)
        const vu = Number(newItems[index].valor_unitario || 0)
        newItems[index].total = (qty * vu).toFixed(2)
      }
      return { ...prev, items: newItems }
    })
  }

  const handleItemProductChange = (index, prodId) => {
    setForm(prev => {
      const newItems = [...prev.items]
      if (!prodId) {
        newItems[index] = {
          ...newItems[index],
          producto_id: '',
          concepto: '',
          valor_unitario: '',
          total: ''
        }
      } else {
        const prod = productos.find(p => p.id === prodId)
        if (prod) {
          const vUnit = prod.precio_costo ? Number(prod.precio_costo).toFixed(2) : ''
          const qty = Number(newItems[index].cantidad || 1)
          const tot = vUnit ? (qty * Number(vUnit)).toFixed(2) : ''
          newItems[index] = {
            ...newItems[index],
            producto_id: prodId,
            concepto: `Compra de: ${prod.nombre}`,
            valor_unitario: vUnit,
            total: tot
          }
        }
      }
      return { ...prev, items: newItems }
    })
  }

  const calculateInvoiceTotal = () => {
    return form.items.reduce((sum, item) => sum + (Number(item.cantidad || 0) * Number(item.valor_unitario || 0)), 0).toFixed(2)
  }

  const handleStartEditProduct = (prod) => {
    setEditingProduct(prod)
    setEditProductForm({
      nombre: prod.nombre || '',
      tipo: prod.tipo || 'insumo',
      proveedor: prod.proveedor || '',
      proveedor_ruc: prod.proveedor_ruc || '',
      precio_costo: prod.precio_costo || '',
      precio_venta: prod.precio_venta || '',
      fecha_compra: prod.fecha_compra || ''
    })
    setEditProductMsg('')
  }

  const handleSaveProductEdit = async (e) => {
    e.preventDefault()
    setEditProductMsg('')
    try {
      if (!editProductForm.nombre.trim()) throw new Error('El nombre del producto es obligatorio.')
      
      const payload = {
        nombre: editProductForm.nombre.trim(),
        tipo: editProductForm.tipo,
        proveedor: editProductForm.proveedor.trim() || null,
        proveedor_ruc: editProductForm.proveedor_ruc.trim() || null,
        precio_costo: editProductForm.precio_costo ? Number(editProductForm.precio_costo) : null,
        precio_venta: editProductForm.precio_venta ? Number(editProductForm.precio_venta) : null,
        fecha_compra: editProductForm.fecha_compra || null
      }

      await dataService.actualizarProducto(editingProduct.id, payload)
      
      // Actualizar el estado de productos local para reflejar el cambio inmediato
      setProductos(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p))
      
      setEditingProduct(null)
      loadData()
    } catch (err) {
      setEditProductMsg(err.message || 'Error al guardar cambios.')
    }
  }

  // Auto-calcular total de egreso
  useEffect(() => {
    if (form.cantidad && form.valor_unitario) {
      const tot = (Number(form.cantidad) * Number(form.valor_unitario)).toFixed(2)
      setForm(prev => ({ ...prev, total: tot }))
    }
  }, [form.cantidad, form.valor_unitario])

  // Auto-calcular valor retenido
  useEffect(() => {
    if (formRetencion.base_imponible && formRetencion.porcentaje) {
      const val = (Number(formRetencion.base_imponible) * (Number(formRetencion.porcentaje) / 100)).toFixed(2)
      setFormRetencion(prev => ({ ...prev, valor_retenido: val }))
    }
  }, [formRetencion.base_imponible, formRetencion.porcentaje])

  // Guardar Gasto
  const handleSubmitGasto = async (e) => {
    e.preventDefault()
    setMsg({ type: '', text: '' })

    try {
      if (!form.fecha) throw new Error('La fecha es requerida.')

      if (form.categoria === 'Insumos') {
        if (!form.items || form.items.length === 0) throw new Error('Debe agregar al menos un producto.')

        // Validar ítems
        for (const item of form.items) {
          if (!item.concepto.trim()) throw new Error('El concepto / detalle es requerido para todos los productos.')
          if (!item.valor_unitario || Number(item.valor_unitario) <= 0) {
            throw new Error(`El valor unitario del producto "${item.concepto}" debe ser mayor a 0.`)
          }
          if (!item.cantidad || Number(item.cantidad) <= 0) {
            throw new Error(`La cantidad del producto "${item.concepto}" debe ser al menos 1.`)
          }
        }

        // Registrar cada producto como un egreso individual agrupado por la misma factura
        await Promise.all(form.items.map(async (item) => {
          const itemTotal = Number(item.cantidad) * Number(item.valor_unitario)

          // 1. Registrar gasto
          await dataService.registrarGasto({
            fecha: form.fecha,
            factura: form.factura || null,
            cantidad: Number(item.cantidad),
            concepto: item.concepto,
            categoria: form.categoria,
            valor_unitario: Number(item.valor_unitario),
            total: itemTotal,
            forma_pago: form.forma_pago,
            cuenta: form.cuenta,
            sucursal_id: selectedBranchId || '11111111-1111-1111-1111-111111111111'
          })

          // 2. Incrementar stock de inventario
          if (item.producto_id) {
            await dataService.registrarReposicion(
              item.producto_id,
              Number(item.cantidad),
              form.fecha
            )

            // 3. Actualizar precio de costo si varía
            const prod = productos.find(p => p.id === item.producto_id)
            if (prod && Number(item.valor_unitario) !== Number(prod.precio_costo)) {
              await dataService.actualizarProducto(item.producto_id, {
                precio_costo: Number(item.valor_unitario),
                fecha_compra: form.fecha
              })
            }
          }
        }))

        setMsg({ type: 'success', text: `✅ Factura registrada con éxito. Se actualizaron ${form.items.filter(i => i.producto_id).length} productos en el inventario.` })
      } else {
        // Gasto simple general
        if (!form.concepto) throw new Error('El concepto del gasto es requerido.')
        if (!form.total || Number(form.total) <= 0) throw new Error('El total del gasto debe ser mayor a 0.')

        await dataService.registrarGasto({
          fecha: form.fecha,
          factura: form.factura || null,
          cantidad: Number(form.cantidad),
          concepto: form.concepto,
          categoria: form.categoria,
          valor_unitario: Number(form.valor_unitario || form.total),
          total: Number(form.total),
          forma_pago: form.forma_pago,
          cuenta: form.cuenta,
          sucursal_id: selectedBranchId || '11111111-1111-1111-1111-111111111111'
        })

        setMsg({ type: 'success', text: '✅ Egreso registrado con éxito.' })
      }

      // Resetear formulario
      setForm({
        fecha: new Date().toISOString().split('T')[0],
        factura: '',
        concepto: '',
        categoria: 'Otros',
        cantidad: 1,
        valor_unitario: '',
        total: '',
        forma_pago: 'Efectivo',
        cuenta: 'Caja Principal',
        producto_id: '',
        items: [
          { producto_id: '', concepto: '', cantidad: 1, valor_unitario: '', total: '' }
        ]
      })
      loadData()
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error al guardar el egreso.' })
    }
  }

  // Guardar Retención (Local)
  const handleSubmitRetencion = (e) => {
    e.preventDefault()
    setMsgRet({ type: '', text: '' })

    try {
      if (!formRetencion.ruc_emisor || !formRetencion.ruc_retenido) {
        throw new Error('Los RUC son obligatorios.')
      }
      if (!formRetencion.no_retencion) {
        throw new Error('El número de comprobante es requerido.')
      }
      if (!formRetencion.base_imponible || Number(formRetencion.base_imponible) <= 0) {
        throw new Error('La base imponible debe ser mayor a 0.')
      }

      const nueva = {
        id: 'ret_' + Date.now(),
        fecha: formRetencion.fecha,
        ruc_emisor: formRetencion.ruc_emisor,
        ruc_retenido: formRetencion.ruc_retenido,
        no_retencion: formRetencion.no_retencion,
        tipo_impuesto: formRetencion.tipo_impuesto,
        porcentaje: Number(formRetencion.porcentaje),
        base_imponible: Number(formRetencion.base_imponible),
        valor_retenido: Number(formRetencion.valor_retenido)
      }

      const updatedList = [...retenciones, nueva]
      setRetenciones(updatedList)
      localStorage.setItem('blush_retenciones', JSON.stringify(updatedList))

      setMsgRet({ type: 'success', text: '✅ Retención registrada con éxito.' })
      setFormRetencion({
        fecha: new Date().toISOString().split('T')[0],
        ruc_emisor: '',
        ruc_retenido: '',
        no_retencion: '',
        tipo_impuesto: 'Renta',
        porcentaje: '1.75',
        base_imponible: '',
        valor_retenido: ''
      })
    } catch (err) {
      setMsgRet({ type: 'error', text: err.message })
    }
  }

  // Eliminar Retención
  const handleDeleteRetencion = (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta retención?')) {
      const updatedList = retenciones.filter(r => r.id !== id)
      setRetenciones(updatedList)
      localStorage.setItem('blush_retenciones', JSON.stringify(updatedList))
    }
  }

  // Exportar Retenciones a Excel
  const handleExportRetenciones = async () => {
    try {
      const rows = [
        ["REPORTE DE RETENCIONES MANUALES - BLUSH BEAUTY STUDIO"],
        ["Fecha de Generación:", new Date().toLocaleString()],
        [],
        ["Fecha", "RUC Emisor", "RUC Retenido", "No. Retención", "Impuesto", "%", "Base Imponible", "Valor Retenido"]
      ]

      retenciones.forEach(r => {
        rows.push([
          r.fecha,
          r.ruc_emisor,
          r.ruc_retenido,
          r.no_retencion,
          r.tipo_impuesto,
          `${r.porcentaje}%`,
          r.base_imponible,
          r.valor_retenido
        ])
      })

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, "Retenciones")
      await exportExcelJS(wb, `Retenciones_Blush_${new Date().toISOString().split('T')[0]}.xlsx`, { sheetName: "Retenciones", col: 5, row: 0 })
    } catch (e) {
      console.error(e)
      alert("Error al exportar retenciones")
    }
  }

  // Filtrado de Gastos por buscador
  const filteredGastos = useMemo(() => {
    return gastos.filter(g => {
      const q = searchGasto.toLowerCase().trim()
      if (!q) return true
      return (
        g.concepto.toLowerCase().includes(q) ||
        (g.factura && g.factura.toLowerCase().includes(q)) ||
        g.categoria.toLowerCase().includes(q) ||
        g.forma_pago.toLowerCase().includes(q)
      )
    })
  }, [gastos, searchGasto])

  // Agrupar gastos filtrados por Factura
  const groupedGastos = useMemo(() => {
    const groups = {}
    filteredGastos.forEach(g => {
      const isNoFact = !g.factura || g.factura.trim() === '' || g.factura.toLowerCase() === 'sin doc'
      const key = isNoFact ? `INDIVIDUAL_${g.id}` : g.factura.trim().toUpperCase()
      
      if (!groups[key]) {
        groups[key] = {
          facturaKey: key,
          facturaLabel: isNoFact ? 'Gastos sin Factura / Proveedor' : g.factura,
          isIndividual: isNoFact,
          fecha: g.fecha,
          forma_pago: g.forma_pago,
          cuenta: g.cuenta,
          total: 0,
          items: []
        }
      }
      groups[key].items.push(g)
      groups[key].total += Number(g.total)
    })
    
    return Object.values(groups).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }, [filteredGastos])

  // Filtrado de comparativa de productos
  const filteredProducts = useMemo(() => {
    return productos.filter(p => {
      const q = searchProduct.toLowerCase().trim()
      if (!q) return true
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.proveedor && p.proveedor.toLowerCase().includes(q)) ||
        p.tipo.toLowerCase().includes(q)
      )
    })
  }, [productos, searchProduct])

  // Filtrado de Retenciones
  const filteredRetenciones = useMemo(() => {
    return retenciones.filter(r => {
      const q = searchRetencion.toLowerCase().trim()
      if (!q) return true
      return (
        r.ruc_emisor.includes(q) ||
        r.ruc_retenido.includes(q) ||
        r.no_retencion.includes(q) ||
        r.tipo_impuesto.toLowerCase().includes(q)
      )
    })
  }, [retenciones, searchRetencion])

  return (
    <div className="space-y-6">
      
      {/* Selector de Sub-pestañas de alto diseño */}
      <div className="flex border-b border-gray-200 gap-1.5 p-1 bg-white rounded-2xl shadow-sm max-w-xl">
        <button
          onClick={() => setSubTab('egresos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            subTab === 'egresos' 
              ? 'bg-blush-palmLeaf text-white shadow-sm' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Wallet size={15} />
          Egresos y Facturas
        </button>
        
        <button
          onClick={() => setSubTab('comparativa')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            subTab === 'comparativa' 
              ? 'bg-blush-palmLeaf text-white shadow-sm' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <ShoppingCart size={15} />
          Comparar Proveedores
        </button>

        <button
          onClick={() => setSubTab('retenciones')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            subTab === 'retenciones' 
              ? 'bg-blush-palmLeaf text-white shadow-sm' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Scale size={15} />
          Retenciones (Manual)
        </button>
      </div>

      {/* RENDERIZADO DE CONTENIDOS SEGÚN SUB-TAB */}
      
      {subTab === 'egresos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORMULARIO DE REGISTRO */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-150 h-fit animate-fade-in">
            <h3 className="text-lg font-black text-blush-palmLeaf mb-1 flex items-center gap-2 uppercase tracking-wide">
              <Wallet size={20} />
              Registrar Egreso
            </h3>
            <p className="text-xs text-gray-400 mb-6 font-medium">Completa los campos para guardar un nuevo egreso.</p>

            <form onSubmit={handleSubmitGasto} className="space-y-4 text-sm font-bold text-gray-700">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Fecha de Compra</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-2xl outline-none transition-all text-sm font-black text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">No. Factura / Proveedor</label>
                <input
                  type="text"
                  placeholder="Ej. FAC-0034 o Distribuidora"
                  value={form.factura}
                  onChange={(e) => setForm({ ...form, factura: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold text-gray-700"
                />
              </div>

              {form.categoria !== 'Insumos' && (
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Concepto del Egreso</label>
                  <input
                    type="text"
                    placeholder="Ej. Esmaltes OPI, Pinceles, Arriendo"
                    value={form.concepto}
                    onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold text-gray-700"
                    required={form.categoria !== 'Insumos'}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Categoría del Gasto</label>
                <select
                  value={form.categoria}
                  onChange={(e) => {
                    const cat = e.target.value
                    setForm(prev => ({
                      ...prev,
                      categoria: cat,
                      ...(cat !== 'Insumos' ? { producto_id: '' } : {})
                    }))
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-2xl outline-none transition-all text-sm font-black text-gray-700 cursor-pointer"
                >
                  <option value="Insumos">Insumos (Uñas, Cremas, Algodón)</option>
                  <option value="Alquiler">Alquiler del Local</option>
                  <option value="Servicios Básicos">Servicios Básicos (Agua, Luz, Internet)</option>
                  <option value="Nómina / Comisiones">Nómina / Comisiones de Personal</option>
                  <option value="Marketing / Publicidad">Marketing y Publicidad</option>
                  <option value="Equipos / Mobiliario">Equipos o Mobiliario</option>
                  <option value="Otros">Otros Egresos</option>
                </select>
              </div>

              {form.categoria === 'Insumos' ? (
                // EDITOR MULTIPRODUCTO DINÁMICO
                <div className="space-y-4 border border-gray-150 p-4 rounded-2xl bg-gray-50/50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-blush-palmLeaf uppercase tracking-wide">Productos en Factura</span>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-2.5 py-1 bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white rounded-lg text-xxs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={11} />
                      Agregar
                    </button>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {form.items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-white border border-gray-200 rounded-xl space-y-2 relative animate-fade-in">
                        {form.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                            title="Quitar producto"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}

                        <div>
                          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wide mb-0.5">Producto en Inventario</label>
                          <select
                            value={item.producto_id || ''}
                            onChange={(e) => handleItemProductChange(idx, e.target.value)}
                            className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none cursor-pointer"
                          >
                            <option value="">-- No asociar (Detalle Manual) --</option>
                            {productos.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.nombre} {p.precio_costo ? `($${Number(p.precio_costo).toFixed(2)})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wide mb-0.5">Concepto / Detalle</label>
                          <input
                            type="text"
                            placeholder="Ej. Esmaltes de Uñas, Algodón"
                            value={item.concepto}
                            onChange={(e) => handleItemFieldChange(idx, 'concepto', e.target.value)}
                            className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-none"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wide mb-0.5">Cant.</label>
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => handleItemFieldChange(idx, 'cantidad', e.target.value.replace(/-/g, ''))}
                              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wide mb-0.5">U. Costo ($)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={item.valor_unitario}
                              onChange={(e) => handleItemFieldChange(idx, 'valor_unitario', e.target.value.replace(/-/g, ''))}
                              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wide mb-0.5">Total ($)</label>
                            <div className="w-full px-2 py-1.5 bg-gray-100 rounded-lg text-xs font-black text-gray-600 border border-gray-150">
                              ${((Number(item.cantidad || 0) * Number(item.valor_unitario || 0)) || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-gray-150 flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-500 uppercase">Monto Total Factura:</span>
                    <span className="text-sm font-black text-rose-600">${calculateInvoiceTotal()}</span>
                  </div>
                </div>
              ) : (
                // SIMPLE FORM FIELDS
                <React.Fragment>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={form.cantidad}
                        onChange={(e) => setForm({ ...form, cantidad: e.target.value.replace(/-/g, '') })}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-2xl outline-none transition-all text-sm font-black text-gray-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Valor Unitario ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={form.valor_unitario}
                        onChange={(e) => setForm({ ...form, valor_unitario: e.target.value.replace(/-/g, '') })}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-2xl outline-none transition-all text-sm font-black text-gray-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Total a Pagar ($)</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={form.total}
                      onChange={(e) => setForm({ ...form, total: e.target.value.replace(/-/g, '') })}
                      className="w-full px-4 py-3 bg-rose-50/70 border-2 border-rose-250 rounded-2xl outline-none text-sm font-black text-rose-700"
                      required
                    />
                  </div>
                </React.Fragment>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Método de Pago</label>
                  <select
                    value={form.forma_pago}
                    onChange={(e) => setForm({ ...form, forma_pago: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-2xl outline-none transition-all text-sm font-black text-gray-700 cursor-pointer"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Deuna">Deuna</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Caja / Fondos</label>
                  <select
                    value={form.cuenta}
                    onChange={(e) => setForm({ ...form, cuenta: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-2xl outline-none transition-all text-sm font-black text-gray-700 cursor-pointer"
                  >
                    <option value="Caja Principal">Caja Principal</option>
                    <option value="Cuenta Corriente">Cuenta Corriente</option>
                  </select>
                </div>
              </div>

              {msg.text && (
                <div className={`p-4 rounded-2xl text-xs font-black text-center ${
                  msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {msg.text}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <Plus size={18} />
                Guardar Egreso
              </button>
            </form>
          </div>

          {/* DETALLE DE FACTURAS COMPRADAS Y BUSCADOR */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-150 flex flex-col animate-fade-in">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h3 className="text-lg font-black text-blush-palmLeaf flex items-center gap-2 uppercase tracking-wide">
                  <ShoppingCart size={20} />
                  Egresos Agrupados por Factura
                </h3>
                <p className="text-xs text-gray-400 font-medium">Historial y auditoría de egresos con buscador de concepto.</p>
              </div>

              {/* Buscador de Egresos */}
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Buscar egreso..."
                  value={searchGasto}
                  onChange={(e) => setSearchGasto(e.target.value)}
                  className="w-full !pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-250 rounded-xl text-xs outline-none focus:border-blush-palmLeaf font-semibold"
                />
                <Search className="absolute left-2.5 top-2.5 text-gray-400" size={13} />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blush-palmLeaf"></div>
                <span className="text-xs font-bold">Cargando egresos...</span>
              </div>
            ) : groupedGastos.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-gray-400 font-bold text-xs">
                No hay egresos que coincidan con la búsqueda.
              </div>
            ) : (
              <div className="space-y-6 max-h-[40rem] overflow-y-auto pr-1">
                {groupedGastos.map((group) => (
                  <div 
                    key={group.facturaKey} 
                    className="bg-gray-50/50 border-2 border-gray-200 rounded-3xl overflow-hidden transition-all hover:border-blush-palmLeaf/40"
                  >
                    <div className="p-4 bg-white border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-gray-800 uppercase tracking-wide">
                            {group.isIndividual ? 'Gastos Varios' : `Factura / Proveedor: ${group.facturaLabel}`}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-black uppercase mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(group.fecha + 'T00:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          <span>•</span>
                          <span>Método: {group.forma_pago}</span>
                          <span>•</span>
                          <span>Caja: {group.cuenta}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Monto Total Factura</span>
                        <span className="text-base font-black text-rose-600">
                          ${group.total.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50/20">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                              <th className="pb-2">Producto / Servicio Comprado</th>
                              <th className="pb-2">Categoría</th>
                              <th className="pb-2 text-center">Cantidad</th>
                              <th className="pb-2 text-right">Precio Unit. ($)</th>
                              <th className="pb-2 text-right">Subtotal ($)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150 text-gray-700 font-bold">
                            {group.items.map((item) => (
                              <tr key={item.id} className="hover:bg-white/40 transition-colors">
                                <td className="py-2.5 font-black text-gray-850">{item.concepto}</td>
                                <td className="py-2.5">
                                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[9px] font-black uppercase rounded">
                                    {item.categoria || 'Otros'}
                                  </span>
                                </td>
                                <td className="py-2.5 text-center">{Number(item.cantidad)} u</td>
                                <td className="py-2.5 text-right">${Number(item.valor_unitario).toFixed(2)}</td>
                                <td className="py-2.5 text-right text-gray-800">${Number(item.total).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'comparativa' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-150 space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h3 className="text-lg font-black text-blush-palmLeaf flex items-center gap-2 uppercase tracking-wide">
                <ShoppingCart size={20} />
                Comparativa de Precios e Insumos de Compra
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                Audita costos de productos y compara precios de compra por cada proveedor o distribuidor.
              </p>
            </div>

            {/* Buscador de Comparativa */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Buscar insumo o distribuidor..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="w-full !pl-9 pr-3 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs outline-none focus:border-blush-palmLeaf font-semibold"
              />
              <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-2xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 text-xxs font-black uppercase tracking-wider bg-gray-50/50">
                  <th className="py-3 px-3">Producto / Insumo</th>
                  <th className="py-3 px-2">Tipo</th>
                  <th className="py-3 px-3">Proveedor / Distribuidor</th>
                  <th className="py-3 px-2">RUC Proveedor</th>
                  <th className="py-3 px-2 text-right">Precio Costo ($)</th>
                  <th className="py-3 px-2 text-right">Precio Venta ($)</th>
                  <th className="py-3 px-3 text-center">F. Compra</th>
                  <th className="py-3 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700 font-bold text-xs">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-3 px-3 font-black text-gray-800">{p.nombre}</td>
                    <td className="py-3 px-2">
                      <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded ${
                        p.tipo === 'insumo' ? 'bg-slate-100 text-slate-700' : 'bg-blush-olivine/20 text-blush-palmLeaf'
                      }`}>
                        {p.tipo}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-600">{p.proveedor || 'N/A'}</td>
                    <td className="py-3 px-2 font-mono text-xxs text-gray-400">{p.proveedor_ruc || 'N/A'}</td>
                    <td className="py-3 px-2 text-right text-rose-600 font-black">
                      {p.precio_costo ? `$${Number(p.precio_costo).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="py-3 px-2 text-right text-blush-palmLeaf font-black">
                      {p.precio_venta ? `$${Number(p.precio_venta).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-400 font-medium">{p.fecha_compra || 'N/A'}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleStartEditProduct(p)}
                        className="p-1.5 text-blush-palmLeaf hover:bg-blush-seashell/60 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                        title="Editar Ficha del Insumo / Producto"
                      >
                        <Edit3 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-gray-400 font-bold bg-white">
                      No se encontraron productos registrados en el inventario para comparar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'retenciones' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Manual de Retenciones */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-150 h-fit animate-fade-in">
            <div className="mb-4">
              <h3 className="text-lg font-black text-blush-palmLeaf flex items-center gap-2 uppercase tracking-wide">
                <Percent size={20} />
                Nueva Retención
              </h3>
              <p className="text-xs text-gray-400 font-medium">Registro manual de retenciones emitidas o recibidas.</p>
            </div>

            <form onSubmit={handleSubmitRetencion} className="space-y-4 text-xs font-bold text-gray-700">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Fecha</label>
                <input
                  type="date"
                  value={formRetencion.fecha}
                  onChange={(e) => setFormRetencion({ ...formRetencion, fecha: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs font-bold text-gray-750"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">RUC Emisor</label>
                <input
                  type="text"
                  placeholder="Ej. 1792938475001"
                  value={formRetencion.ruc_emisor}
                  onChange={(e) => setFormRetencion({ ...formRetencion, ruc_emisor: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">RUC Retenido</label>
                <input
                  type="text"
                  placeholder="Ej. 1792223334001"
                  value={formRetencion.ruc_retenido}
                  onChange={(e) => setFormRetencion({ ...formRetencion, ruc_retenido: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">No. Retención / Comprobante</label>
                <input
                  type="text"
                  placeholder="Ej. 001-002-0000102"
                  value={formRetencion.no_retencion}
                  onChange={(e) => setFormRetencion({ ...formRetencion, no_retencion: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs text-gray-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Impuesto</label>
                  <select
                    value={formRetencion.tipo_impuesto}
                    onChange={(e) => setFormRetencion({ ...formRetencion, tipo_impuesto: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs text-gray-700 cursor-pointer"
                  >
                    <option value="Renta">Renta</option>
                    <option value="IVA">IVA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Porcentaje (%)</label>
                  <select
                    value={formRetencion.porcentaje}
                    onChange={(e) => setFormRetencion({ ...formRetencion, porcentaje: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs text-gray-700 cursor-pointer"
                  >
                    <option value="1">1% (Bienes)</option>
                    <option value="1.75">1.75% (Servicios)</option>
                    <option value="2.75">2.75% (Cargos locales)</option>
                    <option value="10">10% (Honorarios Prof.)</option>
                    <option value="30">30% (Retención IVA)</option>
                    <option value="70">70% (Retención IVA)</option>
                    <option value="100">100% (Retención IVA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Base Imponible ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={formRetencion.base_imponible}
                  onChange={(e) => setFormRetencion({ ...formRetencion, base_imponible: e.target.value.replace(/-/g, '') })}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs font-black text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Valor Retenido ($)</label>
                <div className="w-full px-3 py-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm font-black">
                  ${formRetencion.valor_retenido || '0.00'}
                </div>
              </div>

              {msgRet.text && (
                <div className={`p-3 rounded-xl text-xs font-bold text-center ${
                  msgRet.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {msgRet.text}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Agregar Retención
              </button>
            </form>
          </div>

          {/* Tabla de Historial de Retenciones */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-150 flex flex-col animate-fade-in">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h3 className="text-lg font-black text-blush-palmLeaf flex items-center gap-2 uppercase tracking-wide">
                  <Scale size={20} />
                  Libro de Retenciones Manuales
                </h3>
                <p className="text-xs text-gray-400 font-medium">Buscador y exportación de comprobantes de retención tributarios.</p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Buscador de Retenciones */}
                <div className="relative flex-1 md:w-48">
                  <input
                    type="text"
                    placeholder="RUC o Comprobante..."
                    value={searchRetencion}
                    onChange={(e) => setSearchRetencion(e.target.value)}
                    className="w-full !pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-250 rounded-xl text-xs outline-none focus:border-blush-palmLeaf font-semibold"
                  />
                  <Search className="absolute left-2.5 top-2.5 text-gray-400" size={13} />
                </div>
                <button
                  onClick={handleExportRetenciones}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet size={13} />
                  Exportar
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-2xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 text-xxs font-black uppercase tracking-wider bg-gray-50/50">
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-2">RUC Emisor</th>
                    <th className="py-3 px-2">RUC Retenido</th>
                    <th className="py-3 px-2">No. Retención</th>
                    <th className="py-3 px-2 text-center">Impuesto</th>
                    <th className="py-3 px-2 text-right">Base Imponible</th>
                    <th className="py-3 px-2 text-right">Valor Retenido</th>
                    <th className="py-3 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700 font-bold text-xs">
                  {filteredRetenciones.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-gray-600">{r.fecha}</td>
                      <td className="py-3 px-2 font-mono text-xxs">{r.ruc_emisor}</td>
                      <td className="py-3 px-2 font-mono text-xxs">{r.ruc_retenido}</td>
                      <td className="py-3 px-2 font-semibold text-gray-800">{r.no_retencion}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded ${
                          r.tipo_impuesto === 'IVA' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {r.tipo_impuesto} ({r.porcentaje}%)
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">${Number(r.base_imponible).toFixed(2)}</td>
                      <td className="py-3 px-2 text-right text-rose-600 font-black">${Number(r.valor_retenido).toFixed(2)}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleDeleteRetencion(r.id)}
                          className="p-1 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Eliminar Retención"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRetenciones.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-gray-400 font-bold bg-white">
                        No hay retenciones registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DE EDICIÓN DE PRODUCTO / INSUMO */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-150 relative animate-slide-in my-8">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <Plus className="rotate-45" size={24} />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-black text-blush-palmLeaf flex items-center gap-2 uppercase tracking-wide">
                <Edit3 size={18} />
                Editar Ficha del Producto
              </h3>
              <p className="text-xs text-gray-400 font-medium">Modifica los detalles del producto para normalizar su nombre o precios.</p>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-4 text-xs font-bold text-gray-700">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Nombre Completo del Producto</label>
                <input
                  type="text"
                  value={editProductForm.nombre}
                  onChange={(e) => setEditProductForm({ ...editProductForm, nombre: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-250 rounded-xl outline-none focus:border-blush-palmLeaf focus:bg-white text-xs font-black text-gray-850"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Tipo de Producto</label>
                  <select
                    value={editProductForm.tipo}
                    onChange={(e) => setEditProductForm({ ...editProductForm, tipo: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-250 rounded-xl outline-none text-xs text-gray-700 cursor-pointer"
                  >
                    <option value="insumo">Insumo (Uso interno)</option>
                    <option value="reventa">Reventa (Venta a clientes)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Fecha de Compra</label>
                  <input
                    type="date"
                    value={editProductForm.fecha_compra}
                    onChange={(e) => setEditProductForm({ ...editProductForm, fecha_compra: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-250 rounded-xl outline-none text-xs text-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Proveedor / Distribuidor</label>
                  <input
                    type="text"
                    placeholder="Ej. OPI Distribuidor"
                    value={editProductForm.proveedor}
                    onChange={(e) => setEditProductForm({ ...editProductForm, proveedor: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-250 rounded-xl outline-none text-xs text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">RUC Proveedor</label>
                  <input
                    type="text"
                    placeholder="Ej. 1792938475001"
                    value={editProductForm.proveedor_ruc}
                    onChange={(e) => setEditProductForm({ ...editProductForm, proveedor_ruc: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-250 rounded-xl outline-none text-xs text-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Precio Costo ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={editProductForm.precio_costo}
                    onChange={(e) => setEditProductForm({ ...editProductForm, precio_costo: e.target.value.replace(/-/g, '') })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-250 rounded-xl outline-none text-xs text-gray-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Precio Venta ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={editProductForm.precio_venta}
                    onChange={(e) => setEditProductForm({ ...editProductForm, precio_venta: e.target.value.replace(/-/g, '') })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-250 rounded-xl outline-none text-xs text-gray-700 font-bold"
                  />
                </div>
              </div>

              {editProductMsg && (
                <div className="p-3 bg-red-50 text-red-800 border border-red-200 text-xs rounded-xl font-bold text-center">
                  {editProductMsg}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm text-center"
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
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
