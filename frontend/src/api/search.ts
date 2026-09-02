import client from './client'
import type { SearchResult, Summary } from '../types'

export const search = async (q: string): Promise<{ query: string; results: SearchResult[] }> => {
  const { data } = await client.get('/search/', { params: { q } })
  return data
}

export const getSummary = async (): Promise<Summary> => {
  const { data } = await client.get<Summary>('/search/summary')
  return data
}
