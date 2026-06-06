import api from './client'
import type { User } from '../types'

export interface LoginResponse {
  token: string
  user: User
}

export const login = (email: string, password: string) =>
  api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data)

export const getMe = () =>
  api.get<User>('/auth/me').then((r) => r.data)
