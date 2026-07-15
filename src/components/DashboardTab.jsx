import React, { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, UserCheck, Calendar } from 'lucide-react'
import { dataService } from '../dataService'
import XLSX from 'xlsx-js-style'
import { exportExcelJS } from '../excelExporter'

export default function DashboardTab({ onNavigate, activeTab, selectedBranchId }) {
  const [financials, setFinancials] = useState({ total_ingresos: 0, total_egresos: 0, utilidad_neta: 0 })
  const [pagos, setPagos] = useState([])
  const [alertasStock, setAlertasStock] = useState([])
  const [alertasCRM, setAlertasCRM] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtros de fecha (por defecto el mes actual)
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

  const [rango, setRango] = useState({ inicio: firstDay, fin: lastDay })

  useEffect(() => {
    let active = true

    const loadData = async () => {
      try {
        setLoading(true)
        const [finInfo, pagosInfo, prods, crmList] = await Promise.all([
          dataService.getConciliacionFinanciera(rango.inicio, rango.fin),
          dataService.getIngresosAgrupados(rango.inicio, rango.fin),
          dataService.getProductos(),
          dataService.getClientesPorRecontactar()
        ])
        
        const stockLow = prods.filter(p => p.stock_actual <= p.stock_minimo)
        
        if (active) {
          setFinancials(finInfo)
          setPagos(pagosInfo)
          setAlertasStock(stockLow)
          setAlertasCRM(crmList.filter(crm => crm.dias_retraso >= -1))
        }
      } catch (err) {
        console.error('Error al cargar dashboard:', err)
        if (active) {
          setFinancials({ total_ingresos: 0, total_egresos: 0, utilidad_neta: 0 })
          setPagos([])
          setAlertasStock([])
          setAlertasCRM([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [rango, selectedBranchId])

  // Cálculos para gráfico circular SVG
  const totalPagos = pagos.reduce((sum, p) => sum + Number(p.total_ingresos), 0)

  const getPieSlices = () => {
    if (totalPagos === 0) return []
    let accumAngle = 0
    const colores = {
      'Efectivo': '#748843',      // Palm Leaf
      'Deuna': '#9FAB7E',         // Olivine
      'Transferencia': '#CABF74',  // Dark Khaki
      'Tarjeta': '#BAAB94',        // Khaki
    }

    return pagos.map((p) => {
      const percentage = (Number(p.total_ingresos) / totalPagos)
      const angle = percentage * 360
      const slice = {
        name: p.forma_pago,
        val: Number(p.total_ingresos),
        percentage: (percentage * 100).toFixed(1),
        startAngle: accumAngle,
        endAngle: accumAngle + angle,
        color: colores[p.forma_pago] || '#CBD5E1'
      }
      accumAngle += angle
      return slice
    })
  }

  const slices = getPieSlices()

  const handleExportExcel = async () => {
    try {
      const allCitas = await dataService.getCitasVentas()
      const allGastos = await dataService.getGastos()

      const start = new Date(rango.inicio + 'T00:00:00')
      const end = new Date(rango.fin + 'T23:59:59')

      const periodCitas = allCitas.filter(c => {
        const d = new Date(c.fecha_hora)
        return d >= start && d <= end
      })

      const periodGastos = allGastos.filter(g => {
        const d = new Date(g.fecha + 'T00:00:00')
        return d >= start && d <= end
      })

      const makeCell = (val, type, format = null, style = {}) => {
        const cell = { v: val, t: type }
        if (format) cell.z = format
        cell.s = {
          font: { name: 'Segoe UI', size: 9.5, ...style.font },
          alignment: { vertical: 'middle', ...style.alignment },
          fill: style.fill || undefined,
          border: style.border || undefined
        }
        return cell
      }

      const baseFont = { name: 'Segoe UI', size: 9.5 }

      const titleStyle = {
        font: { name: 'Segoe UI', size: 16, bold: true, color: { rgb: '748843' } },
        alignment: { horizontal: 'left', vertical: 'middle' }
      }

      const subtitleStyle = {
        font: { name: 'Segoe UI', size: 10, italic: true, color: { rgb: '6B7280' } },
        alignment: { horizontal: 'left', vertical: 'middle' }
      }

      const headerStyle = (bgColorHex = '748843') => ({
        font: { name: 'Segoe UI', size: 10, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: bgColorHex } },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: bgColorHex } },
          bottom: { style: 'thin', color: { rgb: bgColorHex } },
          left: { style: 'thin', color: { rgb: bgColorHex } },
          right: { style: 'thin', color: { rgb: bgColorHex } }
        }
      })

      const thLeftStyle = (bgColorHex = '748843') => {
        const th = headerStyle(bgColorHex)
        th.alignment.horizontal = 'left'
        return th
      }

      const tableBorder = {
        top: { style: 'thin', color: { rgb: 'D1D5DB' } },
        bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
        left: { style: 'thin', color: { rgb: 'D1D5DB' } },
        right: { style: 'thin', color: { rgb: 'D1D5DB' } }
      }

      const cellStyleTextLeft = {
        font: baseFont,
        alignment: { horizontal: 'left', vertical: 'middle' },
        border: tableBorder
      }

      const cellStyleTextCenter = {
        font: baseFont,
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: tableBorder
      }

      const cellStyleTextRight = {
        font: baseFont,
        alignment: { horizontal: 'right', vertical: 'middle' },
        border: tableBorder
      }

      const cardLabelStyle = {
        font: { name: 'Segoe UI', size: 10, bold: true, color: { rgb: '4B5563' } },
        fill: { fgColor: { rgb: 'F9FAFB' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
        border: tableBorder
      }

      const cardValIngresoStyle = {
        font: { name: 'Segoe UI', size: 10, bold: true, color: { rgb: '15803D' } },
        alignment: { horizontal: 'right', vertical: 'middle' },
        border: tableBorder
      }

      const cardValEgresoStyle = {
        font: { name: 'Segoe UI', size: 10, bold: true, color: { rgb: 'B91C1C' } },
        alignment: { horizontal: 'right', vertical: 'middle' },
        border: tableBorder
      }

      const cardValUtilidadStyle = {
        font: { name: 'Segoe UI', size: 10, bold: true, color: { rgb: '0369A1' } },
        fill: { fgColor: { rgb: 'F0F9FF' } },
        alignment: { horizontal: 'right', vertical: 'middle' },
        border: tableBorder
      }

      const rows = []
      const merges = []

      const pushSectionHeader = (titleText, colsCount, themeColorHex) => {
        const rIdx = rows.length
        merges.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: colsCount - 1 } })
        
        const row = [makeCell(titleText, 's', null, thLeftStyle(themeColorHex))]
        for (let i = 1; i < colsCount; i++) {
          row.push(makeCell("", 's', null, thLeftStyle(themeColorHex)))
        }
        rows.push(row)
      }      // 1. Cabecera general con marca estilizada
      const branchId = dataService.getSelectedBranchId()
      const branches = await dataService.getSucursales()
      const branchObj = branches.find(b => b.id === branchId)
      const branchName = branchObj ? branchObj.nombre : "Todas las Sucursales"

      // Cabecera superior decorada (Fila 0, 1 y 2)
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } })
      merges.push({ s: { r: 0, c: 5 }, e: { r: 0, c: 7 } })
      
      const headerRow0 = []
      headerRow0[0] = makeCell("BLUSH BEAUTY STUDIO", 's', null, {
        font: { name: 'Segoe UI', size: 18, bold: true, color: { rgb: '748843' } },
        alignment: { horizontal: 'left', vertical: 'middle' }
      })
      for (let i = 1; i <= 4; i++) headerRow0[i] = makeCell("", 's', null, {})
      headerRow0[5] = makeCell("", 's', null, {})
      headerRow0[6] = makeCell("", 's', null, {})
      headerRow0[7] = makeCell("", 's', null, {})
      rows.push(headerRow0)

      merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 7 } })
      rows.push([makeCell("REPORTE FINANCIERO DE CONTROL Y CONCILIACIÓN", 's', null, {
        font: { name: 'Segoe UI', size: 11, bold: true, color: { rgb: 'BAAB94' } },
        alignment: { horizontal: 'left', vertical: 'middle' }
      })])

      merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 7 } })
      rows.push([makeCell(`Periodo: ${rango.inicio} al ${rango.fin} | Sucursal: ${branchName} | Generado el: ${new Date().toLocaleDateString()}`, 's', null, subtitleStyle)])
      
      rows.push([]) // empty row

      // 2. Indicadores Clave
      pushSectionHeader("INDICADORES FINANCIEROS (CONCILIACIÓN GENERAL)", 2, "4B5563")
      rows.push([
        makeCell("Total Ingresos (Ventas)", 's', null, cardLabelStyle),
        makeCell(Number(financials.total_ingresos), 'n', '"$"#,##0.00', cardValIngresoStyle)
      ])
      rows.push([
        makeCell("Total Egresos (Gastos)", 's', null, cardLabelStyle),
        makeCell(-Number(financials.total_egresos), 'n', '"$"#,##0.00', cardValEgresoStyle)
      ])
      rows.push([
        makeCell("Utilidad Bruta (Ganancia)", 's', null, { ...cardLabelStyle, fill: { fgColor: { rgb: 'F0F9FF' } } }),
        makeCell(Number(financials.utilidad_neta), 'n', '"$"#,##0.00', cardValUtilidadStyle)
      ])

      rows.push([]) // empty

      // 3. Ingresos por Medio de Pago
      pushSectionHeader("INGRESOS POR MEDIO DE PAGO", 3, "4B5563")
      rows.push([
        makeCell("Medio de Pago", 's', null, headerStyle("748843")),
        makeCell("Transacciones", 's', null, headerStyle("748843")),
        makeCell("Total Recaudado", 's', null, headerStyle("748843"))
      ])

      if (pagos.length === 0) {
        rows.push([
          makeCell("Sin transacciones registradas", 's', null, cellStyleTextCenter),
          makeCell(0, 'n', '#,##0', cellStyleTextCenter),
          makeCell(0, 'n', '"$"#,##0.00', cellStyleTextRight)
        ])
      } else {
        pagos.forEach(p => {
          rows.push([
            makeCell(p.forma_pago, 's', null, cellStyleTextLeft),
            makeCell(Number(p.cantidad_transacciones), 'n', '#,##0', cellStyleTextCenter),
            makeCell(Number(p.total_ingresos), 'n', '"$"#,##0.00', cellStyleTextRight)
          ])
        })
      }

      rows.push([]) // empty

      // 4. Detalle de Ventas
      pushSectionHeader("DETALLE DE INGRESOS (VENTAS Y CITAS)", 8, "748843")
      rows.push([
        makeCell("Fecha", 's', null, headerStyle("748843")),
        makeCell("Cliente", 's', null, headerStyle("748843")),
        makeCell("Cédula", 's', null, headerStyle("748843")),
        makeCell("Servicio", 's', null, headerStyle("748843")),
        makeCell("Manicurista", 's', null, headerStyle("748843")),
        makeCell("Medio de Pago", 's', null, headerStyle("748843")),
        makeCell("Referencia", 's', null, headerStyle("748843")),
        makeCell("Monto", 's', null, headerStyle("748843"))
      ])

      if (periodCitas.length === 0) {
        rows.push([
          makeCell("Sin registros de ingresos en este periodo", 's', null, cellStyleTextCenter),
          makeCell("", 's', null, cellStyleTextLeft),
          makeCell("", 's', null, cellStyleTextCenter),
          makeCell("", 's', null, cellStyleTextLeft),
          makeCell("", 's', null, cellStyleTextLeft),
          makeCell("", 's', null, cellStyleTextCenter),
          makeCell("", 's', null, cellStyleTextCenter),
          makeCell(0, 'n', '"$"#,##0.00', cellStyleTextRight)
        ])
      } else {
        periodCitas.forEach(c => {
          const clientName = c.clientes?.nombre || 'N/A';
          const clientCed = c.clientes?.cedula || 'N/A';
          const svcName = c.servicios?.nombre || 'N/A';
          const staffName = c.personal?.nombre || 'N/A';
          const dateStr = new Date(c.fecha_hora).toLocaleDateString();
          rows.push([
            makeCell(dateStr, 's', null, cellStyleTextCenter),
            makeCell(clientName, 's', null, cellStyleTextLeft),
            makeCell(clientCed, 's', '@', cellStyleTextCenter),
            makeCell(svcName, 's', null, cellStyleTextLeft),
            makeCell(staffName, 's', null, cellStyleTextLeft),
            makeCell(c.forma_pago, 's', null, cellStyleTextCenter),
            makeCell(c.no_transferencia || '', 's', '@', cellStyleTextCenter),
            makeCell(Number(c.valor_pagado), 'n', '"$"#,##0.00', cellStyleTextRight)
          ])
        })
      }

      rows.push([]) // empty

      // 5. Detalle de Gastos
      pushSectionHeader("DETALLE DE EGRESOS (GASTOS)", 8, "8B3C3C")
      rows.push([
        makeCell("Fecha", 's', null, headerStyle("8B3C3C")),
        makeCell("Factura/Doc", 's', null, headerStyle("8B3C3C")),
        makeCell("Concepto", 's', null, headerStyle("8B3C3C")),
        makeCell("Categoría", 's', null, headerStyle("8B3C3C")),
        makeCell("Medio de Pago", 's', null, headerStyle("8B3C3C")),
        makeCell("Origen Cuenta", 's', null, headerStyle("8B3C3C")),
        makeCell("Cantidad", 's', null, headerStyle("8B3C3C")),
        makeCell("Total", 's', null, headerStyle("8B3C3C"))
      ])

      if (periodGastos.length === 0) {
        rows.push([
          makeCell("Sin registros de egresos en este periodo", 's', null, cellStyleTextCenter),
          makeCell("", 's', null, cellStyleTextCenter),
          makeCell("", 's', null, cellStyleTextLeft),
          makeCell("", 's', null, cellStyleTextLeft),
          makeCell("", 's', null, cellStyleTextCenter),
          makeCell("", 's', null, cellStyleTextCenter),
          makeCell(0, 'n', '#,##0', cellStyleTextCenter),
          makeCell(0, 'n', '"$"#,##0.00', cellStyleTextRight)
        ])
      } else {
        periodGastos.forEach(g => {
          const dateStr = new Date(g.fecha + 'T00:00:00').toLocaleDateString();
          rows.push([
            makeCell(dateStr, 's', null, cellStyleTextCenter),
            makeCell(g.factura || 'Sin Doc', 's', '@', cellStyleTextCenter),
            makeCell(g.concepto, 's', null, cellStyleTextLeft),
            makeCell(g.categoria || 'Otros', 's', null, cellStyleTextLeft),
            makeCell(g.forma_pago, 's', null, cellStyleTextCenter),
            makeCell(g.cuenta, 's', null, cellStyleTextCenter),
            makeCell(Number(g.cantidad), 'n', '#,##0', cellStyleTextCenter),
            makeCell(-Number(g.total), 'n', '"$"#,##0.00', { ...cellStyleTextRight, font: { ...baseFont, color: { rgb: 'B91C1C' } } })
          ])
        })
      }

      // Watermark footer at the bottom of the worksheet
      const lastRowIdx = rows.length
      merges.push({ s: { r: lastRowIdx, c: 0 }, e: { r: lastRowIdx, c: 7 } })
      const footerRow = [makeCell("★ DOCUMENTO OFICIAL GENERADO POR EL SISTEMA BLUSH BEAUTY STUDIO - REGISTRO DE CONTROL CONFIDENCIAL ★", 's', null, {
        font: { name: 'Segoe UI', size: 8, italic: true, color: { rgb: 'D1D5DB' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      })]
      for (let i = 1; i <= 7; i++) footerRow.push(makeCell("", 's', null, {}))
      rows.push(footerRow)

      // Crear Workbook y Worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(rows)
      
      // Aplicar merges y cols
      ws['!merges'] = merges
      ws['!cols'] = [
        { wch: 12 }, // Fecha
        { wch: 25 }, // Cliente / Factura
        { wch: 20 }, // Cédula / Concepto
        { wch: 22 }, // Servicio / Categoría
        { wch: 20 }, // Manicurista / Medio de Pago
        { wch: 18 }, // Medio de Pago / Origen Cuenta
        { wch: 15 }, // Referencia / Cantidad
        { wch: 15 }  // Monto / Total
      ]
      ws['!rows'] = [
        { hpt: 45 } // Row 0 is taller to fit the logo image nicely!
      ]
      
      XLSX.utils.book_append_sheet(wb, ws, "Resumen Financiero")
      
      // Escribir archivo como .xlsx binario
      const safeInicio = rango.inicio.replace(/\//g, '-')
      const safeFin = rango.fin.replace(/\//g, '-')
      await exportExcelJS(wb, `Reporte_Financiero_Blush_${safeInicio}_a_${safeFin}.xlsx`, { sheetName: "Resumen Financiero", col: 5, row: 0 })
    } catch (err) {
      console.error('Error al exportar reporte:', err)
      alert('Hubo un error al generar el reporte de Excel.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado y Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 p-4 rounded-2xl glass-panel">
        <div>
          <h2 className="text-2xl font-bold text-blush-palmLeaf">Panel Administrativo</h2>
          <p className="text-sm text-gray-500">Resumen y trazabilidad del negocio en tiempo real</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2">
            <div>
              <label className="block text-xs text-gray-500 font-semibold mb-1">Desde</label>
              <input 
                type="date" 
                value={rango.inicio} 
                onChange={(e) => setRango({...rango, inicio: e.target.value})}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-semibold mb-1">Hasta</label>
              <input 
                type="date" 
                value={rango.fin} 
                onChange={(e) => setRango({...rango, fin: e.target.value})}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleExportExcel}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-slate-800/10"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ingresos */}
        <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-gray-400 block mb-1">Total Ingresos (Ventas)</span>
            <span className="text-3xl font-bold text-blush-palmLeaf">${financials.total_ingresos.toFixed(2)}</span>
          </div>
          <div className="p-4 bg-blush-olivine/10 rounded-2xl text-blush-palmLeaf">
            <TrendingUp size={28} />
          </div>
        </div>

        {/* Egresos */}
        <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-gray-400 block mb-1">Total Egresos (Gastos)</span>
            <span className="text-3xl font-bold text-rose-600">${financials.total_egresos.toFixed(2)}</span>
          </div>
          <div className="p-4 bg-rose-50 rounded-2xl text-rose-600">
            <TrendingDown size={28} />
          </div>
        </div>

        {/* Utilidad */}
        <div className={`p-6 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between transition-luxury ${financials.utilidad_neta < 0 ? 'ring-2 ring-rose-300 bg-rose-50/20' : 'ring-2 ring-blush-olivine/30'}`}>
          <div>
            <span className="text-sm font-semibold text-gray-400 block mb-1">Utilidad Bruta</span>
            <span className={`text-3xl font-bold ${financials.utilidad_neta >= 0 ? 'text-blush-palmLeaf' : 'text-rose-600'}`}>
              ${financials.utilidad_neta.toFixed(2)}
            </span>
          </div>
          <div className={`p-4 rounded-2xl ${financials.utilidad_neta >= 0 ? 'bg-blush-palmLeaf/10 text-blush-palmLeaf' : 'bg-rose-100 text-rose-600'}`}>
            <DollarSign size={28} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conciliación Métodos de Pago */}
        <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-blush-palmLeaf mb-1">Conciliación de Caja</h3>
            <p className="text-xs text-gray-400 mb-6">Ingresos segmentados por forma de pago para auditoría bancaria</p>
            
            {totalPagos === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-sm">
                <DollarSign size={40} className="mb-2 opacity-50" />
                Sin transacciones registradas en este período
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                {/* SVG Pie Chart */}
                <div className="relative w-44 h-44">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {slices.map((slice, i) => {
                      const radius = 35
                      const circ = 2 * Math.PI * radius
                      const strokeDash = slice.val * circ / totalPagos
                      const strokeOffset = - (slice.startAngle * circ / 360)
                      return (
                        <circle
                          key={i}
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="20"
                          strokeDasharray={`${strokeDash} ${circ}`}
                          strokeDashoffset={strokeOffset}
                          className="transition-all duration-500 hover:opacity-85 cursor-pointer"
                        />
                      )
                    })}
                    <circle cx="50" cy="50" r="22" fill="#FFFFFF" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-semibold text-gray-400">Total</span>
                    <span className="text-lg font-bold text-gray-800">${totalPagos.toFixed(0)}</span>
                  </div>
                </div>

                {/* Leyenda */}
                <div className="space-y-3 w-full sm:w-1/2">
                  {slices.map((slice, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: slice.color }}></span>
                        <span className="text-sm text-gray-600 font-semibold">{slice.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-800">${slice.val.toFixed(2)}</div>
                        <div className="text-xxs text-gray-400">{slice.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sección de Alertas */}
        <div className="space-y-6">
          {/* Alertas CRM de Recontacto */}
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="text-blush-palmLeaf" size={20} />
                <h3 className="text-lg font-bold text-blush-palmLeaf">Seguimiento de Clientes</h3>
              </div>
              <span className="text-xs bg-blush-palmLeaf/10 text-blush-palmLeaf px-2.5 py-1 rounded-full font-semibold">
                {alertasCRM.length} pendiente{alertasCRM.length !== 1 ? 's' : ''}
              </span>
            </div>

            {alertasCRM.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">🎉 Todos los clientes al día en sus tratamientos recurrentes.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                 {alertasCRM.slice(0, 4).map((crm, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-2xl bg-blush-seashell/50 border border-blush-seashell transition-luxury hover:bg-blush-seashell">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">{crm.cliente_nombre}</h4>
                      <p className="text-xs text-gray-500 font-semibold">
                        {crm.servicio_nombre} {crm.dias_retraso === -1 ? '(mañana)' : crm.dias_retraso === 0 ? '(hoy)' : `(hace ${crm.dias_retraso} días)`}
                      </p>
                    </div>
                    <button 
                      onClick={() => onNavigate('seguimiento')}
                      className="text-xs bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
                    >
                      Contactar
                    </button>
                  </div>
                ))}
                {alertasCRM.length > 4 && (
                  <button 
                    onClick={() => onNavigate('seguimiento')}
                    className="w-full text-center text-xs text-blush-palmLeaf font-bold py-1.5 mt-2 hover:underline cursor-pointer"
                  >
                    Ver los {alertasCRM.length} pendientes
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Alertas de Stock Mínimo */}
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={20} />
                <h3 className="text-lg font-bold text-blush-palmLeaf">Alertas de Inventario</h3>
              </div>
              <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-semibold">
                {alertasStock.length} crítico{alertasStock.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {alertasStock.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">✅ Stock saludable. Ningún insumo por debajo de 4 unidades.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alertasStock.map((prod) => (
                  <div key={prod.id} className="flex justify-between items-center p-3 rounded-2xl bg-amber-50/50 border border-amber-100 transition-luxury hover:bg-amber-50">
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">{prod.nombre}</h4>
                      <p className="text-xs text-amber-700 capitalize">Tipo: {prod.tipo}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-amber-800">{prod.stock_actual}</span>
                      <span className="text-xs text-amber-500 block">mínimo {prod.stock_minimo}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
