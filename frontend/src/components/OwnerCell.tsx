import { Tag } from 'antd'

interface Owned {
  is_shared?: boolean
  owner_display?: string
  owner_name?: string
}

/** One consistent rendering of ownership: the lab, a person, or nobody yet. */
export default function OwnerCell({ record }: { record: Owned }) {
  if (record.is_shared) return <Tag>Shared (lab)</Tag>
  const who = record.owner_display || record.owner_name
  return who ? <span>{who}</span> : <span style={{ color: '#bbb' }}>—</span>
}
