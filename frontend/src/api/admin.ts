import client from './client'

export interface AdminSettings {
  elementa_url: string
  tessera_url: string
  elementa_token_set: boolean
  tessera_token_set: boolean
  anbar_token_set: boolean
  app_version: string
}

export interface PublicSettings {
  elementa_url: string
  tessera_url: string
  app_version: string
}

export const getPublicSettings = async (): Promise<PublicSettings> => {
  const { data } = await client.get<PublicSettings>('/admin/public-settings')
  return data
}

export const getAdminSettings = async (): Promise<AdminSettings> => {
  const { data } = await client.get<AdminSettings>('/admin/settings/')
  return data
}

export const setSetting = async (key: string, value: string): Promise<void> => {
  await client.put(`/admin/settings/${key}`, { value })
}

export const testSibling = async (app: 'elementa' | 'tessera'): Promise<void> => {
  await client.get(`/admin/${app}/test`)
}

export interface ElementaExtraction {
  id: number
  specimen_code?: string
  extraction_type?: string
  kit?: string
  date?: string
  yield_ng_ul?: number
}

export interface ElementaPrimer {
  id: number
  name: string
  sequence?: string
  direction?: string
  target_gene?: string
  target_organism?: string
  tm_c?: number
  reference?: string
}

export interface TesseraSpecimen {
  specimen_code: string
  collection_date?: string
  project_code?: string
}

export const searchElementaExtractions = async (q: string): Promise<ElementaExtraction[]> => {
  const { data } = await client.get<ElementaExtraction[]>('/admin/elementa/extractions', { params: { q } })
  return data
}

export const searchElementaPrimers = async (q: string): Promise<ElementaPrimer[]> => {
  const { data } = await client.get<ElementaPrimer[]>('/admin/elementa/primers', { params: { q } })
  return data
}

export const searchTesseraSpecimens = async (q: string): Promise<TesseraSpecimen[]> => {
  const { data } = await client.get<TesseraSpecimen[]>('/admin/tessera/specimens', { params: { q } })
  return data
}
