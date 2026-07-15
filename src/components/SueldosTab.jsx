import React, { useEffect, useState } from 'react'
import { 
  DollarSign, 
  Calendar, 
  Eye, 
  EyeOff, 
  FileSpreadsheet, 
  Plus, 
  Edit3, 
  Search, 
  UserCheck, 
  UserX, 
  Users, 
  Briefcase 
} from 'lucide-react'
import { dataService } from '../dataService'
import * as XLSX from 'xlsx-js-style'
import { exportExcelJS } from '../excelExporter'

export default function SueldosTab({ activeTab, selectedBranchId }) {
  // Sub-tabs: 'liquidacion', 'colaboradoras'
  const [subTab, setSubTab] = useState('liquidacion')

  const [loading, setLoading] = useState(true)
  const [ventas, setVentas] = useState([])
  const [personal, setPersonal] = useState([])
  const [comisiones, setComisiones] = useState([])
  const [selectedManicuristaDetail, setSelectedManicuristaDetail] = useState(null)

  // Buscador de colaboradores
  const [searchColaboradora, setSearchColaboradora] = useState('')

  // Estados del Formulario de Colaboradoras
  const [formColaboradora, setFormColaboradora] = useState({
    nombre: '',
    cargo: 'Manicurista',
    activo: true
  })
  const [editingPersonalId, setEditingPersonalId] = useState(null)
  const [msgCol, setMsgCol] = useState({ type: '', text: '' })
  
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

    // Agrupar por manicuristas activos
    const comms = personal.map(p => {
      const pVentas = periodVentas.filter(v => v.personal && v.personal.id === p.id)
      const totalVentas = pVentas.reduce((sum, v) => sum + Number(v.valor_pagado), 0)
      const totalComision = totalVentas * 0.40

      return {
        id: p.id,
        nombre: p.nombre,
        activo: p.activo,
        cargo: p.cargo || 'Manicurista',
        total_servicios: pVentas.length,
        total_ventas: totalVentas,
        comision: totalComision,
        detalles_ventas: pVentas
      }
    })

    setComisiones(comms.sort((a, b) => b.comision - a.comision))
  }

  // Exportar comisiones corregido
  const handleExportExcel = async () => {
    try {
      const rows = [
        ["REPORTE DE SUELDOS Y COMISIONES (40%) - BLUSH BEAUTY STUDIO"],
        [`Período: ${meses[selectedMonth]} ${selectedYear}`],
        ["Fecha de Emisión:", new Date().toLocaleString()],
        [],
        ["Colaboradora", "Cargo", "Cant. Servicios", "Total Facturado ($)", "Comisión a Pagar (40% $)"]
      ]

      comisiones.forEach(c => {
        rows.push([
          c.nombre,
          c.cargo,
          c.total_servicios,
          c.total_ventas,
          c.comision
        ])
      })

      const sumServicios = comisiones.reduce((sum, c) => sum + c.total_servicios, 0)
      const sumFacturado = comisiones.reduce((sum, c) => sum + c.total_ventas, 0)
      const sumComision = comisiones.reduce((sum, c) => sum + c.comision, 0)

      rows.push([])
      rows.push([
        "TOTALES GENERALES",
        "",
        sumServicios,
        sumFacturado,
        sumComision
      ])

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(rows)
      
      ws['!cols'] = [
        { wch: 28 }, // Colaboradora
        { wch: 18 }, // Cargo
        { wch: 15 }, // Cant. Servicios
        { wch: 20 }, // Total Facturado
        { wch: 22 }  // Comisión a Pagar
      ]

      XLSX.utils.book_append_sheet(wb, ws, "Sueldos y Comisiones")
      const safeMonthName = meses[selectedMonth].replace(/\s+/g, '_')
      await exportExcelJS(wb, `Comisiones_Blush_${safeMonthName}_${selectedYear}.xlsx`, { sheetName: "Sueldos y Comisiones", col: 4, row: 0 })
    } catch (err) {
      console.error('Error al exportar sueldos:', err)
      alert('Hubo un error al exportar el reporte.')
    }
  }

  // Guardar Colaboradora (Nueva / Editar)
  const handleSubmitColaboradora = async (e) => {
    e.preventDefault()
    setMsgCol({ type: '', text: '' })

    try {
      if (!formColaboradora.nombre.trim()) {
        throw new Error('El nombre de la colaboradora es requerido.')
      }

      if (editingPersonalId) {
        await dataService.actualizarPersonal(editingPersonalId, {
          nombre: formColaboradora.nombre.trim(),
          cargo: formColaboradora.cargo,
          activo: formColaboradora.activo
        })
        setMsgCol({ type: 'success', text: '✅ Colaboradora actualizada con éxito.' })
      } else {
        await dataService.registrarPersonal({
          nombre: formColaboradora.nombre.trim(),
          cargo: formColaboradora.cargo,
          activo: true
        })
        setMsgCol({ type: 'success', text: '✅ Colaboradora agregada con éxito.' })
      }

      setFormColaboradora({ nombre: '', cargo: 'Manicurista', activo: true })
      setEditingPersonalId(null)
      loadData()
    } catch (err) {
      setMsgCol({ type: 'error', text: err.message })
    }
  }

  // Activar / Desactivar Colaboradora
  const handleToggleActivo = async (colab) => {
    try {
      const nuevoEstado = !colab.activo
      await dataService.actualizarPersonal(colab.id, { activo: nuevoEstado })
      loadData()
    } catch (err) {
      alert(`Error al actualizar estado: ${err.message}`)
    }
  }

  // Cargar Colaboradora en Formulario para Edición
  const handleEditColaboradora = (colab) => {
    setEditingPersonalId(colab.id)
    setFormColaboradora({
      nombre: colab.nombre,
      cargo: colab.cargo || 'Manicurista',
      activo: colab.activo
    })
  }

  // Filtrado de colaboradores en lista
  const filteredPersonal = personal.filter(p => {
    const q = searchColaboradora.toLowerCase().trim()
    if (!q) return true
    return (
      p.nombre.toLowerCase().includes(q) ||
      (p.cargo && p.cargo.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      
      {/* Selector de Sub-pestañas */}
      <div className="flex border-b border-gray-200 gap-1.5 p-1 bg-white rounded-2xl shadow-sm max-w-md">
        <button
          onClick={() => setSubTab('liquidacion')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            subTab === 'liquidacion' 
              ? 'bg-blush-palmLeaf text-white shadow-sm' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <DollarSign size={15} />
          Liquidación Mensual
        </button>
        
        <button
          onClick={() => setSubTab('colaboradoras')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            subTab === 'colaboradoras' 
              ? 'bg-blush-palmLeaf text-white shadow-sm' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Users size={15} />
          Colaboradoras
        </button>
      </div>

      {subTab === 'liquidacion' && (
        <>
          {/* SECTOR DE FILTROS */}
          <div className="bg-white/85 backdrop-blur-md p-6 rounded-3xl border border-gray-150 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <Calendar className="text-blush-palmLeaf w-6 h-6 shrink-0" />
              <div>
                <h2 className="text-lg font-black text-gray-855 uppercase tracking-wide">Calculadora de Sueldos (Comisiones 40%)</h2>
                <p className="text-xs text-gray-500 font-medium">Liquida el sueldo de las manicuristas de forma automatizada por mes.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <span className="text-[10px] font-black text-blush-palmLeaf uppercase ml-1">Mes</span>
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

              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <span className="text-[10px] font-black text-blush-palmLeaf uppercase ml-1">Año</span>
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
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm animate-pulse">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blush-palmLeaf mx-auto"></div>
              <p className="text-xs text-gray-500 font-bold mt-4">Calculando comisiones...</p>
            </div>
          ) : comisiones.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm">
              <p className="text-xs text-gray-400 font-bold">No se encontraron colaboradores registrados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-sm font-black text-gray-700 uppercase tracking-wide">Liquidación de Comisiones</h3>
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
                            <td className="py-4 px-6 font-black text-sm text-gray-805">
                              {c.nombre}
                              {!c.activo && (
                                <span className="ml-2 text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black uppercase">
                                  Inactiva
                                </span>
                              )}
                            </td>
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
                    <span className="block text-[9px] text-blush-palmLeaf font-bold">Total Comisiones</span>
                    <span className="text-base text-blush-palmLeaf font-black">${comisiones.reduce((sum, c) => sum + c.comision, 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* DETALLE INDIVIDUAL */}
              <div className="bg-white rounded-3xl border border-gray-150 shadow-sm p-6 flex flex-col justify-between">
                {selectedManicuristaDetail ? (
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-gray-100">
                      <h4 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                        Detalle: {selectedManicuristaDetail.nombre}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                        Servicios en {meses[selectedMonth]} {selectedYear}
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
                      <span>Total Comisión (40%):</span>
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
                      <p className="text-[10px] font-medium text-gray-455 mt-1 max-w-xs mx-auto text-gray-400">
                        Haz clic en el botón de ojo en la tabla para auditar los servicios liquidados.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {subTab === 'colaboradoras' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Formulario de Registro / Edición */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-150 h-fit">
            <h3 className="text-lg font-black text-blush-palmLeaf mb-1 flex items-center gap-2 uppercase tracking-wide">
              <Users size={18} />
              {editingPersonalId ? 'Editar Colaboradora' : 'Registrar Colaboradora'}
            </h3>
            <p className="text-xs text-gray-400 mb-6 font-medium">
              Agrega nuevas estilistas, manicuristas o personal técnico sucursal.
            </p>

            <form onSubmit={handleSubmitColaboradora} className="space-y-4 text-xs font-bold text-gray-700">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ej. Pamela Armendariz"
                  value={formColaboradora.nombre}
                  onChange={(e) => setFormColaboradora({ ...formColaboradora, nombre: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Cargo / Especialidad</label>
                <select
                  value={formColaboradora.cargo}
                  onChange={(e) => setFormColaboradora({ ...formColaboradora, cargo: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs text-gray-700 cursor-pointer"
                >
                  <option value="Manicurista">Manicurista</option>
                  <option value="Pedicurista">Pedicurista</option>
                  <option value="Estilista">Estilista</option>
                  <option value="Administradora">Administradora</option>
                </select>
              </div>

              {editingPersonalId && (
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Estado</label>
                  <select
                    value={formColaboradora.activo ? "true" : "false"}
                    onChange={(e) => setFormColaboradora({ ...formColaboradora, activo: e.target.value === "true" })}
                    className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs text-gray-700 cursor-pointer"
                  >
                    <option value="true">Activa (Aparece en agendas y liquidaciones)</option>
                    <option value="false">Inactiva (Baja de la sucursal)</option>
                  </select>
                </div>
              )}

              {msgCol.text && (
                <div className={`p-3 rounded-xl text-xs font-bold text-center ${
                  msgCol.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {msgCol.text}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {editingPersonalId ? 'Guardar Cambios' : 'Agregar'}
                </button>
                {editingPersonalId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPersonalId(null)
                      setFormColaboradora({ nombre: '', cargo: 'Manicurista', activo: true })
                    }}
                    className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Listado de Colaboradoras */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-150 flex flex-col">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h3 className="text-lg font-black text-blush-palmLeaf flex items-center gap-2 uppercase tracking-wide">
                  <Users size={18} />
                  Colaboradoras Registradas
                </h3>
                <p className="text-xs text-gray-400 font-medium">Buscador y control de estado de colaboradoras.</p>
              </div>

              {/* Buscador de Colaboradoras */}
              <div className="relative w-full md:w-48">
                <input
                  type="text"
                  placeholder="Buscar colaboradora..."
                  value={searchColaboradora}
                  onChange={(e) => setSearchColaboradora(e.target.value)}
                  className="w-full !pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-250 rounded-xl text-xs outline-none focus:border-blush-palmLeaf font-semibold"
                />
                <Search className="absolute left-2.5 top-2.5 text-gray-400" size={13} />
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-2xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 text-xxs font-black uppercase tracking-wider bg-gray-50/50">
                    <th className="py-3 px-4">Nombre</th>
                    <th className="py-3 px-3">Cargo</th>
                    <th className="py-3 px-3 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700 font-bold text-xs">
                  {filteredPersonal.map((colab) => (
                    <tr key={colab.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="py-3 px-4 text-gray-800 text-sm font-black">{colab.nombre}</td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1 text-gray-550">
                          <Briefcase size={12} className="text-gray-400" />
                          {colab.cargo || 'Manicurista'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                          colab.activo 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {colab.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditColaboradora(colab)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
                            title="Editar Datos"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleActivo(colab)}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              colab.activo 
                                ? 'hover:bg-red-50 text-gray-400 hover:text-red-600' 
                                : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
                            }`}
                            title={colab.activo ? 'Desactivar Colaboradora' : 'Activar Colaboradora'}
                          >
                            {colab.activo ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPersonal.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-xs text-gray-400 font-bold bg-white">
                        No se encontraron colaboradoras con el filtro actual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
