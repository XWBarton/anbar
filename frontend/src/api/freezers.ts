import client from './client'
import type { Freezer, FreezerMap } from '../types'

export const getFreezers = async (): Promise<Freezer[]> => {
  const { data } = await client.get<Freezer[]>('/freezers/')
  return data
}

export const getFreezer = async (id: number): Promise<Freezer> => {
  const { data } = await client.get<Freezer>(`/freezers/${id}`)
  return data
}

export const getFreezerMap = async (id: number): Promise<FreezerMap> => {
  const { data } = await client.get<FreezerMap>(`/freezers/${id}/map`)
  return data
}

export const createFreezer = async (payload: Partial<Freezer>): Promise<Freezer> => {
  const { data } = await client.post<Freezer>('/freezers/', payload)
  return data
}

export const updateFreezer = async (id: number, payload: Partial<Freezer>): Promise<Freezer> => {
  const { data } = await client.put<Freezer>(`/freezers/${id}`, payload)
  return data
}

export const deleteFreezer = async (id: number): Promise<void> => {
  await client.delete(`/freezers/${id}`)
}
