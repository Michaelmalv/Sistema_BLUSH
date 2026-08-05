import React, { useEffect, useState, useMemo } from 'react'
import { Plus, Calendar, DollarSign, CreditCard, User, Sparkles, Receipt, X, Edit3, Trash2, Search, Clock, ArrowLeft, ArrowRight } from 'lucide-react'
import { dataService } from '../dataService'

const getLocalDatetimeString = () => {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
  return localISOTime;
}

export default function CitasTab({ activeTab, selectedBranchId }) {
  const [citas, setCitas] = useState([])
  const [clientes, setClientes] = useState([])
  const [servicios, setServicios] = useState([])
  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(true)

  // Sub-pestañas
  const [subTab, setSubTab] = useState('calendario') // 'calendario' o 'historial'
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentTime, setCurrentTime] = useState(new Date())

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

  // Controlar la línea del tiempo actual (actualizar cada minuto)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

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
      console.error('Error al cargar datos de citas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'citas') {
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
      // Filtrar únicamente las del tipo 'cita'
      if (c.tipo !== 'cita') return

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
          tipo: c.tipo,
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
      const q = historySearch.toLowerCase().trim()
      if (q) {
        const clientName = group.cliente?.nombre?.toLowerCase() || ''
        const clientCedula = group.cliente?.cedula || ''
        const matchesName = clientName.includes(q)
        const matchesCedula = clientCedula.includes(q)
        if (!matchesName && !matchesCedula) {
          return false
        }
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

  // Lógica del Calendario Diario
  const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]

  const changeDay = (amount) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + amount)
    setSelectedDate(d)
  }

  const daysStrip = useMemo(() => {
    const list = []
    for (let i = -3; i <= 3; i++) {
      const d = new Date(selectedDate)
      d.setDate(d.getDate() + i)
      list.push(d)
    }
    return list
  }, [selectedDate])

  const getFormattedDateLabel = (date) => {
    return date.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const getDayNameShort = (date) => {
    const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    return names[date.getDay()]
  }

  const formatHourLabel = (h) => {
    if (h === 12) return '12:00 PM'
    if (h === 0) return '12:00 AM'
    return h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`
  }

  const appointmentsForSelectedDate = useMemo(() => {
    const selYear = selectedDate.getFullYear()
    const selMonth = selectedDate.getMonth()
    const selDay = selectedDate.getDate()
    
    return groupedCitas.filter(g => {
      const d = new Date(g.fecha_hora)
      return d.getFullYear() === selYear && d.getMonth() === selMonth && d.getDate() === selDay
    })
  }, [groupedCitas, selectedDate])

  const appointmentsByHour = useMemo(() => {
    const map = {}
    HOURS.forEach(h => {
      map[h] = []
    })
    appointmentsForSelectedDate.forEach(g => {
      const d = new Date(g.fecha_hora)
      const h = d.getHours()
      if (map[h]) {
        map[h].push(g)
      }
    })
    return map
  }, [appointmentsForSelectedDate])

  const getCardColorClass = (index) => {
    const colors = [
      'bg-emerald-50 text-emerald-800 border-emerald-400 hover:bg-emerald-100/70',
      'bg-rose-50 text-rose-800 border-rose-400 hover:bg-rose-100/70',
      'bg-sky-50 text-sky-800 border-sky-400 hover:bg-sky-100/70',
      'bg-amber-50 text-amber-800 border-amber-400 hover:bg-amber-100/70',
      'bg-purple-50 text-purple-800 border-purple-400 hover:bg-purple-100/70'
    ]
    return colors[index % colors.length]
  }

  const isTodaySelected = useMemo(() => {
    const today = new Date()
    return (
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate()
    )
  }, [selectedDate, currentTime])

  const redLineTopPercent = useMemo(() => {
    if (!isTodaySelected) return null
    const h = currentTime.getHours()
    const m = currentTime.getMinutes()
    const startHour = 8 // 8 AM
    const endHour = 22 // 10 PM
    const totalMinutesSinceStart = (h - startHour) * 60 + m
    const totalDayMinutes = (endHour - startHour) * 60
    if (totalMinutesSinceStart < 0 || totalMinutesSinceStart > totalDayMinutes) return null
    return (totalMinutesSinceStart / totalDayMinutes) * 100
  }, [isTodaySelected, currentTime])

  const handleQuickAdd = (hour) => {
    const d = new Date(selectedDate)
    d.setHours(hour, 0, 0, 0)
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
    setForm(prev => ({
      ...prev,
      fecha_hora: localISOTime
    }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddServicio = () => {
    if (!form.servicio_id || !form.personal_id || !form.valor_pagado) {
      return alert('Debe seleccionar servicio, colaborador y precio.')
    }
    const val = Number(form.valor_pagado)
    if (isNaN(val) || val <= 0) {
      return alert('El valor cobrado debe ser mayor a 0.')
    }

    const svc = servicios.find(s => s.id === form.servicio_id)
    const pers = personal.find(p => p.id === form.personal_id)

    setServiciosAgregados([
      ...serviciosAgregados,
      {
        servicio_id: form.servicio_id,
        nombre_servicio: svc.nombre,
        personal_id: form.personal_id,
        nombre_personal: pers.nombre,
        valor_pagado: val
      }
    ])

    // Limpiar inputs de servicio
    setForm(prev => ({
      ...prev,
      servicio_id: '',
      personal_id: '',
      valor_pagado: ''
    }))
  }

  const handleRemoveServicio = (idx) => {
    setServiciosAgregados(serviciosAgregados.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg({ type: '', text: '' })

    try {
      let finalClienteId = form.cliente_id

      // 1. Si es un nuevo cliente, lo registramos primero
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

      // Validar servicios
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
          throw new Error('Debe agregar al menos un servicio a la cita.')
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
        throw new Error(`El número de referencia es obligatorio para pagos con ${form.forma_pago}`)
      }

      // Si estamos editando, eliminamos el grupo de citas original primero
      if (editingOriginalGroup) {
        await dataService.eliminarGrupoCitas(editingOriginalGroup.cliente_id, editingOriginalGroup.fecha_hora)
      }

      // Guardar registros con tipo = 'cita'
      const citasToRegister = listToSave.map(s => ({
        cliente_id: finalClienteId,
        servicio_id: s.servicio_id,
        personal_id: s.personal_id,
        fecha_hora: dateObj.toISOString(),
        valor_pagado: Number(s.valor_pagado),
        forma_pago: form.forma_pago,
        no_transferencia: form.no_transferencia.trim() || null,
        tipo: 'cita'
      }))

      await dataService.registrarGrupoCitas(citasToRegister)

      setMsg({ type: 'success', text: editingOriginalGroup ? '✅ Cita actualizada con éxito.' : '✅ Cita programada y agendada con éxito.' })
      
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
      setMsg({ type: 'error', text: err.message || 'Error al procesar la cita.' })
    }
  }

  const handleDeleteGroup = async (group) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro de cita completo?')) {
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
          <Calendar size={18} />
          {editingOriginalGroup ? 'Editar Cita' : 'Programar Cita'}
        </h3>
        <p className="text-xs text-gray-400 mb-6">Agenda las citas de clientes y define fecha/hora del servicio</p>

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
                        Cédula: {clientes.find(c => c.id === form.cliente_id)?.cedula || 'Consumidor Final'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, cliente_id: '' }))
                        setClientSearchText('')
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Search size={14} />
                      </span>
                      <input
                        type="text"
                        placeholder="Buscar cliente por nombre o cédula..."
                        value={clientSearchText}
                        onChange={(e) => {
                          setClientSearchText(e.target.value)
                          setShowClientSuggestions(true)
                        }}
                        onFocus={() => setShowClientSuggestions(true)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blush-palmLeaf font-semibold text-gray-700"
                      />
                    </div>

                    {showClientSuggestions && clientSearchText.trim() !== '' && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-gray-50">
                        {filteredClientSuggestions.map(c => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setForm(prev => ({ ...prev, cliente_id: c.id }))
                              setClientSearchText(c.nombre)
                              setShowClientSuggestions(false)
                            }}
                            className="p-2.5 hover:bg-blush-seashell/30 cursor-pointer text-xs font-bold text-gray-700 flex justify-between"
                          >
                            <span>{c.nombre}</span>
                            <span className="text-[10px] text-gray-400">{c.cedula || 'S/C'}</span>
                          </div>
                        ))}
                        {filteredClientSuggestions.length === 0 && (
                          <div className="p-3 text-center text-xs text-gray-400 font-semibold">
                            No se encontraron clientes.
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sección de Servicios */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">Añadir Servicios a la Cita</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-0.5 ml-1">Servicio</label>
                <select
                  value={form.servicio_id}
                  onChange={(e) => setForm({ ...form, servicio_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none"
                >
                  <option value="">Seleccione un servicio...</option>
                  {servicios.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre} (${Number(s.precio_base).toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-0.5 ml-1">Colaboradora</label>
                  <select
                    value={form.personal_id}
                    onChange={(e) => setForm({ ...form, personal_id: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none"
                  >
                    <option value="">Asignar...</option>
                    {personal.filter(p => p.activo).map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-0.5 ml-1">Precio Cobrado</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.valor_pagado}
                    onChange={(e) => setForm({ ...form, valor_pagado: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-blush-palmLeaf outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddServicio}
                className="w-full bg-blush-palmLeaf/10 hover:bg-blush-palmLeaf/20 text-blush-palmLeaf text-xs font-black py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> Agregar Servicio
              </button>
            </div>

            {/* Listado de Servicios Agregados a la Cita */}
            {serviciosAgregados.length > 0 && (
              <div className="pt-3 border-t border-gray-250/70 space-y-1.5">
                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Servicios Agregados:</span>
                {serviciosAgregados.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs">
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="font-bold text-gray-800 block truncate">{item.nombre_servicio}</span>
                      <span className="text-[10px] text-gray-400 block truncate">Prof: {item.nombre_personal}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-blush-palmLeaf">${item.valor_pagado.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveServicio(idx)}
                        className="text-rose-500 hover:text-rose-700 p-0.5 hover:bg-rose-50 rounded-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="text-right font-black text-xs text-blush-palmLeaf border-t border-gray-100 pt-1.5 pr-1">
                  Total: ${serviciosAgregados.reduce((sum, item) => sum + item.valor_pagado, 0).toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Fecha y Hora */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Fecha y Hora</label>
            <input
              type="datetime-local"
              value={form.fecha_hora}
              onChange={(e) => setForm({ ...form, fecha_hora: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
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

          {/* Referencia digital */}
          {['Deuna', 'Transferencia'].includes(form.forma_pago) && (
            <div className="animate-slide-in">
              <label className="block text-xs font-bold text-amber-800 mb-1">Número de Transferencia / Referencia</label>
              <input
                type="text"
                placeholder="Ej. Ref 1009827 (Obligatorio)"
                value={form.no_transferencia}
                onChange={(e) => setForm({ ...form, no_transferencia: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-sm font-semibold text-amber-900 focus:outline-none"
                required
              />
            </div>
          )}

          {msg.text && (
            <div className={`p-3 rounded-2xl text-xs font-semibold ${msg.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-rose-50 text-rose-800'}`}>
              {msg.text}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-sm cursor-pointer"
            >
              {editingOriginalGroup ? 'Actualizar Cita' : 'Programar Cita'}
            </button>
            {editingOriginalGroup && (
              <button
                type="button"
                onClick={() => {
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
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition-colors text-sm cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Grid de Visualización de Citas */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Selector de Sub-pestañas: Calendario vs Historial */}
        <div className="flex border-b border-gray-200 gap-1.5 p-1 bg-white rounded-2xl shadow-sm max-w-sm">
          <button
            onClick={() => setSubTab('calendario')}
            className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
              subTab === 'calendario' ? 'bg-blush-palmLeaf text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            🗓️ Calendario
          </button>
          <button
            onClick={() => setSubTab('historial')}
            className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
              subTab === 'historial' ? 'bg-blush-palmLeaf text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            📋 Historial de Citas
          </button>
        </div>

        {subTab === 'calendario' ? (
          /* =========================================================================
             VISTA CALENDARIO DIARIO HORARIO
             ========================================================================= */
          <div className="relative border border-gray-100 rounded-3xl p-6 bg-white shadow-sm flex flex-col">
            
            {/* Header del Calendario */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => changeDay(-1)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  title="Día anterior"
                >
                  <ArrowLeft size={16} className="text-gray-500" />
                </button>
                <h4 className="text-sm font-black text-gray-800 capitalize leading-none">
                  {getFormattedDateLabel(selectedDate)}
                </h4>
                <button 
                  type="button"
                  onClick={() => changeDay(1)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  title="Día siguiente"
                >
                  <ArrowRight size={16} className="text-gray-500" />
                </button>
              </div>
              
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(new Date(e.target.value + 'T00:00:00'))
                    }
                  }}
                  className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-blush-palmLeaf text-gray-700"
                />
              </div>
            </div>

            {/* Tira Semanal de Días */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {daysStrip.map((d, index) => {
                const isSelected = d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear()
                const isToday = d.getDate() === new Date().getDate() && d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear()
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-blush-palmLeaf text-white border-blush-palmLeaf shadow-md shadow-blush-palmLeaf/25 font-black scale-105' 
                        : isToday
                        ? 'bg-rose-50 text-rose-600 border-rose-200 font-bold shadow-inner'
                        : 'bg-gray-50/50 text-gray-600 border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-black tracking-wider opacity-75">{getDayNameShort(d)}</span>
                    <span className="text-base font-extrabold mt-1">{d.getDate()}</span>
                  </button>
                )
              })}
            </div>

            {/* Rejilla Horaria del Día */}
            <div className="relative border border-gray-100/80 rounded-2xl overflow-y-auto max-h-[500px]">
              <div className="relative divide-y divide-gray-100 py-1">
                
                {/* Línea del tiempo actual (si es hoy) */}
                {redLineTopPercent !== null && (
                  <div 
                    className="absolute left-[70px] right-0 border-t-2 border-red-500 z-10 pointer-events-none flex items-center" 
                    style={{ top: `calc(${redLineTopPercent}% + 14px)` }} 
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5" />
                    <span className="text-[8px] font-black text-white bg-red-500 px-1 py-0.5 rounded shadow-sm ml-1.5">
                      {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {HOURS.map((hour) => {
                  const hourApps = appointmentsByHour[hour] || []
                  
                  return (
                    <div key={hour} className="flex min-h-[90px] relative group hover:bg-gray-50/20 transition-all">
                      {/* Etiqueta de la hora */}
                      <div className="w-[70px] shrink-0 py-3 text-center border-r border-gray-100 flex items-start justify-center">
                        <span className="text-[10px] font-extrabold text-gray-400 mt-0.5">
                          {formatHourLabel(hour)}
                        </span>
                      </div>
                      
                      {/* Tarjetas de citas en esta hora */}
                      <div className="flex-grow p-2 flex flex-wrap gap-2.5 items-stretch relative">
                        {hourApps.length > 0 ? (
                          hourApps.map((g, idx) => (
                            <div
                              key={g.key}
                              className={`flex-1 min-w-[210px] max-w-[450px] p-3 rounded-2xl border-l-4 border shadow-sm transition-all duration-300 flex flex-col justify-between ${getCardColorClass(idx)}`}
                            >
                              <div>
                                <div className="flex justify-between items-start gap-2 mb-1.5">
                                  <span className="text-xs font-black leading-tight tracking-wide uppercase">
                                    {g.cliente?.nombre || 'S/N'}
                                  </span>
                                  <span className="text-[9px] font-black bg-white/60 px-1.5 py-0.5 rounded border border-black/5 whitespace-nowrap">
                                    {new Date(g.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                
                                <div className="space-y-1 my-2">
                                  {g.servicios.map((s, sIdx) => (
                                    <div key={sIdx} className="text-[11px] font-bold flex items-center justify-between gap-1.5 opacity-90">
                                      <span className="truncate">• {s.nombre_servicio}</span>
                                      <span className="text-black/60 shrink-0 font-semibold">({s.nombre_personal})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-black/5 mt-2 flex justify-between items-center text-[11px] font-black">
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-white/70 px-2 py-0.5 rounded border border-black/5 text-[9px] uppercase tracking-wider">
                                    {g.forma_pago}
                                  </span>
                                  <span className="text-blush-palmLeaf-dark font-black">
                                    ${g.total.toFixed(2)}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleEditGroup(g)}
                                    className="p-1 hover:bg-black/5 rounded text-black/40 hover:text-black/80 transition-all cursor-pointer"
                                    title="Editar Cita"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteGroup(g)}
                                    className="p-1 hover:bg-rose-50 rounded text-rose-500/60 hover:text-rose-600 transition-all cursor-pointer"
                                    title="Eliminar Cita"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(hour)}
                            className="w-full h-full rounded-xl border border-dashed border-gray-200 hover:border-blush-palmLeaf hover:bg-blush-seashell/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 text-xxs font-black text-blush-palmLeaf gap-1 cursor-pointer"
                          >
                            <Plus size={10} /> Programar cita a las {formatHourLabel(hour)}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             VISTA HISTORIAL TABULAR
             ========================================================================= */
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-blush-palmLeaf flex items-center gap-2">
                  <Receipt size={18} />
                  Historial de Citas
                </h3>
                <p className="text-xs text-gray-400">Listado de citas registradas y asignaciones de servicio</p>
              </div>

              {/* Búsqueda */}
              <div className="relative md:w-60">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por cliente..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:bg-white focus:border-blush-palmLeaf transition-all"
                />
              </div>
            </div>

            {/* Filtros de Fecha */}
            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 ml-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-250 rounded-xl text-xs font-semibold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 ml-1">Fecha Fin</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-250 rounded-xl text-xs font-semibold outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400 font-bold">Cargando citas...</div>
            ) : filteredGroupedCitas.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-gray-400 font-bold">No se encontraron citas con los filtros actuales.</div>
            ) : (
              <div className="overflow-x-auto">
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
                          <span className="block font-bold">{new Date(group.fecha_hora).toLocaleDateString('es-EC')}</span>
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
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
