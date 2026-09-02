import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Progress, Select, Space,
  Table, Typography, message,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  useFreezers, useCreateFreezer, useUpdateFreezer, useDeleteFreezer,
} from '../hooks/useFreezers'
import { useLookupOptions } from '../hooks/useLookups'
import type { Freezer } from '../types'

const { Title, Text } = Typography

export default function FreezersPage() {
  const navigate = useNavigate()
  const { data: freezers = [], isLoading } = useFreezers()
  const kinds = useLookupOptions('freezer_kind')
  const createFreezer = useCreateFreezer()
  const updateFreezer = useUpdateFreezer()
  const deleteFreezer = useDeleteFreezer()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Freezer | null>(null)
  const [form] = Form.useForm()

  const openCreate = () => {
    setEditTarget(null)
    form.resetFields()
    form.setFieldsValue({ shelf_count: 4, slots_per_shelf: 3 })
    setModalOpen(true)
  }
  const openEdit = (f: Freezer) => { setEditTarget(f); form.setFieldsValue(f); setModalOpen(true) }

  const handleSave = async (values: Partial<Freezer>) => {
    try {
      if (editTarget) {
        await updateFreezer.mutateAsync({ id: editTarget.id, payload: values })
        message.success('Freezer updated')
      } else {
        await createFreezer.mutateAsync(values)
        message.success('Freezer created')
      }
      setModalOpen(false)
      form.resetFields()
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err.response?.data?.detail || 'Could not save the freezer')
    }
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, r: Freezer) => <a onClick={() => navigate(`/freezers/${r.id}`)}>{v}</a>,
    },
    { title: 'Kind', dataIndex: 'kind', key: 'kind' },
    { title: 'Location', dataIndex: 'location', key: 'location' },
    {
      title: 'Layout',
      key: 'layout',
      width: 160,
      render: (_: unknown, r: Freezer) =>
        `${r.shelf_count} shelves × ${r.slots_per_shelf} slots`,
    },
    {
      title: 'Boxes',
      key: 'boxes',
      width: 180,
      render: (_: unknown, r: Freezer) => {
        const capacity = r.shelf_count * r.slots_per_shelf
        return (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Text style={{ fontSize: 12 }}>{r.box_count} of {capacity} positions</Text>
            <Progress
              percent={capacity ? Math.round((r.box_count / capacity) * 100) : 0}
              size="small"
              showInfo={false}
              strokeColor="#8C2F39"
            />
          </Space>
        )
      },
    },
    { title: 'Tubes', dataIndex: 'item_count', key: 'items', width: 80 },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_: unknown, r: Freezer) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm
            title="Delete this freezer?"
            description="Only possible once it holds no boxes."
            onConfirm={async () => {
              try {
                await deleteFreezer.mutateAsync(r.id)
                message.success('Freezer deleted')
              } catch (e) {
                const err = e as { response?: { data?: { detail?: string } } }
                message.error(err.response?.data?.detail || 'Could not delete the freezer')
              }
            }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Freezers</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Freezer</Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={freezers}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          locale={{ emptyText: 'No freezers yet — add one to start placing boxes' }}
        />
      </Card>

      <Modal
        title={editTarget ? 'Edit freezer' : 'New freezer'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        onOk={() => form.submit()}
        okText={editTarget ? 'Save' : 'Create'}
        confirmLoading={createFreezer.isPending || updateFreezer.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 8 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. −20 A" />
          </Form.Item>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="kind" label="Kind" style={{ width: 180 }}>
              <Select allowClear options={kinds} placeholder="e.g. -20" />
            </Form.Item>
            <Form.Item name="location" label="Location" style={{ width: 250 }}>
              <Input placeholder="e.g. Lab 2, north wall" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item
              name="shelf_count"
              label="Shelves"
              rules={[{ required: true }]}
              style={{ width: 160 }}
              tooltip="How many levels the freezer has"
            >
              <InputNumber min={1} max={26} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="slots_per_shelf"
              label="Slots per shelf"
              rules={[{ required: true }]}
              style={{ width: 160 }}
              tooltip="How many boxes fit side by side on one shelf"
            >
              <InputNumber min={1} max={26} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
