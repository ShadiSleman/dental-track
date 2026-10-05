/**
 * usePolling — replaces Socket.io with lightweight HTTP polling.
 * • Notifications: every 4 s  → updates notifStore
 * • Work orders:   every 10 s → updates ordersStore
 */
import { useEffect, useRef } from 'react'
import { useAuthStore }  from '../store/authStore'
import { useNotifStore } from '../store/notifStore'
import { useOrdersStore } from '../store/ordersStore'
import api from '../api/client'
import type { AppNotification, WorkOrder } from '../types'

export function usePolling() {
  const token           = useAuthStore((s) => s.token)
  const setNotifications = useNotifStore((s) => s.setNotifications)
  const setOrders       = useOrdersStore((s) => s.setOrders)
  const active          = useRef(false)

  useEffect(() => {
    if (!token || active.current) return
    active.current = true

    const pollNotifs = async () => {
      try {
        const { data } = await api.get<AppNotification[]>('/notifications')
        setNotifications(data)
      } catch {
        // silently ignore — user may have logged out
      }
    }

    const pollOrders = async () => {
      try {
        const { data } = await api.get<WorkOrder[]>('/work-orders/mine')
        setOrders(data)
      } catch {}
    }

    // Immediate first fetch
    pollNotifs()
    pollOrders()

    const notifTimer  = setInterval(pollNotifs,  4_000)
    const ordersTimer = setInterval(pollOrders, 10_000)

    return () => {
      clearInterval(notifTimer)
      clearInterval(ordersTimer)
      active.current = false
    }
  }, [token, setNotifications, setOrders])
}
