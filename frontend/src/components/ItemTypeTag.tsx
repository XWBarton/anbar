import { Tag } from 'antd'
import type { ItemType } from '../types'

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
