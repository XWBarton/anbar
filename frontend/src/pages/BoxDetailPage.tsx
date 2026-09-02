import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Button, Card, Descriptions, Drawer, Empty, Popconfirm, Segmented, Select, Space,
  Tag, Typography, message,
} from 'antd'
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useBoxMap, useDeleteBox, useMoveItem } from '../hooks/useBoxes'
import { useDeleteItem } from '../hooks/useItems'
import { usePrimers } from '../hooks/usePrimers'
import { useReagents } from '../hooks/useReagents'
import { useExtracts } from '../hooks/useExtracts'
import ItemFormModal from '../components/ItemFormModal'
import ItemTypeTag from '../components/ItemTypeTag'
import OwnerCell from '../components/OwnerCell'
import StateTag from '../components/StateTag'
import BoxGrid from '../components/BoxGrid'
import type { BoxCell, ItemType, StoredItem } from '../types'

const { Title, Text } = Typography

export default function BoxDetailPage() {
  const { id } = useParams()
  const boxId = Number(id)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: map, isLoading } = useBoxMap(boxId)
  const deleteBox = useDeleteBox()
  const deleteItem = useDeleteItem()
  const moveItem = useMoveItem()

  const [selected, setSelected] = useState<BoxCell | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StoredItem | null>(null)
  const [addType, setAddType] = useState<ItemType>('primer')
  const [addParentId, setAddParentId] = useState<number | null>(null)

  // A Find result can deep-link straight to one tube: /boxes/:id?item=<id>
  useEffect(() => {
    const itemId = searchParams.get('item')
    if (!itemId || !map) return
    const targetId = Number(itemId)
    const cell = map.cells.find((c) => c.item?.id === targetId)
    const unplaced = map.unplaced.find((u) => u.id === targetId)
    if (cell) setSelected(cell)
    else if (unplaced) setSelected({ row: -1, col: -1, slot_label: 'No slot', item: unplaced })
    setSearchParams((prev) => { prev.delete('item'); return prev }, { replace: true })
  }, [map, searchParams, setSearchParams])

  if (isLoading || !map) return <Card loading />

  const item = selected?.item ?? null

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(map.box.freezer_id ? `/freezers/${map.box.freezer_id}` : '/freezers')}
        >
          {map.box.freezer_name || 'Freezers'}
        </Button>
      </Space>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Space align="baseline">
          <Title level={2} style={{ margin: 0 }}>{map.box.name}</Title>
          {map.box.kind && <Tag>{map.box.kind}</Tag>}
        </Space>
        <Popconfirm
          title="Delete this box?"
          description="Its tubes are kept but lose their position."
          onConfirm={async () => {
            try {
              await deleteBox.mutateAsync(boxId)
              message.success('Box deleted')
              navigate(map.box.freezer_id ? `/freezers/${map.box.freezer_id}` : '/freezers')
            } catch {
              message.error('Could not delete — admins only')
            }
          }}
        >
          <Button danger icon={<DeleteOutlined />}>Delete Box</Button>
        </Popconfirm>
      </div>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {map.box.location} · {map.box.filled} of {map.box.capacity} slots used
      </Text>

      <Card
        title="Slots"
        extra={<Text type="secondary" style={{ fontSize: 12 }}>Click a slot to see or place a tube</Text>}
      >
        <BoxGrid
          rows={map.rows}
          cols={map.cols}
          cells={map.cells}
          selected={selected ? { row: selected.row, col: selected.col } : null}
          onCellClick={setSelected}
        />
      </Card>

      {map.unplaced.length > 0 && (
        <Card title="In this box without a slot" style={{ marginTop: 16 }} size="small">
          <Space wrap>
            {map.unplaced.map((u) => (
              <Tag
                key={u.id}
                style={{ padding: '4px 8px', cursor: 'pointer' }}
                onClick={() => setSelected({ row: -1, col: -1, slot_label: 'No slot', item: u })}
              >
                {u.name} <StateTag state={u.state} />
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      <Drawer
        title={selected ? (selected.row === -1 ? 'No slot assigned' : `Slot ${selected.slot_label}`) : ''}
        open={!!selected}
        onClose={() => setSelected(null)}
        width={420}
      >
        {item ? (
          <>
            <Space style={{ marginBottom: 16 }}>
              <ItemTypeTag type={item.item_type} />
              <StateTag state={item.state} />
            </Space>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Name">
                <a onClick={() => navigate(
                  item.item_type === 'primer' ? `/primers/${item.primer_id}`
                  : item.item_type === 'reagent' ? `/reagents/${item.reagent_id}`
                  : `/extracts/${item.extract_id}`
                )}>
                  {item.name}
                </a>
              </Descriptions.Item>
              {item.label && <Descriptions.Item label="Tube label">{item.label}</Descriptions.Item>}
              <Descriptions.Item label="Owner"><OwnerCell record={item} /></Descriptions.Item>
              {item.concentration != null && (
                <Descriptions.Item label="Concentration">
                  {item.concentration} {item.concentration_unit}
                </Descriptions.Item>
              )}
              {item.volume_ul != null && (
                <Descriptions.Item label="Volume">{item.volume_ul} µL</Descriptions.Item>
              )}
              {item.lot_number && <Descriptions.Item label="Lot">{item.lot_number}</Descriptions.Item>}
              {item.expiry_date && <Descriptions.Item label="Expiry">{item.expiry_date}</Descriptions.Item>}
              {item.opened_date && <Descriptions.Item label="Opened">{item.opened_date}</Descriptions.Item>}
              {item.date_added && <Descriptions.Item label="Added">{item.date_added}</Descriptions.Item>}
              {item.notes && <Descriptions.Item label="Notes">{item.notes}</Descriptions.Item>}
            </Descriptions>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                block
                icon={<EditOutlined />}
                onClick={() => { setEditTarget(item); setAddType(item.item_type); setFormOpen(true) }}
              >
                Edit tube
              </Button>
              <Button
                block
                loading={moveItem.isPending}
                onClick={async () => {
                  try {
                    await moveItem.mutateAsync({ boxId, itemId: item.id, row: null, col: null })
                    message.success('Tube taken out of its slot')
                    setSelected(null)
                  } catch {
                    message.error('Could not move the tube')
                  }
                }}
              >
                Take out of slot
              </Button>
              <Popconfirm
                title="Delete this tube?"
                description="Mark it empty instead to keep the history."
                onConfirm={async () => {
                  try {
                    await deleteItem.mutateAsync(item.id)
                    message.success('Tube deleted')
                    setSelected(null)
                  } catch {
                    message.error('Could not delete the tube')
                  }
                }}
              >
                <Button block danger icon={<DeleteOutlined />}>Delete tube</Button>
              </Popconfirm>
            </Space>
          </>
        ) : (
          <>
            <Empty description="This slot is free" style={{ marginBottom: 24 }} />
            <Text strong>Place a tube here</Text>
            <Segmented
              block
              style={{ margin: '12px 0' }}
              value={addType}
              onChange={(v) => { setAddType(v as ItemType); setAddParentId(null) }}
              options={[
                { label: 'Primer', value: 'primer' },
                { label: 'Reagent', value: 'reagent' },
                { label: 'DNA', value: 'extract' },
              ]}
            />
            <ParentSelect type={addType} value={addParentId} onChange={setAddParentId} />
            <Button
              type="primary"
              block
              style={{ marginTop: 12 }}
              disabled={!addParentId}
              onClick={() => { setEditTarget(null); setFormOpen(true) }}
            >
              Add tube to {selected?.slot_label}
            </Button>
          </>
        )}
      </Drawer>

      {(editTarget || addParentId) && (
        <ItemFormModal
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditTarget(null); setSelected(null) }}
          itemType={addType}
          parentId={
            editTarget
              ? (editTarget.primer_id ?? editTarget.reagent_id ?? editTarget.extract_id ?? 0)
              : (addParentId as number)
          }
          editTarget={editTarget}
          defaultBoxId={boxId}
          defaultRow={selected?.row}
          defaultCol={selected?.col}
        />
      )}
    </div>
  )
}

/** Pick which primer / reagent / extract a new tube holds. */
function ParentSelect({
  type, value, onChange,
}: {
  type: ItemType
  value: number | null
  onChange: (id: number) => void
}) {
  const primers = usePrimers()
  const reagents = useReagents()
  const extracts = useExtracts()

  const options =
    type === 'primer'
      ? (primers.data ?? []).map((p) => ({ value: p.id, label: p.name }))
      : type === 'reagent'
        ? (reagents.data ?? []).map((r) => ({ value: r.id, label: r.name }))
        : (extracts.data ?? []).map((e) => ({ value: e.id, label: e.code }))

  return (
    <Select
      style={{ width: '100%' }}
      showSearch
      optionFilterProp="label"
      value={value ?? undefined}
      onChange={onChange}
      options={options}
      loading={primers.isLoading || reagents.isLoading || extracts.isLoading}
      placeholder={
        type === 'primer' ? 'Which primer?' : type === 'reagent' ? 'Which reagent?' : 'Which extract?'
      }
      notFoundContent={`No ${type}s yet — create one first`}
    />
  )
}
