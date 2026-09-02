import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Descriptions, Space, Typography } from 'antd'
import { ArrowLeftOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons'
import { useExtract, useExtractItems } from '../hooks/useExtracts'
import { useSiblingUrls } from '../hooks/useSiblingUrls'
import ItemFormModal from '../components/ItemFormModal'
import OwnerCell from '../components/OwnerCell'
import TubesTable from '../components/TubesTable'
import type { StoredItem } from '../types'

const { Title } = Typography

export default function ExtractDetailPage() {
  const { id } = useParams()
  const extractId = Number(id)
  const navigate = useNavigate()
  const { data: extract, isLoading } = useExtract(extractId)
  const { data: items = [], isLoading: itemsLoading } = useExtractItems(extractId)
  const { elementa, tessera } = useSiblingUrls()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StoredItem | null>(null)

  if (isLoading || !extract) return <Card loading />

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/extracts')}>Extracted DNA</Button>
      </Space>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>{extract.code}</Title>
        <Space>
          {tessera && extract.specimen_code && (
            <Button
              icon={<LinkOutlined />}
              href={`${tessera}/specimens?search=${encodeURIComponent(extract.specimen_code)}`}
              target="_blank"
            >
              In Tessera
            </Button>
          )}
          {elementa && extract.elementa_extraction_id && (
            <Button
              icon={<LinkOutlined />}
              href={`${elementa}/extractions/${extract.elementa_extraction_id}`}
              target="_blank"
            >
              In Elementa
            </Button>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditTarget(null); setModalOpen(true) }}
          >
            Add Tube
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
          <Descriptions.Item label="Organism">{extract.source_organism || '—'}</Descriptions.Item>
          <Descriptions.Item label="Tissue">{extract.tissue_type || '—'}</Descriptions.Item>
          <Descriptions.Item label="Kit">{extract.kit || '—'}</Descriptions.Item>
          <Descriptions.Item label="Extracted">{extract.extraction_date || '—'}</Descriptions.Item>
          <Descriptions.Item label="Specimen">{extract.specimen_code || '—'}</Descriptions.Item>
          <Descriptions.Item label="Elementa ref">{extract.elementa_extraction_ref || '—'}</Descriptions.Item>
          <Descriptions.Item label="Concentration">
            {extract.concentration_ng_ul != null ? `${extract.concentration_ng_ul} ng/µL` : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="A260/280">{extract.a260_280 ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Owner"><OwnerCell record={extract} /></Descriptions.Item>
          {extract.notes && (
            <Descriptions.Item label="Notes" span={3}>{extract.notes}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title={`Tubes (${extract.available_count} of ${extract.tube_count} in stock)`}>
        <TubesTable
          items={items}
          loading={itemsLoading}
          onEdit={(item) => { setEditTarget(item); setModalOpen(true) }}
        />
      </Card>

      <ItemFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        itemType="extract"
        parentId={extractId}
        editTarget={editTarget}
      />
    </div>
  )
}
