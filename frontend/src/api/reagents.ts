import client from './client'
import type { Reagent, StoredItem } from '../types'

export const getReagents = async (q?: string): Promise<Reagent[]> => {
  const { data } = await client.get<Reagent[]>('/reagents/', { params: q ? { q } : {} })
  return data
}

export const getReagent = async (id: number): Promise<Reagent> => {
  const { data } = await client.get<Reagent>(`/reagents/${id}`)
  return data
}

export const getReagentItems = async (id: number): Promise<StoredItem[]> => {
  const { data } = await client.get<StoredItem[]>(`/reagents/${id}/items`)
  return data
}

export const createReagent = async (payload: Partial<Reagent>): Promise<Reagent> => {
  const { data } = await client.post<Reagent>('/reagents/', payload)
  return data
}

export const updateReagent = async (id: number, payload: Partial<Reagent>): Promise<Reagent> => {
  const { data } = await client.put<Reagent>(`/reagents/${id}`, payload)
  return data
}

export const deleteReagent = async (id: number): Promise<void> => {
  await client.delete(`/reagents/${id}`)
}
