import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLookups, addLookup, deleteLookup } from '../api/lookups'
import type { LookupCategory } from '../api/lookups'

export function useLookups(category: LookupCategory) {
  return useQuery({ queryKey: ['lookups', category], queryFn: () => getLookups(category) })
}

/** Options as antd Select expects them. */
export function useLookupOptions(category: LookupCategory) {
  const { data = [] } = useLookups(category)
  return data.map((o) => ({ value: o.value, label: o.value }))
}

export function useAddLookup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ category, value }: { category: LookupCategory; value: string }) =>
      addLookup(category, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lookups'] }),
  })
}

export function useDeleteLookup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ category, id }: { category: LookupCategory; id: number }) =>
      deleteLookup(category, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lookups'] }),
  })
}
