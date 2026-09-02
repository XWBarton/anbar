import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFreezers, getFreezer, getFreezerMap, createFreezer, updateFreezer, deleteFreezer,
} from '../api/freezers'
import type { Freezer } from '../types'

export function useFreezers() {
  return useQuery({ queryKey: ['freezers'], queryFn: getFreezers })
}

export function useFreezer(id: number) {
  return useQuery({ queryKey: ['freezer', id], queryFn: () => getFreezer(id), enabled: !!id })
}

export function useFreezerMap(id: number) {
  return useQuery({ queryKey: ['freezer-map', id], queryFn: () => getFreezerMap(id), enabled: !!id })
}

export function useCreateFreezer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Freezer>) => createFreezer(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['freezers'] }),
  })
}

export function useUpdateFreezer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Freezer> }) => updateFreezer(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['freezers'] })
      qc.invalidateQueries({ queryKey: ['freezer-map'] })
    },
  })
}

export function useDeleteFreezer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteFreezer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['freezers'] }),
  })
}
