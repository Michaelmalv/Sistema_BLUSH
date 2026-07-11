import React, { useEffect, useState } from 'react'
import { DollarSign, Calendar, Eye, EyeOff, FileSpreadsheet } from 'lucide-react'
import { dataService } from '../dataService'
import { exportExcelJS } from '../excelExporter'

export default function SueldosTab({ activeTab, selectedBranchId }) {
  const [loading, setLoading] = useState(true)
  const [ventas, setVentas] = useState([])
  const [personal, setPersonal] = useState([])
  const [comisiones, setComisiones] = useState([])
  const [selectedManicuristaDetail, setSelectedManicuristaDetail] = useState(null)
  
  // Date selector (default: current month)
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth()) // 0-11
  const [selectedYear, setSelectedYear] = useState(today.getFullYear()) // YYYY

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const years = [2025, 2026, 2027]

  const loadData = async () => {
    try {
      setLoading(true)
      const [allVentas, allPersonal] = await Promise.all([
        dataService.getCitasVentas(),
        dataService.getPersonal()
      ])
      setVentas(allVentas)
      setPersonal(allPersonal)
    } catch (err) {
      console.error('Error al cargar datos de sueldos:', err)
      setVentas([])
      setPersonal([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedBranchId])

  useEffect(() => {
    // Calcular comisiones al cambiar mes, año, ventas o personal
    calculateCommissions()
  }, [selectedMonth, selectedYear, ventas, personal])

  const calculateCommissions = () => {
    if (!personal.length) return

    // Rango de fechas del mes seleccionado
    const startDate = new Date(selectedYear, selectedMonth, 1, 0, 0, 0)
    const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59)

    // Filtrar ventas de este período
    const periodVentas = ventas.filter(v => {
      const d = new Date(v.fecha_hora)
      return d >= startDate && d <= endDate
    })

    // Agrupar por personal
    const comms = personal.map(p => {
      const pVentas = periodVentas.filter(v => v.personal && v.personal.id === p.id)
      const totalVentas = pVentas.reduce((sum, v) => sum + Number(v.valor_pagado), 0)
      const totalComision = totalVentas * 0.40

      return {
        id: p.id,
        nombre: p.nombre,
        total_servicios: pVentas.length,
        total_ventas: totalVentas,
        comision: totalComision,
        detalles_ventas: pVentas
      }
    })

    setComisiones(comms.sort((a, b) => b.comision - a.comision))
  }

  const handleExportExcel = () => {
    // Generar datos para exportar usando exportExcelJS o una estructura tabular limpia
    const reportData = comisiones.map(c => ({
      'Colaboradora': c.nombre,
      'Cant. Servicios': c.total_servicios,
      'Total Facturado ($)': c.total_ventas,
      'Comisión a Pagar (40% $)': c.comision
    }))

    // Agregar totalizadores al final del Excel
    const sumServicios = comisiones.reduce((sum, c) => sum + c.total_servicios, 0)
    const sumFacturado = comisiones.reduce((sum, c) => sum + c.total_ventas, 0)
    const sumComision = comisiones.reduce((sum, c) => sum + c.comision, 0)

    reportData.push({
      'Colaboradora': 'TOTALES',
      'Cant. Servicios': sumServicios,
      'Total Facturado ($)': sumFacturado,
      'Comisión a Pagar (40% $)': sumComision
    })

    exportExcelJS(
      `Comisiones_Sueldos_${meses[selectedMonth]}_${selectedYear}`,
      `Reporte de Sueldos y Comisiones (40%) - ${meses[selectedMonth]} ${selectedYear}`,
      reportData,
      [
        { header: 'Colaboradora', key: 'Colaboradora', width: 25 },
        { header: 'Cant. Servicios', key: 'Cant. Servicios', width: 18 },
        { header: 'Total Facturado ($)', key: 'Total Facturado ($)', width: 22, style: { numFormat: '$#,##0.00' } },
        { header: 'Comisión a Pagar (40% $)', key: 'Comisión a Pagar (40% $)', width: 25, style: { numFormat: '$#,##0.00' } }
      ]
    )
  }

  return (
    <div className="space-y-6">
      
      {/* SECTOR DE FILTROS - SENIOR FRIENDLY (GRANDE Y CLARO) */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-150 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="text-blush-palmLeaf w-6 h-6 shrink-0" />
          <div>
            <h2 className="text-lg font-black text-gray-850 uppercase tracking-wide">Calculadora de Sueldos (Comisiones 40%)</h2>
            <p className="text-xs text-gray-500 font-medium">Filtra el mes para liquidar el sueldo de las manicuristas automáticamente.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Selector de Mes */}
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span className="text-[10px] font-black text-blush-palmLeaf uppercase ml-1">Seleccionar Mes</span>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(parseInt(e.target.value, 10))
                setSelectedManicuristaDetail(null)
              }}
              className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-black text-gray-700 outline-none cursor-pointer w-full"
            >
              {meses.map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>
          </div>

          {/* Selector de Año */}
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span className="text-[10px] font-black text-blush-palmLeaf uppercase ml-1">Seleccionar Año</span>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(parseInt(e.target.value, 10))
                setSelectedManicuristaDetail(null)
              }}
              className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-black text-gray-700 outline-none cursor-pointer w-full"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Botón de Exportar */}
          <div className="flex flex-col justify-end pt-5 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              disabled={comisiones.length === 0}
              className="flex items-center justify-center gap-2 py-3 px-5 bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white rounded-2xl font-black text-xs uppercase tracking-wide transition-all shadow-md shadow-blush-palmLeaf/25 disabled:opacity-50 cursor-pointer w-full"
            >
              <FileSpreadsheet size={16} />
              Exportar Excel
            </button>
          </div>
        </div>
      </div>

      {/* DETALLES DE COMISIONES */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blush-palmLeaf mx-auto"></div>
          <p className="text-xs text-gray-500 font-bold mt-4">Calculando comisiones...</p>
        </div>
      ) : comisiones.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm">
          <p className="text-xs text-gray-400 font-bold">No se encontraron colaboradores registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* TABLA PRINCIPAL DE SUELDOS (Ocupa 2 columnas en pantallas grandes) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-wide">Resumen Mensual de Liquidación</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/30 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="py-4 px-6">Manicurista / Colaboradora</th>
                      <th className="py-4 px-4 text-center">Servicios Realizados</th>
                      <th className="py-4 px-4 text-right">Total Facturado ($)</th>
                      <th className="py-4 px-6 text-right text-blush-palmLeaf font-black">Comisión 40% ($)</th>
                      <th className="py-4 px-4 text-center">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700">
                    {comisiones.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="py-4 px-6 font-black text-sm text-gray-800">{c.nombre}</td>
                        <td className="py-4 px-4 text-center text-sm">{c.total_servicios}</td>
                        <td className="py-4 px-4 text-right text-sm">${c.total_ventas.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-4 px-6 text-right text-sm text-blush-palmLeaf font-black">${c.comision.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => setSelectedManicuristaDetail(c)}
                            className={`p-2 rounded-xl transition-all cursor-pointer border ${
                              selectedManicuristaDetail?.id === c.id
                                ? 'bg-blush-palmLeaf text-white border-blush-palmLeaf shadow-sm'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-blush-palmLeaf'
                            }`}
                            title="Ver detalle de servicios"
                          >
                            {selectedManicuristaDetail?.id === c.id ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fila de Totales Generales */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/70 grid grid-cols-3 text-center text-xs font-black uppercase tracking-wider text-gray-600">
              <div>
                <span className="block text-[9px] text-gray-400 font-bold">Servicios Totales</span>
                <span className="text-base text-gray-800 font-black">{comisiones.reduce((sum, c) => sum + c.total_servicios, 0)}</span>
              </div>
              <div className="border-x border-gray-200">
                <span className="block text-[9px] text-gray-400 font-bold">Total Facturado</span>
                <span className="text-base text-gray-800 font-black">${comisiones.reduce((sum, c) => sum + c.total_ventas, 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="block text-[9px] text-blush-palmLeaf font-bold">Total Comisiones (40%)</span>
                <span className="text-base text-blush-palmLeaf font-black">${comisiones.reduce((sum, c) => sum + c.comision, 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* COLUMNA DE DETALLE INDIVIDUAL (Ocupa 1 columna) */}
          <div className="bg-white rounded-3xl border border-gray-150 shadow-sm p-6 flex flex-col justify-between">
            {selectedManicuristaDetail ? (
              <div className="space-y-4">
                <div className="pb-3 border-b border-gray-100">
                  <h4 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                    Detalle: {selectedManicuristaDetail.nombre}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                    Servicios cargados en {meses[selectedMonth]} {selectedYear}
                  </p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {selectedManicuristaDetail.detalles_ventas.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8 font-medium">No se registraron ventas en este mes.</p>
                  ) : (
                    selectedManicuristaDetail.detalles_ventas.map((v) => (
                      <div key={v.id} className="p-3 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-black">
                          <span>{new Date(v.fecha_hora).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}</span>
                          <span className="bg-white px-2 py-0.5 border border-gray-200 rounded-md text-gray-600 uppercase">
                            {v.forma_pago}
                          </span>
                        </div>
                        <div className="flex justify-between items-start mt-1">
                          <div className="min-w-0">
                            <span className="block font-black text-xs text-gray-800 truncate">
                              {v.servicios?.nombre || 'Servicio General'}
                            </span>
                            <span className="block text-[10px] text-gray-500 font-medium truncate">
                              Cliente: {v.clientes?.nombre || 'Cliente General'}
                            </span>
                          </div>
                          <span className="font-black text-sm text-blush-palmLeaf ml-2">
                            ${Number(v.valor_pagado).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 text-xs font-black text-gray-600 flex justify-between">
                  <span>Comisión M manicurista (40%):</span>
                  <span className="text-blush-palmLeaf text-sm font-black">
                    ${selectedManicuristaDetail.comision.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-gray-400 space-y-3">
                <div className="bg-blush-seashell/50 p-4 rounded-full border border-blush-khaki/20 text-blush-palmLeaf">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-650">Ver Desglose de Servicios</h4>
                  <p className="text-[10px] font-medium text-gray-450 mt-1 max-w-xs mx-auto">
                    Haz clic en el botón de la tabla para ver la lista de citas que realizó cada manicurista en el período.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
      
    </div>
  )
}
