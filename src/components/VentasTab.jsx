import React, { useEffect, useState } from 'react'
import { Plus, Calendar, DollarSign, CreditCard, User, Sparkles, Receipt } from 'lucide-react'
import { dataService } from '../dataService'

const getLocalDatetimeString = () => {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
  return localISOTime;
}

export default function VentasTab({ activeTab, selectedBranchId }) {
  const [citas, setCitas] = useState([])
  const [clientes, setClientes] = useState([])
  const [servicios, setServicios] = useState([])
  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(true)

  // Estados del Formulario
  const [esNuevoCliente, setEsNuevoCliente] = useState(false)
  const [form, setForm] = useState({
    cliente_id: '',
    nuevo_nombre: '',
    nuevo_cedula: '',
    nuevo_celular: '',
    nuevo_correo: '',
    nuevo_medio: 'WhatsApp',
    nuevo_medio_otro: '',
    nuevo_fecha_nacimiento: '',
    
    servicio_id: '',
    personal_id: '',
    fecha_hora: getLocalDatetimeString(),
    valor_pagado: '',
    forma_pago: 'Efectivo',
    no_transferencia: ''
  })

  const [msg, setMsg] = useState({ type: '', text: '' })

  const loadData = async () => {
    try {
      setLoading(true)
      const c = await dataService.getCitasVentas()
      const cl = await dataService.getClientes()
      const s = await dataService.getServicios()
      const p = await dataService.getPersonal()

      setCitas(c)
      setClientes(cl)
      setServicios(s)
      setPersonal(p)
    } catch (err) {
      console.error('Error al cargar datos de ventas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'ventas') {
      loadData()
    }
  }, [activeTab, selectedBranchId])

  // Auto-completar el precio cuando cambia el servicio
  useEffect(() => {
    if (form.servicio_id) {
      const svc = servicios.find(s => s.id === form.servicio_id)
      if (svc) {
        setForm(prev => ({ ...prev, valor_pagado: svc.precio_base }))
      }
    }
  }, [form.servicio_id, servicios])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg({ type: '', text: '' })

    try {
      let finalClienteId = form.cliente_id

      // 1. Si es un nuevo cliente, lo registramos primero con validaciones
      if (esNuevoCliente) {
        const nombreLimpio = form.nuevo_nombre.trim();
        if (!nombreLimpio) {
          throw new Error('El nombre del nuevo cliente es obligatorio.')
        }
        
        if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(nombreLimpio)) {
          throw new Error('El nombre solo debe contener letras y espacios.');
        }

        const cedulaLimpia = form.nuevo_cedula.trim();
        if (cedulaLimpia) {
          if (/\D/.test(cedulaLimpia)) {
            throw new Error('La cédula solo debe contener números.');
          }
          if (cedulaLimpia.length !== 10) {
            throw new Error('La cédula ecuatoriana debe tener exactamente 10 dígitos.');
          }
          if (!dataService.validarCedulaEcuatoriana(cedulaLimpia)) {
            throw new Error('La cédula ingresada no es válida en Ecuador.');
          }
        }

        const celularLimpio = form.nuevo_celular.trim();
        if (celularLimpio) {
          if (/\D/.test(celularLimpio)) {
            throw new Error('El celular solo debe contener números.');
          }
          if (celularLimpio.length !== 10) {
            throw new Error('El celular debe tener exactamente 10 dígitos.');
          }
        }

        if (form.nuevo_fecha_nacimiento) {
          const birthYear = new Date(form.nuevo_fecha_nacimiento + 'T00:00:00').getFullYear();
          const currentYear = new Date().getFullYear();
          if (birthYear > currentYear) {
            throw new Error('El año de nacimiento del cliente no puede ser mayor al año actual.');
          }
        }

        const nuevoCli = await dataService.registrarCliente({
          nombre: nombreLimpio,
          cedula: cedulaLimpia || null,
          celular: celularLimpio || null,
          correo: form.nuevo_correo.trim() || null,
          medio_contacto: form.nuevo_medio === 'Otro' ? form.nuevo_medio_otro.trim() : form.nuevo_medio,
          fecha_nacimiento: form.nuevo_fecha_nacimiento || null
        })
        finalClienteId = nuevoCli.id
      }

      if (!finalClienteId) {
        throw new Error('Debe seleccionar o registrar un cliente.')
      }
      if (!form.servicio_id) {
        throw new Error('Debe seleccionar un servicio.')
      }
      if (!form.personal_id) {
        throw new Error('Debe asignar una manicurista.')
      }
      if (!form.fecha_hora) {
        throw new Error('Debe indicar la fecha y hora.')
      }

      let dateObj;
      try {
        dateObj = new Date(form.fecha_hora);
        if (isNaN(dateObj.getTime())) {
          throw new Error('La fecha y hora ingresada no es válida.');
        }
      } catch (e) {
        throw new Error('Formato de fecha y hora inválido.');
      }

      const valor = Number(form.valor_pagado);
      if (isNaN(valor) || valor <= 0) {
        throw new Error('El valor cobrado debe ser un número mayor que 0.');
      }

      // Validar método de pago digital
      const esDigital = ['Deuna', 'Transferencia'].includes(form.forma_pago)
      if (esDigital && (!form.no_transferencia || form.no_transferencia.trim() === '')) {
        throw new Error(`El número de transferencia/referencia es obligatorio para pagos con ${form.forma_pago}`)
      }

      // 2. Registrar la venta
      await dataService.registrarCitaVenta({
        cliente_id: finalClienteId,
        servicio_id: form.servicio_id,
        personal_id: form.personal_id,
        fecha_hora: dateObj.toISOString(),
        valor_pagado: valor,
        forma_pago: form.forma_pago,
        no_transferencia: esDigital ? form.no_transferencia.trim() : null
      })

      setMsg({ type: 'success', text: '✅ Venta registrada y caja actualizada con éxito.' })
      
      // Reiniciar formulario
      setForm({
        cliente_id: '',
        nuevo_nombre: '',
        nuevo_cedula: '',
        nuevo_celular: '',
        nuevo_correo: '',
        nuevo_medio: 'WhatsApp',
        nuevo_fecha_nacimiento: '',
        servicio_id: '',
        personal_id: '',
        fecha_hora: getLocalDatetimeString(),
        valor_pagado: '',
        forma_pago: 'Efectivo',
        no_transferencia: ''
      })
      setEsNuevoCliente(false)
      
      // Recargar datos
      loadData()
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error al procesar la transacción.' })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulario de registro */}
      <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit">
        <h3 className="text-lg font-bold text-blush-palmLeaf mb-1 flex items-center gap-2">
          <Sparkles size={18} />
          Registrar Venta / Cita
        </h3>
        <p className="text-xs text-gray-400 mb-6">Genera la cita y actualiza el balance de caja al instante</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de Cliente */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-500">Cliente</label>
              <button
                type="button"
                onClick={() => setEsNuevoCliente(!esNuevoCliente)}
                className="text-xs text-blush-palmLeaf font-bold hover:underline"
              >
                {esNuevoCliente ? 'Seleccionar existente' : 'Crear nuevo cliente'}
              </button>
            </div>

            {esNuevoCliente ? (
              <div className="p-3 bg-blush-seashell/40 rounded-2xl border border-blush-seashell space-y-2">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={form.nuevo_nombre}
                  onChange={(e) => setForm({ ...form, nuevo_nombre: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl"
                  required
                />
                <input
                  type="text"
                  placeholder="Cédula"
                  value={form.nuevo_cedula}
                  onChange={(e) => setForm({ ...form, nuevo_cedula: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Celular"
                  value={form.nuevo_celular}
                  onChange={(e) => setForm({ ...form, nuevo_celular: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl"
                />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={form.nuevo_correo}
                  onChange={(e) => setForm({ ...form, nuevo_correo: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:border-blush-palmLeaf outline-none"
                />
                <div className="flex flex-col">
                  <label className="text-[10px] text-gray-400 font-bold ml-1 mb-0.5">Fecha de Nacimiento / Cumpleaños</label>
                  <input
                    type="date"
                    value={form.nuevo_fecha_nacimiento}
                    onChange={(e) => setForm({ ...form, nuevo_fecha_nacimiento: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-gray-700 focus:border-blush-palmLeaf outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] text-gray-400 font-bold ml-1 mb-0.5">¿Cómo nos conoció?</label>
                  <select
                    value={form.nuevo_medio}
                    onChange={(e) => setForm({ ...form, nuevo_medio: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-blush-palmLeaf"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Recomendación">Recomendación</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {form.nuevo_medio === 'Otro' && (
                  <div className="animate-slide-in flex flex-col">
                    <label className="text-[10px] text-gray-400 font-bold ml-1 mb-0.5">Especificar medio</label>
                    <input
                      type="text"
                      placeholder="Ej. Rótulo, Volante, Evento..."
                      value={form.nuevo_medio_otro}
                      onChange={(e) => setForm({ ...form, nuevo_medio_otro: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-blush-palmLeaf"
                      required
                    />
                  </div>
                )}
              </div>
            ) : (
              <select
                value={form.cliente_id}
                onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              >
                <option value="">Seleccione un cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.cedula ? `(${c.cedula})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selector de Servicio */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Servicio</label>
            <select
              value={form.servicio_id}
              onChange={(e) => setForm({ ...form, servicio_id: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              required
            >
              <option value="">Seleccione servicio...</option>
              {servicios.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nombre} - ${s.precio_base}
                </option>
              ))}
            </select>
          </div>

          {/* Asignación de Estilista/Manicurista */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Manicurista Asignada</label>
            <select
              value={form.personal_id}
              onChange={(e) => setForm({ ...form, personal_id: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              required
            >
              <option value="">Seleccione manicurista...</option>
              {personal.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha y Hora */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Fecha y Hora</label>
            <input
              type="datetime-local"
              value={form.fecha_hora}
              onChange={(e) => setForm({ ...form, fecha_hora: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              required
            />
          </div>

          {/* Forma de Pago */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Forma de Pago</label>
              <select
                value={form.forma_pago}
                onChange={(e) => setForm({ ...form, forma_pago: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Deuna">Deuna</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Valor Cobrado</label>
              <input
                type="number"
                step="0.01"
                value={form.valor_pagado}
                onChange={(e) => setForm({ ...form, valor_pagado: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold"
                required
              />
            </div>
          </div>

          {/* Nro Referencia (Solo digital) */}
          {['Deuna', 'Transferencia'].includes(form.forma_pago) && (
            <div className="transition-all duration-300">
              <label className="block text-xs font-bold text-amber-700 mb-1">
                No. Transferencia / Referencia <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej. REF129482"
                value={form.no_transferencia}
                onChange={(e) => setForm({ ...form, no_transferencia: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/50 border border-amber-300 rounded-xl text-sm font-semibold text-amber-900"
                required
              />
            </div>
          )}

          {/* Mensajes de feedback */}
          {msg.text && (
            <div className={`p-3 rounded-2xl text-xs font-semibold ${msg.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus size={18} />
            Confirmar Venta
          </button>
        </form>
      </div>

      {/* Historial de Citas/Ventas */}
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-blush-palmLeaf flex items-center gap-2">
            <Receipt size={18} />
            Historial de Transacciones
          </h3>
          <p className="text-xs text-gray-400">Listado de las citas y pagos registrados recientemente en Blush</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Cargando registros...</div>
        ) : citas.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400">No hay ventas registradas.</div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold">
                  <th className="py-3 px-2">Fecha / Hora</th>
                  <th className="py-3 px-2">Cliente</th>
                  <th className="py-3 px-2">Servicio</th>
                  <th className="py-3 px-2">Manicurista</th>
                  <th className="py-3 px-2">Pago</th>
                  <th className="py-3 px-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {citas.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-2 font-medium text-gray-600">
                      {new Date(c.fecha_hora).toLocaleDateString()} {new Date(c.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-bold text-gray-800">{c.clientes?.nombre || 'S/N'}</div>
                      {c.clientes?.cedula && <div className="text-xxs text-gray-400">Ced: {c.clientes.cedula}</div>}
                    </td>
                    <td className="py-3 px-2 text-gray-700 font-semibold">
                      {c.servicios?.nombre || 'S/N'}
                    </td>
                    <td className="py-3 px-2 text-gray-600">
                      {c.personal?.nombre || 'Sin asignar'}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex flex-col items-start`}>
                        <span className={`text-xs font-bold ${
                          c.forma_pago === 'Efectivo' ? 'text-green-700' :
                          c.forma_pago === 'Tarjeta' ? 'text-blue-700' :
                          'text-amber-800 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md'
                        }`}>
                          {c.forma_pago}
                        </span>
                        {c.no_transferencia && (
                          <span className="text-xxs font-mono text-amber-700 font-semibold">{c.no_transferencia}</span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-black text-blush-palmLeaf">
                      ${Number(c.valor_pagado).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
