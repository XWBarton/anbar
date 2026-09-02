import { Tag } from 'antd'

/** The coarse, human-set state of a tube. There is no quantity behind it —
 *  someone sets it when they notice, and nothing recalculates it. */
const COLOURS: Record<string, string> = {
  sealed: 'green',
  opened: 'blue',
  stock: 'green',
  working: 'blue',
  low: 'orange',
  empty: 'default',
}

const LABELS: Record<string, string> = {
  sealed: 'Sealed',
  opened: 'Opened',
  stock: 'Stock',
  working: 'Working',
  low: 'Low',
  empty: 'Empty',
}

export default function StateTag({ state }: { state?: string }) {
  if (!state) return <span style={{ color: '#bbb' }}>—</span>
  return <Tag color={COLOURS[state] ?? 'default'}>{LABELS[state] ?? state}</Tag>
}
