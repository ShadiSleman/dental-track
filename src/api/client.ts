import axios from 'axios'

const resolveBase = (): string => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL as string
  return '/api'
}

const api = axios.create({ baseURL: resolveBase() })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dt_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dt_token')
      localStorage.removeItem('dt_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default api
