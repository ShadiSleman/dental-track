import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const ADMIN_NAV = [
  { to: '/admin',               label: 'דשבורד',   icon: '📊', exact: true },
  { to: '/admin/users',         label: 'משתמשים',  icon: '👥' },
  { to: '/admin/labs',          label: 'מעבדות',   icon: '🏭' },
  { to: '/admin/subscriptions', label: 'מנויים',   icon: '💳' },
  { to: '/admin/logs',          label: 'לוגים',    icon: '📋' },
  { to: '/admin/health',        label: 'מערכת',    icon: '❤️' },
  { to: '/admin/support',       label: 'תמיכה',    icon: '🎧' },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <div className="min-h-screen flex bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 border-l border-gray-800 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <img src="/tooth.svg" className="w-7 h-7 invert" alt="" />
            <div>
              <p className="font-bold text-white text-sm">DentalTrack</p>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.to, item.exact)
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-400 mb-1">{user?.name}</p>
          <p className="text-xs text-gray-500 mb-3">{user?.email}</p>
          <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300">
            יציאה ←
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-gray-950">
        <div className="max-w-6xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
