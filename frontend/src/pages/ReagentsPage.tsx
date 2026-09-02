import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Typography, message,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  useReagents, useCreateReagent, useUpdateReagent, useDeleteReagent,
} from '../hooks/useReagents'
import { useLookupOptions } from '../hooks/useLookups'
import type { Reagent } from '../types'

const { Title, Text } = Typography

export default function ReagentsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: reagents = [], isLoading } = useReagents(search || undefined)
  const categories = useLookupOptions('reagent_category')
  const createReagent = useCreateReagent()
  const updateReagent = useUpdateReagent()
  const deleteReagent = useDeleteReagent()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Reagent | null>(null)
  const [form] = Form.useForm()

  const openCreate = () => { setEditTarget(null); form.resetFields(); setModalOpen(true) }
  const openEdit = (r: Reagent) => { setEditTarget(r); form.setFieldsValue(r); setModalOpen(true) }

  const handleSave = async (values: Partial<Reagent>) => {
    try {
      if (editTarget) {
        await updateReagent.mutateAsync({ id: editTarget.id, payload: values })
        message.success('Reagent updated')
      } else {
        await createReagent.mutateAsync(values)
        message.success('Reagent created')
      }
      setModalOpen(false)
      form.resetFields()
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err.response?.data?.detail || 'Could not save the reagent')
    }
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, r: Reagent) => <a onClick={() => navigate(`/reagents/${r.id}`)}>{v}</a>,
    },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Supplier', dataIndex: 'supplier', key: 'supplier' },
    {
      title: 'Cat. no.',
      dataIndex: 'catalogue_number',
      key: 'catalogue_number',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Bottles',
      key: 'bottles',
      width: 120,
      render: (_: unknown, r: Reagent) =>
        r.tube_count === 0 ? (
          <Text type="secondary">none</Text>
        ) : (
          <Text>{r.available_count} of {r.tube_count}</Text>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_: unknown, r: Reagent) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm
            title="Delete this reagent?"
            description="Its bottles go with it."
            onConfirm={async () => {
              try {
                await deleteReagent.mutateAsync(r.id)
                message.success('Reagent deleted')
              } catch {
                message.error('Could not delete — admins only')
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
        <Title level={2} style={{ margin: 0 }}>Reagents</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Reagent</Button>
      </div>

      <Card>
        <Input.Search
          placeholder="Search by name, supplier or catalogue number"
          allowClear
          onSearch={setSearch}
          onChange={(e) => { if (!e.target.value) setSearch('') }}
          style={{ maxWidth: 420, marginBottom: 16 }}
        />
        <Table
          columns={columns}
          dataSource={reagents}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 30 }}
        />
      </Card>

      <Modal
        title={editTarget ? 'Edit reagent' : 'New reagent'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        onOk={() => form.submit()}
        okText={editTarget ? 'Save' : 'Create'}
        confirmLoading={createReagent.isPending || updateReagent.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 8 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Proteinase K" />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Select allowClear options={categories} placeholder="e.g. Enzyme" />
          </Form.Item>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="supplier" label="Supplier" style={{ width: 220 }}>
              <Input placeholder="e.g. Qiagen" />
            </Form.Item>
            <Form.Item name="catalogue_number" label="Catalogue number" style={{ width: 200 }}>
              <Input placeholder="e.g. 19131" />
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
