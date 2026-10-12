import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'

// Exact brand navy from logo
const NAVY = '#1a3a6b'
const NAVY_LIGHT = '#22508f'
const NAVY_DARK = '#0f2244'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await login(email, password)
      setAuth(token, user, rememberMe)
      if (user.role === 'super_admin') navigate('/admin')
      else navigate('/dashboard')
    } catch {
      setError('אימייל או סיסמה שגויים')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{ background: `linear-gradient(160deg, ${NAVY_DARK} 0%, ${NAVY} 45%, #1e5aa8 100%)` }}>

      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, #4af 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
      {/* Tooth silhouette watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none"
        style={{ fontSize: '28rem', lineHeight: 1 }}>
        🦷
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.35)] overflow-hidden">

          {/* Top hero section */}
          <div className="relative px-8 pt-10 pb-8 text-center"
            style={{ background: `linear-gradient(160deg, ${NAVY_DARK} 0%, ${NAVY} 100%)` }}>
            {/* Subtle wave at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-white"
              style={{ borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }} />

            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="flex justify-center mb-4"
            >
              <div className="w-24 h-24 rounded-full border-4 border-white/30 shadow-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)' }}>
                {/* Inline tooth SVG — always renders, no external file dependency */}
                <svg viewBox="0 0 100 120" width="56" height="56" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Tooth body */}
                  <path d="M50 8 C32 8,16 22,16 40 C16 54,21 63,26 73 C29 81,31 94,33 105 C35 114,39 118,44 118 C48 118,50 110,50 110 C50 110,52 118,56 118 C61 118,65 114,67 105 C69 94,71 81,74 73 C79 63,84 54,84 40 C84 22,68 8,50 8Z"
                    fill="white" opacity="0.95"/>
                  {/* Root split line */}
                  <line x1="50" y1="90" x2="50" y2="118" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5"/>
                  {/* Shine */}
                  <ellipse cx="37" cy="30" rx="7" ry="11" fill="white" opacity="0.2" transform="rotate(-15,37,30)"/>
                  {/* Cross mark */}
                  <line x1="50" y1="24" x2="50" y2="36" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="44" y1="30" x2="56" y2="30" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h1 className="text-3xl font-extrabold tracking-widest text-white mb-1">DentalTrack</h1>
              <p className="text-blue-200 text-sm font-light">מערכת מעקב עבודות מעבדת שיניים</p>
            </motion.div>
          </div>

          {/* Form section */}
          <div className="px-8 py-8">
            <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">כניסה למערכת</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>
                  כתובת אימייל
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-base select-none">✉️</span>
                  <input
                    type="email"
                    className="w-full border-2 border-gray-100 focus:border-[#1a3a6b] rounded-xl px-4 py-3 pr-9 text-sm outline-none transition-colors bg-gray-50 focus:bg-white"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder=""
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: NAVY }}>
                  סיסמה
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 select-none">🔒</span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="w-full border-2 border-gray-100 focus:border-[#1a3a6b] rounded-xl px-4 py-3 pr-9 pl-10 text-sm outline-none transition-colors bg-gray-50 focus:bg-white"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder=""
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs transition-colors"
                  >
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setRememberMe(v => !v)}
                  className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors flex-shrink-0 ${
                    rememberMe ? 'border-[#1a3a6b] bg-[#1a3a6b]' : 'border-gray-300 bg-white'
                  }`}
                >
                  {rememberMe && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>}
                </div>
                <span className="text-sm text-gray-600">זכור אותי</span>
              </label>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                >
                  <span>⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-all mt-2 relative overflow-hidden"
                style={{
                  background: loading
                    ? '#94a3b8'
                    : `linear-gradient(135deg, ${NAVY} 0%, #2563eb 100%)`,
                  boxShadow: loading ? 'none' : `0 8px 24px rgba(26,58,107,0.4)`,
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    מתחבר...
                  </span>
                ) : 'כניסה →'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-gray-400">© 2026 DentalTrack · כל הזכויות שמורות</p>
          </div>
        </div>

        {/* Tagline below card */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-white/40 text-xs mt-6"
        >
          מערכת מאובטחת · כניסה מורשית בלבד
        </motion.p>
      </motion.div>
    </div>
  )
}
