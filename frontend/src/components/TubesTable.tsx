import { Button, Popconfirm, Space, Table, Tag, Typography, message } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useDeleteItem } from '../hooks/useItems'
import OwnerCell from './OwnerCell'
import StateTag from './StateTag'
import type { StoredItem } from '../types'

const { Text } = Typography

interface Props {
  items: StoredItem[]
  loading?: boolean
  showLot?: boolean
  onEdit?: (item: StoredItem) => void
}

interface BoxGroup {
  key: string
  boxId: number | null
  location: string
  tubes: StoredItem[]
}

/** One row per box that holds tubes of this primer / reagent / extract —
 *  where it lives, rather than a flat list repeating the same box. Expand a
 *  row for the individual tubes. */
function groupByBox(items: StoredItem[]): BoxGroup[] {
  const groups = new Map<string, BoxGroup>()
  for (const item of items) {
    const key = item.box_id != null ? `box-${item.box_id}` : 'unplaced'
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        boxId: item.box_id ?? null,
        location: item.box_id != null ? (item.box_location || item.box_name || 'Box') : 'Unplaced',
        tubes: [],
      })
    }
    groups.get(key)!.tubes.push(item)
  }
  // Placed boxes first, alphabetically; anything unplaced sits at the bottom.
  return [...groups.values()].sort((a, b) => {
    if (a.boxId === null) return 1
    if (b.boxId === null) return -1
    return a.location.localeCompare(b.location)
  })
}

function slotsOf(tubes: StoredItem[]): string[] {
  return tubes.map((t) => t.slot_label).filter((s): s is string => !!s).sort()
}

export default function TubesTable({ items, loading, showLot, onEdit }: Props) {
  const deleteItem = useDeleteItem()
  const groups = groupByBox(items)

  const remove = async (item: StoredItem) => {
    try {
      await deleteItem.mutateAsync(item.id)
      message.success('Tube deleted')
    } catch {
      message.error('Could not delete the tube')
    }
  }

  const columns = [
    {
      title: 'Box',
      key: 'box',
      render: (_: unknown, g: BoxGroup) =>
        g.boxId != null ? (
          <Link to={`/boxes/${g.boxId}`}>{g.location}</Link>
        ) : (
          <Text type="secondary">Unplaced</Text>
        ),
    },
    {
      title: 'Slots',
      key: 'slots',
      width: 160,
      render: (_: unknown, g: BoxGroup) => {
        const slots = slotsOf(g.tubes)
        return slots.length ? (
          <Space size={4} wrap>
            {slots.map((s) => <Tag key={s}>{s}</Tag>)}
          </Space>
        ) : (
          <Text type="secondary">no slot</Text>
        )
      },
    },
    {
      title: 'States',
      key: 'states',
      width: 190,
      render: (_: unknown, g: BoxGroup) => (
        <Space size={4} wrap>
          {g.tubes.map((t) => <StateTag key={t.id} state={t.state} />)}
        </Space>
      ),
    },
    {
      title: 'Owner',
      key: 'owner',
      width: 170,
      render: (_: unknown, g: BoxGroup) => {
        const names = [...new Set(g.tubes.map((t) =>
          t.is_shared ? 'Shared (lab)' : (t.owner_display || t.owner_name || '')
        ).filter(Boolean))]
        if (names.length === 0) return <Text type="secondary">—</Text>
        if (names.length === 1) return <span>{names[0]}</span>
        return <Text type="secondary">{names.length} people</Text>
      },
    },
    {
      title: 'Tubes',
      key: 'count',
      width: 80,
      render: (_: unknown, g: BoxGroup) => g.tubes.length,
    },
  ]

  const tubeColumns = [
    {
      title: 'Slot',
      key: 'slot',
      width: 90,
      render: (_: unknown, t: StoredItem) =>
        t.slot_label ? <Tag>{t.slot_label}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      width: 110,
      render: (v: string) => <StateTag state={v} />,
    },
    {
      title: 'Owner',
      key: 'owner',
      width: 160,
      render: (_: unknown, t: StoredItem) => <OwnerCell record={t} />,
    },
    {
      title: 'Conc.',
      key: 'concentration',
      width: 110,
      render: (_: unknown, t: StoredItem) =>
        t.concentration != null ? `${t.concentration} ${t.concentration_unit ?? ''}`.trim() : '—',
    },
    ...(showLot
      ? [
          {
            title: 'Lot',
            dataIndex: 'lot_number',
            key: 'lot',
            width: 120,
            render: (v: string) => v || <Text type="secondary">—</Text>,
          },
          {
            title: 'Expiry',
            dataIndex: 'expiry_date',
            key: 'expiry',
            width: 120,
            render: (v: string) => (v ? <Tag>{v}</Tag> : <Text type="secondary">—</Text>),
          },
        ]
      : []),
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_: unknown, t: StoredItem) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit?.(t)} />
          <Popconfirm
            title="Delete this tube?"
            description="The record goes for good. Mark it empty instead to keep the history."
            onConfirm={() => remove(t)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={groups}
      rowKey="key"
      loading={loading}
      size="small"
      pagination={false}
      locale={{ emptyText: 'No tubes recorded yet' }}
      expandable={{
        defaultExpandAllRows: groups.length <= 2,
        expandedRowRender: (g: BoxGroup) => (
          <Table
            columns={tubeColumns}
            dataSource={g.tubes}
            rowKey="id"
            size="small"
            pagination={false}
            rowClassName={(t) => (t.state === 'empty' ? 'row-empty' : '')}
          />
        ),
      }}
    />
  )
}
