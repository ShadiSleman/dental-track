/**
 * usePolling — lightweight HTTP polling (performance-optimised).
 * • Notifications: every 15 s  (was 4 s) — main real-time channel
 * • Work orders:   every 45 s  (was 10 s) — dashboard refreshes on focus too
 * Reduces server load from ~15 req/min → ~5 req/min per user.
 * For 200 users: was ~3000 req/min, now ~1000 req/min.
 */
import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore }   from '../store/authStore'
import { useNotifStore }  from '../store/notifStore'
import { useOrdersStore } from '../store/ordersStore'
import api from '../api/client'
import type { AppNotification, WorkOrder } from '../types'

export function usePolling() {
  const token            = useAuthStore((s) => s.token)
  const setNotifications = useNotifStore((s) => s.setNotifications)
  const setOrders        = useOrdersStore((s) => s.setOrders)
  const active           = useRef(false)

  const pollNotifs = useCallback(async () => {
    try {
      const { data } = await api.get<AppNotification[]>('/notifications')
      setNotifications(data)
    } catch { /* silently ignore — user may have logged out */ }
  }, [setNotifications])

  const pollOrders = useCallback(async () => {
    try {
      const { data } = await api.get<WorkOrder[]>('/work-orders/mine')
      setOrders(data)
    } catch {}
  }, [setOrders])

  useEffect(() => {
    if (!token || active.current) return
    active.current = true

    // Immediate first fetch
    pollNotifs()
    pollOrders()

    const notifTimer  = setInterval(pollNotifs, 15_000)   // every 15 s
    const ordersTimer = setInterval(pollOrders, 45_000)   // every 45 s

    // Also refresh orders when tab becomes visible again
    const onVisible = () => { if (document.visibilityState === 'visible') pollOrders() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(notifTimer)
      clearInterval(ordersTimer)
      document.removeEventListener('visibilitychange', onVisible)
      active.current = false
    }
  }, [token, pollNotifs, pollOrders])
}
