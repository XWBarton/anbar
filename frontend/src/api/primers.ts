import client from './client'
import type { Primer, StoredItem } from '../types'

export const getPrimers = async (q?: string): Promise<Primer[]> => {
  const { data } = await client.get<Primer[]>('/primers/', { params: q ? { q } : {} })
  return data
}

export const getPrimer = async (id: number): Promise<Primer> => {
  const { data } = await client.get<Primer>(`/primers/${id}`)
  return data
}

export const getPrimerItems = async (id: number): Promise<StoredItem[]> => {
  const { data } = await client.get<StoredItem[]>(`/primers/${id}/items`)
  return data
}

export const createPrimer = async (payload: Partial<Primer>): Promise<Primer> => {
  const { data } = await client.post<Primer>('/primers/', payload)
  return data
}

export const updatePrimer = async (id: number, payload: Partial<Primer>): Promise<Primer> => {
  const { data } = await client.put<Primer>(`/primers/${id}`, payload)
  return data
}

export const deletePrimer = async (id: number): Promise<void> => {
  await client.delete(`/primers/${id}`)
}
