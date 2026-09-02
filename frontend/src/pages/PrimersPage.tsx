import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table,
  Tag, Typography, message,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  usePrimers, useCreatePrimer, useUpdatePrimer, useDeletePrimer,
} from '../hooks/usePrimers'
import ElementaPrimerPicker from '../components/ElementaPrimerPicker'
import type { Primer } from '../types'

const { Title, Text } = Typography

export default function PrimersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: primers = [], isLoading } = usePrimers(search || undefined)
  const createPrimer = useCreatePrimer()
  const updatePrimer = useUpdatePrimer()
  const deletePrimer = useDeletePrimer()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Primer | null>(null)
  const [form] = Form.useForm()

  const openCreate = () => { setEditTarget(null); form.resetFields(); setModalOpen(true) }
  const openEdit = (p: Primer) => { setEditTarget(p); form.setFieldsValue(p); setModalOpen(true) }

  const handleSave = async (values: Partial<Primer>) => {
    try {
      if (editTarget) {
        await updatePrimer.mutateAsync({ id: editTarget.id, payload: values })
        message.success('Primer updated')
      } else {
        await createPrimer.mutateAsync(values)
        message.success('Primer created')
      }
      setModalOpen(false)
      form.resetFields()
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err.response?.data?.detail || 'Could not save the primer')
    }
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, r: Primer) => (
        <a onClick={() => navigate(`/primers/${r.id}`)}>{v}</a>
      ),
    },
    {
      title: 'Direction',
      dataIndex: 'direction',
      key: 'direction',
      width: 100,
      render: (v: string) => (v ? <Tag>{v}</Tag> : <Text type="secondary">—</Text>),
    },
    { title: 'Gene', dataIndex: 'target_gene', key: 'gene' },
    { title: 'Organism', dataIndex: 'target_organism', key: 'organism' },
    {
      title: 'Tm',
      dataIndex: 'tm_c',
      key: 'tm',
      width: 80,
      render: (v: number) => (v != null ? `${v} °C` : '—'),
    },
    {
      title: 'Tubes',
      key: 'tubes',
      width: 110,
      render: (_: unknown, r: Primer) =>
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
      render: (_: unknown, r: Primer) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm
            title="Delete this primer?"
            description="Its tubes go with it."
            onConfirm={async () => {
              try {
                await deletePrimer.mutateAsync(r.id)
                message.success('Primer deleted')
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
        <Title level={2} style={{ margin: 0 }}>Primers</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Primer</Button>
      </div>

      <Card>
        <Input.Search
          placeholder="Search by name, sequence, gene or organism"
          allowClear
          onSearch={setSearch}
          onChange={(e) => { if (!e.target.value) setSearch('') }}
          style={{ maxWidth: 420, marginBottom: 16 }}
        />
        <Table
          columns={columns}
          dataSource={primers}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 30 }}
        />
      </Card>

      <Modal
        title={editTarget ? 'Edit primer' : 'New primer'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        onOk={() => form.submit()}
        okText={editTarget ? 'Save' : 'Create'}
        confirmLoading={createPrimer.isPending || updatePrimer.isPending}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 8 }}>
          {!editTarget && (
            <ElementaPrimerPicker onPick={(p) => form.setFieldsValue(p)} />
          )}
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. 16S-F" />
          </Form.Item>
          <Form.Item name="sequence" label="Sequence">
            <Input.TextArea rows={2} placeholder="5' → 3'" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="direction" label="Direction" style={{ width: 120 }}>
              <Select allowClear options={[{ value: 'F', label: 'Forward' }, { value: 'R', label: 'Reverse' }]} />
            </Form.Item>
            <Form.Item name="target_gene" label="Gene" style={{ width: 180 }}>
              <Input placeholder="e.g. 16S" />
            </Form.Item>
            <Form.Item name="tm_c" label="Tm (°C)" style={{ width: 120 }}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="target_organism" label="Organism / taxa">
            <Input placeholder="e.g. Amphibia" />
          </Form.Item>
          <Form.Item name="reference" label="Reference">
            <Input placeholder="Paper or source" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
