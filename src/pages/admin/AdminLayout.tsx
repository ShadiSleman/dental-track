import { useState } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'

const ADMIN_NAV = [
  { to: '/admin',               label: 'דשבורד',   icon: '📊', exact: true },
  { to: '/admin/users',         label: 'משתמשים',  icon: '👥' },
  { to: '/admin/labs',          label: 'מעבדות',   icon: '🏭' },
  { to: '/admin/subscriptions', label: 'מנויים',   icon: '💳' },
  { to: '/admin/pricing',       label: 'מחירון',   icon: '🏷️' },
  { to: '/admin/logs',          label: 'לוגים',    icon: '📋' },
  { to: '/admin/health',        label: 'מערכת',    icon: '❤️' },
  { to: '/admin/support',       label: 'תמיכה',    icon: '🎧' },
]

export default function AdminLayout() {
  const location            = useLocation()
  const navigate            = useNavigate()
  const { user, logout }    = useAuthStore()
  const [menuOpen, setMenu] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)

  const currentPage = ADMIN_NAV.find(n =>
    n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to)
  )

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950 text-white">

      {/* ─── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-gray-900 border-l border-gray-800 flex-col">
        <div className="px-4 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-sm">🦷</div>
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
          <p className="text-xs text-gray-500 mb-3 truncate">{user?.email}</p>
          <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300">
            יציאה ←
          </button>
        </div>
      </aside>

      {/* ─── Mobile Top Bar ───────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-40 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-sm">🦷</div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Admin Panel</p>
            {currentPage && <p className="text-[10px] text-gray-400">{currentPage.icon} {currentPage.label}</p>}
          </div>
        </div>
        <button
          onClick={() => setMenu(v => !v)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-gray-800 transition-colors"
          aria-label="תפריט"
        >
          <span className={`block w-5 h-0.5 bg-gray-300 transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-300 transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-300 transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </header>

      {/* ─── Mobile Drawer Menu ───────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setMenu(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="md:hidden fixed top-0 right-0 bottom-0 w-72 bg-gray-900 border-l border-gray-800 z-50 flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                <div>
                  <p className="font-bold text-white">DentalTrack Admin</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
                <button onClick={() => setMenu(false)} className="text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 py-4 px-4 space-y-1 overflow-y-auto">
                {ADMIN_NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenu(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive(item.to, item.exact)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Logout */}
              <div className="p-4 border-t border-gray-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 text-sm font-medium transition-colors"
                >
                  <span className="text-xl">🚪</span>
                  התנתק
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto bg-gray-950">
        <div className="max-w-6xl mx-auto p-4 md:p-6 pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
