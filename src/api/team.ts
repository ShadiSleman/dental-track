import api from './client'
import type { User } from '../types'

export interface TeamMember extends Pick<User, '_id' | 'name' | 'email' | 'phone' | 'role' | 'isActive' | 'createdAt'> {
  clinicId?: string
}

export interface CreateMemberData {
  name: string
  email: string
  password: string
  phone?: string
  role: 'technician' | 'doctor'
  clinicId?: string
}

export const getTeam = () =>
  api.get<{ technicians: TeamMember[]; doctors: TeamMember[] }>('/team').then(r => r.data)

export const createMember = (data: CreateMemberData) =>
  api.post<TeamMember>('/team', data).then(r => r.data)

export const updateMember = (id: string, data: Partial<CreateMemberData & { isActive: boolean }>) =>
  api.patch<TeamMember>(`/team/${id}`, data).then(r => r.data)

export const deleteMember = (id: string) =>
  api.delete(`/team/${id}`).then(r => r.data)
