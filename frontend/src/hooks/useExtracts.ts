import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getExtracts, getExtract, getExtractItems, createExtract, updateExtract, deleteExtract,
} from '../api/extracts'
import type { Extract } from '../types'

export function useExtracts(q?: string) {
  return useQuery({ queryKey: ['extracts', q], queryFn: () => getExtracts(q) })
}

export function useExtract(id: number) {
  return useQuery({ queryKey: ['extract', id], queryFn: () => getExtract(id), enabled: !!id })
}

export function useExtractItems(id: number) {
  return useQuery({ queryKey: ['extract-items', id], queryFn: () => getExtractItems(id), enabled: !!id })
}

export function useCreateExtract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Extract>) => createExtract(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['extracts'] }),
  })
}

export function useUpdateExtract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Extract> }) => updateExtract(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['extracts'] })
      qc.invalidateQueries({ queryKey: ['extract'] })
    },
  })
}

export function useDeleteExtract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteExtract,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['extracts'] }),
  })
}
