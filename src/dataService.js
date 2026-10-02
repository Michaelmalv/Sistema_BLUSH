import { supabase, isSupabaseConfigured as originalIsSupabaseConfigured } from './supabaseClient'

let isSupabaseConfigured = originalIsSupabaseConfigured;

const updateSupabaseConfigState = () => {
  const isDemo = sessionStorage.getItem('blush_demo_mode') === 'true'
  isSupabaseConfigured = isDemo ? false : originalIsSupabaseConfigured
}

// Inicializar el estado al cargar la app
updateSupabaseConfigState();


// ============================================================================
// DATOS DE PRUEBA (MOCK DATA) PARA MODO LOCAL/DEMO
// ============================================================================

const MOCK_PERSONAL = [
  { id: 'p1', nombre: 'Pamela', cedula: '1711111111', cargo: 'Manicurista', activo: true },
  { id: 'p2', nombre: 'Sofia', cedula: '1722222222', cargo: 'Manicurista', activo: true },
  { id: 'p3', nombre: 'Roxana', cedula: '1733333333', cargo: 'Manicurista', activo: true },
  { id: 'p4', nombre: 'Cecilia', cedula: '1744444444', cargo: 'Manicurista', activo: true },
  { id: 'p5', nombre: 'Silvia', cedula: '1755555555', cargo: 'Manicurista', activo: true },
  { id: 'p6', nombre: 'Liz', cedula: '1766666666', cargo: 'Manicurista', activo: true },
]

const MOCK_SERVICIOS = [
  { id: '11111111-1111-1111-1111-111111111111', nombre: 'Baño de acrílico', precio_base: 35.00, duracion_minutos: 60, frecuencia_recomendada_dias: 21 },
  { id: '22222222-2222-2222-2222-222222222222', nombre: 'Nivelación Rubber', precio_base: 25.00, duracion_minutos: 45, frecuencia_recomendada_dias: 21 },
  { id: '33333333-3333-3333-3333-333333333333', nombre: 'Pedicura tradicional', precio_base: 15.00, duracion_minutos: 30, frecuencia_recomendada_dias: 30 },
  { id: 's4', nombre: 'Retoque de acrílico', precio_base: 20.00, duracion_minutos: 45, frecuencia_recomendada_dias: 21 },
  { id: 's5', nombre: 'Keratina', precio_base: 90.00, duracion_minutos: 120, frecuencia_recomendada_dias: 90 },
  { id: 's6', nombre: 'Cejas HD', precio_base: 12.00, duracion_minutos: 20, frecuencia_recomendada_dias: 15 },
]

const MOCK_CLIENTES = [
  { id: 'c1', nombre: 'Mayra Lojano', cedula: '1723456789', celular: '0987654321', correo: 'mayra@example.com', medio_contacto: 'WhatsApp', fecha_nacimiento: '1995-04-12' },
  { id: 'c2', nombre: 'Carla Poveda', cedula: '1712345678', celular: '0998877665', correo: 'carla@example.com', medio_contacto: 'Instagram', fecha_nacimiento: '1992-09-24' },
  { id: 'c3', nombre: 'Angelita Flores', cedula: '1709876543', celular: '0988776655', correo: 'angelita@example.com', medio_contacto: 'WhatsApp', fecha_nacimiento: '1988-12-05' },
  { id: 'c4', nombre: 'Carmen Lugo', cedula: '1755443322', celular: '0977665544', correo: 'carmen@example.com', medio_contacto: 'Recomendación', fecha_nacimiento: '1990-06-25' },
  { id: 'c5', nombre: 'Pamela Armendariz', cedula: '1788990011', celular: '0955443322', correo: 'pamela.a@example.com', medio_contacto: 'WhatsApp', fecha_nacimiento: '1996-10-31' },
]

const MOCK_CITAS = [
  { id: 'v1', cliente_id: 'c1', servicio_id: '11111111-1111-1111-1111-111111111111', personal_id: 'p1', fecha_hora: '2026-06-01T10:00:00Z', valor_pagado: 35.00, forma_pago: 'Deuna', no_transferencia: 'REF998877', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'v2', cliente_id: 'c2', servicio_id: '22222222-2222-2222-2222-222222222222', personal_id: 'p2', fecha_hora: '2026-06-15T14:30:00Z', valor_pagado: 25.00, forma_pago: 'Efectivo', no_transferencia: null, sucursal_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'v3', cliente_id: 'c3', servicio_id: '33333333-3333-3333-3333-333333333333', personal_id: 'p3', fecha_hora: '2026-05-20T09:00:00Z', valor_pagado: 15.00, forma_pago: 'Transferencia', no_transferencia: 'TX123456', sucursal_id: '33333333-3333-3333-3333-333333333333' },
  { id: 'v4', cliente_id: 'c4', servicio_id: 's5', personal_id: 'p4', fecha_hora: '2026-04-10T16:00:00Z', valor_pagado: 90.00, forma_pago: 'Tarjeta', no_transferencia: null, sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'v5', cliente_id: 'c5', servicio_id: 's6', personal_id: 'p5', fecha_hora: '2026-06-10T11:00:00Z', valor_pagado: 12.00, forma_pago: 'Deuna', no_transferencia: 'REF112233', sucursal_id: '22222222-2222-2222-2222-222222222222' },
]

const MOCK_GASTOS = [
  { id: 'g1', fecha: '2026-06-05', factura: 'FAC-001', cantidad: 10, concepto: 'Guantes de nitrilo', categoria: 'Insumos', valor_unitario: 0.50, total: 5.00, forma_pago: 'Efectivo', cuenta: 'Caja Principal', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'g2', fecha: '2026-06-10', factura: 'FAC-992', cantidad: 5, concepto: 'Pinceles de acrílico', categoria: 'Insumos', valor_unitario: 4.50, total: 22.50, forma_pago: 'Deuna', cuenta: 'Cuenta Corriente', sucursal_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'g3', fecha: '2026-06-01', factura: 'ARRIENDO-JUN', cantidad: 1, concepto: 'Arriendo del Local Blush', categoria: 'Alquiler', valor_unitario: 350.00, total: 350.00, forma_pago: 'Transferencia', cuenta: 'Cuenta Corriente', sucursal_id: '11111111-1111-1111-1111-111111111111' },
]

const MOCK_PRODUCTOS = [
  { id: '4591ea37-076d-47b7-9e83-f839900c8d05', nombre: 'Esmaltes Gel Pro', descripcion: 'Esmaltes de alta duración', tipo: 'insumo', stock_actual: 12, stock_minimo: 4, precio_venta: null, proveedor: 'OPI Distribuidor', proveedor_ruc: '1792938475001', precio_costo: 3.22, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '77beedbf-c3e1-4451-8a77-d3c08dbb6f22', nombre: 'Removedor de acrílico premium', descripcion: 'Líquido removedor rápido', tipo: 'insumo', stock_actual: 3, stock_minimo: 4, precio_venta: null, proveedor: 'Belleza Total S.A.', proveedor_ruc: '1792223334001', precio_costo: 2.09, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'fa32a9c4-c967-4676-8f95-8cd199ed6a49', nombre: 'Aceite de cutícula coco 15ml', descripcion: 'Para reventa al cliente', tipo: 'reventa', stock_actual: 8, stock_minimo: 4, precio_venta: 7.5, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.74, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'eaa180eb-d7e7-4cc7-89a7-85699cb7ffb8', nombre: 'mascarillas facial', descripcion: 'Insumo para mascarillas facial', tipo: 'insumo', stock_actual: 50, stock_minimo: 4, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.22, fecha_compra: '2026-01-28', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '64609f40-8675-48b8-8567-ac015c5b5e32', nombre: 'lamparas', descripcion: 'mesa manicura', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 10.87, fecha_compra: '2026-04-28', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'b358a600-59fd-4322-86c6-457ae5809c75', nombre: 'drill', descripcion: 'lima electrica', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 29.74, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '3d69ec16-879f-46e8-ab2e-82fa6cc67a4a', nombre: 'mascara ploma', descripcion: 'Insumo para mascara ploma', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.80, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '2af3b204-6658-4dc5-8e90-7b33db12cd33', nombre: 'palos con algodón', descripcion: 'limpiar bordes', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 6.52, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'b710d547-206f-44c9-8c00-0a04a8d5c958', nombre: 'cepillos de pies', descripcion: 'cepillos de pies', tipo: 'insumo', stock_actual: 22, stock_minimo: 22, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.04, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '1a2f4ab5-64ac-4cbe-9387-8894ed1aa5e5', nombre: 'limas  100/180', descripcion: 'limas de uñas', tipo: 'insumo', stock_actual: 22, stock_minimo: 22, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.70, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '088a6f3d-5d24-428f-9e96-5b7a2c5f6b2d', nombre: 'limas 100/240', descripcion: 'limas de uñas', tipo: 'insumo', stock_actual: 18, stock_minimo: 18, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.70, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'bd74d780-560a-40ce-8a72-563c3d8c35f6', nombre: 'lima 100/240 ESPONGI', descripcion: 'limas de uñas', tipo: 'insumo', stock_actual: 4, stock_minimo: 4, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.70, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
]

const MOCK_SUCURSALES = [
  { id: '11111111-1111-1111-1111-111111111111', nombre: 'Matriz Central', direccion: 'Av. de los Granados y Av. Eloy Alfaro' },
  { id: '22222222-2222-2222-2222-222222222222', nombre: 'Sucursal Norte', direccion: 'Av. El Inca y Amazonas' },
  { id: '33333333-3333-3333-3333-333333333333', nombre: 'Sucursal Sur', direccion: 'Av. Maldonado y El Recreo' }
]

const MOCK_USUARIOS = [
  { id: 'u1', username: '1721946067', password: 'Dannabonita2026', nombre: 'Propietaria General', rol: 'Dueño', sucursal_id: null },
  { id: 'u2', username: '1707963227', password: 'Dannabonita2026', nombre: 'Administradora General', rol: 'Administrador', sucursal_id: null }
]

// Inicializar almacenamiento local si no existe para el modo demo
const initLocalStorage = () => {
  if (!localStorage.getItem('blush_personal')) localStorage.setItem('blush_personal', JSON.stringify(MOCK_PERSONAL))
  if (!localStorage.getItem('blush_servicios')) localStorage.setItem('blush_servicios', JSON.stringify(MOCK_SERVICIOS))
  if (!localStorage.getItem('blush_clientes')) localStorage.setItem('blush_clientes', JSON.stringify(MOCK_CLIENTES))
  if (!localStorage.getItem('blush_citas')) localStorage.setItem('blush_citas', JSON.stringify(MOCK_CITAS))
  if (!localStorage.getItem('blush_gastos')) localStorage.setItem('blush_gastos', JSON.stringify(MOCK_GASTOS))
  const storedProds = localStorage.getItem('blush_productos')
  if (!storedProds || JSON.parse(storedProds).length <= 4) {
    localStorage.setItem('blush_productos', JSON.stringify(MOCK_PRODUCTOS))
  }
  if (!localStorage.getItem('blush_sucursales')) localStorage.setItem('blush_sucursales', JSON.stringify(MOCK_SUCURSALES))
  localStorage.setItem('blush_usuarios', JSON.stringify(MOCK_USUARIOS))
  if (!localStorage.getItem('blush_reposiciones')) localStorage.setItem('blush_reposiciones', JSON.stringify([]))
}
initLocalStorage()

const getLocal = (key) => JSON.parse(localStorage.getItem(key))
const setLocal = (key, data) => localStorage.setItem(key, JSON.stringify(data))

// ============================================================================
// CONEXIÓN INTEGRAL - DB O LOCAL STORAGE
// ============================================================================

export const dataService = {
  // In-memory cache with TTL to guarantee instant multi-user synchronization
  _cache: {},
  _cacheTimestamps: {},
  _cacheTTL: 3500, // 3.5 segundos de vida máxima para llamadas simultáneas rápidas
  _realtimeChannel: null,

  isCacheValid(key) {
    if (!this._cache[key]) return false
    const ts = this._cacheTimestamps[key]
    if (!ts) return false
    return (Date.now() - ts) < this._cacheTTL
  },

  setCache(key, data) {
    this._cache[key] = data
    this._cacheTimestamps[key] = Date.now()
  },

  clearCache(key) {
    if (key) {
      Object.keys(this._cache).forEach(k => {
        if (k === key || k.startsWith(key + '_')) {
          delete this._cache[k]
          delete this._cacheTimestamps[k]
        }
      })
    } else {
      this._cache = {}
      this._cacheTimestamps = {}
    }
  },

  initRealtimeSync(onUpdateCallback) {
    if (!isSupabaseConfigured || !supabase) return null
    if (this._realtimeChannel) return this._realtimeChannel
    try {
      this._realtimeChannel = supabase.channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
          this.clearCache()
          try {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('blush_db_update', { detail: payload }))
            }
          } catch (e) {}
          if (onUpdateCallback) onUpdateCallback(payload)
        })
        .subscribe()
      return this._realtimeChannel
    } catch (err) {
      console.warn('Realtime subscription no disponible:', err)
      return null
    }
  },

  unsubscribeRealtime(channel) {
    try {
      if (channel && supabase) {
        supabase.removeChannel(channel)
      }
      this._realtimeChannel = null
    } catch (e) {}
  },

  getEffectiveBranchId(explicitBranchId = null) {
    if (explicitBranchId && explicitBranchId !== 'todas') return explicitBranchId
    const selected = this.getSelectedBranchId()
    if (selected && selected !== 'todas') return selected
    const user = this.getCurrentUser()
    if (user && user.sucursal_id && user.sucursal_id !== 'todas') return user.sucursal_id
    return '11111111-1111-1111-1111-111111111111' // Matriz Central por defecto
  },

  isDemoMode() {
    return sessionStorage.getItem('blush_demo_mode') === 'true'
  },

  setDemoMode(active) {
    sessionStorage.setItem('blush_demo_mode', active ? 'true' : 'false')
    updateSupabaseConfigState()
    this.clearCache()
  },

  restablecerBaseDemo() {
    localStorage.removeItem('blush_personal')
    localStorage.removeItem('blush_servicios')
    localStorage.removeItem('blush_clientes')
    localStorage.removeItem('blush_citas')
    localStorage.removeItem('blush_gastos')
    localStorage.removeItem('blush_productos')
    localStorage.removeItem('blush_sucursales')
    localStorage.removeItem('blush_usuarios')
    localStorage.removeItem('blush_reposiciones')
    initLocalStorage()
    this.clearCache()
  },

  // --- PERSONAL ---
  async getPersonal(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('personal')) return this._cache['personal']
    let list = []
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('personal').select('*').order('nombre')
      if (error) throw error
      list = data || []
    } else {
      list = getLocal('blush_personal') || []
    }
    try {
      const sueldosMap = JSON.parse(localStorage.getItem('blush_sueldos_base_map') || '{}')
      list = list.map(p => ({
        ...p,
        sueldo_base: p.sueldo_base !== undefined && p.sueldo_base !== null 
          ? Number(p.sueldo_base) 
          : (sueldosMap[p.id] !== undefined ? Number(sueldosMap[p.id]) : 0)
      }))
    } catch (e) {}
    this.setCache('personal', list)
    return list
  },

  async registrarPersonal(persona) {
    try {
      const sueldoBaseNum = Number(persona.sueldo_base || 0)
      if (isSupabaseConfigured) {
        let resData = null
        try {
          const { data, error } = await supabase.from('personal').insert([persona]).select()
          if (error) throw error
          resData = data[0]
        } catch (supaErr) {
          if (supaErr?.message?.includes('sueldo_base') || supaErr?.code === '42703') {
            const { sueldo_base, ...rest } = persona
            const { data, error } = await supabase.from('personal').insert([rest]).select()
            if (error) throw error
            resData = { ...data[0], sueldo_base: sueldoBaseNum }
          } else {
            throw supaErr
          }
        }
        try {
          const map = JSON.parse(localStorage.getItem('blush_sueldos_base_map') || '{}')
          map[resData.id] = sueldoBaseNum
          localStorage.setItem('blush_sueldos_base_map', JSON.stringify(map))
        } catch (e) {}
        this.clearCache('personal')
        return resData
      }
      const list = getLocal('blush_personal') || []
      if (list.some(p => p.nombre.toLowerCase().trim() === persona.nombre.toLowerCase().trim())) {
        throw new Error('duplicate key value violates unique constraint "personal_nombre_key"')
      }
      const nuevo = { ...persona, id: 'p_' + Date.now(), sueldo_base: sueldoBaseNum }
      list.push(nuevo)
      setLocal('blush_personal', list)
      try {
        const map = JSON.parse(localStorage.getItem('blush_sueldos_base_map') || '{}')
        map[nuevo.id] = sueldoBaseNum
        localStorage.setItem('blush_sueldos_base_map', JSON.stringify(map))
      } catch (e) {}
      this.clearCache('personal')
      return nuevo
    } catch (err) {
      throw this.traducirErrorPostgres(err)
    }
  },

  async actualizarPersonal(id, persona) {
    try {
      if (persona.sueldo_base !== undefined) {
        try {
          const map = JSON.parse(localStorage.getItem('blush_sueldos_base_map') || '{}')
          map[id] = Number(persona.sueldo_base || 0)
          localStorage.setItem('blush_sueldos_base_map', JSON.stringify(map))
        } catch (e) {}
      }
      if (isSupabaseConfigured) {
        let resData = null
        try {
          const { data, error } = await supabase.from('personal').update(persona).eq('id', id).select()
          if (error) throw error
          resData = data[0]
        } catch (supaErr) {
          if (supaErr?.message?.includes('sueldo_base') || supaErr?.code === '42703') {
            const { sueldo_base, ...rest } = persona
            const { data, error } = await supabase.from('personal').update(rest).eq('id', id).select()
            if (error) throw error
            resData = { ...data[0], sueldo_base: Number(sueldo_base || 0) }
          } else {
            throw supaErr
          }
        }
        this.clearCache('personal')
        return resData
      }
      const list = getLocal('blush_personal') || []
      if (persona.nombre && list.some(p => p.id !== id && p.nombre.toLowerCase().trim() === persona.nombre.toLowerCase().trim())) {
        throw new Error('duplicate key value violates unique constraint "personal_nombre_key"')
      }
      const index = list.findIndex(i => i.id === id)
      if (index !== -1) {
        list[index] = { ...list[index], ...persona }
        setLocal('blush_personal', list)
        this.clearCache('personal')
        return list[index]
      }
    } catch (err) {
      throw this.traducirErrorPostgres(err)
    }
  },

  resolverNombreEstandar(nombre) {
    if (!nombre) return 'Sin asignar'
    const n = nombre.toLowerCase().trim()
    if (n.startsWith('sof') || n.startsWith('sop')) return 'Sofia'
    if (n.startsWith('liz')) return 'Liz'
    if (n.startsWith('pam') || n === 'pame') return 'Pamela'
    if (n.startsWith('rox') || n === 'roxy') return 'Roxana'
    if (n.startsWith('cec') || n === 'ceci') return 'Cecilia'
    if (n.startsWith('silv') || n === 'silvy') return 'Silvia'
    return nombre.charAt(0).toUpperCase() + nombre.slice(1)
  },

  // --- SERVICIOS ---
  async getServicios(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('servicios')) return this._cache['servicios']
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('servicios').select('*').order('nombre')
      if (error) throw error
      this.setCache('servicios', data)
      return data
    }
    const local = getLocal('blush_servicios') || MOCK_SERVICIOS
    this.setCache('servicios', local)
    return local
  },

  async registrarServicio(svc) {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('servicios').insert([svc]).select()
        if (error) throw error
        this.clearCache('servicios')
        return data[0]
      }
      const list = getLocal('blush_servicios') || []
      if (list.some(s => s.nombre.toLowerCase().trim() === svc.nombre.toLowerCase().trim())) {
        throw new Error('duplicate key value violates unique constraint "servicios_nombre_key"')
      }
      const nuevo = { ...svc, id: 's_' + Date.now() }
      list.push(nuevo)
      setLocal('blush_servicios', list)
      this.clearCache('servicios')
      return nuevo
    } catch (err) {
      throw this.traducirErrorPostgres(err)
    }
  },

  async actualizarServicio(id, svc) {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('servicios').update(svc).eq('id', id).select()
        if (error) throw error
        this.clearCache('servicios')
        return data[0]
      }
      const list = getLocal('blush_servicios') || []
      if (svc.nombre && list.some(s => s.id !== id && s.nombre.toLowerCase().trim() === svc.nombre.toLowerCase().trim())) {
        throw new Error('duplicate key value violates unique constraint "servicios_nombre_key"')
      }
      const index = list.findIndex(i => i.id === id)
      if (index !== -1) {
        list[index] = { ...list[index], ...svc }
        setLocal('blush_servicios', list)
        this.clearCache('servicios')
        return list[index]
      }
    } catch (err) {
      throw this.traducirErrorPostgres(err)
    }
  },

  async eliminarServicio(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('servicios').delete().eq('id', id)
      if (error) throw error
      this.clearCache('servicios')
      return true
    }
    const list = getLocal('blush_servicios') || []
    const filtered = list.filter(i => i.id !== id)
    setLocal('blush_servicios', filtered)
    this.clearCache('servicios')
    return true
  },

  async fusionarServicios(idOrigen, idDestino) {
    if (isSupabaseConfigured) {
      const { error: updateError } = await supabase
        .from('citas_ventas')
        .update({ servicio_id: idDestino })
        .eq('servicio_id', idOrigen)
      if (updateError) throw updateError

      const { error: deleteError } = await supabase
        .from('servicios')
        .delete()
        .eq('id', idOrigen)
      if (deleteError) throw deleteError

      this.clearCache('servicios')
      this.clearCache('citas')
      return true
    }
    const citas = getLocal('blush_citas') || []
    const updatedCitas = citas.map(c => c.servicio_id === idOrigen ? { ...c, servicio_id: idDestino } : c)
    setLocal('blush_citas', updatedCitas)
    const servicios = getLocal('blush_servicios') || []
    const filteredSvc = servicios.filter(s => s.id !== idOrigen)
    setLocal('blush_servicios', filteredSvc)
    this.clearCache('servicios')
    this.clearCache('citas')
    return true
  },

  // Registrar pago de cita con soporte para UUIDs precisos
  async registrarPagoCita(clienteId, fechaHora, formaPago, valorTotal, noTransferencia, idsArray = null) {
    if (isSupabaseConfigured) {
      let group = []
      
      // 1. Si se pasan IDs exactos de citas_ventas, usarlos directamente
      if (idsArray && Array.isArray(idsArray) && idsArray.length > 0) {
        const { data, error } = await supabase
          .from('citas_ventas')
          .select('id, servicio_id, valor_pagado')
          .in('id', idsArray)
        if (error) throw error
        group = data || []
      }

      // 2. Si no se encontró por IDs o no se pasaron, buscar por cliente_id y fecha_hora
      if (group.length === 0 && clienteId && fechaHora) {
        const { data, error: fetchError } = await supabase
          .from('citas_ventas')
          .select('id, servicio_id, valor_pagado')
          .eq('cliente_id', clienteId)
          .eq('fecha_hora', fechaHora)
        if (fetchError) throw fetchError
        group = data || []
      }

      // 3. Tolerancia de ventana de tiempo por posible diferencia de zona horaria ISO
      if (group.length === 0 && clienteId && fechaHora) {
        const d = new Date(fechaHora)
        if (!isNaN(d.getTime())) {
          const start = new Date(d.getTime() - 120000).toISOString()
          const end = new Date(d.getTime() + 120000).toISOString()
          const { data } = await supabase
            .from('citas_ventas')
            .select('id, servicio_id, valor_pagado')
            .eq('cliente_id', clienteId)
            .gte('fecha_hora', start)
            .lte('fecha_hora', end)
          group = data || []
        }
      }

      if (group.length === 0) {
        console.warn('No se encontraron registros de citas para actualizar el pago.')
        return false
      }

      const { data: services, error: svcError } = await supabase.from('servicios').select('id, precio_base')
      if (svcError) throw svcError
      const svcMap = new Map((services || []).map(s => [s.id, s.precio_base]))

      const totalBase = group.reduce((sum, item) => sum + (svcMap.get(item.servicio_id) || 0), 0)

      for (const item of group) {
        const basePrice = svcMap.get(item.servicio_id) || 0
        const propVal = totalBase === 0 ? (valorTotal / group.length) : (valorTotal * (basePrice / totalBase))
        const finalVal = Math.round(propVal * 100) / 100

        const { error: updateError } = await supabase
          .from('citas_ventas')
          .update({
            forma_pago: formaPago,
            valor_pagado: finalVal,
            no_transferencia: noTransferencia || null
          })
          .eq('id', item.id)
        if (updateError) throw updateError
      }
      this.clearCache('citas')
      return true
    }

    const list = getLocal('blush_citas') || []
    let group = []
    if (idsArray && Array.isArray(idsArray) && idsArray.length > 0) {
      group = list.filter(c => idsArray.includes(c.id))
    }
    if (group.length === 0) {
      group = list.filter(c => c.cliente_id === clienteId && c.fecha_hora === fechaHora)
    }

    const localSvcs = getLocal('blush_servicios') || []
    const svcMap = new Map(localSvcs.map(s => [s.id, s.precio_base]))
    const totalBase = group.reduce((sum, item) => sum + (svcMap.get(item.servicio_id) || 0), 0)

    const updated = list.map(c => {
      const isMatch = (idsArray && idsArray.includes(c.id)) || (c.cliente_id === clienteId && c.fecha_hora === fechaHora)
      if (isMatch) {
        const basePrice = svcMap.get(c.servicio_id) || 0
        const propVal = totalBase === 0 ? (valorTotal / group.length) : (valorTotal * (basePrice / totalBase))
        const finalVal = Math.round(propVal * 100) / 100
        return {
          ...c,
          forma_pago: formaPago,
          valor_pagado: finalVal,
          no_transferencia: noTransferencia || null
        }
      }
      return c
    })
    setLocal('blush_citas', updated)
    this.clearCache('citas')
    return true
  },

  // --- CLIENTES ---
  async getClientes(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('clientes')) return this._cache['clientes']
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('clientes').select('*').order('nombre')
      if (error) throw error
      this.setCache('clientes', data)
      return data
    }
    const local = getLocal('blush_clientes') || MOCK_CLIENTES
    this.setCache('clientes', local)
    return local
  },

  async registrarCliente(cliente) {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('clientes').insert([cliente]).select()
        if (error) throw error
        this.clearCache('clientes')
        return data[0]
      }
      const list = getLocal('blush_clientes') || []
      if (cliente.cedula && list.some(c => c.cedula === cliente.cedula)) {
        throw new Error('duplicate key value violates unique constraint "clientes_cedula_key"')
      }
      const nuevo = { ...cliente, id: 'c_' + Date.now() }
      list.push(nuevo)
      setLocal('blush_clientes', list)
      this.clearCache('clientes')
      return nuevo
    } catch (err) {
      throw this.traducirErrorPostgres(err)
    }
  },

  async actualizarCliente(id, cliente) {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('clientes').update(cliente).eq('id', id).select()
        if (error) throw error
        this.clearCache('clientes')
        return data[0]
      }
      const list = getLocal('blush_clientes') || []
      if (cliente.cedula && list.some(c => c.id !== id && c.cedula === cliente.cedula)) {
        throw new Error('duplicate key value violates unique constraint "clientes_cedula_key"')
      }
      const index = list.findIndex(c => c.id === id)
      if (index !== -1) {
        list[index] = { ...list[index], ...cliente }
        setLocal('blush_clientes', list)
        this.clearCache('clientes')
        return list[index]
      }
    } catch (err) {
      throw this.traducirErrorPostgres(err)
    }
  },

  async eliminarCliente(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('clientes').delete().eq('id', id)
      if (error) throw error
      this.clearCache('clientes')
      return true
    }
    const list = getLocal('blush_clientes') || []
    const filtered = list.filter(c => c.id !== id)
    setLocal('blush_clientes', filtered)
    this.clearCache('clientes')
    return true
  },

  async eliminarGrupoCitas(clienteId, fechaHora) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('citas_ventas').delete().eq('cliente_id', clienteId).eq('fecha_hora', fechaHora)
      if (error) throw error
      this.clearCache('citas')
      return true
    }
    const list = getLocal('blush_citas') || []
    const filtered = list.filter(c => !(c.cliente_id === clienteId && c.fecha_hora === fechaHora))
    setLocal('blush_citas', filtered)
    this.clearCache('citas')
    return true
  },

  // --- CITAS / VENTAS ---
  async getCitasVentas(forceRefresh = false) {
    const rawBranchId = this.getSelectedBranchId();
    const branchId = rawBranchId || 'todas';
    const cacheKey = `citas_${branchId}`;
    let data;
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      data = this._cache[cacheKey]
    } else {
      if (isSupabaseConfigured) {
        let dbData = [];
        let offset = 0;
        const limit = 1000;
        let hasMore = true;
        let withTipo = true;

        while (hasMore) {
          let selectCols = withTipo
            ? `id, fecha_hora, valor_pagado, forma_pago, no_transferencia, sucursal_id, tipo,
               cliente_id, servicio_id, personal_id,
               clientes (id, nombre, cedula, celular, correo),
               servicios (id, nombre, precio_base, frecuencia_recomendada_dias),
               personal (id, nombre)`
            : `id, fecha_hora, valor_pagado, forma_pago, no_transferencia, sucursal_id,
               cliente_id, servicio_id, personal_id,
               clientes (id, nombre, cedula, celular, correo),
               servicios (id, nombre, precio_base, frecuencia_recomendada_dias),
               personal (id, nombre)`;

          let query = supabase.from('citas_ventas').select(selectCols);
          if (rawBranchId) {
            query = query.or(`sucursal_id.eq.${rawBranchId},sucursal_id.is.null`);
          }
          
          let { data: batch, error } = await query
            .order('fecha_hora', { ascending: false })
            .range(offset, offset + limit - 1);

          if (error && withTipo && (error.message?.includes('tipo') || error.code === 'PGRST204' || error.code === '42703')) {
            withTipo = false;
            selectCols = `id, fecha_hora, valor_pagado, forma_pago, no_transferencia, sucursal_id,
                          cliente_id, servicio_id, personal_id,
                          clientes (id, nombre, cedula, celular, correo),
                          servicios (id, nombre, precio_base, frecuencia_recomendada_dias),
                          personal (id, nombre)`;
            query = supabase.from('citas_ventas').select(selectCols);
            if (rawBranchId) {
              query = query.or(`sucursal_id.eq.${rawBranchId},sucursal_id.is.null`);
            }
            const retryRes = await query.order('fecha_hora', { ascending: false }).range(offset, offset + limit - 1);
            if (retryRes.error) throw retryRes.error;
            batch = retryRes.data;
            error = null;
          }

          if (error) throw error;

          if (!batch || batch.length === 0) {
            hasMore = false;
          } else {
            dbData = [...dbData, ...batch];
            offset += limit;
            if (batch.length < limit) {
              hasMore = false;
            }
          }
        }

        const mapped = dbData.map(c => {
          if (c.personal && c.personal.nombre) {
            c.personal.nombre = this.resolverNombreEstandar(c.personal.nombre)
          }
          c.tipo = c.tipo || 'cita'
          return c
        })
        this.setCache(cacheKey, mapped)
        data = mapped
      } else {
        const citas = getLocal('blush_citas') || []
        const clientes = getLocal('blush_clientes') || []
        const servicios = getLocal('blush_servicios') || []
        const personal = getLocal('blush_personal') || []
        
        data = citas.map(c => {
          const cli = clientes.find(cl => cl.id === c.cliente_id)
          const ser = servicios.find(s => s.id === c.servicio_id)
          const per = personal.find(p => p.id === c.personal_id)
          return {
            ...c,
            tipo: c.tipo || 'cita',
            clientes: cli ? { id: cli.id, nombre: cli.nombre, cedula: cli.cedula, celular: cli.celular, correo: cli.correo } : null,
            servicios: ser ? { id: ser.id, nombre: ser.nombre, precio_base: ser.precio_base, frecuencia_recomendada_dias: ser.frecuencia_recomendada_dias } : null,
            personal: per ? { id: per.id, nombre: this.resolverNombreEstandar(per.nombre) } : null
          }
        })
        const filtered = rawBranchId ? data.filter(c => !c.sucursal_id || c.sucursal_id === rawBranchId) : data
        return [...filtered].sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
      }
    }
    const filtered = rawBranchId ? data.filter(c => !c.sucursal_id || c.sucursal_id === rawBranchId) : data
    return [...filtered].sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
  },

  async registrarCitaVenta(cita) {
    const branch = this.getEffectiveBranchId(cita.sucursal_id)
    const citaConSucursal = { 
      ...cita, 
      tipo: cita.tipo || 'cita',
      sucursal_id: branch 
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('citas_ventas').insert([citaConSucursal]).select()
      if (error) throw error
      this.clearCache('citas')
      return data[0]
    }

    const list = getLocal('blush_citas') || []
    const nuevo = { ...citaConSucursal, id: 'v_' + Date.now() }
    list.push(nuevo)
    setLocal('blush_citas', list)
    this.clearCache('citas')
    return nuevo
  },

  async registrarGrupoCitas(citasArray) {
    const defaultBranch = this.getEffectiveBranchId()
    const citasConSucursal = citasArray.map(c => ({
      ...c,
      tipo: c.tipo || 'cita',
      sucursal_id: c.sucursal_id || defaultBranch
    }))

    if (isSupabaseConfigured) {
      let { data, error } = await supabase.from('citas_ventas').insert(citasConSucursal).select()
      if (error && (error.message?.includes('tipo') || error.code === '42703' || error.code === 'PGRST204')) {
        const withoutTipo = citasConSucursal.map(({ tipo, ...rest }) => rest)
        const retry = await supabase.from('citas_ventas').insert(withoutTipo).select()
        if (retry.error) throw retry.error
        data = retry.data
      } else if (error) {
        throw error
      }
      this.clearCache('citas')
      return data
    }
    const list = getLocal('blush_citas') || []
    const nuevos = citasConSucursal.map((c, idx) => ({ 
      ...c, 
      id: 'v_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 9) 
    }))
    list.push(...nuevos)
    setLocal('blush_citas', list)
    this.clearCache('citas')
    return nuevos
  },

  async actualizarComprobanteMasivo(idsArray, comprobante) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('citas_ventas')
        .update({ no_transferencia: comprobante })
        .in('id', idsArray)
        .select()
      if (error) throw error
      this.clearCache('citas')
      return data
    }
    const list = getLocal('blush_citas') || []
    const updated = list.map(c => {
      if (idsArray.includes(c.id)) {
        return { ...c, no_transferencia: comprobante }
      }
      return c
    })
    setLocal('blush_citas', updated)
    this.clearCache('citas')
    return true
  },

  // --- GASTOS ---
  async getGastos(forceRefresh = false) {
    const branchId = this.getSelectedBranchId()
    const cacheKey = `gastos_${branchId || 'todas'}`
    let data;
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      data = this._cache[cacheKey]
    } else {
      if (isSupabaseConfigured) {
        let query = supabase.from('gastos').select('*')
        if (branchId) {
          query = query.or(`sucursal_id.eq.${branchId},sucursal_id.is.null`)
        }
        const { data: dbData, error } = await query
        if (error) throw error
        this.setCache(cacheKey, dbData)
        data = dbData
      } else {
        const local = getLocal('blush_gastos') || []
        this.setCache(cacheKey, local)
        data = local
      }
    }
    const filtered = branchId ? data.filter(g => !g.sucursal_id || g.sucursal_id === branchId) : data
    return [...filtered].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  },

  async registrarGasto(gasto) {
    const branch = this.getEffectiveBranchId(gasto.sucursal_id)
    const gastoConSucursal = { 
      ...gasto, 
      sucursal_id: branch 
    }

    if (isSupabaseConfigured) {
      let currentPayload = { ...gastoConSucursal }
      let attempts = 0
      let lastError = null
      let data = null

      while (attempts < 6) {
        attempts++
        const res = await supabase.from('gastos').insert([currentPayload]).select()
        if (!res.error) {
          data = res.data
          break
        }
        lastError = res.error
        
        const match = res.error.message?.match(/Could not find the '([^']+)' column/) ||
                      res.error.message?.match(/column "([^"]+)" of relation/)
        if (match && match[1] && currentPayload.hasOwnProperty(match[1])) {
          delete currentPayload[match[1]]
          continue
        }

        if (res.error.code === '42703' || res.error.code === 'PGRST204' || res.error.message?.includes('column')) {
          if (currentPayload.categoria) {
            delete currentPayload.categoria
            continue
          }
          if (currentPayload.proveedor || currentPayload.proveedor_ruc) {
            delete currentPayload.proveedor
            delete currentPayload.proveedor_ruc
            continue
          }
          if (currentPayload.valor_unitario !== undefined) {
            delete currentPayload.valor_unitario
            continue
          }
          if (currentPayload.cantidad !== undefined) {
            delete currentPayload.cantidad
            continue
          }
          if (currentPayload.cuenta) {
            delete currentPayload.cuenta
            continue
          }
          if (currentPayload.sucursal_id) {
            delete currentPayload.sucursal_id
            continue
          }
        }
        break
      }

      if (!data && lastError) {
        console.error('Error final en Supabase gastos:', lastError)
        throw lastError
      }
      this.clearCache('gastos')
      return (data && data[0]) || { ...gastoConSucursal, id: 'g_' + Date.now() }
    }
    const list = getLocal('blush_gastos') || []
    const nuevo = { ...gastoConSucursal, id: 'g_' + Date.now() }
    list.push(nuevo)
    setLocal('blush_gastos', list)
    this.clearCache('gastos')
    return nuevo
  },

  async actualizarGasto(id, gasto) {
    const branch = gasto.sucursal_id !== undefined ? this.getEffectiveBranchId(gasto.sucursal_id) : undefined
    const gastoData = {
      ...gasto,
      ...(branch !== undefined ? { sucursal_id: branch } : {})
    }

    if (isSupabaseConfigured) {
      let currentPayload = { ...gastoData }
      let attempts = 0
      let lastError = null
      let data = null

      while (attempts < 6) {
        attempts++
        const res = await supabase.from('gastos').update(currentPayload).eq('id', id).select()
        if (!res.error) {
          data = res.data
          break
        }
        lastError = res.error
        
        const match = res.error.message?.match(/Could not find the '([^']+)' column/) ||
                      res.error.message?.match(/column "([^"]+)" of relation/)
        if (match && match[1] && currentPayload.hasOwnProperty(match[1])) {
          delete currentPayload[match[1]]
          continue
        }

        if (res.error.code === '42703' || res.error.code === 'PGRST204' || res.error.message?.includes('column')) {
          if (currentPayload.categoria) {
            delete currentPayload.categoria
            continue
          }
          if (currentPayload.proveedor || currentPayload.proveedor_ruc) {
            delete currentPayload.proveedor
            delete currentPayload.proveedor_ruc
            continue
          }
          if (currentPayload.valor_unitario !== undefined) {
            delete currentPayload.valor_unitario
            continue
          }
          if (currentPayload.cantidad !== undefined) {
            delete currentPayload.cantidad
            continue
          }
          if (currentPayload.cuenta) {
            delete currentPayload.cuenta
            continue
          }
          if (currentPayload.sucursal_id) {
            delete currentPayload.sucursal_id
            continue
          }
        }
        break
      }

      if (!data && lastError) {
        console.error('Error final al actualizar gasto en Supabase:', lastError)
        throw lastError
      }
      this.clearCache('gastos')
      return (data && data[0]) || { id, ...gastoData }
    }
    const list = getLocal('blush_gastos') || []
    const idx = list.findIndex(g => g.id === id)
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...gastoData }
      setLocal('blush_gastos', list)
    }
    this.clearCache('gastos')
    return list[idx]
  },

  async eliminarGasto(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('gastos').delete().eq('id', id)
      if (error) throw error
      this.clearCache('gastos')
      return true
    }
    let list = getLocal('blush_gastos') || []
    list = list.filter(g => g.id !== id)
    setLocal('blush_gastos', list)
    this.clearCache('gastos')
    return true
  },

  // --- PRODUCTOS (INVENTARIO) ---
  async getProductos(forceRefresh = false) {
    const branchId = this.getSelectedBranchId()
    const cacheKey = `productos_${branchId || 'todas'}`
    let data;
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      data = this._cache[cacheKey]
    } else {
      if (isSupabaseConfigured) {
        let query = supabase.from('productos').select('*')
        if (branchId) {
          query = query.or(`sucursal_id.eq.${branchId},sucursal_id.is.null`)
        }
        const { data: dbData, error } = await query
        if (error) throw error
        this.setCache(cacheKey, dbData)
        data = dbData
      } else {
        const local = getLocal('blush_productos') || []
        this.setCache(cacheKey, local)
        data = local
      }
    }
    const filtered = branchId ? data.filter(p => !p.sucursal_id || p.sucursal_id === branchId) : data
    return [...filtered].sort((a, b) => a.nombre.localeCompare(b.nombre))
  },

  async registrarProducto(prod) {
    try {
      const branch = this.getEffectiveBranchId(prod.sucursal_id)
      const prodConSucursal = { 
        ...prod, 
        sucursal_id: branch 
      }

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('productos').insert([prodConSucursal]).select()
        if (error) throw error
        this.clearCache('productos')
        return data[0]
      }
      const list = getLocal('blush_productos') || []
      if (list.some(p => p.nombre.toLowerCase().trim() === prod.nombre.toLowerCase().trim())) {
        throw new Error('duplicate key value violates unique constraint "productos_nombre_key"')
      }
      const nuevo = { ...prodConSucursal, id: 'pr_' + Date.now() }
      list.push(nuevo)
      setLocal('blush_productos', list)
      this.clearCache('productos')
      return nuevo
    } catch (err) {
      throw this.traducirErrorPostgres(err)
    }
  },

  async actualizarProducto(id, prod) {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('productos').update(prod).eq('id', id).select()
        if (error) throw error
        this.clearCache('productos')
        return data[0]
      }
      const list = getLocal('blush_productos') || []
      if (prod.nombre && list.some(p => p.id !== id && p.nombre.toLowerCase().trim() === prod.nombre.toLowerCase().trim())) {
        throw new Error('duplicate key value violates unique constraint "productos_nombre_key"')
      }
      const index = list.findIndex(i => i.id === id)
      if (index !== -1) {
        list[index] = { ...list[index], ...prod }
        setLocal('blush_productos', list)
        this.clearCache('productos')
        return list[index]
      }
    } catch (err) {
      throw this.traducirErrorPostgres(err)
    }
  },

  async eliminarProducto(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('productos').delete().eq('id', id)
      if (error) throw error
      this.clearCache('productos')
      return true
    }
    const list = getLocal('blush_productos') || []
    const filtered = list.filter(i => i.id !== id)
    setLocal('blush_productos', filtered)
    this.clearCache('productos')
    return true
  },

  // ============================================================================
  // CÁLCULOS FINANCIEROS Y CRM (0ms NETWORK RETRIES)
  // ============================================================================

  // Conciliación Financiera (Ingresos - Egresos = Utilidad)
  async getConciliacionFinanciera(fechaInicio, fechaFin, forceRefresh = false) {
    const citas = await this.getCitasVentas(forceRefresh)
    const gastos = await this.getGastos(forceRefresh)

    const start = new Date(fechaInicio + 'T00:00:00')
    const end = new Date(fechaFin + 'T23:59:59')

    const totalIngresos = citas
      .filter(c => {
        const d = new Date(c.fecha_hora)
        return d >= start && d <= end
      })
      .reduce((sum, c) => sum + Number(c.valor_pagado), 0)

    const totalEgresos = gastos
      .filter(g => {
        const d = new Date(g.fecha + 'T00:00:00')
        return d >= start && d <= end
      })
      .reduce((sum, g) => sum + Number(g.total), 0)

    return {
      total_ingresos: totalIngresos,
      total_egresos: totalEgresos,
      utilidad_neta: totalIngresos - totalEgresos
    }
  },

  // Ingresos agrupados por forma de pago
  async getIngresosAgrupados(fechaInicio, fechaFin, forceRefresh = false) {
    const citas = await this.getCitasVentas(forceRefresh)
    const start = new Date(fechaInicio + 'T00:00:00')
    const end = new Date(fechaFin + 'T23:59:59')

    const filtrados = citas.filter(c => {
      const d = new Date(c.fecha_hora)
      return d >= start && d <= end
    })

    const agrupados = filtrados.reduce((acc, c) => {
      const fp = c.forma_pago
      if (!acc[fp]) {
        acc[fp] = { forma_pago: fp, cantidad_transacciones: 0, total_ingresos: 0 }
      }
      acc[fp].cantidad_transacciones += 1
      acc[fp].total_ingresos += Number(c.valor_pagado)
      return acc
    }, {})

    return Object.values(agrupados)
  },

  // CRM: Clientes por recontactar
  async getClientesPorRecontactar(forceRefresh = false) {
    const branchId = this.getSelectedBranchId()
    
    const citas = await this.getCitasVentas(forceRefresh)
    const clientes = await this.getClientes(forceRefresh)
    const servicios = await this.getServicios(forceRefresh)

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const citasFiltradas = branchId ? citas.filter(c => !c.sucursal_id || c.sucursal_id === branchId) : citas
    
    const ultimasCitasPorCliente = {}

    citasFiltradas.forEach(c => {
      const clienteId = c.cliente_id || (c.clientes ? c.clientes.id : null)
      if (!clienteId) return

      const cDate = new Date(c.fecha_hora)
      if (isNaN(cDate.getTime())) return

      if (!ultimasCitasPorCliente[clienteId]) {
        ultimasCitasPorCliente[clienteId] = []
      }
      ultimasCitasPorCliente[clienteId].push(c)
    })

    const porRecontactar = []

    Object.entries(ultimasCitasPorCliente).forEach(([clienteId, citasDelCliente]) => {
      const cliente = clientes.find(c => c.id === clienteId)
      if (!cliente) return

      citasDelCliente.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
      
      const ultimaCita = citasDelCliente[0]
      const fechaUltima = new Date(ultimaCita.fecha_hora)
      fechaUltima.setHours(0, 0, 0, 0)

      const fechaUltimaStr = ultimaCita.fecha_hora.includes('T') ? ultimaCita.fecha_hora.split('T')[0] : ultimaCita.fecha_hora
      const citasMismoDia = citasDelCliente.filter(c => {
        const dStr = c.fecha_hora.includes('T') ? c.fecha_hora.split('T')[0] : c.fecha_hora
        return dStr === fechaUltimaStr
      })

      const serviciosEnFecha = []
      citasMismoDia.forEach(c => {
        const sId = c.servicio_id || (c.servicios ? c.servicios.id : null)
        const serv = servicios.find(s => s.id === sId) || (c.servicios?.nombre ? c.servicios : null)
        if (serv) {
          serviciosEnFecha.push(serv)
        }
      })

      let frecuenciaDias = 21
      let servicioPrincipal = null

      const serviciosConFrecuencia = serviciosEnFecha.filter(s => s.frecuencia_recomendada_dias && s.frecuencia_recomendada_dias > 0)
      if (serviciosConFrecuencia.length > 0) {
        serviciosConFrecuencia.sort((a, b) => a.frecuencia_recomendada_dias - b.frecuencia_recomendada_dias)
        servicioPrincipal = serviciosConFrecuencia[0]
        frecuenciaDias = servicioPrincipal.frecuencia_recomendada_dias
      } else if (serviciosEnFecha.length > 0) {
        servicioPrincipal = serviciosEnFecha[0]
      }

      const servicioNombre = serviciosEnFecha.length > 0 
        ? [...new Set(serviciosEnFecha.map(s => s.nombre))].join(', ')
        : (ultimaCita.servicios?.nombre || 'Servicio General')

      const proximaFecha = new Date(fechaUltima)
      proximaFecha.setDate(fechaUltima.getDate() + frecuenciaDias)

      const diffTime = hoy - proximaFecha
      const diasRetraso = Math.round(diffTime / (1000 * 60 * 60 * 24))

      porRecontactar.push({
        cliente_id: cliente.id,
        cliente_nombre: cliente.nombre,
        cliente_celular: cliente.celular || 'N/A',
        cliente_correo: cliente.correo || 'N/A',
        servicio_id: servicioPrincipal ? servicioPrincipal.id : (ultimaCita.servicio_id || null),
        servicio_nombre: servicioNombre,
        frecuencia_recomendada_dias: frecuenciaDias,
        ultima_cita_fecha: fechaUltimaStr,
        proxima_cita_sugerida: proximaFecha.toISOString().split('T')[0],
        dias_retraso: diasRetraso,
        sucursal_id: ultimaCita.sucursal_id
      })
    })

    return porRecontactar.sort((a, b) => b.dias_retraso - a.dias_retraso)
  },

  // --- HISTORIAL COMPLETO DE CLIENTE ---
  async getHistorialCliente(clienteId, forceRefresh = false) {
    if (!clienteId) return null
    const [citas, clientes, servicios, personal] = await Promise.all([
      this.getCitasVentas(forceRefresh),
      this.getClientes(forceRefresh),
      this.getServicios(forceRefresh),
      this.getPersonal(forceRefresh)
    ])

    const cliente = clientes.find(c => c.id === clienteId) || null
    
    const citasDelCliente = citas.filter(c => {
      const cId = c.cliente_id || (c.clientes ? c.clientes.id : null)
      return cId === clienteId
    })

    citasDelCliente.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))

    const visitasMap = {}
    let totalGastado = 0
    const serviciosConteo = {}
    const estilistasConteo = {}

    citasDelCliente.forEach(c => {
      const fechaHora = c.fecha_hora || ''
      const serv = c.servicios || servicios.find(s => s.id === c.servicio_id) || { nombre: 'Servicio' }
      const staff = c.personal || personal.find(p => p.id === c.personal_id) || { nombre: 'Por asignar' }
      const valor = Number(c.valor_pagado) || 0
      totalGastado += valor

      if (serv.nombre) {
        serviciosConteo[serv.nombre] = (serviciosConteo[serv.nombre] || 0) + 1
      }
      if (staff.nombre && staff.nombre !== 'Por asignar') {
        estilistasConteo[staff.nombre] = (estilistasConteo[staff.nombre] || 0) + 1
      }

      if (!visitasMap[fechaHora]) {
        visitasMap[fechaHora] = {
          fecha_hora: fechaHora,
          forma_pago: c.forma_pago || 'Efectivo',
          no_transferencia: c.no_transferencia || '',
          servicios: [],
          totalVisita: 0
        }
      }

      visitasMap[fechaHora].servicios.push({
        id: c.id,
        servicio_id: c.servicio_id,
        servicio_nombre: serv.nombre || 'Servicio General',
        duracion_minutos: serv.duracion_minutos || 30,
        personal_id: c.personal_id,
        personal_nombre: staff.nombre || 'Sin asignar',
        valor_pagado: valor,
        forma_pago: c.forma_pago || 'Efectivo',
        no_transferencia: c.no_transferencia || '',
        sucursal_id: c.sucursal_id
      })
      visitasMap[fechaHora].totalVisita += valor
    })

    const visitas = Object.values(visitasMap).sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))

    let servicioFavorito = null
    let maxSvcCount = 0
    Object.entries(serviciosConteo).forEach(([nombre, count]) => {
      if (count > maxSvcCount) {
        maxSvcCount = count
        servicioFavorito = { nombre, veces: count }
      }
    })

    let estilistaFavorita = null
    let maxStaffCount = 0
    Object.entries(estilistasConteo).forEach(([nombre, count]) => {
      if (count > maxStaffCount) {
        maxStaffCount = count
        estilistaFavorita = { nombre, veces: count }
      }
    })

    return {
      cliente,
      totalVisitas: visitas.length,
      totalServicios: citasDelCliente.length,
      totalGastado,
      promedioGastoVisita: visitas.length > 0 ? (totalGastado / visitas.length) : 0,
      servicioFavorito,
      estilistaFavorita,
      primeraVisita: visitas.length > 0 ? visitas[visitas.length - 1].fecha_hora : null,
      ultimaVisita: visitas.length > 0 ? visitas[0].fecha_hora : null,
      visitas,
      todasCitas: citasDelCliente
    }
  },

  async getClientesConResumenHistorial(forceRefresh = false) {
    const [citas, clientes, servicios] = await Promise.all([
      this.getCitasVentas(forceRefresh),
      this.getClientes(forceRefresh),
      this.getServicios(forceRefresh)
    ])

    const citasPorCliente = {}
    citas.forEach(c => {
      const cId = c.cliente_id || (c.clientes ? c.clientes.id : null)
      if (!cId) return
      if (!citasPorCliente[cId]) citasPorCliente[cId] = []
      citasPorCliente[cId].push(c)
    })

    return clientes.map(cliente => {
      const citasCliente = citasPorCliente[cliente.id] || []
      citasCliente.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))

      const fechasUnicas = new Set(citasCliente.map(c => c.fecha_hora))
      let totalGastado = 0
      const svcMap = {}

      citasCliente.forEach(c => {
        totalGastado += Number(c.valor_pagado) || 0
        const sName = c.servicios?.nombre || servicios.find(s => s.id === c.servicio_id)?.nombre
        if (sName) {
          svcMap[sName] = (svcMap[sName] || 0) + 1
        }
      })

      let favorito = null
      let maxCnt = 0
      Object.entries(svcMap).forEach(([name, cnt]) => {
        if (cnt > maxCnt) {
          maxCnt = cnt
          favorito = name
        }
      })

      const ultimaCita = citasCliente[0] || null
      const ultimoServicio = ultimaCita ? (ultimaCita.servicios?.nombre || servicios.find(s => s.id === ultimaCita.servicio_id)?.nombre || 'Servicio') : null

      return {
        ...cliente,
        totalVisitas: fechasUnicas.size,
        totalServicios: citasCliente.length,
        totalGastado,
        ultimaVisita: ultimaCita ? ultimaCita.fecha_hora : null,
        ultimoServicio,
        servicioFavorito: favorito,
        tieneHistorial: citasCliente.length > 0
      }
    })
  },

  // --- SUCURSALES ---
  async getSucursales(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('sucursales')) return this._cache['sucursales']
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('sucursales').select('*').order('nombre')
      if (error) throw error
      this.setCache('sucursales', data)
      return data
    }
    const local = getLocal('blush_sucursales') || MOCK_SUCURSALES
    this.setCache('sucursales', local)
    return local
  },

  // --- HISTORIAL DE REPOSICIÓN ---
  async getReposiciones(productoId) {
    if (isSupabaseConfigured) {
      const { data: dbData, error } = await supabase.from('registro_reposiciones_inventario').select('*').eq('producto_id', productoId).order('creado_en', { ascending: false })
      if (error) throw error
      return dbData
    }
    const repos = getLocal('blush_reposiciones') || []
    return repos.filter(r => r.producto_id === productoId).sort((a,b) => new Date(b.creado_en) - new Date(a.creado_en))
  },

  async getTodasReposiciones() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('registro_reposiciones_inventario').select('*').order('creado_en', { ascending: false })
      if (error) throw error
      return data
    }
    return getLocal('blush_reposiciones') || []
  },

  async registrarReposicion(productoId, cantidad, fecha) {
    if (isSupabaseConfigured) {
      const { data: prod, error: errFetch } = await supabase
        .from('productos')
        .select('*')
        .eq('id', productoId)
        .single();
      if (errFetch || !prod) throw new Error('Producto no encontrado.');
      
      const stockAnterior = prod.stock_actual;
      const fechaAnterior = prod.fecha_actualizacion_stock || prod.fecha_compra || new Date().toISOString().split('T')[0];
      const nuevoStock = stockAnterior + cantidad;

      const { error: err1 } = await supabase
        .from('productos')
        .update({ stock_actual: nuevoStock, fecha_actualizacion_stock: fecha })
        .eq('id', productoId);
      if (err1) throw err1;

      const nuevaReposicionDb = {
        producto_id: productoId,
        stock_anterior: stockAnterior,
        fecha_anterior: fechaAnterior,
        cantidad_reposicion: cantidad,
        fecha_reposicion: fecha
      };

      const { error: err2 } = await supabase
        .from('registro_reposiciones_inventario')
        .insert([nuevaReposicionDb]);
      if (err2) throw err2;

      this.clearCache('productos');
      return { ...nuevaReposicionDb, creado_en: new Date().toISOString() };
    }

    const reposiciones = getLocal('blush_reposiciones') || []
    const productos = getLocal('blush_productos') || []
    
    const prodIdx = productos.findIndex(p => p.id === productoId)
    if (prodIdx === -1) throw new Error('Producto no encontrado.')
    
    const p = productos[prodIdx]
    const stockAnterior = p.stock_actual
    const fechaAnterior = p.fecha_actualizacion_stock || p.fecha_compra || new Date().toISOString().split('T')[0]
    
    const nuevoStock = stockAnterior + cantidad
    productos[prodIdx] = { 
      ...p, 
      stock_actual: nuevoStock,
      fecha_actualizacion_stock: fecha
    }
    setLocal('blush_productos', productos)

    const nuevaReposicion = {
      id: 'rep_' + Date.now(),
      producto_id: productoId,
      stock_anterior: stockAnterior,
      fecha_anterior: fechaAnterior,
      cantidad_reposicion: cantidad,
      fecha_reposicion: fecha,
      creado_en: new Date().toISOString()
    }

    reposiciones.push(nuevaReposicion)
    setLocal('blush_reposiciones', reposiciones)
    this.clearCache('productos')
    return nuevaReposicion;
  },

  // --- AUTENTICACIÓN ---
  _currentBranchId: null,

  setSelectedBranchId(id) {
    this._currentBranchId = id;
    sessionStorage.setItem('blush_selected_branch_id', id || 'todas');
  },

  getSelectedBranchId() {
    if (!this._currentBranchId) {
      const stored = sessionStorage.getItem('blush_selected_branch_id');
      this._currentBranchId = (stored === 'todas') ? null : (stored || null);
    }
    return this._currentBranchId;
  },

  getCurrentUser() {
    const userStr = sessionStorage.getItem('blush_current_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  validarCedulaEcuatoriana(cedula) {
    if (typeof cedula !== 'string') return false;
    if (!/^\d{10}$/.test(cedula)) return false;

    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || (provincia > 24 && provincia !== 30)) {
      return false;
    }

    const tercerDigito = parseInt(cedula.charAt(2), 10);
    if (tercerDigito < 0 || tercerDigito > 5) {
      return false;
    }

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let valor = parseInt(cedula.charAt(i), 10) * coeficientes[i];
      if (valor >= 10) {
        valor -= 9;
      }
      suma += valor;
    }

    const verificadorObtenido = (10 - (suma % 10)) % 10;
    const verificadorReal = parseInt(cedula.charAt(9), 10);

    return verificadorObtenido === verificadorReal;
  },

  async obtenerUsuarios() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id,
          username,
          nombre,
          rol,
          sucursal_id,
          correo,
          creado_en
        `)
        .order('nombre', { ascending: true });
      if (error) throw error;
      return data;
    } else {
      return getLocal('blush_usuarios') || MOCK_USUARIOS;
    }
  },

  async actualizarUsuario(id, userData) {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('usuarios')
          .update(userData)
          .eq('id', id)
          .select();
        if (error) throw error;
        return data[0];
      } else {
        const users = getLocal('blush_usuarios') || MOCK_USUARIOS;
        const idx = users.findIndex(u => u.id === id);
        if (idx !== -1) {
          if (userData.username && users.some(u => u.id !== id && u.username.toLowerCase() === userData.username.toLowerCase().trim())) {
            throw new Error('La cédula ya está registrada.');
          }
          users[idx] = { ...users[idx], ...userData };
          setLocal('blush_usuarios', users);
          return users[idx];
        }
        throw new Error('Usuario no encontrado.');
      }
    } catch (err) {
      throw this.traducirErrorPostgres(err);
    }
  },

  async registrarUsuario(userData) {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('usuarios')
          .insert([userData])
          .select();
        if (error) throw error;
        return data[0];
      } else {
        const users = getLocal('blush_usuarios') || MOCK_USUARIOS;
        if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase().trim())) {
          throw new Error('La cédula ya está registrada.');
        }
        const newUser = {
          id: 'u_' + Date.now(),
          ...userData
        };
        users.push(newUser);
        setLocal('blush_usuarios', users);
        return newUser;
      }
    } catch (err) {
      throw this.traducirErrorPostgres(err);
    }
  },

  async login(username, password) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('username', username.trim())
        .eq('password', password)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        throw new Error('Usuario o contraseña incorrectos.');
      }
      sessionStorage.setItem('blush_current_user', JSON.stringify(data));
      if (data.rol === 'Dueño') {
        this.setSelectedBranchId(null);
      } else {
        this.setSelectedBranchId(data.sucursal_id);
      }
      this.clearCache();
      return data;
    } else {
      const users = getLocal('blush_usuarios') || MOCK_USUARIOS;
      const found = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password);
      if (!found) {
        throw new Error('Usuario o contraseña incorrectos.');
      }
      sessionStorage.setItem('blush_current_user', JSON.stringify(found));
      if (found.rol === 'Dueño') {
        this.setSelectedBranchId(null);
      } else {
        this.setSelectedBranchId(found.sucursal_id);
      }
      this.clearCache();
      return found;
    }
  },

  async logout() {
    sessionStorage.removeItem('blush_current_user');
    sessionStorage.removeItem('blush_selected_branch_id');
    this._currentBranchId = null;
    this.clearCache();
  },

  traducirErrorPostgres(err) {
    if (!err || !err.message) return err
    const msg = err.message
    if (msg.includes('servicios_nombre_key') || (msg.includes('duplicate key') && msg.includes('servicios'))) {
      return new Error('Ya existe un servicio registrado con ese nombre. Por favor, usa un nombre diferente.')
    }
    if (msg.includes('productos_nombre_key') || (msg.includes('duplicate key') && msg.includes('productos'))) {
      return new Error('Ya existe un producto registrado con ese nombre. Por favor, usa un nombre diferente.')
    }
    if (msg.includes('clientes_cedula_key') || (msg.includes('duplicate key') && msg.includes('clientes') && msg.includes('cedula'))) {
      return new Error('Ya existe un cliente registrado con ese número de cédula.')
    }
    if (msg.includes('personal_nombre_key') || (msg.includes('duplicate key') && msg.includes('personal'))) {
      return new Error('Ya existe una colaboradora registrada con ese nombre.')
    }
    if (msg.includes('usuarios_username_key') || (msg.includes('duplicate key') && msg.includes('usuarios'))) {
      return new Error('Este número de cédula ya está registrado en el sistema con otra cuenta de acceso.')
    }
    return err
  }
}
