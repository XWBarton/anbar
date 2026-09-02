import client from './client'
import type { Box, BoxMap } from '../types'

export const getBoxes = async (freezerId?: number): Promise<Box[]> => {
  const { data } = await client.get<Box[]>('/boxes/', {
    params: freezerId ? { freezer_id: freezerId } : {},
  })
  return data
}

export const getBox = async (id: number): Promise<Box> => {
  const { data } = await client.get<Box>(`/boxes/${id}`)
  return data
}

export const getBoxMap = async (id: number): Promise<BoxMap> => {
  const { data } = await client.get<BoxMap>(`/boxes/${id}/map`)
  return data
}

export const createBox = async (payload: Partial<Box>): Promise<Box> => {
  const { data } = await client.post<Box>('/boxes/', payload)
  return data
}

export const updateBox = async (id: number, payload: Partial<Box>): Promise<Box> => {
  const { data } = await client.put<Box>(`/boxes/${id}`, payload)
  return data
}

export const deleteBox = async (id: number): Promise<void> => {
  await client.delete(`/boxes/${id}`)
}

export const moveItem = async (
  boxId: number,
  payload: { item_id: number; row: number | null; col: number | null },
): Promise<BoxMap> => {
  const { data } = await client.post<BoxMap>(`/boxes/${boxId}/move`, payload)
  return data
}
