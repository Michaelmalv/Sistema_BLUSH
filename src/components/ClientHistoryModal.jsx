import React, { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, 
  Calendar, 
  Clock, 
  DollarSign, 
  Scissors, 
  User, 
  Phone, 
  Mail, 
  Cake, 
  Sparkles, 
  Award, 
  TrendingUp, 
  Search, 
  Download, 
  ExternalLink, 
  CreditCard, 
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { dataService } from '../dataService'
import { exportExcelJS } from '../excelExporter'

export default function ClientHistoryModal({ clienteId, clienteData, onClose }) {
  const [historyData, setHistoryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState('')
  const [filterType, setFilterType] = useState('todos') // 'todos', 'ano_actual'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    let isMounted = true
    const loadHistory = async () => {
      if (!clienteId && !clienteData?.id) return
      try {
        setLoading(true)
        const targetId = clienteId || clienteData.id
        const res = await dataService.getHistorialCliente(targetId)
        if (isMounted) {
          setHistoryData(res)
        }
      } catch (err) {
        console.error('Error al cargar historial del cliente:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadHistory()
    return () => { isMounted = false }
  }, [clienteId, clienteData])

  const clientInfo = historyData?.cliente || clienteData || {}

  const formatDateTimeStr = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A'
    try {
      const [dPart, tPart] = dateTimeStr.includes('T') ? dateTimeStr.split('T') : dateTimeStr.split(' ')
      const [year, month, day] = dPart.split('-')
      const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      const diaSemana = diasSemana[dateObj.getDay()]
      const mesNombre = mesesNombres[parseInt(month, 10) - 1]
      let horaFormateada = ''
      if (tPart) {
        const [hh, mm] = tPart.split(':')
        const hNum = parseInt(hh, 10)
        const ampm = hNum >= 12 ? 'PM' : 'AM'
        const h12 = hNum % 12 || 12
        horaFormateada = ' • ' + h12 + ':' + mm + ' ' + ampm
      }
      return diaSemana + ', ' + parseInt(day, 10) + ' de ' + mesNombre + ' ' + year + horaFormateada
    } catch (e) {
      return dateTimeStr
    }
  }

  const parseShortDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const d = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0]
      const [year, month, day] = d.split('-')
      return day + '/' + month + '/' + year
    } catch (e) {
      return dateStr
    }
  }

  // Filtrado de visitas por término de búsqueda y tipo
  const filteredVisitas = useMemo(() => {
    if (!historyData?.visitas) return []
    const term = searchFilter.toLowerCase().trim()
    const currentYear = new Date().getFullYear().toString()

    return historyData.visitas.filter(v => {
      const matchesSearch = !term || (
        v.fecha_hora.toLowerCase().includes(term) ||
        v.forma_pago.toLowerCase().includes(term) ||
        (v.no_transferencia && v.no_transferencia.toLowerCase().includes(term)) ||
        v.servicios.some(s => 
          s.servicio_nombre.toLowerCase().includes(term) ||
          s.personal_nombre.toLowerCase().includes(term)
        )
      )

      if (!matchesSearch) return false

      if (filterType === 'ano_actual') {
        return v.fecha_hora.startsWith(currentYear)
      }

      return true
    })
  }, [historyData, searchFilter, filterType])

  // Acción de WhatsApp directo
  const handleOpenWhatsApp = () => {
    if (!clientInfo.celular || clientInfo.celular === 'N/A') {
      alert('La clienta no tiene un número celular registrado.')
      return
    }
    const nombrePila = (clientInfo.nombre || 'Estimada clienta').split(' ')[0]
    const ultimoSvc = historyData?.visitas?.[0]?.servicios?.[0]?.servicio_nombre || 'nuestros tratamientos'
    const mensaje = '¡Hola ' + nombrePila + '! ✨ Te saludamos de Blush Beauty Studio. Nos encanta tenerte como parte de nuestra familia Blush. Vemos que tu último servicio fue ' + ultimoSvc + '. ¿Cómo te sentiste con los resultados? ¿Te gustaría agendar un nuevo espacio para consentirte? 💖'

    const tel = clientInfo.celular.replace(/\D/g, '')
    let formattedTel = tel
    if (tel.startsWith('0')) {
      formattedTel = '593' + tel.substring(1)
    }
    const url = 'https://wa.me/' + formattedTel + '?text=' + encodeURIComponent(mensaje)
    window.open(url, '_blank')
  }

  // Exportar historial a Excel
  const handleExportExcel = () => {
    if (!historyData || !historyData.visitas || historyData.visitas.length === 0) {
      alert('No hay historial de visitas para exportar.')
      return
    }

    const rows = []
    historyData.visitas.forEach(v => {
      v.servicios.forEach(s => {
        rows.push({
          'Fecha y Hora': v.fecha_hora,
          'Cliente': clientInfo.nombre || 'N/A',
          'Cédula': clientInfo.cedula || 'N/A',
          'Celular': clientInfo.celular || 'N/A',
          'Servicio / Tratamiento': s.servicio_nombre,
          'Especialista / Atendido Por': s.personal_nombre,
          'Valor Pagado ($)': Number(s.valor_pagado || 0).toFixed(2),
          'Forma de Pago': v.forma_pago,
          'No. Transferencia': v.no_transferencia || 'N/A'
        })
      })
    })

    const cleanName = (clientInfo.nombre || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_')
    exportExcelJS(rows, 'Historial_' + cleanName, 'Historial de ' + (clientInfo.nombre || 'Cliente'))
  }

  const totalVisitas = historyData?.totalVisitas || 0
  let badgeLealtad = { text: 'Prospecto / Sin citas', bg: 'bg-gray-100 text-gray-700 border-gray-200' }
  if (totalVisitas >= 5) {
    badgeLealtad = { text: '⭐ Clienta VIP / Muy Fiel', bg: 'bg-amber-100 text-amber-900 border-amber-300' }
  } else if (totalVisitas >= 2) {
    badgeLealtad = { text: '✨ Clienta Frecuente', bg: 'bg-rose-100 text-rose-900 border-rose-300' }
  } else if (totalVisitas === 1) {
    badgeLealtad = { text: '🌸 Clienta Nueva (1 visita)', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
  }

  const initial = (clientInfo.nombre || 'C').charAt(0).toUpperCase()

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-tab-active">
      <div 
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-150 overflow-hidden relative animate-slide-in my-4 max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Hero con gradiente Blush */}
        <div className="bg-gradient-to-r from-[#9F2241] via-[#8B1E38] to-[#D1A054] text-white p-5 sm:p-6 relative shrink-0 shadow-inner">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0">
              {initial}
            </div>

            {/* Info principal del cliente */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                  {clientInfo.nombre || 'Detalle del Cliente'}
                </h2>
                <span className={"px-2.5 py-0.5 rounded-full text-xxs font-black border uppercase tracking-wider " + badgeLealtad.bg}>
                  {badgeLealtad.text}
                </span>
              </div>

              {/* Fila de metadatos */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/90">
                {clientInfo.cedula && (
                  <div className="flex items-center gap-1">
                    <span className="text-white/60 font-medium">Cédula:</span>
                    <span className="font-bold">{clientInfo.cedula}</span>
                  </div>
                )}
                {clientInfo.celular && (
                  <div className="flex items-center gap-1">
                    <Phone size={12} className="text-white/70" />
                    <span className="font-bold">{clientInfo.celular}</span>
                    <button
                      onClick={handleOpenWhatsApp}
                      className="ml-1 px-2 py-0.5 bg-green-500/80 hover:bg-green-500 text-white rounded-md text-xxs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      title="Abrir chat de WhatsApp"
                    >
                      WhatsApp <ExternalLink size={10} />
                    </button>
                  </div>
                )}
                {clientInfo.correo && (
                  <div className="flex items-center gap-1 truncate max-w-xs">
                    <Mail size={12} className="text-white/70" />
                    <span className="truncate">{clientInfo.correo}</span>
                  </div>
                )}
                {clientInfo.fecha_nacimiento && (
                  <div className="flex items-center gap-1">
                    <Cake size={12} className="text-pink-200" />
                    <span>Cumpleaños: <strong>{parseShortDate(clientInfo.fecha_nacimiento)}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cuerpo del Modal con scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 text-gray-400">
              <Sparkles className="animate-spin text-blush-palmLeaf" size={32} />
              <p className="text-sm font-bold text-gray-600">Cargando historial completo del cliente...</p>
            </div>
          ) : !historyData ? (
            <div className="text-center py-16 text-gray-500">
              <AlertCircle size={40} className="mx-auto text-amber-400 mb-2" />
              <p className="font-bold">No se pudo cargar la información histórica.</p>
            </div>
          ) : (
            <>
              {/* Tarjetas de Métricas Resumen (KPIs) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Total Visitas */}
                <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Visitas</span>
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                      <Calendar size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-gray-800">
                      {historyData.totalVisitas}
                    </div>
                    <p className="text-xxs text-gray-400 font-medium mt-0.5">
                      {historyData.primeraVisita ? '1ª: ' + parseShortDate(historyData.primeraVisita) : 'Sin registros'}
                    </p>
                  </div>
                </div>

                {/* 2. Total Invertido */}
                <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Invertido</span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <DollarSign size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-emerald-600">
                      ${Number(historyData.totalGastado || 0).toFixed(2)}
                    </div>
                    <p className="text-xxs text-gray-400 font-medium mt-0.5">
                      Promedio: ${Number(historyData.promedioGastoVisita || 0).toFixed(2)} / visita
                    </p>
                  </div>
                </div>

                {/* 3. Servicios Recibidos */}
                <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tratamientos</span>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                      <Scissors size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-gray-800">
                      {historyData.totalServicios}
                    </div>
                    <p className="text-xxs text-gray-400 font-medium mt-0.5 truncate">
                      {historyData.ultimaVisita ? 'Última: ' + parseShortDate(historyData.ultimaVisita) : 'Sin registros'}
                    </p>
                  </div>
                </div>

                {/* 4. Servicio Favorito */}
                <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Favorito</span>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <Award size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-800 truncate" title={historyData.servicioFavorito?.nombre || 'N/A'}>
                      {historyData.servicioFavorito?.nombre || 'General'}
                    </div>
                    <p className="text-xxs text-amber-600 font-bold mt-0.5">
                      {historyData.servicioFavorito ? 'Realizado ' + historyData.servicioFavorito.veces + (historyData.servicioFavorito.veces === 1 ? ' vez' : ' veces') : 'Sin preferencia'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Barra de Búsqueda y Filtros dentro del Historial */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-150 shadow-sm">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por servicio, fecha, método de pago o especialista..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:border-blush-palmLeaf"
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="todos">Todas las visitas ({historyData.visitas.length})</option>
                    <option value="ano_actual">Solo de este año</option>
                  </select>

                  <button
                    onClick={handleExportExcel}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
                    title="Descargar historial en formato Excel"
                  >
                    <FileSpreadsheet size={14} />
                    <span className="hidden sm:inline">Exportar Excel</span>
                  </button>
                </div>
              </div>

              {/* Lista Cronológica de Visitas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Receipt size={16} className="text-blush-palmLeaf" />
                    Línea de Tiempo de Servicios ({filteredVisitas.length})
                  </h3>
                  <span className="text-xs text-gray-400 font-semibold">
                    Ordenado de más reciente a más antiguo
                  </span>
                </div>

                {filteredVisitas.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 p-6">
                    <Scissors size={36} className="mx-auto text-gray-300 mb-2" />
                    <h4 className="text-base font-bold text-gray-700">No se encontraron visitas registradas</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      {searchFilter 
                        ? 'Ninguna visita coincide con el filtro de búsqueda aplicado.' 
                        : 'Esta clienta aún no tiene citas o ventas facturadas en el sistema.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredVisitas.map((visita, idx) => {
                      const totalVisita = Number(visita.totalVisita || 0).toFixed(2)
                      return (
                        <div 
                          key={idx}
                          className="bg-white rounded-2xl border border-gray-150 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                        >
                          {/* Barra lateral decorativa */}
                          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-blush-palmLeaf to-[#D1A054]" />

                          {/* Encabezado de la visita */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100 pl-2">
                            <div className="flex items-center gap-2">
                              <Calendar size={15} className="text-blush-palmLeaf" />
                              <span className="text-sm font-black text-gray-800">
                                {formatDateTimeStr(visita.fecha_hora)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Método de pago */}
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1">
                                <CreditCard size={12} className="text-gray-500" />
                                {visita.forma_pago}
                                {visita.no_transferencia ? ' (#' + visita.no_transferencia + ')' : ''}
                              </span>

                              {/* Total de la visita */}
                              <span className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Total: ${totalVisita}
                              </span>
                            </div>
                          </div>

                          {/* Desglose de servicios de la visita */}
                          <div className="space-y-2 pl-2">
                            <div className="text-xxs font-bold uppercase text-gray-400 tracking-wider">
                              Servicios Realizados en esta Sesión:
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {visita.servicios.map((s, sIdx) => (
                                <div 
                                  key={sIdx}
                                  className="flex items-center justify-between p-2.5 bg-gray-50/80 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-pink-100/60 text-pink-700 flex items-center justify-center shrink-0">
                                      <Scissors size={13} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-gray-800 truncate">
                                        {s.servicio_nombre}
                                      </p>
                                      <p className="text-xxs text-gray-400 font-medium flex items-center gap-1">
                                        <User size={10} />
                                        Atendido por: <strong className="text-gray-600">{s.personal_nombre}</strong>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right pl-2 shrink-0">
                                    <span className="text-xs font-black text-gray-700">
                                      ${Number(s.valor_pagado || 0).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="p-4 bg-white border-t border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
            <Sparkles size={14} className="text-blush-palmLeaf" />
            <span>Registro completo sincronizado con la nube Blush.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {clientInfo.celular && (
              <button
                onClick={handleOpenWhatsApp}
                className="flex-1 sm:flex-initial px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Phone size={13} />
                Contactar por WhatsApp
                <ExternalLink size={11} />
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
