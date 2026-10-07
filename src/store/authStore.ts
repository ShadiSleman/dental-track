import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '../types'

interface AuthStore {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
}

// Custom storage: checks 'dt-remember' flag to decide localStorage vs sessionStorage
const rememberStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    // Check session first (for non-remembered logins), then localStorage
    return sessionStorage.getItem(name) ?? localStorage.getItem(name)
  },
  setItem: (name: string, value: string) => {
    if (localStorage.getItem('dt-remember') === '1') {
      localStorage.setItem(name, value)
      sessionStorage.removeItem(name)
    } else {
      sessionStorage.setItem(name, value)
      localStorage.removeItem(name)
    }
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
  },
}))

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => {
        set({ token: null, user: null })
        localStorage.removeItem('dt-auth')
        localStorage.removeItem('dt_token')
        localStorage.removeItem('dt-remember')
        sessionStorage.removeItem('dt-auth')
      },
    }),
    {
      name: 'dt-auth',
      storage: rememberStorage,
    },
  ),
)
