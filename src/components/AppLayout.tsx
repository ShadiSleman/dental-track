import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import NotificationBell from './NotificationBell'

const NAV_ITEMS = {
  doctor: [
    { to: '/dashboard', label: 'עבודות שלי', icon: '🦷' },
    { to: '/orders/new', label: 'עבודה חדשה', icon: '➕' },
  ],
  lab_manager: [
    { to: '/dashboard', label: 'לוח עבודות', icon: '📋' },
    { to: '/lab/stats', label: 'סטטיסטיקות', icon: '📊' },
    { to: '/lab/team', label: 'ניהול צוות', icon: '👥' },
  ],
  technician: [
    { to: '/dashboard', label: 'העבודות שלי', icon: '🔧' },
  ],
  courier: [
    { to: '/dashboard', label: 'משלוחים', icon: '🚚' },
  ],
  super_admin: [
    { to: '/admin', label: 'דשבורד', icon: '📊' },
    { to: '/admin/users', label: 'משתמשים', icon: '👥' },
    { to: '/admin/subscriptions', label: 'מנויים', icon: '💳' },
    { to: '/admin/logs', label: 'לוגים', icon: '📋' },
    { to: '/admin/health', label: 'מערכת', icon: '❤️' },
    { to: '/admin/support', label: 'תמיכה', icon: '🎧' },
  ],
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const items = user ? (NAV_ITEMS[user.role] ?? []) : []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/tooth.svg" className="w-7 h-7" alt="logo" />
            <span className="font-bold text-primary-700 text-lg tracking-tight">DentalTrack</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="text-sm text-gray-600 hidden sm:block">{user?.name}</div>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1">
              יציאה
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-5xl mx-auto w-full">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex flex-col w-52 border-l border-gray-100 bg-white py-4 px-3 gap-1">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.to
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 overflow-auto">{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-40">
        <div className="flex">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                location.pathname === item.to ? 'text-primary-600' : 'text-gray-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
