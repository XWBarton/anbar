import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBoxes, getBox, getBoxMap, createBox, updateBox, deleteBox, moveItem,
} from '../api/boxes'
import type { Box } from '../types'

export function useBoxes(freezerId?: number) {
  return useQuery({ queryKey: ['boxes', freezerId], queryFn: () => getBoxes(freezerId) })
}

export function useBox(id: number) {
  return useQuery({ queryKey: ['box', id], queryFn: () => getBox(id), enabled: !!id })
}

export function useBoxMap(id: number) {
  return useQuery({ queryKey: ['box-map', id], queryFn: () => getBoxMap(id), enabled: !!id })
}

function invalidateStorage(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['boxes'] })
  qc.invalidateQueries({ queryKey: ['box-map'] })
  qc.invalidateQueries({ queryKey: ['freezer-map'] })
  qc.invalidateQueries({ queryKey: ['freezers'] })
}

export function useCreateBox() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Box>) => createBox(payload),
    onSuccess: () => invalidateStorage(qc),
  })
}

export function useUpdateBox() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Box> }) => updateBox(id, payload),
    onSuccess: () => invalidateStorage(qc),
  })
}

export function useDeleteBox() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteBox,
    onSuccess: () => {
      invalidateStorage(qc)
      qc.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useMoveItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ boxId, itemId, row, col }: {
      boxId: number; itemId: number; row: number | null; col: number | null
    }) => moveItem(boxId, { item_id: itemId, row, col }),
    onSuccess: () => {
      invalidateStorage(qc)
      qc.invalidateQueries({ queryKey: ['items'] })
    },
  })
}
