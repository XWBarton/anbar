import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Descriptions, Space, Typography } from 'antd'
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import { useReagent, useReagentItems } from '../hooks/useReagents'
import ItemFormModal from '../components/ItemFormModal'
import TubesTable from '../components/TubesTable'
import type { StoredItem } from '../types'

const { Title } = Typography

export default function ReagentDetailPage() {
  const { id } = useParams()
  const reagentId = Number(id)
  const navigate = useNavigate()
  const { data: reagent, isLoading } = useReagent(reagentId)
  const { data: items = [], isLoading: itemsLoading } = useReagentItems(reagentId)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StoredItem | null>(null)

  if (isLoading || !reagent) return <Card loading />

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reagents')}>Reagents</Button>
      </Space>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>{reagent.name}</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditTarget(null); setModalOpen(true) }}
        >
          Add Bottle
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
          <Descriptions.Item label="Category">{reagent.category || '—'}</Descriptions.Item>
          <Descriptions.Item label="Supplier">{reagent.supplier || '—'}</Descriptions.Item>
          <Descriptions.Item label="Catalogue number">{reagent.catalogue_number || '—'}</Descriptions.Item>
          {reagent.notes && (
            <Descriptions.Item label="Notes" span={3}>{reagent.notes}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title={`Bottles (${reagent.available_count} of ${reagent.tube_count} usable)`}>
        <TubesTable
          items={items}
          loading={itemsLoading}
          showLot
          onEdit={(item) => { setEditTarget(item); setModalOpen(true) }}
        />
      </Card>

      <ItemFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        itemType="reagent"
        parentId={reagentId}
        editTarget={editTarget}
      />
    </div>
  )
}
