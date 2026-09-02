import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert, Button, Card, Checkbox, Empty, Form, Input, InputNumber, Modal, Progress,
  Select, Space, Table, Tag, Typography, message,
} from 'antd'
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import { useFreezerMap } from '../hooks/useFreezers'
import { useBoxes, useCreateBox } from '../hooks/useBoxes'
import { useLookupOptions } from '../hooks/useLookups'
import { useUsers } from '../hooks/useUsers'
import FreezerGrid from '../components/FreezerGrid'
import OwnerCell from '../components/OwnerCell'
import type { Box, FreezerMapBox } from '../types'

const { Title, Text } = Typography

export default function FreezerDetailPage() {
  const { id } = useParams()
  const freezerId = Number(id)
  const navigate = useNavigate()
  const { data: map, isLoading } = useFreezerMap(freezerId)
  const { data: boxes = [], isLoading: boxesLoading } = useBoxes(freezerId)
  const { data: users = [] } = useUsers()
  const kinds = useLookupOptions('box_kind')
  const createBox = useCreateBox()
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const isShared = Form.useWatch('is_shared', form)

  if (isLoading || !map) return <Card loading />

  const openCreateAt = (shelf?: number, slot?: number) => {
    form.resetFields()
    form.setFieldsValue({ shelf, slot, rows: 9, cols: 9 })
    setModalOpen(true)
  }

  const handleSlotClick = (shelf: number, slot: number, box?: FreezerMapBox) => {
    if (box) navigate(`/boxes/${box.id}`)
    else openCreateAt(shelf, slot)
  }

  const handleSave = async (values: Partial<Box>) => {
    try {
      await createBox.mutateAsync({ ...values, freezer_id: freezerId })
      message.success('Box created')
      setModalOpen(false)
      form.resetFields()
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err.response?.data?.detail || 'Could not create the box')
    }
  }

  const columns = [
    {
      title: 'Box',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, r: Box) => <a onClick={() => navigate(`/boxes/${r.id}`)}>{v}</a>,
    },
    {
      title: 'Position',
      key: 'position',
      width: 170,
      render: (_: unknown, r: Box) =>
        r.shelf != null && r.slot != null
          ? `Shelf ${r.shelf} · Slot ${r.slot}`
          : <Text type="secondary">not placed</Text>,
    },
    {
      title: 'Holds',
      dataIndex: 'kind',
      key: 'kind',
      width: 140,
      render: (v: string) => (v ? <Tag>{v}</Tag> : <Text type="secondary">—</Text>),
    },
    {
      title: 'Grid',
      key: 'grid',
      width: 90,
      render: (_: unknown, r: Box) => `${r.rows} × ${r.cols}`,
    },
    {
      title: 'Full',
      key: 'full',
      width: 180,
      render: (_: unknown, r: Box) => (
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <Text style={{ fontSize: 12 }}>{r.filled} of {r.capacity} slots</Text>
          <Progress
            percent={r.capacity ? Math.round((r.filled / r.capacity) * 100) : 0}
            size="small"
            showInfo={false}
            strokeColor="#8C2F39"
          />
        </Space>
      ),
    },
    {
      title: 'Owner',
      key: 'owner',
      width: 160,
      render: (_: unknown, r: Box) => <OwnerCell record={r} />,
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/freezers')}>Freezers</Button>
      </Space>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Space align="baseline">
          <Title level={2} style={{ margin: 0 }}>{map.freezer.name}</Title>
          {map.freezer.kind && <Tag>{map.freezer.kind}</Tag>}
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreateAt()}>Add Box</Button>
      </div>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {map.freezer.location ? `${map.freezer.location} · ` : ''}
        {map.freezer.box_count} boxes · {map.freezer.item_count} tubes
      </Text>

      <Card title="Boxes" style={{ marginBottom: 16 }}>
        <Table
          columns={columns}
          dataSource={boxes}
          rowKey="id"
          loading={boxesLoading}
          pagination={false}
          locale={{ emptyText: 'No boxes in this freezer yet' }}
        />
      </Card>

      <Card
        title="Layout"
        extra={<Text type="secondary" style={{ fontSize: 12 }}>Click a box to open it, or an empty slot to add one</Text>}
      >
        <FreezerGrid
          shelfCount={map.shelf_count}
          slotsPerShelf={map.slots_per_shelf}
          boxes={map.boxes}
          onSlotClick={handleSlotClick}
        />
        {map.unplaced_boxes.length > 0 && (
          <>
            <Text type="secondary" style={{ display: 'block', margin: '16px 0 8px' }}>
              Not placed on a shelf yet
            </Text>
            <Space wrap>
              {map.unplaced_boxes.map((b) => (
                <Button key={b.id} size="small" onClick={() => navigate(`/boxes/${b.id}`)}>
                  {b.name} <Text type="secondary">({b.filled}/{b.capacity})</Text>
                </Button>
              ))}
            </Space>
          </>
        )}
        {map.boxes.length === 0 && map.unplaced_boxes.length === 0 && (
          <Empty description="Nothing placed yet" style={{ marginTop: 16 }} />
        )}
      </Card>

      <Modal
        title="New box"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        onOk={() => form.submit()}
        okText="Create"
        confirmLoading={createBox.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 8 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Primers 2026" />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={`Position in ${map.freezer.name} — leave blank to place the box later.`}
          />
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="shelf" label="Shelf" style={{ width: 130 }}>
              <Select
                allowClear
                options={Array.from({ length: map.shelf_count }, (_, i) => ({ value: i + 1, label: `Shelf ${i + 1}` }))}
              />
            </Form.Item>
            <Form.Item name="slot" label="Slot" style={{ width: 130 }}>
              <Select
                allowClear
                options={Array.from({ length: map.slots_per_shelf }, (_, i) => ({ value: i + 1, label: `Slot ${i + 1}` }))}
              />
            </Form.Item>
            <Form.Item name="kind" label="Holds" style={{ width: 180 }}>
              <Select allowClear options={kinds} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="rows" label="Rows" rules={[{ required: true }]} style={{ width: 130 }}>
              <InputNumber min={1} max={26} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="cols" label="Columns" rules={[{ required: true }]} style={{ width: 130 }}>
              <InputNumber min={1} max={26} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="is_shared" valuePropName="checked" style={{ marginBottom: 12 }}>
            <Checkbox>Shared lab box</Checkbox>
          </Form.Item>
          {!isShared && (
            <Form.Item name="owner_id" label="Owner">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={users.map((u) => ({ value: u.id, label: u.full_name }))}
              />
            </Form.Item>
          )}
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
