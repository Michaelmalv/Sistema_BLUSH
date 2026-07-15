import React, { useEffect, useState } from 'react'
import { Search, Phone, Mail, UserPlus, Users, BellRing, ExternalLink, Cake, Edit3, Trash2, Download } from 'lucide-react'
import { dataService } from '../dataService'
import * as XLSX from 'xlsx-js-style'
import { exportExcelJS } from '../excelExporter'

export default function ClientesTab({ activeTab }) {
  const [clientes, setClientes] = useState([])
  const [recontactar, setRecontactar] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)

  // Formulario de Cliente
  const [form, setForm] = useState({
    nombre: '',
    cedula: '',
    celular: '',
    correo: '',
    medio_contacto: 'WhatsApp',
    medio_contacto_otro: '',
    fecha_nacimiento: ''
  })

  const [msg, setMsg] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      const c = await dataService.getClientes()
      setClientes(c)
    } catch (err) {
      console.error('Error al cargar clientes CRM:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'crm') {
      loadData()
    }
  }, [activeTab])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg('')

    try {
      const nombreLimpio = form.nombre.trim()
      if (!nombreLimpio) throw new Error('El nombre es obligatorio.')
      
      if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(nombreLimpio)) {
        throw new Error('El nombre solo debe contener letras y espacios.');
      }

      const cedulaLimpia = form.cedula.trim()
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

      const celularLimpia = form.celular.trim()
      if (celularLimpia) {
        if (/\D/.test(celularLimpia)) {
          throw new Error('El celular solo debe contener números.');
        }
        if (celularLimpia.length !== 10) {
          throw new Error('El celular debe tener exactamente 10 dígitos.');
        }
      }

      if (form.fecha_nacimiento) {
        const birthYear = new Date(form.fecha_nacimiento + 'T00:00:00').getFullYear();
        const currentYear = new Date().getFullYear();
        if (birthYear > currentYear) {
          throw new Error('El año de nacimiento no puede ser mayor al año actual.');
        }
      }

      const clientData = {
        nombre: nombreLimpio,
        cedula: cedulaLimpia || null,
        celular: celularLimpia || null,
        correo: form.correo.trim() || null,
        medio_contacto: form.medio_contacto === 'Otro' ? (form.medio_contacto_otro.trim() || 'Otro') : form.medio_contacto,
        fecha_nacimiento: form.fecha_nacimiento || null
      }

      if (editingId) {
        await dataService.actualizarCliente(editingId, clientData)
        setMsg('✅ Cliente actualizado con éxito.')
      } else {
        await dataService.registrarCliente(clientData)
        setMsg('✅ Cliente registrado con éxito.')
      }

      setForm({ nombre: '', cedula: '', celular: '', correo: '', medio_contacto: 'WhatsApp', medio_contacto_otro: '', fecha_nacimiento: '' })
      setEditingId(null)
      loadData()
    } catch (err) {
      setMsg(`⚠️ ${err.message}`)
    }
  }

  const handleEdit = (c) => {
    setEditingId(c.id)
    const presetMedios = ['WhatsApp', 'Instagram', 'Facebook', 'TikTok', 'Recomendación']
    const isPreset = presetMedios.includes(c.medio_contacto)
    
    setForm({
      nombre: c.nombre || '',
      cedula: c.cedula || '',
      celular: c.celular || '',
      correo: c.correo || '',
      medio_contacto: isPreset ? c.medio_contacto : 'Otro',
      medio_contacto_otro: isPreset ? '' : (c.medio_contacto || ''),
      fecha_nacimiento: c.fecha_nacimiento || ''
    })
    setMsg('')
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente? Sus citas históricas no se borrarán pero quedarán desasociadas.')) {
      try {
        await dataService.eliminarCliente(id)
        setMsg('✅ Cliente eliminado con éxito.')
        loadData()
      } catch (err) {
        setMsg(`⚠️ Error al eliminar cliente: ${err.message}`)
      }
    }
  }

  const handleExportExcel = async () => {
    try {
      const makeCell = (val, type, style = {}) => {
        const cell = { v: val, t: type }
        cell.s = {
          font: { name: 'Segoe UI', size: 9.5, ...style.font },
          alignment: { vertical: 'middle', ...style.alignment },
          fill: style.fill || undefined,
          border: style.border || undefined
        }
        return cell
      }

      const baseFont = { name: 'Segoe UI', size: 9.5 }
      const headerStyle = {
        font: { name: 'Segoe UI', size: 10, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '748843' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { rgb: '748843' } },
          bottom: { style: 'thin', color: { rgb: '748843' } },
          left: { style: 'thin', color: { rgb: '748843' } },
          right: { style: 'thin', color: { rgb: '748843' } }
        }
      }
      
      const tableBorder = {
        top: { style: 'thin', color: { rgb: 'D1D5DB' } },
        bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
        left: { style: 'thin', color: { rgb: 'D1D5DB' } },
        right: { style: 'thin', color: { rgb: 'D1D5DB' } }
      }

      const cellStyleLeft = { font: baseFont, alignment: { horizontal: 'left', vertical: 'middle' }, border: tableBorder }
      const cellStyleCenter = { font: baseFont, alignment: { horizontal: 'center', vertical: 'middle' }, border: tableBorder }

      const ws = {}
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: filteredClientes.length + 3, c: 5 } })
      
      ws['!cols'] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 20 }
      ]

      ws['!rows'] = [
        { hpt: 45 },
        { hpt: 20 },
        { hpt: 25 }
      ]

      ws['A1'] = makeCell('DIRECTORIO DE CLIENTES - BLUSH BEAUTY STUDIO', 's', {
        font: { name: 'Playfair Display', size: 14, bold: true, color: { rgb: '748843' } },
        alignment: { horizontal: 'left', vertical: 'middle' }
      })
      ws['A2'] = makeCell(`Generado el: ${new Date().toLocaleDateString()} | Total registros: ${filteredClientes.length} clientes`, 's', {
        font: { name: 'Segoe UI', size: 9, italic: true, color: { rgb: '6B7280' } }
      })

      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }
      ]

      const headers = ['Nombre Completo', 'Cédula', 'Celular', 'Correo Electrónico', 'Canal de Contacto', 'Fecha de Nacimiento']
      headers.forEach((h, cIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: 2, c: cIdx })
        ws[cellRef] = makeCell(h, 's', headerStyle)
      })

      filteredClientes.forEach((client, rIdx) => {
        const r = rIdx + 3
        ws[XLSX.utils.encode_cell({ r, c: 0 })] = makeCell(client.nombre, 's', cellStyleLeft)
        ws[XLSX.utils.encode_cell({ r, c: 1 })] = makeCell(client.cedula || 'N/A', 's', cellStyleCenter)
        ws[XLSX.utils.encode_cell({ r, c: 2 })] = makeCell(client.celular || 'N/A', 's', cellStyleCenter)
        ws[XLSX.utils.encode_cell({ r, c: 3 })] = makeCell(client.correo || 'N/A', 's', cellStyleLeft)
        ws[XLSX.utils.encode_cell({ r, c: 4 })] = makeCell(client.medio_contacto || 'N/A', 's', cellStyleCenter)
        ws[XLSX.utils.encode_cell({ r, c: 5 })] = makeCell(client.fecha_nacimiento || 'N/A', 's', cellStyleCenter)
      })

      const wb = {
        SheetNames: ['Clientes'],
        Sheets: { 'Clientes': ws }
      }

      await exportExcelJS(wb, `Clientes_Blush_${new Date().toISOString().split('T')[0]}.xlsx`, { sheetName: 'Clientes', col: 5, row: 0 })
    } catch (err) {
      console.error('Error al exportar clientes:', err)
      alert('No se pudo exportar la lista de clientes.')
    }
  }

  // Filtrado de clientes
  const filteredClientes = clientes.filter(c => {
    const term = search.toLowerCase()
    return (
      c.nombre.toLowerCase().includes(term) ||
      (c.cedula && c.cedula.includes(term)) ||
      (c.correo && c.correo.toLowerCase().includes(term))
    )
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna Izquierda: Registro/Edición */}
      <div className="lg:col-span-1">
        {/* Registrar/Editar Cliente */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-blush-palmLeaf mb-1 flex items-center gap-2">
            <UserPlus size={18} />
            {editingId ? 'Editar Ficha de Cliente' : 'Crear Ficha de Cliente'}
          </h3>
          <p className="text-xs text-gray-400 mb-6">
            {editingId ? 'Modifica los datos de la ficha del cliente' : 'Agrega una nueva ficha de cliente en el directorio de Blush'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Nombre Completo</label>
              <input
                type="text"
                placeholder="Nombre y Apellidos"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Cédula</label>
              <input
                type="text"
                placeholder="Cédula de identidad"
                value={form.cedula}
                onChange={(e) => setForm({ ...form, cedula: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Celular</label>
                <input
                  type="text"
                  placeholder="Ej. 0987654321"
                  value={form.celular}
                  onChange={(e) => setForm({ ...form, celular: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:border-blush-palmLeaf outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">¿Cómo nos conoció?</label>
                <select
                  value={form.medio_contacto}
                  onChange={(e) => setForm({ ...form, medio_contacto: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blush-palmLeaf outline-none"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Recomendación">Recomendación</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            {form.medio_contacto === 'Otro' && (
              <div className="animate-slide-in">
                <label className="block text-xs font-bold text-gray-500 mb-1">Especificar por dónde nos conoció</label>
                <input
                  type="text"
                  placeholder="Ej. Rótulo, Volante, Evento..."
                  value={form.medio_contacto_otro}
                  onChange={(e) => setForm({ ...form, medio_contacto_otro: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:border-blush-palmLeaf outline-none"
                  required
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blush-palmLeaf outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Cumpleaños</label>
                <input
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blush-palmLeaf outline-none"
                />
              </div>
            </div>

            {msg && <div className="p-2 bg-gray-50 border border-gray-100 text-xs rounded-xl font-bold">{msg}</div>}

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm cursor-pointer"
              >
                {editingId ? 'Guardar Cambios' : 'Registrar Cliente'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null)
                    setForm({ nombre: '', cedula: '', celular: '', correo: '', medio_contacto: 'WhatsApp', medio_contacto_otro: '', fecha_nacimiento: '' })
                    setMsg('')
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Columna Derecha: Directorio de Clientes */}
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-blush-palmLeaf flex items-center gap-2">
              <Users size={18} />
              Directorio de Clientes
            </h3>
            <p className="text-xs text-gray-400">Total registrados: {clientes.length} clientes</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Botón Exportar */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
              title="Exportar a Excel"
            >
              <Download size={14} />
              Exportar Excel
            </button>

            {/* Barra de búsqueda */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full !pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Cargando directorio...</div>
        ) : filteredClientes.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Ningún cliente coincide con la búsqueda.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[600px] pr-2">
            {filteredClientes.map((c) => (
              <div 
                key={c.id} 
                className="p-4 bg-gray-50/40 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-luxury flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">{c.nombre}</h4>
                      <div className="text-xxs text-gray-400 mt-0.5">Cédula: {c.cedula || 'N/A'}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(c)}
                        className="p-1.5 hover:bg-gray-200/50 rounded-lg text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                        title="Editar Cliente"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar Cliente"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-gray-400" />
                    <span className="font-semibold">{c.celular || 'Sin celular'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-gray-400" />
                    <span className="truncate">{c.correo || 'Sin correo'}</span>
                  </div>
                  {c.fecha_nacimiento && (
                    <div className="flex items-center gap-2 bg-amber-50/70 text-amber-800 border border-amber-100 px-2.5 py-1 rounded-xl w-fit">
                      <Cake size={13} className="text-amber-600 alert-pulse" />
                      <span className="font-bold text-[10px]">
                        Cumpleaños: {new Date(c.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-gray-100/50">
                    <span className="text-xxs text-gray-400">Canal de Contacto:</span>
                    <span className="text-xxs bg-blush-olivine/20 text-blush-palmLeaf px-2 py-0.5 rounded-full font-bold">
                      {c.medio_contacto}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
