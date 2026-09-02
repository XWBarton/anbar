import client from './client'
import type { StoredItem } from '../types'

export interface ItemFilters {
  item_type?: string
  state?: string
  box_id?: number
  freezer_id?: number
  owner_id?: number
  primer_id?: number
  reagent_id?: number
  extract_id?: number
  include_empty?: boolean
}

export const getItems = async (filters: ItemFilters = {}): Promise<StoredItem[]> => {
  const { data } = await client.get<StoredItem[]>('/items/', { params: filters })
  return data
}

export const getItem = async (id: number): Promise<StoredItem> => {
  const { data } = await client.get<StoredItem>(`/items/${id}`)
  return data
}

export const createItem = async (payload: Partial<StoredItem>): Promise<StoredItem> => {
  const { data } = await client.post<StoredItem>('/items/', payload)
  return data
}

export const updateItem = async (id: number, payload: Partial<StoredItem>): Promise<StoredItem> => {
  const { data } = await client.put<StoredItem>(`/items/${id}`, payload)
  return data
}

export const deleteItem = async (id: number): Promise<void> => {
  await client.delete(`/items/${id}`)
}
