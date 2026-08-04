import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Lock, 
  MapPin, 
  Edit3, 
  Save, 
  X, 
  UserCheck, 
  Mail, 
  Database,
  Shield,
  Trash2
} from 'lucide-react'
import { dataService } from '../dataService'

export default function UsuariosTab() {
  const [usuarios, setUsuarios] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  
  // Edit values
  const [editNombre, setEditNombre] = useState('')
  const [editCorreo, setEditCorreo] = useState('')
  const [editRol, setEditRol] = useState('')
  const [editSucursalId, setEditSucursalId] = useState('')
  
  const [msg, setMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const usersData = await dataService.obtenerUsuarios()
      const branchesData = await dataService.getSucursales()
      setUsuarios(usersData)
      setSucursales(branchesData)
    } catch (err) {
      console.error('Error al cargar datos:', err)
      setErrorMsg('⚠️ Error al conectar con el servidor para cargar usuarios.')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (user) => {
    setEditingId(user.id)
    setEditNombre(user.nombre)
    setEditCorreo(user.correo || '')
    setEditRol(user.rol)
    setEditSucursalId(user.sucursal_id || '')
    setMsg('')
    setErrorMsg('')
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (id) => {
    setMsg('')
    setErrorMsg('')
    try {
      const payload = {
        nombre: editNombre.trim(),
        correo: editCorreo.trim() || null,
        rol: editRol,
        sucursal_id: editRol === 'Dueño' ? null : (editSucursalId || null)
      }
      
      await dataService.actualizarUsuario(id, payload)
      setMsg('✅ Usuario actualizado correctamente.')
      setEditingId(null)
      
      const activeUser = dataService.getCurrentUser()
      if (activeUser && activeUser.id === id) {
        const updatedUser = { ...activeUser, ...payload }
        sessionStorage.setItem('blush_current_user', JSON.stringify(updatedUser))
        window.location.reload()
      } else {
        loadData()
      }
    } catch (err) {
      console.error('Error al actualizar usuario:', err)
      setErrorMsg(`⚠️ Error: ${err.message || 'No se pudo actualizar el usuario.'}`)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Shield className="text-blush-palmLeaf" size={22} />
            Gestión de Accesos y Usuarios
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Como Dueño, puedes autorizar roles y asignar sucursales a los usuarios registrados en el sistema.
          </p>
        </div>
      </div>

      {/* Alertas */}
      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-bold rounded-2xl animate-fade-in shadow-sm">
          {msg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-250 text-rose-800 text-xs font-bold rounded-2xl animate-fade-in shadow-sm">
          {errorMsg}
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blush-palmLeaf border-t-transparent" />
            <span className="text-xs font-bold">Cargando personal administrativo...</span>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold text-xs">
            No hay ningún usuario registrado además de ti.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-150 text-[10px] uppercase font-black tracking-wider text-gray-500">
                  <th className="py-4 px-6">Nombre del Usuario</th>
                  <th className="py-4 px-6">Cédula (Usuario)</th>
                  <th className="py-4 px-6">Correo Electrónico</th>
                  <th className="py-4 px-6">Rol de Acceso</th>
                  <th className="py-4 px-6">Sucursal Asignada</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-xs text-gray-600 font-bold">
                {usuarios.map((u) => {
                  const isEditing = editingId === u.id
                  const isSystemOwner = u.username === '1721946067' // La propietaria principal no puede auto-cambiarse el rol por seguridad
                  const assignedBranchName = sucursales.find(s => s.id === u.sucursal_id)?.nombre || 'Todas (Acceso Total)'

                  return (
                    <tr 
                      key={u.id} 
                      className={`transition-colors hover:bg-gray-50/50 ${isEditing ? 'bg-blush-seashell/20' : ''}`}
                    >
                      {/* Nombre */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="bg-blush-seashell/60 p-2 rounded-xl text-blush-palmLeaf border border-blush-khaki/20">
                            <Users size={14} />
                          </div>
                          <div className="flex-grow">
                            {isEditing ? (
                              <input
                                type="text"
                                required
                                value={editNombre}
                                onChange={(e) => setEditNombre(e.target.value)}
                                className="bg-white border border-gray-250 rounded-xl px-2 py-1.5 outline-none font-bold text-gray-700 w-full text-xs"
                              />
                            ) : (
                              <>
                                <span className="block text-gray-800 font-bold">{u.nombre}</span>
                                <span className="block text-[8px] text-gray-400 mt-0.5">Registrado el {new Date(u.creado_en).toLocaleDateString('es-EC')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cédula */}
                      <td className="py-4 px-6 font-mono text-gray-700">{u.username}</td>

                      {/* Correo */}
                      <td className="py-4 px-6">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Mail size={12} className="text-gray-400" />
                            <input
                              type="email"
                              placeholder="correo@ejemplo.com"
                              value={editCorreo}
                              onChange={(e) => setEditCorreo(e.target.value)}
                              className="bg-white border border-gray-250 rounded-xl px-2 py-1.5 outline-none font-bold text-gray-700 w-full text-xs"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-500 font-medium">
                            <Mail size={12} className="opacity-75" />
                            <span>{u.correo || 'N/R'}</span>
                          </div>
                        )}
                      </td>

                      {/* Rol */}
                      <td className="py-4 px-6">
                        {isEditing ? (
                          <select
                            value={editRol}
                            onChange={(e) => setEditRol(e.target.value)}
                            disabled={isSystemOwner}
                            className="bg-white border border-gray-250 rounded-xl px-2 py-1.5 outline-none font-bold text-gray-700"
                          >
                            <option value="Administrador">Administrador</option>
                            <option value="Gerente">Gerente</option>
                            <option value="Dueño">Dueño</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            u.rol === 'Dueño'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : u.rol === 'Gerente'
                              ? 'bg-amber-50 text-amber-800 border-amber-250'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {u.rol}
                          </span>
                        )}
                      </td>

                      {/* Sucursal */}
                      <td className="py-4 px-6">
                        {isEditing ? (
                          editRol === 'Dueño' ? (
                            <span className="text-gray-400 italic font-medium">Acceso Total a todo el sistema</span>
                          ) : (
                            <select
                              value={editSucursalId}
                              onChange={(e) => setEditSucursalId(e.target.value)}
                              className="bg-white border border-gray-250 rounded-xl px-2 py-1.5 outline-none font-bold text-gray-700"
                            >
                              <option value="">Todas las Sucursales</option>
                              {sucursales.map(s => (
                                <option key={s.id} value={s.id}>{s.nombre}</option>
                              ))}
                            </select>
                          )
                        ) : (
                          <div className="flex items-center gap-1 text-gray-700">
                            <MapPin size={12} className="text-blush-palmLeaf" />
                            <span>{u.rol === 'Dueño' ? 'Todas (Acceso Total)' : assignedBranchName}</span>
                          </div>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-6 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => saveEdit(u.id)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 px-2.5 font-bold"
                            >
                              <Save size={13} />
                              Guardar
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 px-2"
                            >
                              <X size={13} />
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(u)}
                            className="p-2 hover:bg-gray-200/50 text-blush-palmLeaf rounded-xl border border-transparent hover:border-gray-200 transition-all cursor-pointer font-bold inline-flex items-center gap-1.5 px-3"
                          >
                            <Edit3 size={13} />
                            Asignar Rol/Sucursal
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
