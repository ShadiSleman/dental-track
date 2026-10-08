import api from './client'
import type { WorkOrder, Stage } from '../types'

export const getMyOrders = () =>
  api.get<WorkOrder[]>('/work-orders/mine').then((r) => r.data)

export const getAllOrders = (params?: Record<string, string>) =>
  api.get<WorkOrder[]>('/work-orders', { params }).then((r) => r.data)

export const getOrder = (id: string) =>
  api.get<WorkOrder>(`/work-orders/${id}`).then((r) => r.data)

export const createOrder = (data: FormData) =>
  api.post<WorkOrder>('/work-orders', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  }).then((r) => r.data)

export const updateStage = (id: string, stage: Stage, note?: string) =>
  api.patch<WorkOrder>(`/work-orders/${id}/stage`, { stage, note }).then((r) => r.data)

export const approveOrder = (id: string) =>
  api.patch<WorkOrder>(`/work-orders/${id}/approve`).then((r) => r.data)

export const rejectOrder = (id: string, reason: string) =>
  api.patch<WorkOrder>(`/work-orders/${id}/reject`, { reason }).then((r) => r.data)

export const assignTechnician = (id: string, technicianId: string) =>
  api.patch<WorkOrder>(`/work-orders/${id}/assign`, { technicianId }).then((r) => r.data)

export const uploadStageImages = (id: string, data: FormData) =>
  api.post<WorkOrder>(`/work-orders/${id}/images`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)

export const uploadOrderFiles = (id: string, data: FormData) =>
  api.post<WorkOrder>(`/work-orders/${id}/files`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }).then((r) => r.data)

export const saveSignature = (id: string, signature: string) =>
  api.patch<WorkOrder>(`/work-orders/${id}/signature`, { signature }).then((r) => r.data)

export const getLabStats = () =>
  api.get<{
    total: number
    open: number
    delayed: number
    delivered: number
    byStage: { _id: string; count: number }[]
    byType: { _id: string; count: number }[]
    byMonth: { month: string; count: number }[]
    byTech: { _id: string; name: string; orders: number; delayed: number }[]
  }>('/work-orders/stats').then((r) => r.data)
