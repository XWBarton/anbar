import apiClient from './client'
import type { User } from '../types'

export const getUsers = async (): Promise<User[]> => {
  const { data } = await apiClient.get<User[]>('/users/')
  return data
}

export const createUser = async (payload: {
  username: string; full_name: string; email: string; password: string; is_admin?: boolean
}): Promise<User> => {
  const { data } = await apiClient.post<User>('/users/', payload)
  return data
}

export const updateUser = async (id: number, payload: Partial<User> & { password?: string }): Promise<User> => {
  const { data } = await apiClient.put<User>(`/users/${id}`, payload)
  return data
}

export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/users/${id}`)
}
