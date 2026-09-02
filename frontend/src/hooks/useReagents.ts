import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getReagents, getReagent, getReagentItems, createReagent, updateReagent, deleteReagent,
} from '../api/reagents'
import type { Reagent } from '../types'

export function useReagents(q?: string) {
  return useQuery({ queryKey: ['reagents', q], queryFn: () => getReagents(q) })
}

export function useReagent(id: number) {
  return useQuery({ queryKey: ['reagent', id], queryFn: () => getReagent(id), enabled: !!id })
}

export function useReagentItems(id: number) {
  return useQuery({ queryKey: ['reagent-items', id], queryFn: () => getReagentItems(id), enabled: !!id })
}

export function useCreateReagent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Reagent>) => createReagent(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reagents'] }),
  })
}

export function useUpdateReagent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Reagent> }) => updateReagent(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reagents'] })
      qc.invalidateQueries({ queryKey: ['reagent'] })
    },
  })
}

export function useDeleteReagent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteReagent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reagents'] }),
  })
}
