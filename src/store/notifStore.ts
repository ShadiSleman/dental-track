import { create } from 'zustand'
import type { AppNotification } from '../types'

interface NotifStore {
  notifications: AppNotification[]
  unreadCount: number
  addNotification: (n: AppNotification) => void
  markAllRead: () => void
  setNotifications: (ns: AppNotification[]) => void
}

export const useNotifStore = create<NotifStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (n) => {
    set({
      notifications: [n, ...get().notifications],
      unreadCount: get().unreadCount + (n.read ? 0 : 1),
    })
  },
  markAllRead: () =>
    set({
      notifications: get().notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }),
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),
}))
