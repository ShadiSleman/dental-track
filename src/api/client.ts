import axios from 'axios'

const resolveBase = (): string => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL as string
  return '/api'
}

const api = axios.create({
  baseURL: resolveBase(),
  timeout: 25000,
})

// Read token — localStorage first, cookie as fallback
function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem('dt-auth')
    if (raw) {
      const t = JSON.parse(raw)?.state?.token
      if (t) return t
    }
  } catch {}
  // Cookie fallback (survives Chrome localStorage clearing)
  const m = document.cookie.match(/(?:^|; )dt-tok=([^;]*)/)
  return m ? decodeURIComponent(m[1]) : null
}

// Decode JWT payload without verifying signature (just to check expiry)
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp && payload.exp < Date.now() / 1000
  } catch {
    return false // if we can't parse, assume it's valid
  }
}

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      const isLoginEndpoint = err.config?.url?.includes('/auth/login')
      const token = getStoredToken()

      if (!isLoginEndpoint && token) {
        // Only clear session if the token is genuinely expired/invalid
        // (not a transient server/cold-start error)
        if (isTokenExpired(token)) {
          localStorage.removeItem('dt-auth')
          window.location.href = '/login'
        }
        // If token looks valid but server returned 401 → transient error
        // Don't log the user out — let the next request retry
      }
    }
    return Promise.reject(err)
  },
)

export default api
