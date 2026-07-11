import React, { useEffect, useState, useMemo } from 'react'
import { Plus, Trash2, Calendar, FileText, ShoppingCart, DollarSign, Wallet, ArrowRight } from 'lucide-react'
import { dataService } from '../dataService'

export default function GastosTab({ activeTab, selectedBranchId }) {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)

  // Estados del Formulario (Inputs grandes de alto contraste)
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    factura: '',
    concepto: '',
    categoria: 'Otros',
    cantidad: 1,
    valor_unitario: '',
    total: '',
    forma_pago: 'Efectivo',
    cuenta: 'Caja Principal'
  })

  const [msg, setMsg] = useState({ type: '', text: '' })

  const loadData = async () => {
    try {
      setLoading(true)
      const g = await dataService.getGastos()
      setGastos(g)
    } catch (err) {
      console.error('Error al cargar gastos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedBranchId])

  // Auto-calcular total
  useEffect(() => {
    if (form.cantidad && form.valor_unitario) {
      const tot = (Number(form.cantidad) * Number(form.valor_unitario)).toFixed(2)
      setForm(prev => ({ ...prev, total: tot }))
    }
  }, [form.cantidad, form.valor_unitario])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg({ type: '', text: '' })

    try {
      if (!form.fecha) throw new Error('La fecha es requerida.')
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
        sucursal_id: '11111111-1111-1111-1111-111111111111' // Asignado a Matriz Central por defecto
      })

      setMsg({ type: 'success', text: '✅ Egreso registrado con éxito.' })
      setForm({
        fecha: new Date().toISOString().split('T')[0],
        factura: '',
        concepto: '',
        categoria: 'Otros',
        cantidad: 1,
        valor_unitario: '',
        total: '',
        forma_pago: 'Efectivo',
        cuenta: 'Caja Principal'
      })
      loadData()
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error al guardar el egreso.' })
    }
  }

  // Agrupar gastos por Factura/Proveedor para visualización clara de facturas y sus productos
  const groupedGastos = useMemo(() => {
    const groups = {}
    gastos.forEach(g => {
      // Clave de agrupación por factura (limpia y en mayúsculas) o ID individual si no tiene factura
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
    
    // Ordenar de más reciente a más antiguo
    return Object.values(groups).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }, [gastos])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* FORMULARIO DE REGISTRO - ACCESIBILIDAD MEJORADA */}
      <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-150 h-fit">
        <h3 className="text-lg font-black text-blush-palmLeaf mb-1 flex items-center gap-2 uppercase tracking-wide">
          <Wallet size={20} />
          Registrar Egreso
        </h3>
        <p className="text-xs text-gray-400 mb-6 font-medium">Completa los campos para guardar un nuevo egreso.</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm font-bold text-gray-700">
          
          {/* Fecha */}
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

          {/* Factura / Proveedor */}
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

          {/* Concepto del Producto / Gasto */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Concepto del Egreso</label>
            <input
              type="text"
              placeholder="Ej. Esmaltes OPI, Pinceles, Arriendo"
              value={form.concepto}
              onChange={(e) => setForm({ ...form, concepto: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold text-gray-700"
              required
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Categoría del Gasto</label>
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
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

          {/* Cantidad y Unitario */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-2xl outline-none transition-all text-sm font-black text-gray-700"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Valor Unitario ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.valor_unitario}
                onChange={(e) => setForm({ ...form, valor_unitario: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-2xl outline-none transition-all text-sm font-black text-gray-700"
              />
            </div>
          </div>

          {/* Total */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Total a Pagar ($)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.total}
              onChange={(e) => setForm({ ...form, total: e.target.value })}
              className="w-full px-4 py-3 bg-rose-50/70 border-2 border-rose-250 rounded-2xl outline-none text-sm font-black text-rose-700"
              required
            />
          </div>

          {/* Origen y Forma de Pago */}
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

          {/* Alerta de Mensaje */}
          {msg.text && (
            <div className={`p-4 rounded-2xl text-xs font-black text-center ${
              msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {msg.text}
            </div>
          )}

          {/* Botón de envío - Grande para fácil pulsación */}
          <button
            type="submit"
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            <Plus size={18} />
            Guardar Egreso
          </button>
        </form>
      </div>

      {/* DETALLE DE FACTURAS Y PRODUCTOS COMPRADOS */}
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-150 flex flex-col">
        <div className="mb-6">
          <h3 className="text-lg font-black text-blush-palmLeaf flex items-center gap-2 uppercase tracking-wide">
            <ShoppingCart size={20} />
            Egresos Agrupados por Factura
          </h3>
          <p className="text-xs text-gray-400 font-medium">Cada tarjeta representa una factura con el detalle de productos comprados.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blush-palmLeaf"></div>
            <span className="text-xs font-bold">Cargando egresos...</span>
          </div>
        ) : groupedGastos.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400 font-bold text-xs">
            No hay egresos registrados para este período.
          </div>
        ) : (
          <div className="space-y-6 max-h-[40rem] overflow-y-auto pr-1">
            {groupedGastos.map((group) => (
              <div 
                key={group.facturaKey} 
                className="bg-gray-50/50 border-2 border-gray-200 rounded-3xl overflow-hidden transition-all hover:border-blush-palmLeaf/40"
              >
                {/* Cabecera de la Factura (Resumen de alto contraste) */}
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

                {/* Detalle de Productos Comprados en la Factura */}
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
  )
}
