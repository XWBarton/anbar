import { Tag } from 'antd'
import type { ItemType, SearchKind } from '../types'

export const TYPE_COLOURS: Record<ItemType, string> = {
  primer: '#8C2F39',
  reagent: '#5B7B7A',
  extract: '#A2683A',
}

const LABELS: Record<ItemType, string> = {
  primer: 'Primer',
  reagent: 'Reagent',
  extract: 'DNA',
}

export default function ItemTypeTag({ type }: { type: ItemType }) {
  return <Tag color={TYPE_COLOURS[type]}>{LABELS[type]}</Tag>
}

const KIND_COLOURS: Record<SearchKind, string> = { ...TYPE_COLOURS, box: '#4A5A6A' }
const KIND_LABELS: Record<SearchKind, string> = { ...LABELS, box: 'Box' }

/** Same tag, but also covers the 'box' search kind, which isn't a StoredItem type. */
export function SearchKindTag({ kind }: { kind: SearchKind }) {
  return <Tag color={KIND_COLOURS[kind]}>{KIND_LABELS[kind]}</Tag>
}
