import client from './client'
import type { Extract, StoredItem } from '../types'

export const getExtracts = async (q?: string): Promise<Extract[]> => {
  const { data } = await client.get<Extract[]>('/extracts/', { params: q ? { q } : {} })
  return data
}

export const getExtract = async (id: number): Promise<Extract> => {
  const { data } = await client.get<Extract>(`/extracts/${id}`)
  return data
}

export const getExtractItems = async (id: number): Promise<StoredItem[]> => {
  const { data } = await client.get<StoredItem[]>(`/extracts/${id}/items`)
  return data
}

export const createExtract = async (payload: Partial<Extract>): Promise<Extract> => {
  const { data } = await client.post<Extract>('/extracts/', payload)
  return data
}

export const updateExtract = async (id: number, payload: Partial<Extract>): Promise<Extract> => {
  const { data } = await client.put<Extract>(`/extracts/${id}`, payload)
  return data
}

export const deleteExtract = async (id: number): Promise<void> => {
  await client.delete(`/extracts/${id}`)
}
