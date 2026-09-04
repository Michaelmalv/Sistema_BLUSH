import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
  Briefcase,
  X
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
    cedula: '',
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
      return d >= startDate && d <= endDate && v.forma_pago && v.forma_pago !== 'Pendiente'
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

  // Exportar comisiones con formato profesional, colores de marca y bordeado
  const handleExportExcel = async (customColab = null) => {
    try {
      const isColabObject = customColab && typeof customColab === 'object' && customColab.nombre && !customColab.nativeEvent;
      const targetColab = isColabObject ? customColab : null;

      const makeCell = (val, type, format = null, style = {}) => {
        const cell = { v: val, t: type };
        if (format) cell.z = format;
        cell.s = {
          font: { name: 'Segoe UI', size: 9.5, ...style.font },
          alignment: { vertical: 'middle', ...style.alignment },
          fill: style.fill || undefined,
          border: style.border || undefined
        };
        return cell;
      };

      const baseFont = { name: 'Segoe UI', size: 9.5 };
      const tableBorder = {
        top: { style: 'thin', color: { rgb: 'E5E7EB' } },
        bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
        left: { style: 'thin', color: { rgb: 'E5E7EB' } },
        right: { style: 'thin', color: { rgb: 'E5E7EB' } }
      };

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
      });

      const cellTextLeft = (bg = 'FFFFFF') => ({
        font: baseFont,
        fill: bg !== 'FFFFFF' ? { fgColor: { rgb: bg } } : undefined,
        alignment: { horizontal: 'left', vertical: 'middle' },
        border: tableBorder
      });

      const cellTextCenter = (bg = 'FFFFFF') => ({
        font: baseFont,
        fill: bg !== 'FFFFFF' ? { fgColor: { rgb: bg } } : undefined,
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: tableBorder
      });

      const cellCurrency = (bg = 'FFFFFF') => ({
        font: baseFont,
        fill: bg !== 'FFFFFF' ? { fgColor: { rgb: bg } } : undefined,
        alignment: { horizontal: 'right', vertical: 'middle' },
        border: tableBorder
      });

      const cellCurrencyBold = (bg = 'FFFFFF') => ({
        font: { ...baseFont, bold: true, color: { rgb: '15803D' } },
        fill: bg !== 'FFFFFF' ? { fgColor: { rgb: bg } } : undefined,
        alignment: { horizontal: 'right', vertical: 'middle' },
        border: tableBorder
      });

      const cardLabelStyle = {
        font: { name: 'Segoe UI', size: 9.5, bold: true, color: { rgb: '4B5563' } },
        fill: { fgColor: { rgb: 'F9FAFB' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
        border: tableBorder
      };

      const cardValStyle = {
        font: { name: 'Segoe UI', size: 10, bold: true, color: { rgb: '1F2937' } },
        alignment: { horizontal: 'right', vertical: 'middle' },
        border: tableBorder
      };

      const cardValGreenStyle = {
        font: { name: 'Segoe UI', size: 10.5, bold: true, color: { rgb: '15803D' } },
        fill: { fgColor: { rgb: 'F0FDF4' } },
        alignment: { horizontal: 'right', vertical: 'middle' },
        border: tableBorder
      };

      const totalRowStyle = {
        font: { name: 'Segoe UI', size: 10, bold: true, color: { rgb: '1F2937' } },
        fill: { fgColor: { rgb: 'F3F4F6' } },
        alignment: { vertical: 'middle' },
        border: {
          top: { style: 'medium', color: { rgb: '748843' } },
          bottom: { style: 'double', color: { rgb: '748843' } },
          left: { style: 'thin', color: { rgb: 'D1D5DB' } },
          right: { style: 'thin', color: { rgb: 'D1D5DB' } }
        }
      };

      if (targetColab) {
        // ==========================================
        // EXPORTAR REPORTE DETALLADO DE 1 COLABORADORA
        // ==========================================
        const rows = [];
        const merges = [];
        const detalles = targetColab.detalles_ventas || [];

        // Fila 0: Logo y Marca BLUSH
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } });
        const h0 = [makeCell('BLUSH BEAUTY STUDIO', 's', null, {
          font: { name: 'Segoe UI', size: 17, bold: true, color: { rgb: '748843' } },
          alignment: { horizontal: 'left', vertical: 'middle' }
        })];
        for (let i = 1; i <= 5; i++) h0.push(makeCell('', 's', null, {}));
        rows.push(h0);

        // Fila 1: Título de reporte
        merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } });
        rows.push([makeCell('LIQUIDACIÓN INDIVIDUAL DE COMISIONES (40%)', 's', null, {
          font: { name: 'Segoe UI', size: 11, bold: true, color: { rgb: 'BAAB94' } },
          alignment: { horizontal: 'left', vertical: 'middle' }
        })]);

        // Fila 2: Subtítulo de metadata
        merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 5 } });
        rows.push([makeCell(`Colaboradora: ${targetColab.nombre} (${targetColab.cargo || 'Manicurista'}) | Período: ${meses[selectedMonth]} ${selectedYear} | Emisión: ${new Date().toLocaleString('es-EC')}`, 's', null, {
          font: { name: 'Segoe UI', size: 9.5, italic: true, color: { rgb: '6B7280' } },
          alignment: { horizontal: 'left', vertical: 'middle' }
        })]);

        rows.push([]); // espacio

        // Fila 4-6: Tarjetas de resumen (KPIs)
        const totalFacturado = detalles.reduce((sum, v) => sum + Number(v.valor_pagado || 0), 0);
        const totalComision = totalFacturado * 0.40;

        rows.push([
          makeCell('Cant. Servicios Realizados', 's', null, cardLabelStyle),
          makeCell(detalles.length, 'n', '#,##0', cardValStyle)
        ]);
        rows.push([
          makeCell('Total Facturado / Cobrado', 's', null, cardLabelStyle),
          makeCell(totalFacturado, 'n', '"$"#,##0.00', cardValStyle)
        ]);
        rows.push([
          makeCell('Comisión Total a Liquidar (40%)', 's', null, { ...cardLabelStyle, fill: { fgColor: { rgb: 'F0FDF4' } } }),
          makeCell(totalComision, 'n', '"$"#,##0.00', cardValGreenStyle)
        ]);

        rows.push([]); // espacio

        // Fila 8: Encabezados de tabla
        rows.push([
          makeCell('Fecha y Hora', 's', null, headerStyle('748843')),
          makeCell('Cliente', 's', null, headerStyle('748843')),
          makeCell('Servicio Realizado', 's', null, headerStyle('748843')),
          makeCell('Forma de Pago', 's', null, headerStyle('748843')),
          makeCell('Valor Cobrado ($)', 's', null, headerStyle('748843')),
          makeCell('Comisión 40% ($)', 's', null, headerStyle('748843'))
        ]);

        if (detalles.length === 0) {
          rows.push([
            makeCell('Sin servicios registrados en este período', 's', null, cellTextCenter()),
            makeCell('', 's', null, cellTextLeft()),
            makeCell('', 's', null, cellTextLeft()),
            makeCell('', 's', null, cellTextCenter()),
            makeCell(0, 'n', '"$"#,##0.00', cellCurrency()),
            makeCell(0, 'n', '"$"#,##0.00', cellCurrencyBold())
          ]);
        } else {
          detalles.forEach((v, idx) => {
            const bg = idx % 2 === 0 ? 'FFFFFF' : 'FBFDF9';
            const valCobrado = Number(v.valor_pagado || 0);
            const com40 = valCobrado * 0.40;
            const fStr = v.fecha_hora ? new Date(v.fecha_hora).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
            rows.push([
              makeCell(fStr, 's', null, cellTextCenter(bg)),
              makeCell(v.clientes ? v.clientes.nombre : 'Cliente General', 's', null, cellTextLeft(bg)),
              makeCell(v.servicios ? v.servicios.nombre : 'Servicio', 's', null, cellTextLeft(bg)),
              makeCell(v.forma_pago || 'Efectivo', 's', null, cellTextCenter(bg)),
              makeCell(valCobrado, 'n', '"$"#,##0.00', cellCurrency(bg)),
              makeCell(com40, 'n', '"$"#,##0.00', cellCurrencyBold(bg))
            ]);
          });
        }

        // Fila Total
        rows.push([
          makeCell('TOTAL GENERAL', 's', null, { ...totalRowStyle, alignment: { horizontal: 'left', vertical: 'middle' } }),
          makeCell('', 's', null, totalRowStyle),
          makeCell('', 's', null, totalRowStyle),
          makeCell(`Cant: ${detalles.length}`, 's', null, { ...totalRowStyle, alignment: { horizontal: 'center', vertical: 'middle' } }),
          makeCell(totalFacturado, 'n', '"$"#,##0.00', { ...totalRowStyle, alignment: { horizontal: 'right', vertical: 'middle' } }),
          makeCell(totalComision, 'n', '"$"#,##0.00', { ...totalRowStyle, font: { ...baseFont, bold: true, color: { rgb: '15803D' } }, alignment: { horizontal: 'right', vertical: 'middle' } })
        ]);

        // Pie de página oficial
        const lastRowIdx = rows.length;
        merges.push({ s: { r: lastRowIdx, c: 0 }, e: { r: lastRowIdx, c: 5 } });
        const footerRow = [makeCell('★ DOCUMENTO OFICIAL GENERADO POR EL SISTEMA BLUSH BEAUTY STUDIO - CONTROL DE COMISIONES ★', 's', null, {
          font: { name: 'Segoe UI', size: 8, italic: true, color: { rgb: '9CA3AF' } },
          alignment: { horizontal: 'center', vertical: 'middle' }
        })];
        for (let i = 1; i <= 5; i++) footerRow.push(makeCell('', 's', null, {}));
        rows.push(footerRow);

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!merges'] = merges;
        ws['!cols'] = [
          { wch: 20 }, // Fecha
          { wch: 28 }, // Cliente
          { wch: 30 }, // Servicio
          { wch: 18 }, // Forma de Pago
          { wch: 18 }, // Valor Cobrado
          { wch: 18 }  // Comisión 40%
        ];
        ws['!rows'] = [{ hpt: 45 }];

        XLSX.utils.book_append_sheet(wb, ws, 'Detalle Comisiones');
        const safeName = targetColab.nombre.replace(/\s+/g, '_');
        const safeMonthName = meses[selectedMonth].replace(/\s+/g, '_');
        await exportExcelJS(wb, `Comisiones_${safeName}_${safeMonthName}_${selectedYear}.xlsx`, { sheetName: 'Detalle Comisiones', col: 5, row: 0 });
      } else {
        // ==========================================
        // EXPORTAR REPORTE GENERAL DE TODA LA NÓMINA
        // ==========================================
        const wb = XLSX.utils.book_new();

        // ------------------------------------------
        // HOJA 1: RESUMEN GENERAL DE COMISIONES
        // ------------------------------------------
        const rowsResumen = [];
        const mergesResumen = [];

        // Fila 0: Logo y Marca BLUSH
        mergesResumen.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } });
        const h0 = [makeCell('BLUSH BEAUTY STUDIO', 's', null, {
          font: { name: 'Segoe UI', size: 17, bold: true, color: { rgb: '748843' } },
          alignment: { horizontal: 'left', vertical: 'middle' }
        })];
        for (let i = 1; i <= 4; i++) h0.push(makeCell('', 's', null, {}));
        rowsResumen.push(h0);

        // Fila 1: Título de reporte
        mergesResumen.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 4 } });
        rowsResumen.push([makeCell('REPORTE GENERAL DE SUELDOS Y COMISIONES (40%)', 's', null, {
          font: { name: 'Segoe UI', size: 11, bold: true, color: { rgb: 'BAAB94' } },
          alignment: { horizontal: 'left', vertical: 'middle' }
        })]);

        // Fila 2: Subtítulo
        mergesResumen.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 4 } });
        rowsResumen.push([makeCell(`Período: ${meses[selectedMonth]} ${selectedYear} | Emisión: ${new Date().toLocaleString('es-EC')}`, 's', null, {
          font: { name: 'Segoe UI', size: 9.5, italic: true, color: { rgb: '6B7280' } },
          alignment: { horizontal: 'left', vertical: 'middle' }
        })]);

        rowsResumen.push([]); // espacio

        // Fila 4-7: Tarjetas de resumen general (KPIs)
        const sumServicios = comisiones.reduce((sum, c) => sum + (c.total_servicios || 0), 0);
        const sumFacturado = comisiones.reduce((sum, c) => sum + (c.total_ventas || 0), 0);
        const sumComision = comisiones.reduce((sum, c) => sum + (c.comision || 0), 0);

        rowsResumen.push([
          makeCell('Total Colaboradoras en Nómina', 's', null, cardLabelStyle),
          makeCell(comisiones.length, 'n', '#,##0', cardValStyle)
        ]);
        rowsResumen.push([
          makeCell('Total Servicios Realizados', 's', null, cardLabelStyle),
          makeCell(sumServicios, 'n', '#,##0', cardValStyle)
        ]);
        rowsResumen.push([
          makeCell('Total Facturado en el Mes', 's', null, cardLabelStyle),
          makeCell(sumFacturado, 'n', '"$"#,##0.00', cardValStyle)
        ]);
        rowsResumen.push([
          makeCell('Total Comisiones a Liquidar (40%)', 's', null, { ...cardLabelStyle, fill: { fgColor: { rgb: 'F0FDF4' } } }),
          makeCell(sumComision, 'n', '"$"#,##0.00', cardValGreenStyle)
        ]);

        rowsResumen.push([]); // espacio

        // Fila 9: Encabezados de tabla resumen
        rowsResumen.push([
          makeCell('Colaboradora', 's', null, headerStyle('748843')),
          makeCell('Cargo', 's', null, headerStyle('748843')),
          makeCell('Cant. Servicios', 's', null, headerStyle('748843')),
          makeCell('Total Facturado ($)', 's', null, headerStyle('748843')),
          makeCell('Comisión a Pagar (40% $)', 's', null, headerStyle('748843'))
        ]);

        comisiones.forEach((c, idx) => {
          const bg = idx % 2 === 0 ? 'FFFFFF' : 'FBFDF9';
          rowsResumen.push([
            makeCell(c.nombre, 's', null, cellTextLeft(bg)),
            makeCell(c.cargo || 'Manicurista', 's', null, cellTextLeft(bg)),
            makeCell(Number(c.total_servicios || 0), 'n', '#,##0', cellTextCenter(bg)),
            makeCell(Number(c.total_ventas || 0), 'n', '"$"#,##0.00', cellCurrency(bg)),
            makeCell(Number(c.comision || 0), 'n', '"$"#,##0.00', cellCurrencyBold(bg))
          ]);
        });

        // Fila Totales
        rowsResumen.push([
          makeCell('TOTALES GENERALES', 's', null, { ...totalRowStyle, alignment: { horizontal: 'left', vertical: 'middle' } }),
          makeCell('', 's', null, totalRowStyle),
          makeCell(sumServicios, 'n', '#,##0', { ...totalRowStyle, alignment: { horizontal: 'center', vertical: 'middle' } }),
          makeCell(sumFacturado, 'n', '"$"#,##0.00', { ...totalRowStyle, alignment: { horizontal: 'right', vertical: 'middle' } }),
          makeCell(sumComision, 'n', '"$"#,##0.00', { ...totalRowStyle, font: { ...baseFont, bold: true, color: { rgb: '15803D' } }, alignment: { horizontal: 'right', vertical: 'middle' } })
        ]);

        // Pie de página
        const lastRowRes = rowsResumen.length;
        mergesResumen.push({ s: { r: lastRowRes, c: 0 }, e: { r: lastRowRes, c: 4 } });
        const footerRes = [makeCell('★ DOCUMENTO OFICIAL GENERADO POR EL SISTEMA BLUSH BEAUTY STUDIO - CONTROL DE SUELDOS ★', 's', null, {
          font: { name: 'Segoe UI', size: 8, italic: true, color: { rgb: '9CA3AF' } },
          alignment: { horizontal: 'center', vertical: 'middle' }
        })];
        for (let i = 1; i <= 4; i++) footerRes.push(makeCell('', 's', null, {}));
        rowsResumen.push(footerRes);

        const wsResumen = XLSX.utils.aoa_to_sheet(rowsResumen);
        wsResumen['!merges'] = mergesResumen;
        wsResumen['!cols'] = [
          { wch: 28 }, // Colaboradora
          { wch: 18 }, // Cargo
          { wch: 16 }, // Cant. Servicios
          { wch: 20 }, // Total Facturado
          { wch: 24 }  // Comisión a Pagar
        ];
        wsResumen['!rows'] = [{ hpt: 45 }];
        XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen General');

        // ------------------------------------------
        // HOJA 2: DESGLOSE DETALLADO DE SERVICIOS
        // ------------------------------------------
        const rowsDetail = [];
        const mergesDetail = [];

        mergesDetail.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
        const hd0 = [makeCell('BLUSH BEAUTY STUDIO', 's', null, {
          font: { name: 'Segoe UI', size: 17, bold: true, color: { rgb: '748843' } },
          alignment: { horizontal: 'left', vertical: 'middle' }
        })];
        for (let i = 1; i <= 6; i++) hd0.push(makeCell('', 's', null, {}));
        rowsDetail.push(hd0);

        mergesDetail.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 6 } });
        rowsDetail.push([makeCell('DESGLOSE DETALLADO DE SERVICIOS POR COLABORADORA', 's', null, {
          font: { name: 'Segoe UI', size: 11, bold: true, color: { rgb: 'BAAB94' } },
          alignment: { horizontal: 'left', vertical: 'middle' }
        })]);

        mergesDetail.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 6 } });
        rowsDetail.push([makeCell(`Período: ${meses[selectedMonth]} ${selectedYear} | Detalle completo de servicios realizados`, 's', null, {
          font: { name: 'Segoe UI', size: 9.5, italic: true, color: { rgb: '6B7280' } },
          alignment: { horizontal: 'left', vertical: 'middle' }
        })]);

        rowsDetail.push([]); // espacio

        rowsDetail.push([
          makeCell('Colaboradora', 's', null, headerStyle('748843')),
          makeCell('Fecha y Hora', 's', null, headerStyle('748843')),
          makeCell('Cliente', 's', null, headerStyle('748843')),
          makeCell('Servicio Realizado', 's', null, headerStyle('748843')),
          makeCell('Forma de Pago', 's', null, headerStyle('748843')),
          makeCell('Valor Cobrado ($)', 's', null, headerStyle('748843')),
          makeCell('Comisión 40% ($)', 's', null, headerStyle('748843'))
        ]);

        let detailCount = 0;
        comisiones.forEach(c => {
          (c.detalles_ventas || []).forEach(v => {
            const bg = detailCount % 2 === 0 ? 'FFFFFF' : 'FBFDF9';
            detailCount++;
            const val = Number(v.valor_pagado || 0);
            const fStr = v.fecha_hora ? new Date(v.fecha_hora).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
            rowsDetail.push([
              makeCell(c.nombre, 's', null, cellTextLeft(bg)),
              makeCell(fStr, 's', null, cellTextCenter(bg)),
              makeCell(v.clientes ? v.clientes.nombre : 'Cliente General', 's', null, cellTextLeft(bg)),
              makeCell(v.servicios ? v.servicios.nombre : 'Servicio', 's', null, cellTextLeft(bg)),
              makeCell(v.forma_pago || 'Efectivo', 's', null, cellTextCenter(bg)),
              makeCell(val, 'n', '"$"#,##0.00', cellCurrency(bg)),
              makeCell(val * 0.40, 'n', '"$"#,##0.00', cellCurrencyBold(bg))
            ]);
          });
        });

        if (detailCount === 0) {
          rowsDetail.push([
            makeCell('Sin registros de servicios en este período', 's', null, cellTextCenter()),
            makeCell('', 's', null, cellTextCenter()),
            makeCell('', 's', null, cellTextLeft()),
            makeCell('', 's', null, cellTextLeft()),
            makeCell('', 's', null, cellTextCenter()),
            makeCell(0, 'n', '"$"#,##0.00', cellCurrency()),
            makeCell(0, 'n', '"$"#,##0.00', cellCurrencyBold())
          ]);
        }

        // Fila Total
        rowsDetail.push([
          makeCell('TOTAL GENERAL', 's', null, { ...totalRowStyle, alignment: { horizontal: 'left', vertical: 'middle' } }),
          makeCell('', 's', null, totalRowStyle),
          makeCell('', 's', null, totalRowStyle),
          makeCell('', 's', null, totalRowStyle),
          makeCell(`Cant: ${detailCount}`, 's', null, { ...totalRowStyle, alignment: { horizontal: 'center', vertical: 'middle' } }),
          makeCell(sumFacturado, 'n', '"$"#,##0.00', { ...totalRowStyle, alignment: { horizontal: 'right', vertical: 'middle' } }),
          makeCell(sumComision, 'n', '"$"#,##0.00', { ...totalRowStyle, font: { ...baseFont, bold: true, color: { rgb: '15803D' } }, alignment: { horizontal: 'right', vertical: 'middle' } })
        ]);

        const lastRowDet = rowsDetail.length;
        mergesDetail.push({ s: { r: lastRowDet, c: 0 }, e: { r: lastRowDet, c: 6 } });
        const footerDet = [makeCell('★ DOCUMENTO OFICIAL GENERADO POR EL SISTEMA BLUSH BEAUTY STUDIO - DETALLE DE SERVICIOS ★', 's', null, {
          font: { name: 'Segoe UI', size: 8, italic: true, color: { rgb: '9CA3AF' } },
          alignment: { horizontal: 'center', vertical: 'middle' }
        })];
        for (let i = 1; i <= 6; i++) footerDet.push(makeCell('', 's', null, {}));
        rowsDetail.push(footerDet);

        const wsDetail = XLSX.utils.aoa_to_sheet(rowsDetail);
        wsDetail['!merges'] = mergesDetail;
        wsDetail['!cols'] = [
          { wch: 24 }, // Colaboradora
          { wch: 18 }, // Fecha
          { wch: 26 }, // Cliente
          { wch: 28 }, // Servicio
          { wch: 16 }, // Forma de Pago
          { wch: 18 }, // Valor
          { wch: 18 }  // Comisión
        ];
        wsDetail['!rows'] = [{ hpt: 45 }];
        XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle Servicios');

        const safeMonthName = meses[selectedMonth].replace(/\s+/g, '_');
        await exportExcelJS(wb, `Comisiones_Blush_${safeMonthName}_${selectedYear}.xlsx`, { sheetName: 'Resumen General', col: 4, row: 0 });
      }
    } catch (err) {
      console.error('Error al exportar sueldos:', err);
      alert('Hubo un error al exportar el reporte: ' + (err.message || 'Error desconocido'));
    }
  };

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
          cedula: formColaboradora.cedula.trim() || null,
          cargo: formColaboradora.cargo,
          activo: formColaboradora.activo
        })
        setMsgCol({ type: 'success', text: '✅ Colaboradora actualizada con éxito.' })
      } else {
        await dataService.registrarPersonal({
          nombre: formColaboradora.nombre.trim(),
          cedula: formColaboradora.cedula.trim() || null,
          cargo: formColaboradora.cargo,
          activo: true
        })
        setMsgCol({ type: 'success', text: '✅ Colaboradora agregada con éxito.' })
      }

      setFormColaboradora({ nombre: '', cedula: '', cargo: 'Manicurista', activo: true })
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
      cedula: colab.cedula || '',
      cargo: colab.cargo || 'Manicurista',
      activo: colab.activo
    })
  }

  // Filtrado de colaboradores en lista
  const filteredPersonal = personal.filter(p => {
    const q = (searchColaboradora || '').toLowerCase().trim()
    if (!q) return true
    return (
      (p.nombre && String(p.nombre).toLowerCase().includes(q)) ||
      (p.cargo && String(p.cargo).toLowerCase().includes(q)) ||
      (p.cedula && String(p.cedula).toLowerCase().includes(q))
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
                  onClick={() => handleExportExcel(null)}
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
                    <div className="pb-3 border-b border-gray-100 flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                          Detalle: {selectedManicuristaDetail.nombre}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                          Servicios en {meses[selectedMonth]} {selectedYear}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExportExcel(selectedManicuristaDetail)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                        title="Descargar detalle de comisiones en Excel"
                      >
                        <FileSpreadsheet size={12} />
                        Excel
                      </button>
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
          {/* Formulario de Registro / Creación */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-150 h-fit">
            <h3 className="text-lg font-black text-blush-palmLeaf mb-1 flex items-center gap-2 uppercase tracking-wide">
              <Users size={18} />
              Registrar Colaboradora
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
                  value={editingPersonalId ? '' : formColaboradora.nombre}
                  onChange={(e) => setFormColaboradora({ ...formColaboradora, nombre: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-250 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs text-gray-700"
                  required
                  disabled={!!editingPersonalId}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Número de Cédula</label>
                <input
                  type="text"
                  placeholder="Ej. 1723456789"
                  value={editingPersonalId ? '' : formColaboradora.cedula}
                  onChange={(e) => setFormColaboradora({ ...formColaboradora, cedula: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-250 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs text-gray-700"
                  disabled={!!editingPersonalId}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Cargo / Especialidad</label>
                <select
                  value={editingPersonalId ? 'Manicurista' : formColaboradora.cargo}
                  onChange={(e) => setFormColaboradora({ ...formColaboradora, cargo: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-250 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs text-gray-700 cursor-pointer"
                  disabled={!!editingPersonalId}
                >
                  <option value="Manicurista">Manicurista</option>
                  <option value="Pedicurista">Pedicurista</option>
                  <option value="Estilista">Estilista</option>
                  <option value="Administradora">Administradora</option>
                </select>
              </div>

              {!editingPersonalId && msgCol.text && (
                <div className={`p-3 rounded-xl text-xs font-bold text-center ${
                  msgCol.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {msgCol.text}
                </div>
              )}

              <button
                type="submit"
                disabled={!!editingPersonalId}
                className={`w-full py-3 bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 ${
                  editingPersonalId ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Agregar Colaboradora
              </button>
            </form>
          </div>

          {/* MODAL DE EDICIÓN FLOTANTE */}
          {editingPersonalId && createPortal(
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-tab-active">
              <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-150 relative animate-slide-in my-8 max-h-[95vh] overflow-y-auto text-xs font-bold text-gray-700">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-blush-palmLeaf flex items-center gap-2 uppercase tracking-wide">
                    <Users size={18} />
                    Editar Colaboradora
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPersonalId(null)
                      setFormColaboradora({ nombre: '', cedula: '', cargo: 'Manicurista', activo: true })
                      setMsgCol({ type: '', text: '' })
                    }}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmitColaboradora} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      placeholder="Ej. Pamela Armendariz"
                      value={formColaboradora.nombre}
                      onChange={(e) => setFormColaboradora({ ...formColaboradora, nombre: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-250 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs text-gray-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Número de Cédula</label>
                    <input
                      type="text"
                      placeholder="Ej. 1723456789"
                      value={formColaboradora.cedula}
                      onChange={(e) => setFormColaboradora({ ...formColaboradora, cedula: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-250 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs text-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Cargo / Especialidad</label>
                    <select
                      value={formColaboradora.cargo}
                      onChange={(e) => setFormColaboradora({ ...formColaboradora, cargo: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-250 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs text-gray-700 cursor-pointer"
                    >
                      <option value="Manicurista">Manicurista</option>
                      <option value="Pedicurista">Pedicurista</option>
                      <option value="Estilista">Estilista</option>
                      <option value="Administradora">Administradora</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Estado</label>
                    <select
                      value={formColaboradora.activo ? "true" : "false"}
                      onChange={(e) => setFormColaboradora({ ...formColaboradora, activo: e.target.value === "true" })}
                      className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-250 focus:border-blush-palmLeaf focus:bg-white rounded-xl outline-none transition-all text-xs text-gray-700 cursor-pointer"
                    >
                      <option value="true">Activa (Aparece en agendas y liquidaciones)</option>
                      <option value="false">Inactiva (Baja de la sucursal)</option>
                    </select>
                  </div>

                  {msgCol.text && (
                    <div className={`p-3 rounded-xl text-xs font-bold text-center ${
                      msgCol.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                      {msgCol.text}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                    >
                      Guardar Cambios
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPersonalId(null)
                        setFormColaboradora({ nombre: '', cedula: '', cargo: 'Manicurista', activo: true })
                        setMsgCol({ type: '', text: '' })
                      }}
                      className="py-3 px-4 bg-gray-150 hover:bg-gray-200 text-gray-750 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}

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
                      <td className="py-3 px-4 text-gray-800 text-sm font-black">
                        <div>{colab.nombre}</div>
                        {colab.cedula && (
                          <div className="text-xxs text-gray-400 font-medium mt-0.5 font-bold">Ced: {colab.cedula}</div>
                        )}
                      </td>
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
