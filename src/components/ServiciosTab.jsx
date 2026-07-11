import React, { useEffect, useState } from 'react'
import { Plus, Edit3, Trash2, Scissors, Award, Clock } from 'lucide-react'
import { dataService } from '../dataService'

export default function ServiciosTab({ activeTab }) {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)

  // Formulario
  const [form, setForm] = useState({
    nombre: '',
    precio_base: '',
    duracion_minutos: 30,
    frecuencia_recomendada_dias: ''
  })

  const [editingId, setEditingId] = useState(null)
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
    if (!window.confirm('¿Está seguro de que desea eliminar este servicio? No se podrán registrar nuevas citas con este servicio.')) return
    try {
      await dataService.eliminarServicio(id)
      setMsg({ type: 'success', text: '🗑️ Servicio eliminado.' })
      loadData()
    } catch (err) {
      setMsg({ type: 'error', text: 'No se pudo eliminar el servicio (puede estar enlazado a citas históricas).' })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulario */}
      <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit">
        <h3 className="text-lg font-bold text-blush-palmLeaf mb-1 flex items-center gap-2">
          <Scissors size={18} />
          {editingId ? 'Editar Servicio' : 'Crear Servicio'}
        </h3>
        <p className="text-xs text-gray-400 mb-6">Administra el catálogo y define los intervalos sugeridos de contacto</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Nombre del Servicio</label>
            <input
              type="text"
              placeholder="Ej. Uñas Acrílicas Esculpidas"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold"
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
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-blush-palmLeaf"
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
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
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
              className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-sm font-semibold text-amber-900"
            />
            <p className="text-xxs text-amber-700 mt-1">Define cuántos días deben pasar para contactar al cliente para su mantenimiento.</p>
          </div>

          {msg.text && (
            <div className={`p-3 rounded-2xl text-xs font-semibold ${msg.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {msg.text}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-sm"
            >
              {editingId ? 'Actualizar' : 'Crear Servicio'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm({ nombre: '', precio_base: '', duracion_minutos: 30, frecuencia_recomendada_dias: '' })
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Grid del Listado */}
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-blush-palmLeaf flex items-center gap-2">
            <Award size={18} />
            Catálogo de Servicios
          </h3>
          <p className="text-xs text-gray-400">Listado de servicios registrados y sus intervalos de recurrencia</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Cargando catálogo...</div>
        ) : servicios.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400">No hay servicios registrados.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[500px] pr-2">
            {servicios.map((svc) => (
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
    </div>
  )
}
