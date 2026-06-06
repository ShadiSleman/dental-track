import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      localStorage.setItem('dt_token', token)
      setAuth(token, user)
      if (user.role === 'super_admin') navigate('/admin')
      else navigate('/dashboard')
    } catch {
      setError('אימייל או סיסמה שגויים')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-dental-teal flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <img src="/tooth.svg" className="w-14 h-14 mb-3" alt="logo" />
          <h1 className="text-2xl font-bold text-gray-900">DentalTrack</h1>
          <p className="text-sm text-gray-500 mt-1">מערכת מעקב עבודות שיניים</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">אימייל</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="doctor@clinic.co.il"
              dir="ltr"
            />
          </div>
          <div>
            <label className="label">סיסמה</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 DentalTrack · כל הזכויות שמורות
        </p>
      </motion.div>
    </div>
  )
}
