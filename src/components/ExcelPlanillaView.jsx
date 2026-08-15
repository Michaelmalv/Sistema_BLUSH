import React, { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2, Save, X } from 'lucide-react'
import { dataService } from '../dataService'

const createEmptyRow = () => {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const localDate = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
  return {
    fecha: localDate,
    cliente_nombre: '',
    cedula: '',
    celular: '',
    correo: '',
    servicio_texto: '',
    precio: '',
    forma_pago: 'Efectivo',
    no_transferencia: '',
    personal_id: ''
  }
}

export default function ExcelPlanillaView({ activeTab, clientes, servicios, personal, loadData }) {
  const [excelRows, setExcelRows] = useState(() => Array(5).fill(null).map(createEmptyRow))
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  // Autocomplete suggestions states
  const [activeCell, setActiveCell] = useState({ rowIndex: -1, field: '' })
  const [clientSuggestions, setClientSuggestions] = useState([])
  const [serviceSuggestions, setServiceSuggestions] = useState([])
  const [suggestIdx, setSuggestIdx] = useState(-1)

  // Recalculate sum of base prices from text
  const recalculateRowPrice = (serviceText, availableServices) => {
    if (!serviceText) return ''
    const segments = serviceText.split('+').map(s => s.trim())
    let sum = 0
    let matchesCount = 0
    segments.forEach(seg => {
      if (!seg) return
      const svc = availableServices.find(s => 
        s.nombre.toLowerCase() === seg.toLowerCase() || 
        s.nombre.toLowerCase().includes(seg.toLowerCase())
      )
      if (svc) {
        sum += Number(svc.precio_base)
        matchesCount++
      }
    })
    return matchesCount > 0 ? sum.toFixed(2) : ''
  }

  // Handle Client Input
  const handleClientTextChange = (rowIndex, val) => {
    const updated = [...excelRows]
    updated[rowIndex].cliente_nombre = val
    setExcelRows(updated)

    if (val.trim() === '') {
      setClientSuggestions([])
      setSuggestIdx(-1)
      return
    }

    const filtered = clientes.filter(c => 
      c.nombre.toLowerCase().includes(val.toLowerCase()) || 
      (c.cedula && c.cedula.includes(val))
    ).slice(0, 5)
    setClientSuggestions(filtered)
    setSuggestIdx(0)
  }

  const handleClientKeyDown = (rowIndex, e) => {
    if (clientSuggestions.length === 0) {
      handleGeneralKeyDown(rowIndex, 'cliente_nombre', e)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSuggestIdx(prev => Math.min(prev + 1, clientSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSuggestIdx(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestIdx >= 0 && suggestIdx < clientSuggestions.length) {
        selectClient(rowIndex, clientSuggestions[suggestIdx])
      }
    } else if (e.key === 'Escape') {
      setClientSuggestions([])
      setSuggestIdx(-1)
    }
  }

  const selectClient = (rowIndex, clientObj) => {
    const updated = [...excelRows]
    updated[rowIndex].cliente_nombre = clientObj.nombre
    updated[rowIndex].cedula = clientObj.cedula || ''
    updated[rowIndex].celular = clientObj.celular || ''
    updated[rowIndex].correo = clientObj.correo || ''
    setExcelRows(updated)
    setClientSuggestions([])
    setSuggestIdx(-1)
  }

  // Handle Service Input
  const handleServiceTextChange = (rowIndex, val) => {
    const updated = [...excelRows]
    updated[rowIndex].servicio_texto = val

    // Recalculate price
    const calculatedPrice = recalculateRowPrice(val, servicios)
    if (calculatedPrice) {
      updated[rowIndex].precio = calculatedPrice
    }

    setExcelRows(updated)

    const segments = val.split('+')
    const lastSeg = segments[segments.length - 1].trim()

    if (lastSeg === '') {
      setServiceSuggestions([])
      setSuggestIdx(-1)
      return
    }

    const filtered = servicios.filter(s => 
      s.nombre.toLowerCase().includes(lastSeg.toLowerCase())
    ).slice(0, 5)
    setServiceSuggestions(filtered)
    setSuggestIdx(0)
  }

  const handleServiceKeyDown = (rowIndex, e) => {
    if (serviceSuggestions.length === 0) {
      handleGeneralKeyDown(rowIndex, 'servicio_texto', e)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSuggestIdx(prev => Math.min(prev + 1, serviceSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSuggestIdx(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestIdx >= 0 && suggestIdx < serviceSuggestions.length) {
        selectService(rowIndex, serviceSuggestions[suggestIdx])
      }
    } else if (e.key === 'Escape') {
      setServiceSuggestions([])
      setSuggestIdx(-1)
    }
  }

  const selectService = (rowIndex, svcObj) => {
    const updated = [...excelRows]
    const val = updated[rowIndex].servicio_texto
    const segments = val.split('+')

    // Replace the last segment with completed name
    segments[segments.length - 1] = ` ${svcObj.nombre} `

    const newVal = segments.join('+ ')
    updated[rowIndex].servicio_texto = newVal

    // Recalculate price
    const calculatedPrice = recalculateRowPrice(newVal, servicios)
    if (calculatedPrice) {
      updated[rowIndex].precio = calculatedPrice
    }

    setExcelRows(updated)
    setServiceSuggestions([])
    setSuggestIdx(-1)
  }

  // Navigation and dynamic row addition
  const handleGeneralKeyDown = (rowIndex, field, e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (rowIndex < excelRows.length - 1) {
        const nextInput = document.querySelector(`[data-row="${rowIndex + 1}"][data-field="${field}"]`)
        if (nextInput) nextInput.focus()
      } else {
        handleAddRow()
        setTimeout(() => {
          const nextInput = document.querySelector(`[data-row="${rowIndex + 1}"][data-field="${field}"]`)
          if (nextInput) nextInput.focus()
        }, 50)
      }
    }
  }

  const handleAddRow = () => {
    setExcelRows([...excelRows, createEmptyRow()])
  }

  const handleRemoveRow = (rowIndex) => {
    if (excelRows.length <= 1) {
      setExcelRows([createEmptyRow()])
      return
    }
    setExcelRows(excelRows.filter((_, i) => i !== rowIndex))
  }

  const handleCellBlur = () => {
    // Small timeout to allow suggestion mouse down events to fire
    setTimeout(() => {
      setActiveCell({ rowIndex: -1, field: '' })
      setClientSuggestions([])
      setServiceSuggestions([])
      setSuggestIdx(-1)
    }, 200)
  }

  // Submit / Register all rows
  const handleRegisterExcel = async () => {
    setMsg({ type: '', text: '' })

    const rowsToSave = excelRows.filter(r => 
      r.cliente_nombre.trim() !== '' && r.servicio_texto.trim() !== ''
    )

    if (rowsToSave.length === 0) {
      return alert('Debe completar al menos una fila con Nombre de Cliente y Servicio.')
    }

    try {
      setLoading(true)
      let processedCount = 0

      for (let r of rowsToSave) {
        let finalClienteId = null

        // 1. Check if client exists
        let client = clientes.find(c => 
          c.nombre.toLowerCase() === r.cliente_nombre.trim().toLowerCase() ||
          (r.cedula && c.cedula === r.cedula.trim())
        )

        if (client) {
          finalClienteId = client.id
        } else {
          // Auto-create client
          const newClient = await dataService.registrarCliente({
            nombre: r.cliente_nombre.trim(),
            cedula: r.cedula.trim() || null,
            celular: r.celular.trim() || null,
            correo: r.correo.trim() || null,
            medio_contacto: 'Recomendación'
          })
          finalClienteId = newClient.id
        }

        // 2. Parse services connected by "+"
        const serviceSegments = r.servicio_texto.split('+').map(s => s.trim())
        const appointmentsToRegister = []

        for (let segment of serviceSegments) {
          if (!segment) continue
          const svc = servicios.find(s => 
            s.nombre.toLowerCase() === segment.toLowerCase() || 
            s.nombre.toLowerCase().includes(segment.toLowerCase())
          )

          if (!svc) {
            throw new Error(`El servicio "${segment}" no existe en el catálogo. Por favor, regístralo primero en la pestaña de Servicios.`)
          }

          appointmentsToRegister.push({
            cliente_id: finalClienteId,
            servicio_id: svc.id,
            personal_id: r.personal_id || personal.find(p => p.activo)?.id || null,
            fecha_hora: new Date(r.fecha + 'T12:00:00').toISOString(),
            valor_pagado: Number(svc.precio_base),
            forma_pago: r.forma_pago,
            no_transferencia: r.no_transferencia.trim() || null,
            tipo: activeTab === 'citas' ? 'cita' : 'venta'
          })
        }

        // Proportional distribution of customized total row price
        const rowTotal = Number(r.precio)
        if (!isNaN(rowTotal) && rowTotal > 0 && appointmentsToRegister.length > 0) {
          const sumBases = appointmentsToRegister.reduce((sum, c) => sum + c.valor_pagado, 0)
          if (sumBases > 0) {
            appointmentsToRegister.forEach(c => {
              c.valor_pagado = Number(((c.valor_pagado / sumBases) * rowTotal).toFixed(2))
            })
            // Correct rounding errors on the last service
            const sumDistributed = appointmentsToRegister.reduce((sum, c) => sum + c.valor_pagado, 0)
            const diff = rowTotal - sumDistributed
            if (Math.abs(diff) > 0.001) {
              appointmentsToRegister[appointmentsToRegister.length - 1].valor_pagado = Number((appointmentsToRegister[appointmentsToRegister.length - 1].valor_pagado + diff).toFixed(2))
            }
          } else {
            appointmentsToRegister.forEach(c => {
              c.valor_pagado = Number((rowTotal / appointmentsToRegister.length).toFixed(2))
            })
          }
        }

        await dataService.registrarGrupoCitas(appointmentsToRegister)
        processedCount++
      }

      setMsg({ 
        type: 'success', 
        text: `✅ Se registraron con éxito ${processedCount} filas desde la planilla Excel.` 
      })
      setExcelRows(Array(5).fill(null).map(createEmptyRow))
      loadData()
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error al procesar la planilla.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col w-full overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-black text-blush-palmLeaf flex items-center gap-2">
            Planilla de Registro Rápido (Estilo Excel)
          </h3>
          <p className="text-xs text-gray-400">Completa las celdas directamente. Usa las flechas y Enter para autocompletar rápidamente.</p>
        </div>
        <button
          onClick={handleAddRow}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={14} /> Añadir Fila
        </button>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto w-full border border-gray-200 rounded-2xl mb-6">
        <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 font-bold uppercase text-[10px]">
              <th className="py-2.5 px-2 border-r border-gray-250 w-10 text-center">#</th>
              <th className="py-2.5 px-2 border-r border-gray-250 w-32">Fecha</th>
              <th className="py-2.5 px-2 border-r border-gray-250 w-52">Cliente (Nombre)</th>
              <th className="py-2.5 px-2 border-r border-gray-250 w-32">Cédula</th>
              <th className="py-2.5 px-2 border-r border-gray-250 w-32">Teléfono</th>
              <th className="py-2.5 px-2 border-r border-gray-250 w-44">Correo</th>
              <th className="py-2.5 px-2 border-r border-gray-250 w-72">Servicios (con "+")</th>
              <th className="py-2.5 px-2 border-r border-gray-250 w-24">Precio ($)</th>
              <th className="py-2.5 px-2 border-r border-gray-250 w-36">Forma Pago</th>
              <th className="py-2.5 px-2 border-r border-gray-250 w-32">Ref / Código</th>
              <th className="py-2.5 px-2 border-r border-gray-250 w-44">Colaboradora</th>
              <th className="py-2.5 px-2 text-center w-12">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150">
            {excelRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-2 px-1 text-center font-bold text-gray-400 border-r border-gray-200">
                  {rowIndex + 1}
                </td>
                
                {/* FECHA */}
                <td className="py-1 px-1.5 border-r border-gray-200">
                  <input
                    type="date"
                    value={row.fecha}
                    onChange={(e) => {
                      const updated = [...excelRows]
                      updated[rowIndex].fecha = e.target.value
                      setExcelRows(updated)
                    }}
                    onKeyDown={(e) => handleGeneralKeyDown(rowIndex, 'fecha', e)}
                    className="w-full !bg-transparent !border-0 !p-1.5 !rounded-none !text-xs !font-semibold outline-none text-gray-700 focus:!bg-white"
                  />
                </td>

                {/* NOMBRE CLIENTE */}
                <td className="py-1 px-1.5 border-r border-gray-200 relative">
                  <input
                    type="text"
                    data-row={rowIndex}
                    data-field="cliente_nombre"
                    placeholder="Escribe el cliente..."
                    value={row.cliente_nombre}
                    onChange={(e) => handleClientTextChange(rowIndex, e.target.value)}
                    onKeyDown={(e) => handleClientKeyDown(rowIndex, e)}
                    onFocus={() => setActiveCell({ rowIndex, field: 'cliente_nombre' })}
                    onBlur={handleCellBlur}
                    className="w-full !bg-transparent !border-0 !p-1.5 !rounded-none !text-xs !font-bold outline-none text-gray-800 focus:!bg-white"
                  />
                  {activeCell.rowIndex === rowIndex && activeCell.field === 'cliente_nombre' && clientSuggestions.length > 0 && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-60 py-1 divide-y divide-gray-50">
                      {clientSuggestions.map((c, sIndex) => (
                        <div
                          key={c.id}
                          onMouseDown={() => selectClient(rowIndex, c)}
                          className={`px-3 py-2 text-[11px] font-bold cursor-pointer transition-colors flex justify-between ${
                            suggestIdx === sIndex ? 'bg-blush-seashell/50 text-blush-palmLeaf' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{c.nombre}</span>
                          <span className="text-[9px] text-gray-400 font-medium">{c.cedula || 'S/C'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>

                {/* CEDULA */}
                <td className="py-1 px-1.5 border-r border-gray-200">
                  <input
                    type="text"
                    data-row={rowIndex}
                    data-field="cedula"
                    placeholder="Cédula..."
                    value={row.cedula}
                    onChange={(e) => {
                      const updated = [...excelRows]
                      updated[rowIndex].cedula = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setExcelRows(updated)
                    }}
                    onKeyDown={(e) => handleGeneralKeyDown(rowIndex, 'cedula', e)}
                    className="w-full !bg-transparent !border-0 !p-1.5 !rounded-none !text-xs !font-semibold outline-none text-gray-700 focus:!bg-white"
                  />
                </td>

                {/* TELEFONO */}
                <td className="py-1 px-1.5 border-r border-gray-200">
                  <input
                    type="text"
                    data-row={rowIndex}
                    data-field="celular"
                    placeholder="Celular..."
                    value={row.celular}
                    onChange={(e) => {
                      const updated = [...excelRows]
                      updated[rowIndex].celular = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setExcelRows(updated)
                    }}
                    onKeyDown={(e) => handleGeneralKeyDown(rowIndex, 'celular', e)}
                    className="w-full !bg-transparent !border-0 !p-1.5 !rounded-none !text-xs !font-semibold outline-none text-gray-700 focus:!bg-white"
                  />
                </td>

                {/* CORREO */}
                <td className="py-1 px-1.5 border-r border-gray-200">
                  <input
                    type="email"
                    data-row={rowIndex}
                    data-field="correo"
                    placeholder="Correo..."
                    value={row.correo}
                    onChange={(e) => {
                      const updated = [...excelRows]
                      updated[rowIndex].correo = e.target.value
                      setExcelRows(updated)
                    }}
                    onKeyDown={(e) => handleGeneralKeyDown(rowIndex, 'correo', e)}
                    className="w-full !bg-transparent !border-0 !p-1.5 !rounded-none !text-xs !font-medium outline-none text-gray-650 focus:!bg-white"
                  />
                </td>

                {/* SERVICIO TEXTO */}
                <td className="py-1 px-1.5 border-r border-gray-200 relative">
                  <input
                    type="text"
                    data-row={rowIndex}
                    data-field="servicio_texto"
                    placeholder="Servicio A + Servicio B..."
                    value={row.servicio_texto}
                    onChange={(e) => handleServiceTextChange(rowIndex, e.target.value)}
                    onKeyDown={(e) => handleServiceKeyDown(rowIndex, e)}
                    onFocus={() => setActiveCell({ rowIndex, field: 'servicio_texto' })}
                    onBlur={handleCellBlur}
                    className="w-full !bg-transparent !border-0 !p-1.5 !rounded-none !text-xs !font-bold outline-none text-gray-800 focus:!bg-white"
                  />
                  {activeCell.rowIndex === rowIndex && activeCell.field === 'servicio_texto' && serviceSuggestions.length > 0 && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-64 py-1 divide-y divide-gray-50">
                      {serviceSuggestions.map((s, sIndex) => (
                        <div
                          key={s.id}
                          onMouseDown={() => selectService(rowIndex, s)}
                          className={`px-3 py-2 text-[11px] font-bold cursor-pointer transition-colors flex justify-between ${
                            suggestIdx === sIndex ? 'bg-blush-seashell/50 text-blush-palmLeaf' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{s.nombre}</span>
                          <span className="text-[10px] text-blush-palmLeaf font-extrabold">${Number(s.precio_base).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>

                {/* PRECIO */}
                <td className="py-1 px-1.5 border-r border-gray-200">
                  <input
                    type="number"
                    step="0.01"
                    data-row={rowIndex}
                    data-field="precio"
                    placeholder="0.00"
                    value={row.precio}
                    onChange={(e) => {
                      const updated = [...excelRows]
                      updated[rowIndex].precio = e.target.value
                      setExcelRows(updated)
                    }}
                    onKeyDown={(e) => handleGeneralKeyDown(rowIndex, 'precio', e)}
                    className="w-full !bg-transparent !border-0 !p-1.5 !rounded-none !text-xs !font-black text-blush-palmLeaf outline-none focus:!bg-white"
                  />
                </td>

                {/* FORMA PAGO */}
                <td className="py-0.5 px-1 border-r border-gray-200">
                  <select
                    value={row.forma_pago}
                    onChange={(e) => {
                      const updated = [...excelRows]
                      updated[rowIndex].forma_pago = e.target.value
                      updated[rowIndex].no_transferencia = '' // reset reference
                      setExcelRows(updated)
                    }}
                    className="w-full !bg-transparent !border-0 !p-1.5 !rounded-none !text-xs !font-semibold outline-none text-gray-750 cursor-pointer focus:!bg-white"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Deuna">Deuna</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                  </select>
                </td>

                {/* COMPROBANTE / CÓDIGO */}
                <td className="py-1 px-1.5 border-r border-gray-200">
                  <input
                    type="text"
                    data-row={rowIndex}
                    data-field="no_transferencia"
                    placeholder={row.forma_pago === 'Tarjeta' ? "3 dígs..." : "Opcional..."}
                    maxLength={row.forma_pago === 'Tarjeta' ? 3 : 100}
                    value={row.no_transferencia}
                    onChange={(e) => {
                      const updated = [...excelRows]
                      updated[rowIndex].no_transferencia = row.forma_pago === 'Tarjeta'
                        ? e.target.value.replace(/\D/g, '').slice(0, 3)
                        : e.target.value
                      setExcelRows(updated)
                    }}
                    onKeyDown={(e) => handleGeneralKeyDown(rowIndex, 'no_transferencia', e)}
                    className="w-full !bg-transparent !border-0 !p-1.5 !rounded-none !text-xs !font-semibold outline-none text-gray-700 focus:!bg-white"
                  />
                </td>

                {/* COLABORADORA */}
                <td className="py-0.5 px-1 border-r border-gray-200">
                  <select
                    value={row.personal_id}
                    onChange={(e) => {
                      const updated = [...excelRows]
                      updated[rowIndex].personal_id = e.target.value
                      setExcelRows(updated)
                    }}
                    className="w-full !bg-transparent !border-0 !p-1.5 !rounded-none !text-xs !font-semibold outline-none text-gray-700 cursor-pointer focus:!bg-white"
                  >
                    <option value="">Seleccione...</option>
                    {personal.filter(p => p.activo).map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </td>

                {/* ACCIÓN ELIMINAR FILA */}
                <td className="py-1 px-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(rowIndex)}
                    className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {msg.text && (
        <div className={`p-4 mb-4 rounded-2xl text-xs font-bold ${
          msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Footer controls */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleRegisterExcel}
          disabled={loading}
          className="bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-blush-palmLeaf/15 cursor-pointer"
        >
          <Save size={15} />
          {loading ? 'Registrando...' : 'Registrar Todo'}
        </button>
      </div>
    </div>
  )
}
