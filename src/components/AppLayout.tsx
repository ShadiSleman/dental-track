import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import NotificationBell from './NotificationBell'
import { useOnClickOutside } from '../hooks/useOnClickOutside'
import LabLogo from './LabLogo'

/** Tooth logo — inline SVG, never fails to load */
function AppLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const px = size === 'sm' ? 28 : 36
  return (
    <div
      className="flex-shrink-0 rounded-full flex items-center justify-center"
      style={{
        width: px, height: px,
        background: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)',
      }}
    >
      <svg viewBox="0 0 100 120" width={px * 0.58} height={px * 0.58} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 8 C32 8,16 22,16 40 C16 54,21 63,26 73 C29 81,31 94,33 105 C35 114,39 118,44 118 C48 118,50 110,50 110 C50 110,52 118,56 118 C61 118,65 114,67 105 C69 94,71 81,74 73 C79 63,84 54,84 40 C84 22,68 8,50 8Z"
          fill="white" opacity="0.95"/>
        <line x1="50" y1="90" x2="50" y2="118" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5"/>
        <line x1="50" y1="24" x2="50" y2="36" stroke="#60a5fa" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="44" y1="30" x2="56" y2="30" stroke="#60a5fa" strokeWidth="3.5" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

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

const ROLE_LABELS: Record<string, string> = {
  doctor:      'רופא',
  lab_manager: 'מנהל מעבדה',
  technician:  'טכנאי',
  courier:     'שליח',
  super_admin: 'סופר אדמין',
}

function ProfileButton() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useOnClickOutside(ref, () => setOpen(false))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  // Initials avatar
  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="פרופיל"
      >
        {/* Mobile: small person icon only. Desktop: name + role */}
        <div className="hidden sm:block text-right leading-tight">
          <p className="text-sm font-semibold text-gray-800 max-w-[110px] truncate">{user.name}</p>
          <p className="text-[10px] text-gray-400">{ROLE_LABELS[user.role] ?? user.role}</p>
        </div>
        {/* Mobile only — person circle icon */}
        <span className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-sm select-none">
          {initials}
        </span>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute right-0 top-12 w-[min(260px,calc(100vw-1rem))] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          >
            {/* User info section */}
            <div className="px-4 py-4 bg-gradient-to-br from-primary-50 to-white border-b border-gray-100">
              <p className="font-bold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{ROLE_LABELS[user.role] ?? user.role}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
              >
                <span className="text-lg">🚪</span>
                התנתק
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const location = useLocation()
  const [currentLab, setCurrentLab] = useState<{ name: string; logoUrl?: string | null; _id?: string } | null>(null)

  useEffect(() => {
    if (user?.role === 'lab_manager' && user.labId) {
      import('../api/labs').then(m => m.getMyLab()).then(setCurrentLab).catch(() => {})
    }
  }, [user?.role, user?.labId])

  const items = user ? (NAV_ITEMS[user.role] ?? []) : []

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user?.role === 'lab_manager' && currentLab ? (
              <>
                <LabLogo lab={currentLab} size="sm" />
                <span className="font-extrabold text-[#1a3a6b] text-base sm:text-lg tracking-wide">{currentLab.name}</span>
              </>
            ) : (
              <>
                <AppLogo />
                <span className="font-extrabold text-[#1a3a6b] text-base sm:text-lg tracking-wide">DentalTrack</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <NotificationBell />
            <ProfileButton />
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
