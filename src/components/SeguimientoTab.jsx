import React, { useEffect, useState, useMemo } from 'react'
import { 
  Search, 
  Phone, 
  Calendar, 
  Clock, 
  BellRing, 
  ExternalLink, 
  Sparkles, 
  Cake,
  MessageSquare
} from 'lucide-react'
import { dataService } from '../dataService'

export default function SeguimientoTab({ activeTab, selectedBranchId }) {
  // Sub-tabs: 'recontacto', 'cumpleanos'
  const [subTab, setSubTab] = useState('recontacto')

  const [recontactar, setRecontactar] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)

  // Buscadores
  const [searchRecontacto, setSearchRecontacto] = useState('')
  const [searchBirthday, setSearchBirthday] = useState('')

  // Filtros de recontacto y mes de cumpleaños
  const [filterRecontacto, setFilterRecontacto] = useState('todos')
  const [birthdayMonth, setBirthdayMonth] = useState(new Date().getMonth() + 1) // 1-12

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const loadData = async () => {
    try {
      setLoading(true)
      const [rc, cl] = await Promise.all([
        dataService.getClientesPorRecontactar(),
        dataService.getClientes()
      ])
      setRecontactar(rc)
      setClientes(cl)
    } catch (err) {
      console.error('Error al cargar datos CRM/Seguimiento:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedBranchId])

  // Enviar WhatsApp de Recontacto
  const handleWhatsappContact = (crm) => {
    if (!crm.cliente_celular || crm.cliente_celular === 'N/A' || crm.cliente_celular.trim() === '') {
      alert(`La clienta ${crm.cliente_nombre} no tiene un número de celular registrado.`)
      return
    }

    let fechaLimpia = crm.ultima_cita_fecha
    try {
      if (crm.ultima_cita_fecha) {
        const datePart = crm.ultima_cita_fecha.includes('T') 
          ? crm.ultima_cita_fecha.split('T')[0] 
          : crm.ultima_cita_fecha
        const [year, month, day] = datePart.split('-')
        fechaLimpia = `${day}/${month}/${year}`
      }
    } catch (e) {
      console.error('Error al formatear fecha de cita:', e)
    }

    const nombreCompleto = crm.cliente_nombre.split(' ')[0]
    const mensaje = `Hola ${nombreCompleto}, te saludamos de Blush Beauty Studio. ✨ Vemos que tu último servicio de ${crm.servicio_nombre} fue el ${fechaLimpia}. Como han transcurrido ${crm.frecuencia_recomendada_dias} días, te sugerimos agendar tu cita de retoque o mantenimiento para consentirte de nuevo. ¿Te gustaría reservar un espacio para esta semana? 💖`
    
    const tel = crm.cliente_celular.replace(/\D/g, '')
    let formattedTel = tel
    if (tel.startsWith('0')) {
      formattedTel = '593' + tel.substring(1)
    }
    const url = `https://wa.me/${formattedTel}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  // Enviar WhatsApp de Cumpleaños
  const handleBirthdayContact = (cliente) => {
    if (!cliente.celular || cliente.celular === 'N/A' || cliente.celular.trim() === '') {
      alert(`La clienta ${cliente.nombre} no tiene un número de celular registrado.`)
      return
    }

    const nombrePila = cliente.nombre.split(' ')[0]
    const mensaje = `¡Hola ${nombrePila}! Te saludamos de Blush Beauty Studio. 🌸 Queremos desearte un muy feliz cumpleaños. 🎂 Que pases un día maravilloso rodeada de tus seres queridos. Como regalo especial de nuestra parte, tienes un 15% de descuento en cualquiera de nuestros servicios durante tu mes de cumpleaños. ¡Te esperamos para consentirte! 💖`
    
    const tel = cliente.celular.replace(/\D/g, '')
    let formattedTel = tel
    if (tel.startsWith('0')) {
      formattedTel = '593' + tel.substring(1)
    }
    const url = `https://wa.me/${formattedTel}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  // Filtrado de recontactos
  const filteredRecontacts = useMemo(() => {
    return recontactar.filter(crm => {
      const term = searchRecontacto.toLowerCase()
      const matchesSearch = crm.cliente_nombre.toLowerCase().includes(term) ||
                            crm.servicio_nombre.toLowerCase().includes(term)
      
      if (!matchesSearch) return false
      
      if (filterRecontacto === 'atrasados') return crm.dias_retraso > 0
      if (filterRecontacto === 'hoy') return crm.dias_retraso === 0
      if (filterRecontacto === 'manana') return crm.dias_retraso === -1
      if (filterRecontacto === 'al_dia') return crm.dias_retraso < -1
      return true
    })
  }, [recontactar, searchRecontacto, filterRecontacto])

  // Filtrado de Cumpleañeros por mes y buscador
  const birthdayList = useMemo(() => {
    return clientes.filter(c => {
      if (!c.fecha_nacimiento) return false
      
      // Parsear mes de nacimiento (YYYY-MM-DD)
      const parts = c.fecha_nacimiento.split('-')
      if (parts.length !== 3) return false
      const month = parseInt(parts[1], 10)
      
      if (month !== birthdayMonth) return false

      const term = searchBirthday.toLowerCase().trim()
      if (!term) return true
      return c.nombre.toLowerCase().includes(term)
    }).sort((a, b) => {
      // Ordenar por día del mes
      const dayA = parseInt(a.fecha_nacimiento.split('-')[2], 10)
      const dayB = parseInt(b.fecha_nacimiento.split('-')[2], 10)
      return dayA - dayB
    })
  }, [clientes, birthdayMonth, searchBirthday])

  const parseDateStr = (d) => {
    if (!d) return 'Sin fecha'
    const dateOnly = d.includes('T') ? d.split('T')[0] : d
    const dt = new Date(dateOnly + 'T00:00:00')
    return isNaN(dt.getTime()) ? 'Invalid Date' : dt.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      
      {/* Selector de Sub-pestañas */}
      <div className="flex border-b border-gray-200 gap-1.5 p-1 bg-white rounded-2xl shadow-sm max-w-md">
        <button
          onClick={() => setSubTab('recontacto')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            subTab === 'recontacto' 
              ? 'bg-blush-palmLeaf text-white shadow-sm' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <BellRing size={15} />
          Clientes a Recontactar
        </button>
        
        <button
          onClick={() => setSubTab('cumpleanos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            subTab === 'cumpleanos' 
              ? 'bg-blush-palmLeaf text-white shadow-sm' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Cake size={15} />
          Cumpleaños del Mes
        </button>
      </div>

      {subTab === 'recontacto' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col animate-fade-in">
          {/* Encabezado y buscador */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-blush-palmLeaf flex items-center gap-2">
                <BellRing size={22} className="text-amber-600 alert-pulse" />
                Seguimiento de Clientes (Recontacto)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Listado de clientes con visitas sugeridas basadas en la frecuencia del tratamiento.
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Buscar por cliente o servicio..."
                value={searchRecontacto}
                onChange={(e) => setSearchRecontacto(e.target.value)}
                className="w-full !pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
            </div>
          </div>

          {/* Filtros de estado */}
          <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-100">
            <button
              onClick={() => setFilterRecontacto('todos')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                filterRecontacto === 'todos' ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todos ({recontactar.length})
            </button>
            <button
              onClick={() => setFilterRecontacto('atrasados')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                filterRecontacto === 'atrasados' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Atrasados ({recontactar.filter(c => c.dias_retraso > 0).length})
            </button>
            <button
              onClick={() => setFilterRecontacto('hoy')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                filterRecontacto === 'hoy' ? 'bg-green-600 text-white shadow-sm' : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              Toca hoy ({recontactar.filter(c => c.dias_retraso === 0).length})
            </button>
            <button
              onClick={() => setFilterRecontacto('manana')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                filterRecontacto === 'manana' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              Toca mañana ({recontactar.filter(c => c.dias_retraso === -1).length})
            </button>
            <button
              onClick={() => setFilterRecontacto('al_dia')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                filterRecontacto === 'al_dia' ? 'bg-slate-500 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Al día ({recontactar.filter(c => c.dias_retraso < -1).length})
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">Cargando recontactos...</div>
          ) : filteredRecontacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center space-y-2">
              <Sparkles className="text-blush-palmLeaf opacity-65" size={48} />
              <p className="font-bold text-gray-600">Sin registros</p>
              <p className="text-xs">No hay clientes sugeridos para contactar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecontacts.map((crm, i) => {
                const esTarde = crm.dias_retraso > 0
                const esHoy = crm.dias_retraso === 0
                const esManana = crm.dias_retraso === -1
                const esCritico = crm.dias_retraso > 7

                let cardBgClass = 'bg-gray-50/40 border-gray-100 hover:bg-gray-50'
                let badgeBgClass = 'bg-slate-100 text-slate-700 border border-slate-200'
                let badgeText = `En ${Math.abs(crm.dias_retraso)} día${Math.abs(crm.dias_retraso) !== 1 ? 's' : ''}`
                let nextDateColorClass = 'text-gray-700'

                if (esTarde) {
                  if (esCritico) {
                    cardBgClass = 'bg-rose-50/20 border-rose-100/70 hover:bg-rose-50/40'
                    badgeBgClass = 'bg-rose-100 text-rose-800 border border-rose-200'
                    nextDateColorClass = 'text-rose-700 font-bold'
                  } else {
                    cardBgClass = 'bg-amber-50/10 border-amber-100/70 hover:bg-amber-50/30'
                    badgeBgClass = 'bg-amber-100 text-amber-800 border border-amber-200'
                    nextDateColorClass = 'text-amber-800 font-bold'
                  }
                  badgeText = `${crm.dias_retraso} día${crm.dias_retraso !== 1 ? 's' : ''} tarde`
                } else if (esHoy) {
                  cardBgClass = 'bg-green-50/20 border-green-100/70 hover:bg-green-50/40'
                  badgeBgClass = 'bg-green-100 text-green-800 border border-green-200 animate-pulse font-bold'
                  badgeText = 'Toca hoy'
                  nextDateColorClass = 'text-green-700 font-bold'
                } else if (esManana) {
                  cardBgClass = 'bg-indigo-50/20 border-indigo-100/70 hover:bg-indigo-50/40'
                  badgeBgClass = 'bg-indigo-100 text-indigo-850 border border-indigo-200 font-bold'
                  badgeText = 'Toca mañana'
                  nextDateColorClass = 'text-indigo-700 font-bold'
                }

                return (
                  <div key={i} className={`p-5 rounded-3xl border transition-luxury flex flex-col justify-between gap-4 ${cardBgClass}`}>
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h4 className="text-base font-bold text-gray-800 tracking-wide">{crm.cliente_nombre}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-xxs font-black tracking-wide ${badgeBgClass}`}>
                          {badgeText}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-semibold mb-3">
                        Tratamiento: <span className="text-blush-palmLeaf font-bold">{crm.servicio_nombre}</span>
                      </p>
                      <div className="space-y-1.5 text-xs text-gray-600 bg-white/60 p-3 rounded-2xl border border-gray-100/50">
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className="text-gray-400" />
                          <span>Último servicio: <strong>{parseDateStr(crm.ultima_cita_fecha)}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-gray-400" />
                          <span>Recontacto sugerido: <strong className={nextDateColorClass}>{parseDateStr(crm.proxima_cita_sugerida)}</strong></span>
                        </div>
                        {crm.cliente_celular && (
                          <div className="flex items-center gap-2 pt-1 border-t border-gray-100/50 mt-1">
                            <Phone size={13} className="text-gray-400" />
                            <span>Celular: <strong>{crm.cliente_celular}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleWhatsappContact(crm)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Phone size={14} />
                      Enviar Mensaje Recontacto
                      <ExternalLink size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {subTab === 'cumpleanos' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col animate-fade-in">
          {/* Cabecera y buscador */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-blush-palmLeaf flex items-center gap-2">
                <Cake size={22} className="text-pink-500 alert-pulse" />
                Seguimiento de Cumpleaños del Mes
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Envía saludos automáticos con descuento de fidelidad para sus cumpleaños.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Selector de Mes de Cumpleaños */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-black text-gray-450 uppercase ml-1">Mes de Cumpleaños</span>
                <select
                  value={birthdayMonth}
                  onChange={(e) => setBirthdayMonth(parseInt(e.target.value, 10))}
                  className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-black text-gray-700 outline-none cursor-pointer"
                >
                  {meses.map((m, idx) => (
                    <option key={idx} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Buscador de Cumpleaños */}
              <div className="relative flex-1 md:w-48 pt-3">
                <input
                  type="text"
                  placeholder="Buscar cumpleañera..."
                  value={searchBirthday}
                  onChange={(e) => setSearchBirthday(e.target.value)}
                  className="w-full !pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-205 rounded-xl text-xs outline-none focus:border-blush-palmLeaf font-semibold"
                />
                <Search className="absolute left-2.5 top-5 text-gray-400" size={13} />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">Cargando cumpleaños...</div>
          ) : birthdayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center space-y-2 bg-gray-50/30 border border-dashed border-gray-200 rounded-3xl">
              <Cake className="text-pink-300 opacity-60 animate-bounce" size={48} />
              <p className="font-bold text-gray-600">No hay cumpleaños</p>
              <p className="text-xs text-gray-400">Ningún cliente cumple años en {meses[birthdayMonth - 1]}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {birthdayList.map((c) => {
                const day = c.fecha_nacimiento.split('-')[2]
                return (
                  <div 
                    key={c.id} 
                    className="p-5 bg-gradient-to-br from-pink-50/30 to-pink-100/10 border border-pink-100 rounded-3xl hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="text-base font-bold text-gray-800 tracking-wide">{c.nombre}</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-xxs font-black bg-pink-100 text-pink-700 border border-pink-200 uppercase">
                          {day} {meses[birthdayMonth - 1].substring(0, 3)}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-gray-650 bg-white/70 p-3 rounded-2xl border border-pink-50/50 mt-3">
                        <div>
                          <span className="text-gray-400 font-bold">F. Nacimiento:</span> {parseDateStr(c.fecha_nacimiento)}
                        </div>
                        {c.celular && (
                          <div>
                            <span className="text-gray-400 font-bold">Celular:</span> {c.celular}
                          </div>
                        )}
                        {c.correo && (
                          <div className="truncate">
                            <span className="text-gray-400 font-bold">Correo:</span> {c.correo}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleBirthdayContact(c)}
                      className="w-full bg-pink-550 hover:bg-pink-600 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-pink-500/10"
                      style={{ backgroundColor: '#ec4899' }}
                    >
                      <MessageSquare size={14} />
                      Enviar Felicitación (15% Desc)
                      <ExternalLink size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
