import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

// ─── Cookie helpers (more resilient than localStorage in Chrome) ───────────────
const COOKIE_NAME = 'dt-tok'
const COOKIE_USER = 'dt-usr'
const MAX_AGE     = 60 * 60 * 24 * 30 // 30 days

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};max-age=${MAX_AGE};path=/;SameSite=Lax`
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function clearCookie(name: string) {
  document.cookie = `${name}=;max-age=0;path=/`
}

// Pre-read token from cookie BEFORE zustand even starts (fastest possible restore)
const cookieToken = getCookie(COOKIE_NAME)
const cookieUserRaw = getCookie(COOKIE_USER)
let cookieUser: User | null = null
try { if (cookieUserRaw) cookieUser = JSON.parse(cookieUserRaw) } catch {}

// ─── Store ────────────────────────────────────────────────────────────────────
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
      // Initialise from cookie immediately — no wait for localStorage hydration
      token: cookieToken,
      user:  cookieUser,
      _hasHydrated: !!cookieToken, // if cookie exists, skip spinner
      setAuth: (token, user) => {
        set({ token, user })
        // Backup to cookie so Chrome can restore after localStorage loss
        setCookie(COOKIE_NAME, token)
        setCookie(COOKIE_USER, JSON.stringify(user))
      },
      logout: () => {
        set({ token: null, user: null })
        localStorage.removeItem('dt-auth')
        localStorage.removeItem('dt_token')
        localStorage.removeItem('dt-remember')
        sessionStorage.clear()
        clearCookie(COOKIE_NAME)
        clearCookie(COOKIE_USER)
      },
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'dt-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => (state, error) => {
        if (error) console.warn('[auth] rehydrate error:', error)
        const s = state ?? useAuthStore.getState()
        s.setHasHydrated(true)
        // If localStorage had a token but cookies were missing, re-set cookies
        if (s.token && !getCookie(COOKIE_NAME)) {
          setCookie(COOKIE_NAME, s.token)
          if (s.user) setCookie(COOKIE_USER, JSON.stringify(s.user))
        }
      },
    },
  ),
)

// Safety net: force hydrated after 400ms in case onRehydrateStorage never fires
setTimeout(() => {
  if (!useAuthStore.getState()._hasHydrated)
    useAuthStore.getState().setHasHydrated(true)
}, 400)
