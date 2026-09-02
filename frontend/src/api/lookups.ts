import client from './client'
import type { LookupOption } from '../types'

export type LookupCategory =
  | 'freezer_kind'
  | 'box_kind'
  | 'reagent_category'
  | 'extraction_kit'
  | 'concentration_unit'

export const getLookups = async (category: LookupCategory): Promise<LookupOption[]> => {
  const { data } = await client.get<LookupOption[]>(`/lookups/${category}`)
  return data
}

export const addLookup = async (category: LookupCategory, value: string): Promise<LookupOption> => {
  const { data } = await client.post<LookupOption>(`/lookups/${category}`, { value })
  return data
}

export const deleteLookup = async (category: LookupCategory, id: number): Promise<void> => {
  await client.delete(`/lookups/${category}/${id}`)
}
