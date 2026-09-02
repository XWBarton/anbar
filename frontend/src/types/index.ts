export interface User {
  id: number
  username: string
  full_name: string
  email: string
  is_admin: boolean
  is_active: boolean
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
}

export type ItemType = 'primer' | 'reagent' | 'extract'

/** Coarse, human-set states. Nothing computes or decrements these. */
export const REAGENT_STATES = ['sealed', 'opened', 'low', 'empty'] as const
export const STOCK_STATES = ['stock', 'working', 'low', 'empty'] as const

export function statesFor(type: ItemType): readonly string[] {
  return type === 'reagent' ? REAGENT_STATES : STOCK_STATES
}

export interface Freezer {
  id: number
  name: string
  kind?: string
  location?: string
  shelf_count: number
  slots_per_shelf: number
  notes?: string
  created_at: string
  box_count: number
  item_count: number
}

export interface Box {
  id: number
  name: string
  freezer_id?: number
  shelf?: number
  slot?: number
  rows: number
  cols: number
  kind?: string
  owner_id?: number
  owner_name?: string
  is_shared: boolean
  notes?: string
  created_at: string
  freezer_name?: string
  location: string
  filled: number
  capacity: number
}

export interface FreezerMapBox {
  id: number
  name: string
  shelf?: number
  slot?: number
  kind?: string
  rows: number
  cols: number
  filled: number
  capacity: number
}

export interface FreezerMap {
  freezer: Freezer
  shelf_count: number
  slots_per_shelf: number
  boxes: FreezerMapBox[]
  unplaced_boxes: FreezerMapBox[]
}

export interface StoredItem {
  id: number
  item_type: ItemType
  primer_id?: number
  reagent_id?: number
  extract_id?: number
  box_id?: number
  row?: number
  col?: number
  slot_label?: string
  label?: string
  state: string
  owner_id?: number
  owner_name?: string
  is_shared: boolean
  owner_display?: string
  date_added?: string
  opened_date?: string
  lot_number?: string
  expiry_date?: string
  concentration?: number
  concentration_unit?: string
  volume_ul?: number
  notes?: string
  created_at: string
  updated_at: string
  name?: string
  location?: string
  box_name?: string
  box_location?: string
  freezer_name?: string
}

export interface BoxCell {
  row: number
  col: number
  slot_label: string
  item: StoredItem | null
}

export interface BoxMap {
  box: Box
  rows: number
  cols: number
  cells: BoxCell[]
  unplaced: StoredItem[]
}

export interface Primer {
  id: number
  name: string
  sequence?: string
  direction?: string
  target_gene?: string
  target_organism?: string
  tm_c?: number
  reference?: string
  elementa_primer_id?: number
  notes?: string
  created_at: string
  tube_count: number
  available_count: number
}

export interface Reagent {
  id: number
  name: string
  category?: string
  supplier?: string
  catalogue_number?: string
  notes?: string
  created_at: string
  tube_count: number
  available_count: number
}

export interface Extract {
  id: number
  code: string
  source_organism?: string
  tissue_type?: string
  kit?: string
  extraction_date?: string
  specimen_code?: string
  elementa_extraction_ref?: string
  elementa_extraction_id?: number
  concentration_ng_ul?: number
  a260_280?: number
  owner_id?: number
  owner_name?: string
  is_shared: boolean
  owner_display?: string
  notes?: string
  created_at: string
  tube_count: number
  available_count: number
}

export interface LookupOption {
  id: number
  category: string
  value: string
  sort_order: number
}

export interface SearchTube {
  id: number
  item_type: ItemType
  name?: string
  label?: string
  state: string
  location: string
  slot_label?: string
  box_id?: number
  owner_display?: string
}

export type SearchKind = ItemType | 'box'

export interface SearchResult {
  kind: SearchKind
  id: number
  name: string
  subtitle: string
  tubes: SearchTube[]
}

export interface Summary {
  freezers: number
  boxes: number
  primers: number
  reagents: number
  extracts: number
  by_type: Record<string, number>
  by_state: Record<string, number>
  needs_attention: StoredItem[]
  recent: StoredItem[]
}
