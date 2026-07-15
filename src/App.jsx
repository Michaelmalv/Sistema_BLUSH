import React, { useState, useEffect, useRef } from 'react'
import { 
  LayoutDashboard, 
  Calendar, 
  TrendingDown, 
  Package, 
  Users, 
  Scissors, 
  Database,
  Info,
  BellRing,
  X,
  LogOut,
  MapPin,
  Lock,
  User as UserIcon,
  DollarSign
} from 'lucide-react'

// Tabs
import DashboardTab from './components/DashboardTab'
import VentasTab from './components/VentasTab'
import GastosTab from './components/GastosTab'
import InventarioTab from './components/InventarioTab'
import ClientesTab from './components/ClientesTab'
import ServiciosTab from './components/ServiciosTab'
import SeguimientoTab from './components/SeguimientoTab'
import SueldosTab from './components/SueldosTab'

// Client config check
import { isSupabaseConfigured } from './supabaseClient'
import { dataService } from './dataService'

const LogoImg = ({ className = "w-10 h-10" }) => (
  <img 
    src="/logo.png" 
    className={`${className} object-contain rounded-2xl bg-[#FAF3EF]`} 
    alt="Blush Logo" 
  />
)

export default function App() {
  const [currentUser, setCurrentUser] = useState(dataService.getCurrentUser())
  const [selectedBranchId, setSelectedBranchId] = useState(dataService.getSelectedBranchId())
  const [sucursales, setSucursales] = useState([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showConfigInfo, setShowConfigInfo] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificaciones, setNotificaciones] = useState([])
  const [toasts, setToasts] = useState([])

  const notificationsRef = useRef(null)
  const configInfoRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (configInfoRef.current && !configInfoRef.current.contains(event.target)) {
        setShowConfigInfo(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Login form state
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    // Si ya hay usuario guardado, alinear pestaña inicial
    const user = dataService.getCurrentUser()
    if (user) {
      setCurrentUser(user)
      setSelectedBranchId(dataService.getSelectedBranchId())
      if (user.rol === 'Administrador') {
        setActiveTab('crm')
      } else {
        setActiveTab('dashboard')
      }
    }
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadSucursales()
      loadNotifications()
    }
  }, [currentUser, selectedBranchId])

  const loadSucursales = async () => {
    try {
      const data = await dataService.getSucursales()
      setSucursales(data)
    } catch (e) {
      console.error('Error al cargar sucursales:', e)
    }
  }

  const loadNotifications = async () => {
    if (!currentUser) return
    try {
      const prods = await dataService.getProductos()
      const lowStock = prods.filter(p => p.stock_actual <= p.stock_minimo)

      const crmList = await dataService.getClientesPorRecontactar()
      const pendingCrm = crmList.filter(c => c.dias_retraso >= -1)

      const allClients = await dataService.getClientes()
      const upcomingBirthdays = allClients.filter(c => {
        if (!c.fecha_nacimiento) return false
        const parts = c.fecha_nacimiento.split('-')
        if (parts.length !== 3) return false
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)
        
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        let nextBday = new Date(today.getFullYear(), month, day)
        if (nextBday < today) {
          nextBday.setFullYear(today.getFullYear() + 1)
        }
        
        const diffTime = nextBday - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays >= 0 && diffDays <= 7
      })

      const alerts = []
      
      lowStock.forEach(p => {
        alerts.push({
          id: `stock-${p.id}`,
          type: 'stock',
          title: 'Stock Crítico',
          desc: `${p.nombre} tiene ${p.stock_actual} unidades (mínimo ${p.stock_minimo})`,
          tab: 'inventario'
        })
      })

      pendingCrm.forEach(c => {
        const isTomorrow = c.dias_retraso === -1
        const isToday = c.dias_retraso === 0
        const delayText = isTomorrow ? 'mañana' : isToday ? 'hoy' : `${c.dias_retraso} días tarde`
        alerts.push({
          id: `crm-${c.cliente_id}-${c.servicio_id}`,
          type: 'crm',
          title: isTomorrow ? 'Recontacto Próximo' : 'Recontacto Pendiente',
          desc: `${c.cliente_nombre} necesita reagendar ${c.servicio_nombre} (${delayText})`,
          tab: 'seguimiento',
          data: c
        })
      })

      upcomingBirthdays.forEach(c => {
        const parts = c.fecha_nacimiento.split('-')
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        let nextBday = new Date(today.getFullYear(), month, day)
        if (nextBday < today) {
          nextBday.setFullYear(today.getFullYear() + 1)
        }
        const diffTime = nextBday - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        const isToday = diffDays === 0
        const daysText = isToday ? 'hoy 🎉' : diffDays === 1 ? 'mañana 🎂' : `en ${diffDays} días 🎂`
        alerts.push({
          id: `bday-${c.id}`,
          type: 'birthday',
          title: isToday ? '¡Cumpleaños Hoy!' : 'Cumpleaños Cercano',
          desc: `El cliente ${c.nombre} cumple años ${daysText} (${new Date(c.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'long' })})`,
          tab: 'crm'
        })
      })

      setNotificaciones(alerts)

      // Cargar Toasts de manera sutil
      const initialToasts = []
      lowStock.slice(0, 2).forEach(p => {
        initialToasts.push({
          id: `toast-stock-${p.id}`,
          type: 'stock',
          title: '⚠️ Stock Mínimo',
          desc: `${p.nombre} está por agotarse.`
        })
      })

      pendingCrm.slice(0, 2).forEach(c => {
        const isTomorrow = c.dias_retraso === -1
        initialToasts.push({
          id: `toast-crm-${c.cliente_id}`,
          type: 'crm',
          title: isTomorrow ? '⏰ CRM Próximo' : '⏰ CRM Recontacto',
          desc: isTomorrow 
            ? `${c.cliente_nombre} reagenda mañana.` 
            : `${c.cliente_nombre} está pendiente de reagenda.`
        })
      })

      upcomingBirthdays.slice(0, 2).forEach(c => {
        const parts = c.fecha_nacimiento.split('-')
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        let nextBday = new Date(today.getFullYear(), month, day)
        if (nextBday < today) {
          nextBday.setFullYear(today.getFullYear() + 1)
        }
        const diffTime = nextBday - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const isToday = diffDays === 0
        initialToasts.push({
          id: `toast-bday-${c.id}`,
          type: 'birthday',
          title: isToday ? '🎉 ¡Cumpleaños Hoy!' : '🎂 Cumpleaños Cercano',
          desc: `${c.nombre} cumple años ${isToday ? 'hoy' : diffDays === 1 ? 'mañana' : `en ${diffDays} días`}.`
        })
      })

      const totalAlerts = lowStock.length + pendingCrm.length + upcomingBirthdays.length
      if (lowStock.length > 2 || pendingCrm.length > 2 || upcomingBirthdays.length > 0) {
        initialToasts.push({
          id: 'toast-summary',
          type: 'info',
          title: '🔔 Nuevas Alertas',
          desc: `Tienes ${totalAlerts} alertas pendientes en el panel superior.`
        })
      }

      initialToasts.forEach((t, index) => {
        setTimeout(() => {
          setToasts(prev => {
            if (prev.some(x => x.id === t.id)) return prev;
            return [...prev, t];
          })
          setTimeout(() => {
            setToasts(prev => prev.filter(x => x.id !== t.id))
          }, 5000)
        }, index * 400)
      })

    } catch (e) {
      console.error('Error al cargar alertas en tiempo real:', e)
    }
  }

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault()
    setLoginError('')
    try {
      const user = await dataService.login(usernameInput, passwordInput)
      setCurrentUser(user)
      setSelectedBranchId(dataService.getSelectedBranchId())
      if (user.rol === 'Administrador') {
        setActiveTab('crm')
      } else {
        setActiveTab('dashboard')
      }
      setUsernameInput('')
      setPasswordInput('')
    } catch (err) {
      setLoginError(err.message || 'Error al iniciar sesión.')
    }
  }

  const handleQuickLogin = async (username) => {
    setLoginError('')
    try {
      const user = await dataService.login(username, '123')
      setCurrentUser(user)
      setSelectedBranchId(dataService.getSelectedBranchId())
      if (user.rol === 'Administrador') {
        setActiveTab('crm')
      } else {
        setActiveTab('dashboard')
      }
    } catch (err) {
      setLoginError(err.message)
    }
  }

  const handleLogout = async () => {
    await dataService.logout()
    setCurrentUser(null)
    setSelectedBranchId(null)
    setActiveTab('dashboard')
  }

  const handleBranchChange = (e) => {
    const val = e.target.value === 'todas' ? null : e.target.value
    dataService.setSelectedBranchId(val)
    setSelectedBranchId(val)
  }

  const renderTab = () => {
    const tabKey = `${activeTab}-${selectedBranchId}`
    if (currentUser?.rol === 'Administrador' && activeTab === 'dashboard') {
      return <ClientesTab key={tabKey} />
    }
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab key={tabKey} onNavigate={(tab) => setActiveTab(tab)} />
      case 'crm':
        return <ClientesTab key={tabKey} />
      case 'seguimiento':
        return <SeguimientoTab key={tabKey} />
      case 'inventario':
        return <InventarioTab key={tabKey} />
      case 'ventas':
        return <VentasTab key={tabKey} />
      case 'servicios':
        return <ServiciosTab key={tabKey} />
      case 'gastos':
        return <GastosTab key={tabKey} />
      default:
        return currentUser?.rol === 'Administrador' 
          ? <ClientesTab key={tabKey} /> 
          : <DashboardTab key={tabKey} onNavigate={(tab) => setActiveTab(tab)} />
    }
  }

  const tabs = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'crm', label: 'Clientes', icon: Users },
    { id: 'seguimiento', label: 'Seguimiento', icon: BellRing },
    { id: 'ventas', label: 'Citas y Ventas', icon: Calendar },
    { id: 'servicios', label: 'Servicios', icon: Scissors },
    { id: 'gastos', label: 'Egresos (Gastos)', icon: TrendingDown },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'sueldos', label: 'Sueldos / Comisiones', icon: DollarSign },
  ]

  // Filtrar pestañas basadas en roles
  const visibleTabs = tabs.filter(tab => {
    if (tab.id === 'dashboard' && currentUser?.rol === 'Administrador') {
      return false
    }
    return true
  })

  // Retornar Pantalla de Login si no hay sesión activa
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-blush-seashell/30 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Decoraciones de fondo estéticas */}
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-blush-palmLeaf/5 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-blush-khaki/10 blur-3xl" />

        <div className="bg-white/85 backdrop-blur-xl border border-white/50 shadow-2xl p-8 rounded-[2.5rem] max-w-md w-full relative z-10 transition-all duration-300">
          <div className="text-center mb-8 flex flex-col items-center">
            <LogoImg className="w-20 h-20 mb-3 shadow-md border border-gray-150" />
            <h2 className="font-display text-3xl font-extrabold tracking-wider text-blush-palmLeaf">BLUSH</h2>
            <span className="text-xxs uppercase tracking-widest text-blush-khaki font-black">Beauty Studio</span>
            <p className="text-xs text-gray-500 mt-2 font-medium">Ingresa tus credenciales para acceder a la gestión sucursal</p>
          </div>

          {loginError && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xxs font-black text-blush-palmLeaf uppercase tracking-wider mb-1.5 ml-1">Usuario</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <UserIcon size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="ej. dueno"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full !pl-10 pr-4 py-3 rounded-2xl bg-white border border-gray-150 focus:border-blush-palmLeaf focus:ring-1 focus:ring-blush-palmLeaf outline-none text-xs font-semibold text-gray-700 placeholder-gray-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xxs font-black text-blush-palmLeaf uppercase tracking-wider mb-1.5 ml-1">Contraseña</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full !pl-10 pr-4 py-3 rounded-2xl bg-white border border-gray-150 focus:border-blush-palmLeaf focus:ring-1 focus:ring-blush-palmLeaf outline-none text-xs font-semibold text-gray-700 placeholder-gray-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blush-palmLeaf hover:bg-blush-palmLeaf-dark text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blush-palmLeaf/25 cursor-pointer mt-2"
            >
              Iniciar Sesión
            </button>
          </form>

          {/* Demostración de Roles Rápidos */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <span className="block text-center text-[10px] font-black text-blush-khaki uppercase tracking-widest mb-3.5">
              Acceso Rápido Demo (Contraseña: 123)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickLogin('dueno')}
                className="px-2 py-2.5 bg-blush-seashell/50 hover:bg-blush-seashell text-blush-palmLeaf border border-blush-seashell-dark/20 rounded-xl font-bold text-[10px] text-center transition-all cursor-pointer"
              >
                👑 Dueño
              </button>
              <button
                onClick={() => handleQuickLogin('gerente_norte')}
                className="px-2 py-2.5 bg-blush-seashell/50 hover:bg-blush-seashell text-blush-palmLeaf border border-blush-seashell-dark/20 rounded-xl font-bold text-[10px] text-center transition-all cursor-pointer"
              >
                👔 Gerente N.
              </button>
              <button
                onClick={() => handleQuickLogin('admin_norte')}
                className="px-2 py-2.5 bg-blush-seashell/50 hover:bg-blush-seashell text-blush-palmLeaf border border-blush-seashell-dark/20 rounded-xl font-bold text-[10px] text-center transition-all cursor-pointer"
              >
                🛠️ Admin N.
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Encontrar nombre de la sucursal actual si está asignada
  const supabaseActive = isSupabaseConfigured && !dataService.isDemoMode()
  const assignedBranch = sucursales.find(s => s.id === currentUser.sucursal_id)

  return (
    <div className="min-h-screen bg-blush-seashell/40 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR NAVIGATION - FIXED & PERMANENT FOR SENIOR ACCESSIBILITY */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-250 flex flex-col justify-between shrink-0 sticky top-0 z-40 h-auto md:h-screen md:overflow-y-auto shadow-sm">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-gray-150 flex items-center gap-3">
            <LogoImg className="w-10 h-10 shadow-sm border border-gray-100" />
            <div>
              <span className="font-display text-xl font-black tracking-wider text-blush-palmLeaf block -mb-0.5">BLUSH</span>
              <span className="text-[9px] uppercase tracking-widest text-blush-khaki font-black block">Beauty Studio</span>
            </div>
          </div>

          {/* Navigation links - large layout for senior accessibility */}
          <nav className="p-4 space-y-2 md:space-y-3">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setShowConfigInfo(false)
                    setShowNotifications(false)
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-black transition-luxury text-left border cursor-pointer ${
                    isActive 
                      ? 'bg-blush-palmLeaf text-white shadow-md shadow-blush-palmLeaf/25 border-blush-khaki/30' 
                      : 'bg-transparent text-gray-600 border-transparent hover:bg-blush-seashell/50 hover:text-blush-palmLeaf'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-blush-palmLeaf'} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* User profile details at the bottom of the sidebar */}
        <div className="p-4 border-t border-gray-150 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blush-seashell/80 p-2 rounded-xl text-blush-palmLeaf border border-blush-khaki/20">
              <UserIcon size={14} />
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-700 leading-tight">{currentUser.nombre}</span>
              <span className="block text-[9px] font-black text-blush-khaki uppercase tracking-wider">{currentUser.rol}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="p-2 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-xl transition-all cursor-pointer flex items-center justify-center"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* RIGHT SIDE MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {dataService.isDemoMode() && (
          <div className="bg-amber-600 text-white text-center py-2.5 px-4 text-xs font-black tracking-wider flex items-center justify-center gap-2 shadow-sm animate-pulse z-50">
            <span>⚠️ MODO ENTRENAMIENTO Y CAPACITACIÓN ACTIVO: Los datos ingresados aquí son temporales y NO afectan a la base de datos real.</span>
            <button 
              onClick={() => {
                dataService.setDemoMode(false);
                window.location.reload();
              }}
              className="bg-white/20 hover:bg-white/30 text-white text-[10px] uppercase px-2 py-0.5 rounded-lg border border-white/40 transition-colors ml-2 cursor-pointer font-extrabold"
            >
              Volver a Producción
            </button>
          </div>
        )}
        
        {/* TOP BAR BAR */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-base font-black text-gray-800 uppercase tracking-wider">
              {tabs.find(t => t.id === activeTab)?.label || 'Panel de Control'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Control Sucursal */}
            {currentUser.rol === 'Dueño' ? (
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-2xl shadow-sm">
                <MapPin size={13} className="text-blush-palmLeaf" />
                <select
                  value={selectedBranchId || 'todas'}
                  onChange={handleBranchChange}
                  className="bg-transparent border-none text-xs font-black text-gray-700 outline-none pr-1 py-0.5 cursor-pointer"
                >
                  <option value="todas">Todas las Sucursales</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-gray-600">
                <MapPin size={13} className="text-blush-khaki" />
                <span>Sucursal: {assignedBranch ? assignedBranch.nombre : 'No asignada'}</span>
              </div>
            )}

            {/* Campana de Notificaciones */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  setShowConfigInfo(false)
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer relative flex items-center justify-center ${
                  notificaciones.length > 0
                    ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 shadow-sm'
                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <BellRing size={16} className={notificaciones.length > 0 ? 'alert-pulse text-amber-600' : 'text-gray-400'} />
                {notificaciones.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-white">
                    {notificaciones.length}
                  </span>
                )}
              </button>

              {/* Dropdown de Alertas */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-3 bg-gray-50 border-b border-gray-150 flex justify-between items-center">
                    <span className="font-bold text-xs text-gray-700">Alertas Activas</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black">
                      {notificaciones.length} Pendientes
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {notificaciones.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-400 font-bold">
                        🎉 ¡Al día! Sin alertas pendientes.
                      </div>
                    ) : (
                      notificaciones.map((n) => (
                        <div key={n.id} className="p-3 hover:bg-gray-50 transition-colors text-xs flex flex-col gap-1">
                          <div className="flex justify-between items-start">
                            <span className={`font-black uppercase text-[9px] tracking-wide px-1.5 py-0.5 rounded ${
                              n.type === 'stock' 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : n.type === 'birthday'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-blush-palmLeaf/10 text-blush-palmLeaf border border-blush-palmLeaf/25'
                            }`}>
                              {n.title}
                            </span>
                            <button
                              onClick={() => {
                                setActiveTab(n.tab)
                                setShowNotifications(false)
                              }}
                              className="text-[10px] text-blush-palmLeaf hover:underline font-black cursor-pointer"
                            >
                              Ver
                            </button>
                          </div>
                          <p className="text-gray-600 font-bold leading-tight">{n.desc}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[10px] text-gray-400 font-bold hover:text-gray-600 cursor-pointer"
                    >
                      Cerrar Panel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selector de Entorno (Producción / Capacitación) */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black text-gray-400 uppercase">Entorno:</span>
              <button
                onClick={() => {
                  const currentDemo = dataService.isDemoMode();
                  dataService.setDemoMode(!currentDemo);
                  window.location.reload();
                }}
                className={`px-2.5 py-0.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                  dataService.isDemoMode()
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
                title="Haz clic para alternar entre el entorno de producción (real) y de entrenamiento (pruebas)"
              >
                {dataService.isDemoMode() ? '⚠️ CAPACITACIÓN / PRUEBAS' : '💼 PRODUCCIÓN'}
              </button>
            </div>

            {/* Database Connection Badge */}
            <div className="relative" ref={configInfoRef}>
              <button 
                onClick={() => {
                  setShowConfigInfo(!showConfigInfo)
                  setShowNotifications(false)
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black transition-all border shadow-sm cursor-pointer ${
                  supabaseActive 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Database size={13} />
                {supabaseActive ? 'Supabase Activa' : 'Modo Demo (Local)'}
                <Info size={12} className="opacity-75" />
              </button>

              {/* Ventana flotante informativa de conexión */}
              {showConfigInfo && (
                <div className="absolute right-0 mt-2 w-72 bg-white p-4 rounded-2xl shadow-xl border border-gray-150 z-50 text-xs text-gray-600 space-y-2 leading-relaxed">
                  <h4 className="font-bold text-gray-800 flex items-center gap-1">
                    <Database size={12} className="text-blush-palmLeaf" />
                    Estado del Servidor
                  </h4>
                  {supabaseActive ? (
                    <p>El sistema está conectado a PostgreSQL de Supabase. Datos sincronizados en la nube de forma segura.</p>
                  ) : (
                    <p>El sistema está ejecutándose con la base de datos local temporal (localStorage). Ideal para realizar pruebas sin afectar la base de datos de producción.</p>
                  )}
                  {dataService.isDemoMode() && (
                    <button 
                      onClick={() => {
                        if (window.confirm("¿Estás seguro de que deseas restablecer los datos de prueba? Esto eliminará todos los clientes, ventas y gastos que hayas creado en este modo de capacitación y los restaurará a los valores iniciales.")) {
                          dataService.restablecerBaseDemo();
                          alert("Base de datos de entrenamiento restablecida con éxito.");
                          window.location.reload();
                        }
                      }}
                      className="w-full text-center bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 font-bold py-2 rounded-xl mt-2 transition-all cursor-pointer animate-pulse"
                    >
                      Restablecer Base de Pruebas
                    </button>
                  )}
                  <button 
                    onClick={() => setShowConfigInfo(false)}
                    className="w-full text-center text-blush-palmLeaf font-bold mt-2 pt-2 border-t border-gray-100 hover:underline cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-grow p-6 md:p-8">
          {/* Banner de aviso demo */}
          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 bg-amber-50/70 border border-amber-200 rounded-3xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-amber-100 rounded-2xl text-amber-800">
                  <Info size={20} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Entorno Demo Interactivo Activo</h4>
                  <p className="text-xs text-amber-700">El sistema tiene cargado datos reales de muestra en tu navegador. Puedes crear registros y probar toda la interfaz libremente con los roles del sistema.</p>
                </div>
              </div>
            </div>
          )}

          {/* Carga del módulo seleccionado con persistencia de estado (keep-alive) */}
          <div className="transition-all duration-300">
            <div className={activeTab === 'dashboard' && currentUser?.rol !== 'Administrador' ? 'animate-tab-active' : ''} style={{ display: activeTab === 'dashboard' && currentUser?.rol !== 'Administrador' ? 'block' : 'none' }}>
              <DashboardTab onNavigate={(tab) => setActiveTab(tab)} activeTab={activeTab} selectedBranchId={selectedBranchId} />
            </div>
            <div className={(activeTab === 'crm' || (currentUser?.rol === 'Administrador' && activeTab === 'dashboard')) ? 'animate-tab-active' : ''} style={{ display: activeTab === 'crm' || (currentUser?.rol === 'Administrador' && activeTab === 'dashboard') ? 'block' : 'none' }}>
              <ClientesTab activeTab={currentUser?.rol === 'Administrador' && activeTab === 'dashboard' ? 'crm' : activeTab} />
            </div>
            <div className={activeTab === 'seguimiento' ? 'animate-tab-active' : ''} style={{ display: activeTab === 'seguimiento' ? 'block' : 'none' }}>
              <SeguimientoTab activeTab={activeTab} selectedBranchId={selectedBranchId} />
            </div>
            <div className={activeTab === 'sueldos' ? 'animate-tab-active' : ''} style={{ display: activeTab === 'sueldos' ? 'block' : 'none' }}>
              <SueldosTab activeTab={activeTab} selectedBranchId={selectedBranchId} />
            </div>
            <div className={activeTab === 'inventario' ? 'animate-tab-active' : ''} style={{ display: activeTab === 'inventario' ? 'block' : 'none' }}>
              <InventarioTab activeTab={activeTab} selectedBranchId={selectedBranchId} />
            </div>
            <div className={activeTab === 'ventas' ? 'animate-tab-active' : ''} style={{ display: activeTab === 'ventas' ? 'block' : 'none' }}>
              <VentasTab activeTab={activeTab} selectedBranchId={selectedBranchId} />
            </div>
            <div className={activeTab === 'servicios' ? 'animate-tab-active' : ''} style={{ display: activeTab === 'servicios' ? 'block' : 'none' }}>
              <ServiciosTab activeTab={activeTab} />
            </div>
            <div className={activeTab === 'gastos' ? 'animate-tab-active' : ''} style={{ display: activeTab === 'gastos' ? 'block' : 'none' }}>
              <GastosTab activeTab={activeTab} selectedBranchId={selectedBranchId} />
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="py-6 border-t border-gray-100 bg-white/20 text-center text-xs text-gray-400 font-medium">
          Blush Beauty Studio © 2026. Todos los derechos reservados.
        </footer>
      </div>

      {/* CONTENEDOR DE TOASTS EMERGENTES */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-white border border-gray-150 p-4 rounded-2xl shadow-xl flex items-start justify-between gap-3 animate-slide-in"
            style={{
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
              borderLeft: t.type === 'stock' ? '4px solid #D97706' : t.type === 'crm' ? '4px solid #748843' : t.type === 'birthday' ? '4px solid #EC4899' : '4px solid #64748B'
            }}
          >
            <div className="flex-1">
              <h5 className="font-bold text-xs text-gray-800 mb-0.5">{t.title}</h5>
              <p className="text-xxs text-gray-500 font-medium leading-tight">{t.desc}</p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

    </div>
  )
}

