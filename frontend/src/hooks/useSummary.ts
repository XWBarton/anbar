import { useQuery } from '@tanstack/react-query'
import { getSummary } from '../api/search'

export function useSummary() {
  return useQuery({ queryKey: ['summary'], queryFn: getSummary })
}
