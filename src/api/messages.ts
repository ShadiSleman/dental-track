import api from './client'
import type { Message } from '../types'

export const getMessages = (workOrderId: string) =>
  api.get<Message[]>(`/messages/${workOrderId}`).then((r) => r.data)

export const sendMessage = (workOrderId: string, text: string) =>
  api.post<Message>('/messages', { workOrderId, text }).then((r) => r.data)
