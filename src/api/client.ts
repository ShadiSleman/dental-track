import axios from 'axios'

const resolveBase = (): string => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL as string
  return '/api'
}

const api = axios.create({
  baseURL: resolveBase(),
  timeout: 25000,
})

// Read token from zustand's persist key (dt-auth → state.token)
function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem('dt-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state?.token ?? null
  } catch {
    return null
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
    // Only auto-redirect on 401 if:
    // 1. We actually had a token (session expired — not a bad login attempt)
    // 2. NOT on the /auth/login endpoint (that 401 = wrong password, show error instead)
    if (err.response?.status === 401) {
      const isLoginEndpoint = err.config?.url?.includes('/auth/login')
      const hadToken = !!getStoredToken()

      if (!isLoginEndpoint && hadToken) {
        // Session expired — clear auth and redirect
        localStorage.removeItem('dt-auth')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  },
)

export default api
