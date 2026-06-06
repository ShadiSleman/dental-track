import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
import { useOrdersStore } from '../store/ordersStore'
import { useNotifStore } from '../store/notifStore'
import type { WorkOrder, AppNotification } from '../types'

let socket: Socket | null = null

export const useSocket = () => {
  const token = useAuthStore((s) => s.token)
  const upsertOrder = useOrdersStore((s) => s.upsertOrder)
  const addNotification = useNotifStore((s) => s.addNotification)
  const connected = useRef(false)

  useEffect(() => {
    if (!token || connected.current) return

    const base = import.meta.env.VITE_API_URL
      ? (import.meta.env.VITE_API_URL as string).replace('/api', '')
      : window.location.origin

    socket = io(base, { auth: { token }, transports: ['websocket'] })
    connected.current = true

    socket.on('stage_updated', (order: WorkOrder) => {
      upsertOrder(order)
    })

    socket.on('notification', (n: AppNotification) => {
      addNotification(n)
    })

    return () => {
      socket?.disconnect()
      socket = null
      connected.current = false
    }
  }, [token, upsertOrder, addNotification])

  return socket
}

export const getSocket = () => socket
