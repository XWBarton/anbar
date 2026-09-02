import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getItems, getItem, createItem, updateItem, deleteItem } from '../api/items'
import type { ItemFilters } from '../api/items'
import type { StoredItem } from '../types'

export function useItems(filters: ItemFilters = {}) {
  return useQuery({ queryKey: ['items', filters], queryFn: () => getItems(filters) })
}

export function useItem(id: number) {
  return useQuery({ queryKey: ['item', id], queryFn: () => getItem(id), enabled: !!id })
}

/** Every mutation touches stock counts and the maps, so they all refresh together. */
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  for (const key of ['items', 'item', 'box-map', 'boxes', 'freezer-map', 'freezers',
                     'primers', 'primer-items', 'reagents', 'reagent-items',
                     'extracts', 'extract-items', 'summary']) {
    qc.invalidateQueries({ queryKey: [key] })
  }
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<StoredItem>) => createItem(payload),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<StoredItem> }) => updateItem(id, payload),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: () => invalidateAll(qc),
  })
}
