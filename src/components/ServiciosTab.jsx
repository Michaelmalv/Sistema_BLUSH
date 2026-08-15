import React, { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Edit3, Trash2, Scissors, Award, Clock, Search, X } from 'lucide-react'
import { dataService } from '../dataService'

export default function ServiciosTab({ activeTab }) {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Formulario de Creación
  const [form, setForm] = useState({
    nombre: '',
    precio_base: '',
    duracion_minutos: 30,
    frecuencia_recomendada_dias: ''
  })

  const [editingId, setEditingId] = useState(null)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [serviceToMerge, setServiceToMerge] = useState(null)
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [msg, setMsg] = useState({ type: '', text: '' })

  const loadData = async () => {
    try {
      setLoading(true)
      const s = await dataService.getServicios()
      setServicios(s)
    } catch (err) {
      console.error('Error al cargar servicios:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'servicios') {
      loadData()
    }
  }, [activeTab])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg({ type: '', text: '' })

    try {
      if (!form.nombre) throw new Error('El nombre del servicio es requerido.')
      if (!form.precio_base || Number(form.precio_base) <= 0) throw new Error('El precio base debe ser mayor a 0.')

      const sData = {
        nombre: form.nombre.trim(),
        precio_base: Number(form.precio_base),
        duracion_minutos: Number(form.duracion_minutos),
        frecuencia_recomendada_dias: form.frecuencia_recomendada_dias ? Number(form.frecuencia_recomendada_dias) : null
      }

      if (editingId) {
        await dataService.actualizarServicio(editingId, sData)
        setMsg({ type: 'success', text: '✅ Servicio actualizado con éxito.' })
      } else {
        await dataService.registrarServicio(sData)
        setMsg({ type: 'success', text: '✅ Servicio creado con éxito.' })
      }

      setForm({
        nombre: '',
        precio_base: '',
        duracion_minutos: 30,
        frecuencia_recomendada_dias: ''
      })
      setEditingId(null)
      loadData()
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error al guardar servicio.' })
    }
  }

  const handleEdit = (svc) => {
    setEditingId(svc.id)
    setForm({
      nombre: svc.nombre,
      precio_base: svc.precio_base,
      duracion_minutos: svc.duracion_minutos,
      frecuencia_recomendada_dias: svc.frecuencia_recomendada_dias || ''
    })
  }

  const handleDelete = async (id) => {
    const svc = servicios.find(s => s.id === id)
    if (!svc) return
    if (!window.confirm(`¿Está seguro de que desea eliminar el servicio "${svc.nombre}"? No se podrán registrar nuevas citas con este servicio.`)) return
    try {
      await dataService.eliminarServicio(id)
      setMsg({ type: 'success', text: '🗑️ Servicio eliminado.' })
      loadData()
    } catch (err) {
      setServiceToMerge(svc)
      setMergeTargetId('')
      setShowMergeModal(true)
    }
  }

  const handleMergeSubmit = async (e) => {
    e.preventDefault()
    if (!serviceToMerge || !mergeTargetId) return
    try {
      await dataService.fusionarServicios(serviceToMerge.id, mergeTargetId)
      setMsg({ type: 'success', text: '👍 Servicios fusionados y eliminados correctamente.' })
      setShowMergeModal(false)
      setServiceToMerge(null)
      setMergeTargetId('')
      loadData()
    } catch (err) {
      console.error(err)
      setMsg({ type: 'error', text: 'Ocurrió un error al fusionar los servicios.' })
    }
  }

  const filteredServicios = useMemo(() => {
    return servicios.filter(svc => 
      svc.nombre.toLowerCase().includes(searchQuery.toLowerCase().trim())
    )
  }, [servicios, searchQuery])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulario de Creación (Fijo en el lateral) */}
      <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit">
        <h3 className="text-lg font-bold text-blush-palmLeaf mb-1 flex items-center gap-2">
          <Scissors size={18} />
          Crear Servicio
        </h3>
        <p className="text-xs text-gray-400 mb-6">Administra el catálogo y define los intervalos sugeridos de contacto</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Nombre del Servicio</label>
            <input
              type="text"
              placeholder="Ej. Uñas Acrílicas Esculpidas"
              value={editingId ? '' : form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold outline-none focus:border-blush-palmLeaf focus:bg-white text-gray-700"
              required
              disabled={!!editingId}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Precio Base</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editingId ? '' : form.precio_base}
                onChange={(e) => setForm({ ...form, precio_base: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs font-bold text-blush-palmLeaf outline-none focus:border-blush-palmLeaf focus:bg-white"
                required
                disabled={!!editingId}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Duración (min)</label>
              <input
                type="number"
                min="5"
                value={editingId ? 30 : form.duracion_minutos}
                onChange={(e) => setForm({ ...form, duracion_minutos: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold outline-none focus:border-blush-palmLeaf focus:bg-white text-gray-700"
                required
                disabled={!!editingId}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-800 mb-1">
              Frecuencia Recomendada (días)
            </label>
            <input
              type="number"
              placeholder="Ej. 21 para acrílicas (Opcional)"
              value={editingId ? '' : form.frecuencia_recomendada_dias}
              onChange={(e) => setForm({ ...form, frecuencia_recomendada_dias: e.target.value })}
              className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900 outline-none focus:border-blush-palmLeaf focus:bg-white"
              disabled={!!editingId}
            />
            <p className="text-xxs text-amber-700 mt-1">Define cuántos días deben pasar para contactar al cliente para su mantenimiento.</p>
          </div>

          {!editingId && msg.text && (
            <div className={`p-3 rounded-2xl text-xs font-semibold ${msg.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={!!editingId}
            className={`w-full bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-sm cursor-pointer ${
              editingId ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Crear Servicio
          </button>
        </form>
      </div>

      {/* MODAL DE EDICIÓN FLOTANTE */}
      {editingId && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-tab-active">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-150 relative animate-slide-in my-8 max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-blush-palmLeaf flex items-center gap-2">
                <Scissors size={18} />
                Editar Servicio
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm({ nombre: '', precio_base: '', duracion_minutos: 30, frecuencia_recomendada_dias: '' })
                  setMsg({ type: '', text: '' })
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nombre del Servicio</label>
                <input
                  type="text"
                  placeholder="Ej. Uñas Acrílicas Esculpidas"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold outline-none focus:border-blush-palmLeaf focus:bg-white text-gray-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Precio Base</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.precio_base}
                    onChange={(e) => setForm({ ...form, precio_base: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs font-bold text-blush-palmLeaf outline-none focus:border-blush-palmLeaf focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Duración (min)</label>
                  <input
                    type="number"
                    min="5"
                    value={form.duracion_minutos}
                    onChange={(e) => setForm({ ...form, duracion_minutos: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold outline-none focus:border-blush-palmLeaf focus:bg-white text-gray-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-800 mb-1">
                  Frecuencia Recomendada (días)
                </label>
                <input
                  type="number"
                  placeholder="Ej. 21 para acrílicas (Opcional)"
                  value={form.frecuencia_recomendada_dias}
                  onChange={(e) => setForm({ ...form, frecuencia_recomendada_dias: e.target.value })}
                  className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900 outline-none focus:border-blush-palmLeaf focus:bg-white"
                />
              </div>

              {msg.text && (
                <div className={`p-3 rounded-2xl text-xs font-semibold ${msg.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {msg.text}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null)
                    setForm({ nombre: '', precio_base: '', duracion_minutos: 30, frecuencia_recomendada_dias: '' })
                    setMsg({ type: '', text: '' })
                  }}
                  className="bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Grid del Listado */}
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-blush-palmLeaf flex items-center gap-2">
              <Award size={18} />
              Catálogo de Servicios
            </h3>
            <p className="text-xs text-gray-400">Listado de servicios registrados y sus intervalos de recurrencia</p>
          </div>

          {/* Buscador */}
          <div className="relative md:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar servicio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full !pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:bg-white focus:border-blush-palmLeaf focus:ring-1 focus:ring-blush-palmLeaf outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Cargando catálogo...</div>
        ) : servicios.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400">No hay servicios registrados.</div>
        ) : filteredServicios.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400">No se encontraron servicios que coincidan con la búsqueda.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[500px] pr-2">
            {filteredServicios.map((svc) => (
              <div 
                key={svc.id} 
                className="p-4 rounded-2xl border border-gray-100 bg-gray-50/40 hover:bg-gray-50 transition-luxury flex flex-col justify-between"
              >
                <div>
                  <h4 className="text-sm font-black text-gray-800">{svc.nombre}</h4>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-gray-500 font-semibold">
                      <Clock size={12} /> {svc.duracion_minutos} min
                    </span>
                    {svc.frecuencia_recomendada_dias && (
                      <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold">
                        Cada {svc.frecuencia_recomendada_dias} días
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <div className="text-sm font-black text-blush-palmLeaf">
                    ${Number(svc.precio_base).toFixed(2)}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleEdit(svc)}
                      className="p-1.5 hover:bg-gray-200/50 text-gray-500 hover:text-gray-800 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button 
                      onClick={() => handleDelete(svc.id)}
                      className="p-1.5 hover:bg-rose-100/50 text-rose-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE FUSIÓN FLOTANTE */}
      {showMergeModal && serviceToMerge && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-tab-active">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-150 relative animate-slide-in my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-blush-palmLeaf flex items-center gap-2">
                <Scissors size={18} />
                Fusionar y Eliminar Servicio
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowMergeModal(false)
                  setServiceToMerge(null)
                  setMergeTargetId('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              El servicio <strong className="text-gray-800">"{serviceToMerge.nombre}"</strong> tiene citas registradas.
              Selecciona el servicio correcto con el que deseas unificar el historial de citas antes de eliminarlo:
            </p>

            <form onSubmit={handleMergeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Servicio Destino</label>
                <select
                  value={mergeTargetId}
                  onChange={(e) => setMergeTargetId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold focus:outline-none focus:border-blush-palmLeaf"
                  required
                >
                  <option value="">Selecciona el servicio destino...</option>
                  {servicios
                    .filter(s => s.id !== serviceToMerge.id)
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} (${s.precio_base})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white font-bold py-2 px-4 rounded-xl transition-colors text-xs cursor-pointer"
                >
                  Confirmar Fusión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMergeModal(false)
                    setServiceToMerge(null)
                    setMergeTargetId('')
                  }}
                  className="bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl transition-colors text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
