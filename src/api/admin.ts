import api from './client'
import type { User, AuditLog, Subscription, SupportTicket } from '../types'

export const getAdminStats = () =>
  api.get<{
    totalUsers: number
    totalLabs: number
    totalClinics: number
    totalOrders: number
    openOrders: number
    delayedOrders: number
    mrr: number
    recentSignups: User[]
    ordersByMonth: { month: string; count: number }[]
    topLabs: { name: string; orders: number }[]
  }>('/admin/stats').then((r) => r.data)

export const getAdminUsers = (params?: Record<string, string>) =>
  api.get<{ users: User[]; total: number }>('/admin/users', { params }).then((r) => r.data)

export const updateUser = (id: string, data: Partial<User> & { isActive?: boolean }) =>
  api.patch<User>(`/admin/users/${id}`, data).then((r) => r.data)

export const deleteUser = (id: string) =>
  api.delete(`/admin/users/${id}`).then((r) => r.data)

export const resetUserPassword = (id: string) =>
  api.post(`/admin/users/${id}/reset-password`).then((r) => r.data)

export const getSubscriptions = (params?: Record<string, string>) =>
  api.get<{ subscriptions: Subscription[]; total: number }>('/admin/subscriptions', { params }).then((r) => r.data)

export const updateSubscription = (id: string, data: Partial<Subscription>) =>
  api.patch<Subscription>(`/admin/subscriptions/${id}`, data).then((r) => r.data)

export const getLogs = (params?: Record<string, string>) =>
  api.get<{ logs: AuditLog[]; total: number }>('/admin/logs', { params }).then((r) => r.data)

export const getSystemHealth = () =>
  api.get<{
    uptime: number
    dbStatus: string
    socketClients: number
    recentErrors: { message: string; route: string; createdAt: string }[]
    nodeVersion: string
    region: string
  }>('/admin/health').then((r) => r.data)

export const getTickets = (params?: Record<string, string>) =>
  api.get<{ tickets: SupportTicket[]; total: number }>('/admin/tickets', { params }).then((r) => r.data)

export const replyTicket = (id: string, text: string) =>
  api.post(`/admin/tickets/${id}/reply`, { text }).then((r) => r.data)

export const updateTicketStatus = (id: string, status: SupportTicket['status']) =>
  api.patch(`/admin/tickets/${id}`, { status }).then((r) => r.data)
