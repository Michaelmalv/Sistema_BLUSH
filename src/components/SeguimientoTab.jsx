import React, { useEffect, useState } from 'react'
import { Search, Phone, Calendar, Clock, BellRing, ExternalLink, Sparkles } from 'lucide-react'
import { dataService } from '../dataService'

export default function SeguimientoTab({ activeTab, selectedBranchId }) {
  const [recontactar, setRecontactar] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos') // 'todos', 'atrasados', 'hoy', 'al_dia'
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const rc = await dataService.getClientesPorRecontactar()
      setRecontactar(rc)
    } catch (err) {
      console.error('Error al cargar datos CRM:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'seguimiento') {
      loadData()
    }
  }, [activeTab, selectedBranchId])

  const handleWhatsappContact = (crm) => {
    if (!crm.cliente_celular || crm.cliente_celular === 'N/A' || crm.cliente_celular.trim() === '') {
      alert(`La clienta ${crm.cliente_nombre} no tiene un número de celular registrado.`);
      return;
    }

    let fechaLimpia = crm.ultima_cita_fecha;
    try {
      if (crm.ultima_cita_fecha) {
        const datePart = crm.ultima_cita_fecha.includes('T') 
          ? crm.ultima_cita_fecha.split('T')[0] 
          : crm.ultima_cita_fecha;
        const [year, month, day] = datePart.split('-');
        fechaLimpia = `${day}/${month}/${year}`;
      }
    } catch (e) {
      console.error('Error al formatear fecha de cita:', e);
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

  // Filtrado de recontactos por búsqueda y por estado de retraso
  const filteredList = recontactar.filter(crm => {
    const term = search.toLowerCase()
    const matchesSearch = crm.cliente_nombre.toLowerCase().includes(term) ||
                          crm.servicio_nombre.toLowerCase().includes(term)
    
    if (!matchesSearch) return false
    
    if (filter === 'atrasados') return crm.dias_retraso > 0
    if (filter === 'hoy') return crm.dias_retraso === 0
    if (filter === 'manana') return crm.dias_retraso === -1
    if (filter === 'al_dia') return crm.dias_retraso < -1
    return true
  })

  // Helper para parsear fechas de forma segura sin colisiones de formato ISO
  const parseDateStr = (d) => {
    if (!d) return 'Sin fecha'
    const dateOnly = d.includes('T') ? d.split('T')[0] : d
    const dt = new Date(dateOnly + 'T00:00:00')
    return isNaN(dt.getTime()) ? 'Invalid Date' : dt.toLocaleDateString()
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
      {/* Encabezado y buscador */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-blush-palmLeaf flex items-center gap-2">
            <BellRing size={22} className="text-amber-600 alert-pulse" />
            Seguimiento de Clientes (Recontacto)
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Listado de clientes con visitas pendientes basadas en la frecuencia sugerida de cada tratamiento
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar por cliente o servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
          />
          <Search className="absolute left-3.5 top-3 text-gray-400" size={15} />
        </div>
      </div>

      {/* Filtros de estado de recontacto */}
      <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-100">
        <button
          onClick={() => setFilter('todos')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'todos'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
          }`}
        >
          Todos ({recontactar.length})
        </button>
        <button
          onClick={() => setFilter('atrasados')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'atrasados'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100'
          }`}
        >
          Atrasados ({recontactar.filter(c => c.dias_retraso > 0).length})
        </button>
        <button
          onClick={() => setFilter('hoy')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'hoy'
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-100'
          }`}
        >
          Toca hoy ({recontactar.filter(c => c.dias_retraso === 0).length})
        </button>
        <button
          onClick={() => setFilter('manana')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'manana'
              ? 'bg-indigo-650 text-white shadow-sm'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
          }`}
          style={{ backgroundColor: filter === 'manana' ? '#4f46e5' : '' }}
        >
          Toca mañana ({recontactar.filter(c => c.dias_retraso === -1).length})
        </button>
        <button
          onClick={() => setFilter('al_dia')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'al_dia'
              ? 'bg-slate-500 text-white shadow-sm'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
          }`}
        >
          Al día ({recontactar.filter(c => c.dias_retraso < -1).length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Cargando alertas de recontacto...</div>
      ) : filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center space-y-2">
          <Sparkles className="text-blush-palmLeaf opacity-65" size={48} />
          <p className="font-bold text-gray-600">Sin registros</p>
          <p className="text-xs">No se encontraron clientes para el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((crm, i) => {
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
              <div 
                key={i} 
                className={`p-5 rounded-3xl border transition-luxury flex flex-col justify-between gap-4 ${cardBgClass}`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="text-base font-bold text-gray-800 tracking-wide">{crm.cliente_nombre}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-xxs font-black tracking-wide ${badgeBgClass}`}>
                      {badgeText}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 font-semibold mb-3">
                    Servicio realizado: <span className="text-blush-palmLeaf font-bold">{crm.servicio_nombre}</span>
                  </p>

                  <div className="space-y-1.5 text-xs text-gray-600 bg-white/60 p-3 rounded-2xl border border-gray-100/50">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-gray-400" />
                      <span>Última visita: <strong>{parseDateStr(crm.ultima_cita_fecha)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-gray-400" />
                      <span>Reagendar desde: <strong className={nextDateColorClass}>{parseDateStr(crm.proxima_cita_sugerida)}</strong></span>
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
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-green-600/10"
                >
                  <Phone size={14} />
                  Enviar WhatsApp de Recontacto
                  <ExternalLink size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
