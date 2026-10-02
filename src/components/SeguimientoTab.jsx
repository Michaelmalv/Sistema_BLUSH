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
  MessageSquare,
  History,
  Users,
  DollarSign,
  Scissors,
  Award,
  ArrowRight,
  TrendingUp,
  Receipt,
  UserCheck,
  Filter
} from 'lucide-react'
import { dataService } from '../dataService'
import ClientHistoryModal from './ClientHistoryModal'

export default function SeguimientoTab({ activeTab, selectedBranchId, subTab: controlledSubTab, onSubTabChange }) {
  // Sub-tabs: 'recontacto', 'cumpleanos', 'historial'
  const [internalSubTab, setInternalSubTab] = useState('recontacto')
  const subTab = controlledSubTab !== undefined ? controlledSubTab : internalSubTab

  const setSubTab = (tab) => {
    setInternalSubTab(tab)
    if (onSubTabChange) {
      onSubTabChange(tab)
    }
  }

  const [recontactar, setRecontactar] = useState([])
  const [clientes, setClientes] = useState([])
  const [clientesConHistorial, setClientesConHistorial] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal de Historial de Cliente
  const [selectedClientForHistory, setSelectedClientForHistory] = useState(null)

  // Buscadores
  const [searchRecontacto, setSearchRecontacto] = useState('')
  const [searchBirthday, setSearchBirthday] = useState('')
  const [searchHistorial, setSearchHistorial] = useState('')

  // Filtros
  const [filterRecontacto, setFilterRecontacto] = useState('todos')
  const [filterHistorial, setFilterHistorial] = useState('todos') // 'todos', 'con_visitas', 'frecuentes', 'nuevas', 'sin_visitas'
  const [birthdayMonth, setBirthdayMonth] = useState(new Date().getMonth() + 1) // 1-12

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const loadData = async () => {
    try {
      setLoading(true)
      const [rc, cl, clHist] = await Promise.all([
        dataService.getClientesPorRecontactar(),
        dataService.getClientes(),
        dataService.getClientesConResumenHistorial()
      ])
      setRecontactar(rc)
      setClientes(cl)
      setClientesConHistorial(clHist)
    } catch (err) {
      console.error('Error al cargar datos CRM/Seguimiento:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeTab, selectedBranchId])

  useEffect(() => {
    const handleDbUpdate = () => loadData()
    const handleFocus = () => {
      if (document.visibilityState === 'visible') loadData()
    }
    window.addEventListener('blush_db_update', handleDbUpdate)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)
    return () => {
      window.removeEventListener('blush_db_update', handleDbUpdate)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [])

  const parseDateStr = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const parts = dateStr.includes('T') ? dateStr.split('T')[0].split('-') : dateStr.split('-')
      if (parts.length === 3) {
        return parts[2] + '/' + parts[1] + '/' + parts[0]
      }
    } catch (e) {}
    return dateStr
  }

  // Enviar WhatsApp de Recontacto
  const handleWhatsappContact = (crm) => {
    if (!crm.cliente_celular || crm.cliente_celular === 'N/A' || crm.cliente_celular.trim() === '') {
      alert('La clienta ' + crm.cliente_nombre + ' no tiene un número de celular registrado.')
      return
    }

    let fechaLimpia = crm.ultima_cita_fecha
    try {
      if (crm.ultima_cita_fecha) {
        const datePart = crm.ultima_cita_fecha.includes('T') 
          ? crm.ultima_cita_fecha.split('T')[0] 
          : crm.ultima_cita_fecha
        const [year, month, day] = datePart.split('-')
        fechaLimpia = day + '/' + month + '/' + year
      }
    } catch (e) {
      console.error('Error al formatear fecha de cita:', e)
    }

    const nombreCompleto = crm.cliente_nombre.split(' ')[0]
    const mensaje = 'Hola ' + nombreCompleto + ', te saludamos de Blush Beauty Studio. ✨ Vemos que tu último servicio de ' + crm.servicio_nombre + ' fue el ' + fechaLimpia + '. Como han transcurrido ' + crm.frecuencia_recomendada_dias + ' días, te sugerimos agendar tu cita de retoque o mantenimiento para consentirte de nuevo. ¿Te gustaría reservar un espacio para esta semana? 💖'
    
    const tel = crm.cliente_celular.replace(/\D/g, '')
    let formattedTel = tel
    if (tel.startsWith('0')) {
      formattedTel = '593' + tel.substring(1)
    }
    const url = 'https://wa.me/' + formattedTel + '?text=' + encodeURIComponent(mensaje)
    window.open(url, '_blank')
  }

  // Enviar WhatsApp de Cumpleaños
  const handleBirthdayContact = (cliente) => {
    if (!cliente.celular || cliente.celular === 'N/A' || cliente.celular.trim() === '') {
      alert('La clienta ' + cliente.nombre + ' no tiene un número de celular registrado.')
      return
    }

    const nombrePila = cliente.nombre.split(' ')[0]
    const mensaje = '🎂✨ ¡Feliz cumpleaños de parte de BLUSH! ✨🎂\n\n¡Hola ' + nombrePila + '! Te deseamos un día maravilloso, lleno de momentos bonitos y mucho amor. 💗\nQueremos invitarte a regalarte un momento para ti y disfrutar de alguno de nuestros servicios. Y como detalle especial por tu cumpleaños, tienes un 15% de descuento en cualquiera de ellos. ✨\n\n💅 Manicure\n🦶 Pedicure\n✨ Depilación de cejas\n👁️ Lifting de pestañas\n\n📲 Agenda tu cita y déjanos consentirte.\nCon cariño, BLUSH 💗'
    
    const tel = cliente.celular.replace(/\D/g, '')
    let formattedTel = tel
    if (tel.startsWith('0')) {
      formattedTel = '593' + tel.substring(1)
    }
    const url = 'https://wa.me/' + formattedTel + '?text=' + encodeURIComponent(mensaje)
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
      const parts = c.fecha_nacimiento.split('-')
      if (parts.length !== 3) return false
      const month = parseInt(parts[1], 10)
      if (month !== birthdayMonth) return false

      const term = searchBirthday.toLowerCase().trim()
      if (!term) return true
      return c.nombre.toLowerCase().includes(term)
    }).sort((a, b) => {
      const dayA = parseInt(a.fecha_nacimiento.split('-')[2], 10)
      const dayB = parseInt(b.fecha_nacimiento.split('-')[2], 10)
      return dayA - dayB
    })
  }, [clientes, birthdayMonth, searchBirthday])

  // Filtrado de Clientes para Historial
  const filteredHistorialList = useMemo(() => {
    const term = searchHistorial.toLowerCase().trim()
    return clientesConHistorial.filter(c => {
      const matchesSearch = !term || (
        c.nombre.toLowerCase().includes(term) ||
        (c.cedula && c.cedula.includes(term)) ||
        (c.celular && c.celular.includes(term)) ||
        (c.ultimoServicio && c.ultimoServicio.toLowerCase().includes(term))
      )
      if (!matchesSearch) return false

      if (filterHistorial === 'con_visitas') return c.totalVisitas > 0
      if (filterHistorial === 'frecuentes') return c.totalVisitas >= 3
      if (filterHistorial === 'nuevas') return c.totalVisitas === 1
      if (filterHistorial === 'sin_visitas') return c.totalVisitas === 0
      return true
    }).sort((a, b) => {
      if (b.totalVisitas !== a.totalVisitas) {
        return b.totalVisitas - a.totalVisitas
      }
      return (b.totalGastado || 0) - (a.totalGastado || 0)
    })
  }, [clientesConHistorial, searchHistorial, filterHistorial])

  // Métricas globales de CRM para la sub-pestaña Historial
  const metricasHistorial = useMemo(() => {
    const totalClientes = clientesConHistorial.length
    const conHistorial = clientesConHistorial.filter(c => c.totalVisitas > 0).length
    const totalVisitas = clientesConHistorial.reduce((sum, c) => sum + (c.totalVisitas || 0), 0)
    const facturacionTotal = clientesConHistorial.reduce((sum, c) => sum + (c.totalGastado || 0), 0)
    return { totalClientes, conHistorial, totalVisitas, facturacionTotal }
  }, [clientesConHistorial])

  const pendingRecontactsCount = recontactar.filter(c => c.dias_retraso >= -1 && c.dias_retraso <= 90 && c.cliente_nombre && !c.cliente_nombre.toLowerCase().includes('consumidor final')).length
  const currentMonthBirthdaysCount = clientes.filter(c => {
    if (!c.fecha_nacimiento) return false
    const parts = c.fecha_nacimiento.split('-')
    return parts.length === 3 && parseInt(parts[1], 10) === (new Date().getMonth() + 1)
  }).length

  return (
    <div className="space-y-6">
      {/* Selector de Sub-pestañas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setSubTab('recontacto')}
          className={'px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ' + 
            (subTab === 'recontacto'
              ? 'bg-blush-palmLeaf text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100')}
        >
          <BellRing size={14} className={subTab === 'recontacto' ? 'text-white' : 'text-blush-palmLeaf'} />
          Recontacto Inteligente
          {pendingRecontactsCount > 0 && (
            <span className={'px-2 py-0.5 rounded-full text-xxs font-black ' + (subTab === 'recontacto' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700')}>
              {pendingRecontactsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('cumpleanos')}
          className={'px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ' + 
            (subTab === 'cumpleanos'
              ? 'bg-blush-palmLeaf text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100')}
        >
          <Cake size={14} className={subTab === 'cumpleanos' ? 'text-white' : 'text-pink-500'} />
          Cumpleaños del Mes
          {currentMonthBirthdaysCount > 0 && (
            <span className={'px-2 py-0.5 rounded-full text-xxs font-black ' + (subTab === 'cumpleanos' ? 'bg-white/20 text-white' : 'bg-pink-100 text-pink-700')}>
              {currentMonthBirthdaysCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('historial')}
          className={'px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ' + 
            (subTab === 'historial'
              ? 'bg-blush-palmLeaf text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100')}
        >
          <History size={14} className={subTab === 'historial' ? 'text-white' : 'text-indigo-600'} />
          Historial de Clientes
          <span className={'px-2 py-0.5 rounded-full text-xxs font-black ' + (subTab === 'historial' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700')}>
            {clientesConHistorial.length}
          </span>
        </button>
      </div>

      {/* Sub-pestaña 1: Recontacto Inteligente */}
      {subTab === 'recontacto' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-blush-palmLeaf flex items-center gap-2">
                <BellRing size={20} className="text-rose-500 alert-pulse" />
                Seguimiento y Recontacto de Clientes
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Detecta automáticamente clientas listas para agendar retoque según su servicio previo.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-56">
                <input
                  type="text"
                  placeholder="Buscar clienta o servicio..."
                  value={searchRecontacto}
                  onChange={(e) => setSearchRecontacto(e.target.value)}
                  className="w-full !pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-205 rounded-xl text-xs outline-none focus:border-blush-palmLeaf font-semibold"
                />
                <Search className="absolute left-2.5 top-2.5 text-gray-400" size={13} />
              </div>

              <select
                value={filterRecontacto}
                onChange={(e) => setFilterRecontacto(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-black text-gray-700 outline-none cursor-pointer"
              >
                <option value="todos">Todos los Estados ({recontactar.length})</option>
                <option value="atrasados">Atrasados (Retoque pendiente)</option>
                <option value="hoy">Toca Hoy</option>
                <option value="manana">Toca Mañana</option>
                <option value="al_dia">Al día</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">Cargando recontactos...</div>
          ) : filteredRecontacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center space-y-2 bg-gray-50/30 border border-dashed border-gray-200 rounded-3xl">
              <Sparkles className="text-emerald-500 opacity-60" size={48} />
              <p className="font-bold text-gray-600">¡Todo al día!</p>
              <p className="text-xs text-gray-400">No hay clientes pendientes de recontacto con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecontacts.map((crm, i) => {
                let badgeBgClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                let badgeText = 'Al día'
                let cardBgClass = 'bg-white hover:border-gray-300'
                let nextDateColorClass = 'text-emerald-700 font-bold'

                if (crm.dias_retraso > 0) {
                  badgeBgClass = 'bg-rose-50 text-rose-700 border border-rose-100'
                  badgeText = crm.dias_retraso + (crm.dias_retraso === 1 ? ' día tarde' : ' días tarde')
                  cardBgClass = 'bg-rose-50/10 border-rose-100 hover:border-rose-200'
                  nextDateColorClass = 'text-rose-700 font-bold'
                } else if (crm.dias_retraso === 0) {
                  badgeBgClass = 'bg-amber-50 text-amber-700 border border-amber-100'
                  badgeText = 'Toca hoy'
                  cardBgClass = 'bg-amber-50/10 border-amber-100 hover:border-amber-200'
                  nextDateColorClass = 'text-amber-700 font-bold'
                } else if (crm.dias_retraso === -1) {
                  badgeBgClass = 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  badgeText = 'Toca mañana'
                  nextDateColorClass = 'text-indigo-700 font-bold'
                }

                return (
                  <div key={i} className={'p-5 rounded-3xl border transition-luxury flex flex-col justify-between gap-4 ' + cardBgClass}>
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h4 className="text-base font-bold text-gray-800 tracking-wide">{crm.cliente_nombre}</h4>
                        <span className={'px-2.5 py-0.5 rounded-full text-xxs font-black tracking-wide ' + badgeBgClass}>
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

                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        onClick={() => handleWhatsappContact(crm)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <Phone size={14} />
                        Enviar Mensaje Recontacto
                        <ExternalLink size={12} />
                      </button>

                      <button
                        onClick={() => setSelectedClientForHistory({ id: crm.cliente_id, nombre: crm.cliente_nombre, celular: crm.cliente_celular })}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <History size={13} className="text-blush-palmLeaf" />
                        Ver Historial Completo
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-pestaña 2: Cumpleaños del Mes */}
      {subTab === 'cumpleanos' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col animate-fade-in">
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

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleBirthdayContact(c)}
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-pink-500/10"
                      >
                        <MessageSquare size={14} />
                        Enviar Felicitación (15% Desc)
                        <ExternalLink size={12} />
                      </button>

                      <button
                        onClick={() => setSelectedClientForHistory(c)}
                        className="w-full bg-white hover:bg-pink-50 text-gray-700 border border-pink-200 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <History size={13} className="text-pink-600" />
                        Ver Historial Completo
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-pestaña 3: Historial Completo de Clientes */}
      {subTab === 'historial' && (
        <div className="space-y-6 animate-fade-in">
          {/* Métricas Globales de Historial */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-3xl border border-gray-150 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Total Clientes</p>
                <p className="text-xl font-black text-gray-800">{metricasHistorial.totalClientes}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-gray-150 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <UserCheck size={20} />
              </div>
              <div>
                <p className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Con Historial Activo</p>
                <p className="text-xl font-black text-gray-800">{metricasHistorial.conHistorial}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-gray-150 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Visitas Realizadas</p>
                <p className="text-xl font-black text-gray-800">{metricasHistorial.totalVisitas}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-gray-150 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Facturado en Servicios</p>
                <p className="text-xl font-black text-emerald-600">
                  {'$' + Number(metricasHistorial.facturacionTotal || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Panel Principal de Búsqueda y Lista */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-blush-palmLeaf flex items-center gap-2">
                  <History size={22} className="text-indigo-600" />
                  Búsqueda e Historial Integral de Clientes
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Consulta el recorrido, tratamientos solicitados, fechas, montos invertidos y especialistas de cada clienta.
                </p>
              </div>

              {/* Barra de Búsqueda y Filtro */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, cédula o teléfono..."
                    value={searchHistorial}
                    onChange={(e) => setSearchHistorial(e.target.value)}
                    className="w-full !pl-9 pr-3 py-2 bg-gray-50 border border-gray-205 rounded-xl text-xs outline-none focus:border-blush-palmLeaf font-semibold"
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                  {searchHistorial && (
                    <button
                      onClick={() => setSearchHistorial('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                <select
                  value={filterHistorial}
                  onChange={(e) => setFilterHistorial(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-black text-gray-700 outline-none cursor-pointer"
                >
                  <option value="todos">Todos los clientes ({clientesConHistorial.length})</option>
                  <option value="con_visitas">Con visitas ({metricasHistorial.conHistorial})</option>
                  <option value="frecuentes">Frecuentes (3+ visitas)</option>
                  <option value="nuevas">Nuevas (1 visita)</option>
                  <option value="sin_visitas">Sin visitas aún</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">Cargando catálogo de clientes...</div>
            ) : filteredHistorialList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center space-y-2 bg-gray-50/30 border border-dashed border-gray-200 rounded-3xl">
                <Search className="text-gray-300" size={48} />
                <p className="font-bold text-gray-600">No se encontraron clientes</p>
                <p className="text-xs text-gray-400">Intenta con otro nombre, cédula o ajusta el filtro.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredHistorialList.map((c) => {
                  const initial = (c.nombre || 'C').charAt(0).toUpperCase()
                  const hasHistory = (c.totalVisitas || 0) > 0
                  
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => setSelectedClientForHistory(c)}
                      className="p-5 bg-white border border-gray-150 hover:border-blush-palmLeaf hover:shadow-lg rounded-3xl transition-all flex flex-col justify-between gap-4 cursor-pointer relative group overflow-hidden"
                    >
                      {/* Fondo decorativo hover */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-rose-100 transition-colors pointer-events-none" />

                      <div>
                        {/* Cabecera de la tarjeta */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#9F2241] to-[#D1A054] text-white font-black text-lg flex items-center justify-center shadow-sm shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-black text-gray-800 tracking-tight truncate group-hover:text-blush-palmLeaf transition-colors">
                              {c.nombre}
                            </h4>
                            <p className="text-xxs text-gray-400 font-medium">
                              {c.cedula ? 'Cédula: ' + c.cedula : (c.celular || 'Sin teléfono')}
                            </p>
                          </div>
                        </div>

                        {/* Píldoras de Estadísticas del Cliente */}
                        <div className="grid grid-cols-2 gap-2 bg-gray-50/80 p-3 rounded-2xl border border-gray-100 text-xs mb-3">
                          <div>
                            <span className="text-gray-400 font-bold text-xxs uppercase block">Visitas</span>
                            <span className="font-black text-gray-700">
                              {c.totalVisitas || 0} {c.totalVisitas === 1 ? 'visita' : 'visitas'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-bold text-xxs uppercase block">Total Invertido</span>
                            <span className="font-black text-emerald-600">
                              {'$' + Number(c.totalGastado || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Detalle del último servicio */}
                        {hasHistory ? (
                          <div className="space-y-1 text-xs text-gray-600 bg-rose-50/30 p-2.5 rounded-xl border border-rose-100/50">
                            <div className="flex items-center gap-1.5 truncate">
                              <Scissors size={12} className="text-blush-palmLeaf shrink-0" />
                              <span className="truncate">Último: <strong className="text-gray-800">{c.ultimoServicio || 'Servicio'}</strong></span>
                            </div>
                            {c.ultimaVisita && (
                              <div className="flex items-center gap-1.5 text-xxs text-gray-400">
                                <Calendar size={11} className="shrink-0" />
                                <span>Fecha: <strong>{parseDateStr(c.ultimaVisita)}</strong></span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-gray-50 text-gray-400 text-xxs font-medium text-center border border-dashed border-gray-200">
                            Sin historial de citas registradas aún
                          </div>
                        )}
                      </div>

                      {/* Botón de acción */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedClientForHistory(c)
                        }}
                        className="w-full bg-gray-100 hover:bg-blush-palmLeaf hover:text-white text-gray-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group-hover:bg-blush-palmLeaf group-hover:text-white"
                      >
                        <History size={14} />
                        Ver Historial Completo
                        <ArrowRight size={13} className="opacity-70" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Detallado de Historial del Cliente */}
      {selectedClientForHistory && (
        <ClientHistoryModal
          clienteId={selectedClientForHistory.id || selectedClientForHistory.cliente_id}
          clienteData={selectedClientForHistory}
          onClose={() => setSelectedClientForHistory(null)}
        />
      )}
    </div>
  )
}
