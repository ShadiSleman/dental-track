import api from './client'
import type { Lab } from '../types'

export const getLabs = () =>
  api.get<(Lab & { address?: string; phone?: string; email?: string })[]>('/labs').then(r => r.data)

export const getMyLab = () =>
  api.get<Lab & { address?: string; phone?: string; email?: string }>('/labs/mine').then(r => r.data)
