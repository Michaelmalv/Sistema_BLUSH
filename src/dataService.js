import { supabase, isSupabaseConfigured } from './supabaseClient'

// ============================================================================
// DATOS DE PRUEBA (MOCK DATA) PARA MODO LOCAL/DEMO
// ============================================================================

const MOCK_PERSONAL = [
  { id: 'p1', nombre: 'Pamela', cargo: 'Manicurista', activo: true },
  { id: 'p2', nombre: 'Sofia', cargo: 'Manicurista', activo: true },
  { id: 'p3', nombre: 'Roxana', cargo: 'Manicurista', activo: true },
  { id: 'p4', nombre: 'Cecilia', cargo: 'Manicurista', activo: true },
  { id: 'p5', nombre: 'Silvia', cargo: 'Manicurista', activo: true },
  { id: 'p6', nombre: 'Liz', cargo: 'Manicurista', activo: true },
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
  { id: 'pr1', nombre: 'Esmlates Gel Pro', descripcion: 'Esmaltes de alta duración', tipo: 'insumo', stock_actual: 12, stock_minimo: 4, precio_venta: null, proveedor: 'OPI Distribuidor', proveedor_ruc: '1792938475001', precio_costo: 3.50, fecha_compra: '2026-05-01', fecha_actualizacion_stock: '2026-05-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'pr2', nombre: 'Removedor de acrílico premium', descripcion: 'Líquido removedor rápido', tipo: 'insumo', stock_actual: 3, stock_minimo: 4, precio_venta: null, proveedor: 'Belleza Total S.A.', proveedor_ruc: '1792223334001', precio_costo: 8.00, fecha_compra: '2026-05-15', fecha_actualizacion_stock: '2026-05-15', sucursal_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'pr3', nombre: 'Aceite de cutícula coco 15ml', descripcion: 'Para reventa al cliente', tipo: 'reventa', stock_actual: 8, stock_minimo: 4, precio_venta: 7.50, proveedor: 'Cosméticos Ec', proveedor_ruc: '1794445556001', precio_costo: 3.00, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '33333333-3333-3333-3333-333333333333' },
  { id: 'pr4', nombre: 'Guantes de Nitrilo Rosa M', descripcion: 'Insumo de protección', tipo: 'insumo', stock_actual: 2, stock_minimo: 4, precio_venta: null, proveedor: 'Medikal Import', proveedor_ruc: '1796667778001', precio_costo: 5.50, fecha_compra: '2026-06-10', fecha_actualizacion_stock: '2026-06-10', sucursal_id: '22222222-2222-2222-2222-222222222222' },
]

const MOCK_SUCURSALES = [
  { id: '11111111-1111-1111-1111-111111111111', nombre: 'Matriz Central', direccion: 'Av. de los Granados y Av. Eloy Alfaro' },
  { id: '22222222-2222-2222-2222-222222222222', nombre: 'Sucursal Norte', direccion: 'Av. El Inca y Amazonas' },
  { id: '33333333-3333-3333-3333-333333333333', nombre: 'Sucursal Sur', direccion: 'Av. Maldonado y El Recreo' }
]

const MOCK_USUARIOS = [
  { id: 'u1', username: 'dueno', password: '123', nombre: 'Propietaria General', rol: 'Dueño', sucursal_id: null },
  { id: 'u2', username: 'gerente_norte', password: '123', nombre: 'Gerente Norte', rol: 'Gerente', sucursal_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'u3', username: 'admin_norte', password: '123', nombre: 'Admin Norte', rol: 'Administrador', sucursal_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'u4', username: 'gerente_sur', password: '123', nombre: 'Gerente Sur', rol: 'Gerente', sucursal_id: '33333333-3333-3333-3333-333333333333' },
  { id: 'u5', username: 'admin_sur', password: '123', nombre: 'Admin Sur', rol: 'Administrador', sucursal_id: '33333333-3333-3333-3333-333333333333' }
]

// Inicializar almacenamiento local si no existe para el modo demo
const initLocalStorage = () => {
  if (!localStorage.getItem('blush_personal')) localStorage.setItem('blush_personal', JSON.stringify(MOCK_PERSONAL))
  if (!localStorage.getItem('blush_servicios')) localStorage.setItem('blush_servicios', JSON.stringify(MOCK_SERVICIOS))
  if (!localStorage.getItem('blush_clientes')) localStorage.setItem('blush_clientes', JSON.stringify(MOCK_CLIENTES))
  if (!localStorage.getItem('blush_citas')) localStorage.setItem('blush_citas', JSON.stringify(MOCK_CITAS))
  if (!localStorage.getItem('blush_gastos')) localStorage.setItem('blush_gastos', JSON.stringify(MOCK_GASTOS))
  if (!localStorage.getItem('blush_productos')) localStorage.setItem('blush_productos', JSON.stringify(MOCK_PRODUCTOS))
  if (!localStorage.getItem('blush_sucursales')) localStorage.setItem('blush_sucursales', JSON.stringify(MOCK_SUCURSALES))
  if (!localStorage.getItem('blush_usuarios')) localStorage.setItem('blush_usuarios', JSON.stringify(MOCK_USUARIOS))
  if (!localStorage.getItem('blush_reposiciones')) localStorage.setItem('blush_reposiciones', JSON.stringify([]))
}
initLocalStorage()

const getLocal = (key) => JSON.parse(localStorage.getItem(key))
const setLocal = (key, data) => localStorage.setItem(key, JSON.stringify(data))

// ============================================================================
// CONEXIÓN INTEGRAL - DB O LOCAL STORAGE
// ============================================================================

export const dataService = {
  // In-memory cache for high-speed local data fetching (Senior usability performance)
  _cache: {
    personal: null,
    servicios: null,
    clientes: null,
    citas: null,
    gastos: null,
    productos: null,
    sucursales: null
  },

  clearCache(key) {
    if (key) {
      this._cache[key] = null
    } else {
      Object.keys(this._cache).forEach(k => {
        this._cache[k] = null
      })
    }
  },

  // --- PERSONAL ---
  async getPersonal() {
    if (this._cache.personal) return this._cache.personal
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('personal').select('*').order('nombre')
      if (error) throw error
      this._cache.personal = data
      return data
    }
    const local = getLocal('blush_personal')
    this._cache.personal = local
    return local
  },

  // --- SERVICIOS ---
  async getServicios() {
    if (this._cache.servicios) return this._cache.servicios
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('servicios').select('*').order('nombre')
      if (error) throw error
      this._cache.servicios = data
      return data
    }
    const local = getLocal('blush_servicios')
    this._cache.servicios = local
    return local
  },

  async registrarServicio(svc) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('servicios').insert([svc]).select()
      if (error) throw error
      this.clearCache('servicios')
      return data[0]
    }
    const list = getLocal('blush_servicios')
    const nuevo = { ...svc, id: 's_' + Date.now() }
    list.push(nuevo)
    setLocal('blush_servicios', list)
    this.clearCache('servicios')
    return nuevo
  },

  async actualizarServicio(id, svc) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('servicios').update(svc).eq('id', id).select()
      if (error) throw error
      this.clearCache('servicios')
      return data[0]
    }
    const list = getLocal('blush_servicios')
    const index = list.findIndex(i => i.id === id)
    if (index !== -1) {
      list[index] = { ...list[index], ...svc }
      setLocal('blush_servicios', list)
      this.clearCache('servicios')
      return list[index]
    }
  },

  async eliminarServicio(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('servicios').delete().eq('id', id)
      if (error) throw error
      this.clearCache('servicios')
      return true
    }
    const list = getLocal('blush_servicios')
    const filtered = list.filter(i => i.id !== id)
    setLocal('blush_servicios', filtered)
    this.clearCache('servicios')
    return true
  },

  // --- CLIENTES ---
  async getClientes() {
    if (this._cache.clientes) return this._cache.clientes
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('clientes').select('*').order('nombre')
      if (error) throw error
      this._cache.clientes = data
      return data
    }
    const local = getLocal('blush_clientes')
    this._cache.clientes = local
    return local
  },

  async registrarCliente(cliente) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('clientes').insert([cliente]).select()
      if (error) throw error
      this.clearCache('clientes')
      return data[0]
    }
    const list = getLocal('blush_clientes')
    const nuevo = { ...cliente, id: 'c_' + Date.now() }
    list.push(nuevo)
    setLocal('blush_clientes', list)
    this.clearCache('clientes')
    return nuevo
  },

  // --- CITAS / VENTAS ---
  async getCitasVentas() {
    const branchId = this.getSelectedBranchId()
    let data;
    if (this._cache.citas) {
      data = this._cache.citas
    } else {
      if (isSupabaseConfigured) {
        const { data: dbData, error } = await supabase
          .from('citas_ventas')
          .select(`
            id, fecha_hora, valor_pagado, forma_pago, no_transferencia, sucursal_id,
            cliente_id, servicio_id, personal_id,
            clientes (id, nombre, cedula, celular, correo),
            servicios (id, nombre, precio_base, frecuencia_recomendada_dias),
            personal (id, nombre)
          `)
        if (error) throw error
        this._cache.citas = dbData
        data = dbData
      } else {
        const citas = getLocal('blush_citas') || []
        const clientes = getLocal('blush_clientes') || []
        const servicios = getLocal('blush_servicios') || []
        const personal = getLocal('blush_personal') || []
        
        const localJoined = citas.map(c => ({
          ...c,
          clientes: clientes.find(cl => cl.id === c.cliente_id) || {},
          servicios: servicios.find(s => s.id === c.servicio_id) || {},
          personal: personal.find(p => p.id === c.personal_id) || {}
        }))
        this._cache.citas = localJoined
        data = localJoined
      }
    }

    const filtered = branchId ? data.filter(c => c.sucursal_id === branchId) : data
    return [...filtered].sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
  },

  async registrarCitaVenta(cita) {
    if (['Deuna', 'Transferencia'].includes(cita.forma_pago) && (!cita.no_transferencia || cita.no_transferencia.trim() === '')) {
      throw new Error(`El número de transferencia/referencia es requerido para ${cita.forma_pago}`)
    }

    // Auto-asignar sucursal del creador
    const user = this.getCurrentUser()
    const citaConSucursal = { 
      ...cita, 
      sucursal_id: cita.sucursal_id || (user ? user.sucursal_id : null) 
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('citas_ventas').insert([citaConSucursal]).select()
      if (error) throw error
      this.clearCache('citas')
      return data[0]
    }

    const list = getLocal('blush_citas')
    const nuevo = { ...citaConSucursal, id: 'v_' + Date.now() }
    list.push(nuevo)
    setLocal('blush_citas', list)
    this.clearCache('citas')
    return nuevo
  },

  // --- GASTOS ---
  async getGastos() {
    const branchId = this.getSelectedBranchId()
    let data;
    if (this._cache.gastos) {
      data = this._cache.gastos
    } else {
      if (isSupabaseConfigured) {
        const { data: dbData, error } = await supabase.from('gastos').select('*')
        if (error) throw error
        this._cache.gastos = dbData
        data = dbData
      } else {
        const local = getLocal('blush_gastos') || []
        this._cache.gastos = local
        data = local
      }
    }
    const filtered = branchId ? data.filter(g => g.sucursal_id === branchId) : data
    return [...filtered].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  },

  async registrarGasto(gasto) {
    const user = this.getCurrentUser()
    const gastoConSucursal = { 
      ...gasto, 
      sucursal_id: gasto.sucursal_id || (user ? user.sucursal_id : null) 
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('gastos').insert([gastoConSucursal]).select()
      if (error) throw error
      this.clearCache('gastos')
      return data[0]
    }
    const list = getLocal('blush_gastos')
    const nuevo = { ...gastoConSucursal, id: 'g_' + Date.now() }
    list.push(nuevo)
    setLocal('blush_gastos', list)
    this.clearCache('gastos')
    return nuevo
  },

  // --- PRODUCTOS (INVENTARIO) ---
  async getProductos() {
    const branchId = this.getSelectedBranchId()
    let data;
    if (this._cache.productos) {
      data = this._cache.productos
    } else {
      if (isSupabaseConfigured) {
        const { data: dbData, error } = await supabase.from('productos').select('*')
        if (error) throw error
        this._cache.productos = dbData
        data = dbData
      } else {
        const local = getLocal('blush_productos') || []
        this._cache.productos = local
        data = local
      }
    }
    const filtered = branchId ? data.filter(p => p.sucursal_id === branchId) : data
    return [...filtered].sort((a, b) => a.nombre.localeCompare(b.nombre))
  },

  async registrarProducto(prod) {
    const user = this.getCurrentUser()
    const prodConSucursal = { 
      ...prod, 
      sucursal_id: prod.sucursal_id || (user ? user.sucursal_id : null) 
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('productos').insert([prodConSucursal]).select()
      if (error) throw error
      this.clearCache('productos')
      return data[0]
    }
    const list = getLocal('blush_productos')
    const nuevo = { ...prodConSucursal, id: 'pr_' + Date.now() }
    list.push(nuevo)
    setLocal('blush_productos', list)
    this.clearCache('productos')
    return nuevo
  },

  async actualizarProducto(id, prod) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('productos').update(prod).eq('id', id).select()
      if (error) throw error
      this.clearCache('productos')
      return data[0]
    }
    const list = getLocal('blush_productos')
    const index = list.findIndex(i => i.id === id)
    if (index !== -1) {
      list[index] = { ...list[index], ...prod }
      setLocal('blush_productos', list)
      this.clearCache('productos')
      return list[index]
    }
  },

  async eliminarProducto(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('productos').delete().eq('id', id)
      if (error) throw error
      this.clearCache('productos')
      return true
    }
    const list = getLocal('blush_productos')
    const filtered = list.filter(i => i.id !== id)
    setLocal('blush_productos', filtered)
    this.clearCache('productos')
    return true
  },

  // ============================================================================
  // CÁLCULOS FINANCIEROS Y CRM (OPTIMIZACIÓN SENIOR - 0ms NETWORK RETRIES)
  // ============================================================================

  // Conciliación Financiera (Ingresos - Egresos = Utilidad)
  async getConciliacionFinanciera(fechaInicio, fechaFin) {
    const citas = await this.getCitasVentas()
    const gastos = await this.getGastos()

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
  async getIngresosAgrupados(fechaInicio, fechaFin) {
    const citas = await this.getCitasVentas()
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

  // CRM: Clientes por recontactar (Solución del error sucursal_id de la vista DB)
  async getClientesPorRecontactar() {
    const branchId = this.getSelectedBranchId()
    
    // Fetch base tables with memory caching
    const citas = await this.getCitasVentas()
    const clientes = await this.getClientes()
    const servicios = await this.getServicios()

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    // Agrupar última cita de cada cliente para cada servicio
    const ultimasCitas = {}
    const citasFiltradas = branchId ? citas.filter(c => c.sucursal_id === branchId) : citas
    
    citasFiltradas.forEach(c => {
      const clienteId = c.cliente_id || (c.clientes ? c.clientes.id : null)
      const servicioId = c.servicio_id || (c.servicios ? c.servicios.id : null)
      if (!clienteId || !servicioId) return

      const key = `${clienteId}_${servicioId}`
      const cDate = new Date(c.fecha_hora)
      if (!ultimasCitas[key] || cDate > new Date(ultimasCitas[key].fecha_hora)) {
        ultimasCitas[key] = {
          ...c,
          clienteId,
          servicioId
        }
      }
    })

    const porRecontactar = []
    Object.values(ultimasCitas).forEach(uc => {
      const servicio = servicios.find(s => s.id === uc.servicioId)
      if (!servicio || !servicio.frecuencia_recomendada_dias) return

      const cliente = clientes.find(c => c.id === uc.clienteId)
      if (!cliente) return

      const fechaUltima = new Date(uc.fecha_hora)
      fechaUltima.setHours(0,0,0,0)
      
      const proximaFecha = new Date(fechaUltima)
      proximaFecha.setDate(fechaUltima.getDate() + servicio.frecuencia_recomendada_dias)

      const diffTime = hoy - proximaFecha
      const diasRetraso = Math.round(diffTime / (1000 * 60 * 60 * 24))

      porRecontactar.push({
        cliente_id: cliente.id,
        cliente_nombre: cliente.nombre,
        cliente_celular: cliente.celular || 'N/A',
        cliente_correo: cliente.correo || 'N/A',
        servicio_id: servicio.id,
        servicio_nombre: servicio.nombre,
        frecuencia_recomendada_dias: servicio.frecuencia_recomendada_dias,
        ultima_cita_fecha: uc.fecha_hora.includes('T') ? uc.fecha_hora.split('T')[0] : uc.fecha_hora,
        proxima_cita_sugerida: proximaFecha.toISOString().split('T')[0],
        dias_retraso: diasRetraso,
        sucursal_id: uc.sucursal_id
      })
    })

    return porRecontactar.sort((a, b) => b.dias_retraso - a.dias_retraso)
  },

  // --- SUCURSALES ---
  async getSucursales() {
    if (this._cache.sucursales) return this._cache.sucursales
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('sucursales').select('*').order('nombre')
      if (error) throw error
      this._cache.sucursales = data
      return data
    }
    const local = getLocal('blush_sucursales') || MOCK_SUCURSALES
    this._cache.sucursales = local
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

    if (isSupabaseConfigured) {
      const { error: err1 } = await supabase.from('productos').update({ stock_actual: nuevoStock, fecha_actualizacion_stock: fecha }).eq('id', productoId)
      if (err1) throw err1
      const { error: err2 } = await supabase.from('registro_reposiciones_inventario').insert([nuevaReposicion])
      if (err2) throw err2
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

  async login(username, password) {
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
    return found;
  },

  async logout() {
    sessionStorage.removeItem('blush_current_user');
    sessionStorage.removeItem('blush_selected_branch_id');
    this._currentBranchId = null;
  }
}
