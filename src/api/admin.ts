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
    billing?: {
      lifetimeCount: number
      monthlyCount: number
      lifetimeLabs: { _id: string; name: string; plan: string | null; price: number; validUntil: string | null }[]
      monthlyLabs: { _id: string; name: string; plan: string | null; price: number; validUntil: string | null }[]
    }
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

// ─── Lab management ───────────────────────────────────────────────────────────
export const getAdminLabs = () =>
  api.get<AdminLabEntry[]>('/admin/labs').then((r) => r.data)

export const getAdminLab = (id: string) =>
  api.get<AdminLabDetail>(`/admin/labs/${id}`).then((r) => r.data)

export const createAdminLab = (data: CreateLabPayload) =>
  api.post<{ lab: AdminLabEntry; manager: User; subscription: AdminSubscriptionRecord }>('/admin/labs', data).then((r) => r.data)

export const updateAdminLab = (id: string, data: Partial<{ name: string; address: string; phone: string; email: string; isActive: boolean }>) =>
  api.patch<AdminLabEntry>(`/admin/labs/${id}`, data).then((r) => r.data)

export const deleteAdminLab = (id: string) =>
  api.delete(`/admin/labs/${id}`).then((r) => r.data)

export const uploadLabLogo = (id: string, file: File) => {
  const fd = new FormData()
  fd.append('logo', file)
  return api.post<AdminLabEntry>(`/admin/labs/${id}/logo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
}

export const addLabTeamMember = (labId: string, data: AddTeamMemberPayload) =>
  api.post<User>(`/admin/labs/${labId}/team`, data).then((r) => r.data)

export const removeLabTeamMember = (labId: string, userId: string) =>
  api.delete(`/admin/labs/${labId}/team/${userId}`).then((r) => r.data)

export const addLabSubscription = (labId: string, data: { plan: string; price: number; paymentNote?: string }) =>
  api.post<AdminSubscriptionRecord>(`/admin/labs/${labId}/subscriptions`, data).then((r) => r.data)

export interface PriceCatalog {
  lifetimePrice: number
  starterPrice: number
  standardPrice: number
  proPrice: number
}

export const getPricing = () =>
  api.get<PriceCatalog>('/admin/pricing').then((r) => r.data)

export const updatePricing = (data: PriceCatalog) =>
  api.patch<PriceCatalog>('/admin/pricing', data).then((r) => r.data)

// Types for lab management
export interface AdminLabEntry {
  _id: string
  name: string
  email?: string
  phone?: string
  address?: string
  logoUrl?: string
  isActive: boolean
  technicianCount: number
  doctorCount: number
  openOrders: number
  billingPhase?: 'lifetime' | 'monthly' | 'none'
  subscription: AdminSubscriptionRecord | null
  createdAt: string
}

export interface AdminLabDetail extends AdminLabEntry {
  team: User[]
  subscriptions: AdminSubscriptionRecord[]
  totalOrders: number
}

export interface AdminSubscriptionRecord {
  _id: string
  labId: string
  plan: string
  status: string
  price: number
  validUntil: string
  createdAt: string
}

export interface CreateLabPayload {
  name: string
  address?: string
  phone?: string
  email?: string
  managerName?: string
  managerEmail: string
  managerPassword: string
  plan: string
  price?: number
}

export interface AddTeamMemberPayload {
  name?: string
  email: string
  password?: string
  role: string
  phone?: string
}
