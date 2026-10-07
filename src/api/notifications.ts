import api from './client'
import type { AppNotification } from '../types'

export const getNotifications = () =>
  api.get<AppNotification[]>('/notifications').then(r => r.data)

export const markAllRead = () =>
  api.patch('/notifications/read-all').then(r => r.data)

export const markOneRead = (id: string) =>
  api.patch<AppNotification>(`/notifications/${id}/read`).then(r => r.data)
