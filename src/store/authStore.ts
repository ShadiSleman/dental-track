import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthStore {
  token: string | null
  user: User | null
  _hasHydrated: boolean
  setAuth: (token: string, user: User) => void
  logout: () => void
  setHasHydrated: (v: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      _hasHydrated: false,
      setAuth: (token, user) => set({ token, user }),
      logout: () => {
        set({ token: null, user: null })
        // Clean up any legacy keys
        localStorage.removeItem('dt-auth')
        localStorage.removeItem('dt_token')
        localStorage.removeItem('dt-remember')
        sessionStorage.clear()
      },
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'dt-auth',
      // Only persist token + user (not the hydration flag)
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
