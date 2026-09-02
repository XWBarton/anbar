import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPrimers, getPrimer, getPrimerItems, createPrimer, updatePrimer, deletePrimer,
} from '../api/primers'
import type { Primer } from '../types'

export function usePrimers(q?: string) {
  return useQuery({ queryKey: ['primers', q], queryFn: () => getPrimers(q) })
}

export function usePrimer(id: number) {
  return useQuery({ queryKey: ['primer', id], queryFn: () => getPrimer(id), enabled: !!id })
}

export function usePrimerItems(id: number) {
  return useQuery({ queryKey: ['primer-items', id], queryFn: () => getPrimerItems(id), enabled: !!id })
}

export function useCreatePrimer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Primer>) => createPrimer(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['primers'] }),
  })
}

export function useUpdatePrimer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Primer> }) => updatePrimer(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['primers'] })
      qc.invalidateQueries({ queryKey: ['primer'] })
    },
  })
}

export function useDeletePrimer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePrimer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['primers'] }),
  })
}
