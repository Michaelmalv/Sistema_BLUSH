import React, { useEffect, useState, useMemo } from 'react'
import { Plus, Calendar, DollarSign, CreditCard, User, Sparkles, Receipt, X, Edit3, Trash2, Search } from 'lucide-react'
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

  // Nuevos estados para múltiples servicios
  const [serviciosAgregados, setServiciosAgregados] = useState([])
  const [clientSearchText, setClientSearchText] = useState('')
  const [showClientSuggestions, setShowClientSuggestions] = useState(false)
  const [editingOriginalGroup, setEditingOriginalGroup] = useState(null)

  // Filtros de Historial
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [historySearch, setHistorySearch] = useState('')

  // Conciliación masiva
  const [showConciliacionModal, setShowConciliacionModal] = useState(false)
  const [depositVoucher, setDepositVoucher] = useState('')
  const [selectedCashIds, setSelectedCashIds] = useState([])

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

  const filteredClientSuggestions = useMemo(() => {
    const term = clientSearchText.toLowerCase().trim()
    if (!term) return []
    return clientes.filter(c => 
      c.nombre.toLowerCase().includes(term) || (c.cedula && c.cedula.includes(term))
    ).slice(0, 8)
  }, [clientes, clientSearchText])

  const groupedCitas = useMemo(() => {
    const groups = {}
    citas.forEach(c => {
      const clientKey = c.cliente_id || 'anonymous'
      const dateKey = new Date(c.fecha_hora).toISOString()
      const groupKey = `${clientKey}_${dateKey}`
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          cliente_id: c.cliente_id,
          cliente: c.clientes || { nombre: 'S/N' },
          fecha_hora: c.fecha_hora,
          forma_pago: c.forma_pago,
          no_transferencia: c.no_transferencia,
          servicios: [],
          total: 0
        }
      }
      
      groups[groupKey].servicios.push({
        id: c.id,
        servicio_id: c.servicio_id,
        nombre_servicio: c.servicios?.nombre || 'S/N',
        personal_id: c.personal_id,
        nombre_personal: c.personal?.nombre || 'Sin asignar',
        valor_pagado: Number(c.valor_pagado)
      })
      groups[groupKey].total += Number(c.valor_pagado)
    })
    return Object.values(groups).sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
  }, [citas])

  const filteredGroupedCitas = useMemo(() => {
    return groupedCitas.filter(group => {
      const clientName = group.cliente?.nombre?.toLowerCase() || ''
      if (historySearch && !clientName.includes(historySearch.toLowerCase())) {
        return false
      }
      const groupDate = new Date(group.fecha_hora)
      if (filterStartDate) {
        const start = new Date(filterStartDate + 'T00:00:00')
        if (groupDate < start) return false
      }
      if (filterEndDate) {
        const end = new Date(filterEndDate + 'T23:59:59')
        if (groupDate > end) return false
      }
      return true
    })
  }, [groupedCitas, historySearch, filterStartDate, filterEndDate])

  const cashCitas = useMemo(() => {
    return citas.filter(c => {
      if (c.forma_pago !== 'Efectivo') return false
      const groupDate = new Date(c.fecha_hora)
      if (filterStartDate) {
        const start = new Date(filterStartDate + 'T00:00:00')
        if (groupDate < start) return false
      }
      if (filterEndDate) {
        const end = new Date(filterEndDate + 'T23:59:59')
        if (groupDate > end) return false
      }
      return true
    })
  }, [citas, filterStartDate, filterEndDate])

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

      // Validar que tengamos servicios en el array o al menos uno seleccionado en los inputs
      let listToSave = [...serviciosAgregados]
      if (listToSave.length === 0) {
        if (form.servicio_id && form.personal_id) {
          const val = Number(form.valor_pagado)
          if (isNaN(val) || val <= 0) {
            throw new Error('El valor cobrado debe ser mayor a 0.')
          }
          const svc = servicios.find(s => s.id === form.servicio_id)
          const pers = personal.find(p => p.id === form.personal_id)
          listToSave.push({
            servicio_id: form.servicio_id,
            nombre_servicio: svc.nombre,
            personal_id: form.personal_id,
            nombre_personal: pers.nombre,
            valor_pagado: val
          })
        } else {
          throw new Error('Debe agregar al menos un servicio a la venta.')
        }
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

      // Validar método de pago digital
      const esDigital = ['Deuna', 'Transferencia'].includes(form.forma_pago)
      if (esDigital && (!form.no_transferencia || form.no_transferencia.trim() === '')) {
        throw new Error(`El número de transferencia/referencia es obligatorio para pagos con ${form.forma_pago}`)
      }

      // Si estamos editando, eliminamos el grupo de citas original primero
      if (editingOriginalGroup) {
        await dataService.eliminarGrupoCitas(editingOriginalGroup.cliente_id, editingOriginalGroup.fecha_hora)
      }

      // Registrar los servicios del grupo
      const citasToRegister = listToSave.map(s => ({
        cliente_id: finalClienteId,
        servicio_id: s.servicio_id,
        personal_id: s.personal_id,
        fecha_hora: dateObj.toISOString(),
        valor_pagado: Number(s.valor_pagado),
        forma_pago: form.forma_pago,
        no_transferencia: form.no_transferencia.trim() || null
      }))

      await dataService.registrarGrupoCitas(citasToRegister)

      setMsg({ type: 'success', text: editingOriginalGroup ? '✅ Cita/Venta actualizada con éxito.' : '✅ Venta registrada y caja actualizada con éxito.' })
      
      // Reiniciar formulario
      setForm({
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
      setEsNuevoCliente(false)
      setServiciosAgregados([])
      setClientSearchText('')
      setEditingOriginalGroup(null)
      loadData()
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error al procesar la transacción.' })
    }
  }

  const handleApplyMassVoucher = async () => {
    if (!depositVoucher.trim()) {
      return alert('Debe ingresar un número de comprobante/depósito.')
    }
    if (selectedCashIds.length === 0) {
      return alert('Debe seleccionar al menos una venta en efectivo.')
    }
    
    try {
      await dataService.actualizarComprobanteMasivo(selectedCashIds, depositVoucher.trim())
      alert('✅ Comprobante asignado masivamente con éxito.')
      setDepositVoucher('')
      setSelectedCashIds([])
      loadData()
    } catch (err) {
      alert(`⚠️ Error al asignar comprobante: ${err.message}`)
    }
  }

  const handleDeleteGroup = async (group) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro de venta/cita completo?')) {
      try {
        await dataService.eliminarGrupoCitas(group.cliente_id, group.fecha_hora)
        loadData()
      } catch (err) {
        alert(`Error al eliminar: ${err.message}`)
      }
    }
  }

  const handleEditGroup = (group) => {
    setEditingOriginalGroup({ cliente_id: group.cliente_id, fecha_hora: group.fecha_hora })
    setEsNuevoCliente(false)
    setForm({
      cliente_id: group.cliente_id,
      nuevo_nombre: '',
      nuevo_cedula: '',
      nuevo_celular: '',
      nuevo_correo: '',
      nuevo_medio: 'WhatsApp',
      nuevo_medio_otro: '',
      nuevo_fecha_nacimiento: '',
      servicio_id: '',
      personal_id: '',
      fecha_hora: new Date(new Date(group.fecha_hora).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16),
      valor_pagado: '',
      forma_pago: group.forma_pago,
      no_transferencia: group.no_transferencia || ''
    })
    setServiciosAgregados(group.servicios.map(s => ({
      id: s.id,
      servicio_id: s.servicio_id,
      nombre_servicio: s.nombre_servicio,
      personal_id: s.personal_id,
      nombre_personal: s.nombre_personal,
      valor_pagado: s.valor_pagado
    })))
    setClientSearchText(group.cliente?.nombre || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
                onClick={() => {
                  setEsNuevoCliente(!esNuevoCliente)
                  setForm(prev => ({ ...prev, cliente_id: '' }))
                  setClientSearchText('')
                }}
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
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-blush-palmLeaf"
                  required
                />
                <input
                  type="text"
                  placeholder="Cédula"
                  value={form.nuevo_cedula}
                  onChange={(e) => setForm({ ...form, nuevo_cedula: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-blush-palmLeaf"
                />
                <input
                  type="text"
                  placeholder="Celular"
                  value={form.nuevo_celular}
                  onChange={(e) => setForm({ ...form, nuevo_celular: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-blush-palmLeaf"
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
              <div className="relative">
                {form.cliente_id ? (
                  <div className="flex justify-between items-center bg-blush-seashell/40 border border-blush-seashell-dark/30 px-3 py-2 rounded-xl text-sm">
                    <div>
                      <span className="font-bold text-gray-800">
                        {clientes.find(c => c.id === form.cliente_id)?.nombre || 'Cliente seleccionado'}
                      </span>
                      <span className="block text-[10px] text-gray-400">
                        Cédula: {clientes.find(c => c.id === form.cliente_id)?.cedula || 'N/A'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, cliente_id: '' }))
                        setClientSearchText('')
                      }}
                      className="text-gray-400 hover:text-rose-600 font-bold p-1 cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Escribe el nombre o cédula del cliente..."
                      value={clientSearchText}
                      onChange={(e) => {
                        setClientSearchText(e.target.value)
                        setShowClientSuggestions(true)
                      }}
                      onFocus={() => setShowClientSuggestions(true)}
                      className="w-full !pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
                    {showClientSuggestions && clientSearchText.trim() !== '' && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-250 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                        {filteredClientSuggestions.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setForm(prev => ({ ...prev, cliente_id: c.id }))
                              setShowClientSuggestions(false)
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs border-b border-gray-100 last:border-0 flex flex-col cursor-pointer"
                          >
                            <span className="font-bold text-gray-800">{c.nombre}</span>
                            <span className="text-[10px] text-gray-400">
                              Cédula: {c.cedula || 'N/A'} | Cel: {c.celular || 'N/A'}
                            </span>
                          </button>
                        ))}
                        {filteredClientSuggestions.length === 0 && (
                          <div className="p-3 text-center text-xs text-gray-400 font-bold">
                            Ningún cliente coincide. ¿Deseas crearlo?
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Formulario de Servicio Interno para agregar múltiples */}
          <div className="bg-gray-50/50 p-3.5 rounded-2xl border border-gray-150 space-y-3">
            <div className="font-bold text-xs text-blush-palmLeaf flex items-center gap-1">
              <Sparkles size={14} />
              Agregar servicios a esta cita:
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 ml-1 mb-0.5">Servicio</label>
                <select
                  value={form.servicio_id}
                  onChange={(e) => setForm({ ...form, servicio_id: e.target.value })}
                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-xl text-xs outline-none"
                >
                  <option value="">Seleccione...</option>
                  {servicios.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} - ${s.precio_base}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 ml-1 mb-0.5">Manicurista</label>
                <select
                  value={form.personal_id}
                  onChange={(e) => setForm({ ...form, personal_id: e.target.value })}
                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-xl text-xs outline-none"
                >
                  <option value="">Seleccione...</option>
                  {personal.filter(p => p.activo).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 ml-1 mb-0.5">Valor Cobrado ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.valor_pagado}
                onChange={(e) => setForm({ ...form, valor_pagado: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!form.servicio_id) return alert('Por favor seleccione un servicio.')
                if (!form.personal_id) return alert('Por favor asigne una manicurista.')
                const val = Number(form.valor_pagado)
                if (isNaN(val) || val <= 0) return alert('El valor cobrado debe ser mayor a 0.')
                
                const svc = servicios.find(s => s.id === form.servicio_id)
                const pers = personal.find(p => p.id === form.personal_id)
                
                setServiciosAgregados([
                  ...serviciosAgregados,
                  {
                    id: 'temp_' + Date.now() + '_' + Math.random(),
                    servicio_id: form.servicio_id,
                    nombre_servicio: svc.nombre,
                    personal_id: form.personal_id,
                    nombre_personal: pers.nombre,
                    valor_pagado: val
                  }
                ])
                setForm(prev => ({ ...prev, servicio_id: '', personal_id: '', valor_pagado: '' }))
              }}
              className="w-full bg-blush-palmLeaf/10 hover:bg-blush-palmLeaf/20 text-blush-palmLeaf font-bold py-1.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus size={14} />
              Agregar a la lista
            </button>
          </div>

          {/* Listado de Servicios Agregados a la Factura */}
          {serviciosAgregados.length > 0 && (
            <div className="space-y-2 bg-gray-50/50 p-3 rounded-2xl border border-gray-150 max-h-40 overflow-y-auto">
              <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1 mb-1">
                Servicios Agregados ({serviciosAgregados.length})
              </span>
              <div className="space-y-1.5">
                {serviciosAgregados.map((s) => (
                  <div key={s.id} className="flex justify-between items-center text-xs bg-white p-2 rounded-xl border border-gray-100 shadow-xxs">
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="font-bold text-gray-800 block truncate">{s.nombre_servicio}</span>
                      <span className="text-[10px] text-gray-400 block truncate">Manicurista: {s.nombre_personal}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-black text-blush-palmLeaf">${s.valor_pagado.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => setServiciosAgregados(serviciosAgregados.filter(item => item.id !== s.id))}
                        className="text-gray-400 hover:text-rose-600 font-bold p-1 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right font-black text-xs text-blush-palmLeaf border-t border-gray-100 pt-1.5 pr-1">
                Total: ${serviciosAgregados.reduce((sum, item) => sum + item.valor_pagado, 0).toFixed(2)}
              </div>
            </div>
          )}

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

          {/* Forma de Pago y Total */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Forma de Pago</label>
              <select
                value={form.forma_pago}
                onChange={(e) => setForm({ ...form, forma_pago: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blush-palmLeaf"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Deuna">Deuna</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Total a Pagar</label>
              <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm font-black text-blush-palmLeaf">
                ${serviciosAgregados.reduce((sum, item) => sum + item.valor_pagado, 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Nro Referencia o Comprobante */}
          {['Deuna', 'Transferencia', 'Efectivo'].includes(form.forma_pago) && (
            <div className="transition-all duration-300">
              <label className={`block text-xs font-bold mb-1 ${form.forma_pago === 'Efectivo' ? 'text-gray-500' : 'text-amber-700'}`}>
                {form.forma_pago === 'Efectivo' ? 'No. Depósito / Comprobante (Opcional)' : 'No. Transferencia / Referencia'}
                {form.forma_pago !== 'Efectivo' && <span className="text-red-500"> *</span>}
              </label>
              <input
                type="text"
                placeholder={form.forma_pago === 'Efectivo' ? "Ej. DEP-998822" : "Ej. REF129482"}
                value={form.no_transferencia}
                onChange={(e) => setForm({ ...form, no_transferencia: e.target.value })}
                className={`w-full px-3 py-2 border rounded-xl text-sm font-semibold outline-none ${
                  form.forma_pago === 'Efectivo'
                    ? 'bg-gray-50 border-gray-200 text-gray-700 focus:border-blush-palmLeaf'
                    : 'bg-amber-50/50 border-amber-300 text-amber-900 focus:border-amber-500'
                }`}
                required={form.forma_pago !== 'Efectivo'}
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

      <TransactionHistory
        loading={loading}
        filteredGroupedCitas={filteredGroupedCitas}
        cashCitas={cashCitas}
        showConciliacionModal={showConciliacionModal}
        setShowConciliacionModal={setShowConciliacionModal}
        depositVoucher={depositVoucher}
        setDepositVoucher={setDepositVoucher}
        selectedCashIds={selectedCashIds}
        setSelectedCashIds={setSelectedCashIds}
        handleApplyMassVoucher={handleApplyMassVoucher}
        handleEditGroup={handleEditGroup}
        handleDeleteGroup={handleDeleteGroup}
        historySearch={historySearch}
        setHistorySearch={setHistorySearch}
        filterStartDate={filterStartDate}
        setFilterStartDate={setFilterStartDate}
        filterEndDate={filterEndDate}
        setFilterEndDate={setFilterEndDate}
      />
    </div>
  )
}

const TransactionHistory = React.memo(({
  loading,
  filteredGroupedCitas,
  cashCitas,
  showConciliacionModal,
  setShowConciliacionModal,
  depositVoucher,
  setDepositVoucher,
  selectedCashIds,
  setSelectedCashIds,
  handleApplyMassVoucher,
  handleEditGroup,
  handleDeleteGroup,
  historySearch,
  setHistorySearch,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate
}) => {
  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
      {/* Filtros e Historial */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-lg font-bold text-blush-palmLeaf flex items-center gap-2">
              <Receipt size={18} />
              Historial de Transacciones
            </h3>
            <p className="text-xs text-gray-400">Auditoría, filtros avanzados y control de caja</p>
          </div>
          
          <button
            type="button"
            onClick={() => {
              setShowConciliacionModal(!showConciliacionModal)
              setSelectedCashIds([])
              setDepositVoucher('')
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm ${
              showConciliacionModal 
                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                : 'bg-blush-seashell text-blush-palmLeaf hover:bg-blush-seashell/80 border border-blush-seashell-dark/10'
            }`}
          >
            <DollarSign size={14} />
            {showConciliacionModal ? 'Ver Historial' : 'Depósitos de Efectivo'}
          </button>
        </div>

        {/* Panel de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/50 p-3.5 rounded-2xl border border-gray-150">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Buscar por Cliente</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ej. Mayra Lojano..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full !pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-blush-palmLeaf"
              />
              <Search className="absolute left-2.5 top-2.5 text-gray-400" size={13} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Desde</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-blush-palmLeaf text-gray-600 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Hasta</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-blush-palmLeaf text-gray-600 font-semibold"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Cargando registros...</div>
      ) : showConciliacionModal ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-150">
            <h4 className="font-bold text-sm text-blush-palmLeaf flex items-center gap-1.5">
              <DollarSign size={16} />
              Depósito Masivo de Efectivo
            </h4>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {cashCitas.length} Ventas en Efectivo
            </span>
          </div>
          
          {/* Controles de Depósito */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-xxs">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
                Nro. Comprobante de Depósito Bancario
              </label>
              <input
                type="text"
                placeholder="Ej. DEP-109248"
                value={depositVoucher}
                onChange={(e) => setDepositVoucher(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-blush-palmLeaf"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleApplyMassVoucher}
                className="w-full bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white font-black py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer shadow-sm"
              >
                Asignar a seleccionadas ({selectedCashIds.length})
              </button>
            </div>
          </div>

          {/* Lista de Transacciones en Efectivo */}
          <div className="overflow-x-auto max-h-[400px] border border-gray-100 rounded-2xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-gray-400 text-xxs font-black uppercase tracking-wider bg-gray-50/50">
                  <th className="py-2.5 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedCashIds.length === cashCitas.length && cashCitas.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCashIds(cashCitas.map(c => c.id))
                        } else {
                          setSelectedCashIds([])
                        }
                      }}
                      className="cursor-pointer rounded border-gray-300 text-blush-palmLeaf focus:ring-blush-palmLeaf"
                    />
                  </th>
                  <th className="py-2.5 px-2">Fecha</th>
                  <th className="py-2.5 px-2">Cliente</th>
                  <th className="py-2.5 px-2">Servicio</th>
                  <th className="py-2.5 px-2">Monto</th>
                  <th className="py-2.5 px-3">Comprobante Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cashCitas.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedCashIds.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCashIds([...selectedCashIds, c.id])
                          } else {
                            setSelectedCashIds(selectedCashIds.filter(id => id !== c.id))
                          }
                        }}
                        className="cursor-pointer rounded border-gray-300 text-blush-palmLeaf focus:ring-blush-palmLeaf"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-xs font-semibold text-gray-600">
                      {new Date(c.fecha_hora).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-2 font-bold text-gray-800 text-xs">{c.clientes?.nombre || 'S/N'}</td>
                    <td className="py-2.5 px-2 text-xs font-semibold text-gray-700">{c.servicios?.nombre || 'S/N'}</td>
                    <td className="py-2.5 px-2 font-black text-blush-palmLeaf text-xs">${Number(c.valor_pagado).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-xxs font-mono text-gray-500 font-bold">{c.no_transferencia || 'Ninguno'}</td>
                  </tr>
                ))}
                {cashCitas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-gray-400 font-bold bg-white">
                      No hay ventas en efectivo pendientes de depósito.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold">
                <th className="py-3 px-2">Fecha / Hora</th>
                <th className="py-3 px-2">Cliente</th>
                <th className="py-3 px-2">Servicios Asignados</th>
                <th className="py-3 px-2">Detalles Pago</th>
                <th className="py-3 px-2 text-right">Valor Total</th>
                <th className="py-3 px-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredGroupedCitas.map((group) => (
                <tr key={group.key} className="hover:bg-gray-50/50 transition-colors align-top">
                  <td className="py-3.5 px-2 font-medium text-gray-600 text-xs">
                    <span className="block font-bold">{new Date(group.fecha_hora).toLocaleDateString()}</span>
                    <span className="text-xxs text-gray-400">{new Date(group.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td className="py-3.5 px-2">
                    <div className="font-bold text-gray-800 text-xs">{group.cliente?.nombre || 'S/N'}</div>
                    {group.cliente?.cedula && <div className="text-[10px] text-gray-400">Ced: {group.cliente.cedula}</div>}
                  </td>
                  <td className="py-3.5 px-2">
                    <div className="space-y-1">
                      {group.servicios.map((s, sIdx) => (
                        <div key={sIdx} className="text-xs text-gray-700 bg-gray-50 p-1.5 rounded-lg border border-gray-100 max-w-[200px]">
                          <span className="font-bold text-gray-800 block truncate">{s.nombre_servicio}</span>
                          <span className="text-[10px] text-gray-400 block truncate">Téc: {s.nombre_personal}</span>
                          <span className="text-[10px] font-black text-blush-palmLeaf">${s.valor_pagado.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-2">
                    <span className="inline-flex flex-col items-start">
                      <span className={`text-xs font-bold ${
                        group.forma_pago === 'Efectivo' ? 'text-green-700' :
                        group.forma_pago === 'Tarjeta' ? 'text-blue-700' :
                        'text-amber-800 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md'
                      }`}>
                        {group.forma_pago}
                      </span>
                      {group.no_transferencia && (
                        <span className="text-xxs font-mono text-amber-700 font-semibold max-w-[120px] truncate" title={group.no_transferencia}>
                          Ref: {group.no_transferencia}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-right font-black text-blush-palmLeaf text-sm">
                    ${group.total.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-2">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditGroup(group)}
                        className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                        title="Editar Cita"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(group)}
                        className="p-1 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Eliminar Cita"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredGroupedCitas.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400 font-bold bg-white">
                    No se encontraron transacciones con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
})
