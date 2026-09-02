import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Descriptions, Space, Tag, Typography } from 'antd'
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import { usePrimer, usePrimerItems } from '../hooks/usePrimers'
import ItemFormModal from '../components/ItemFormModal'
import TubesTable from '../components/TubesTable'
import { useSiblingUrls } from '../hooks/useSiblingUrls'
import type { StoredItem } from '../types'

const { Title, Text } = Typography

export default function PrimerDetailPage() {
  const { id } = useParams()
  const primerId = Number(id)
  const navigate = useNavigate()
  const { data: primer, isLoading } = usePrimer(primerId)
  const { data: items = [], isLoading: itemsLoading } = usePrimerItems(primerId)
  const { elementa } = useSiblingUrls()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StoredItem | null>(null)

  if (isLoading || !primer) return <Card loading />

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/primers')}>Primers</Button>
      </Space>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>{primer.name}</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditTarget(null); setModalOpen(true) }}
        >
          Add Tube
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
          <Descriptions.Item label="Direction">
            {primer.direction ? <Tag>{primer.direction}</Tag> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Gene">{primer.target_gene || '—'}</Descriptions.Item>
          <Descriptions.Item label="Organism">{primer.target_organism || '—'}</Descriptions.Item>
          <Descriptions.Item label="Tm">{primer.tm_c != null ? `${primer.tm_c} °C` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Reference">{primer.reference || '—'}</Descriptions.Item>
          <Descriptions.Item label="In Elementa">
            {primer.elementa_primer_id && elementa ? (
              <a href={`${elementa}/primers`} target="_blank" rel="noreferrer">
                #{primer.elementa_primer_id}
              </a>
            ) : primer.elementa_primer_id ? (
              `#${primer.elementa_primer_id}`
            ) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Sequence" span={3}>
            {primer.sequence
              ? <Text code style={{ fontFamily: 'monospace' }}>{primer.sequence}</Text>
              : '—'}
          </Descriptions.Item>
          {primer.notes && (
            <Descriptions.Item label="Notes" span={3}>{primer.notes}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title={`Tubes (${primer.available_count} of ${primer.tube_count} in stock)`}>
        <TubesTable
          items={items}
          loading={itemsLoading}
          onEdit={(item) => { setEditTarget(item); setModalOpen(true) }}
        />
      </Card>

      <ItemFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        itemType="primer"
        parentId={primerId}
        editTarget={editTarget}
      />
    </div>
  )
}
