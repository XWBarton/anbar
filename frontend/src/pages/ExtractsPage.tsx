import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Card, Checkbox, DatePicker, Form, Input, InputNumber, Modal, Popconfirm,
  Select, Space, Table, Typography, message,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  useExtracts, useCreateExtract, useUpdateExtract, useDeleteExtract,
} from '../hooks/useExtracts'
import { useLookupOptions } from '../hooks/useLookups'
import { useUsers } from '../hooks/useUsers'
import { ElementaExtractionPicker, TesseraSpecimenPicker } from '../components/SiblingRecordPicker'
import OwnerCell from '../components/OwnerCell'
import type { Extract } from '../types'

const { Title, Text } = Typography

export default function ExtractsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: extracts = [], isLoading } = useExtracts(search || undefined)
  const { data: users = [] } = useUsers()
  const kits = useLookupOptions('extraction_kit')
  const createExtract = useCreateExtract()
  const updateExtract = useUpdateExtract()
  const deleteExtract = useDeleteExtract()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Extract | null>(null)
  const [form] = Form.useForm()
  const isShared = Form.useWatch('is_shared', form)

  const openCreate = () => { setEditTarget(null); form.resetFields(); setModalOpen(true) }
  const openEdit = (e: Extract) => {
    setEditTarget(e)
    form.setFieldsValue({ ...e, extraction_date: e.extraction_date ? dayjs(e.extraction_date) : undefined })
    setModalOpen(true)
  }

  const handleSave = async (values: Record<string, unknown>) => {
    const payload: Record<string, unknown> = {
      ...values,
      extraction_date: values.extraction_date
        ? dayjs(values.extraction_date as dayjs.Dayjs).format('YYYY-MM-DD')
        : null,
    }
    if (payload.is_shared) payload.owner_id = null
    try {
      if (editTarget) {
        await updateExtract.mutateAsync({ id: editTarget.id, payload })
        message.success('Extract updated')
      } else {
        await createExtract.mutateAsync(payload)
        message.success('Extract created')
      }
      setModalOpen(false)
      form.resetFields()
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err.response?.data?.detail || 'Could not save the extract')
    }
  }

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (v: string, r: Extract) => <a onClick={() => navigate(`/extracts/${r.id}`)}>{v}</a>,
    },
    { title: 'Organism', dataIndex: 'source_organism', key: 'organism' },
    { title: 'Kit', dataIndex: 'kit', key: 'kit' },
    {
      title: 'Extracted',
      dataIndex: 'extraction_date',
      key: 'date',
      width: 120,
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Specimen',
      dataIndex: 'specimen_code',
      key: 'specimen',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Owner',
      key: 'owner',
      width: 150,
      render: (_: unknown, r: Extract) => <OwnerCell record={r} />,
    },
    {
      title: 'Tubes',
      key: 'tubes',
      width: 110,
      render: (_: unknown, r: Extract) =>
        r.tube_count === 0
          ? <Text type="secondary">none</Text>
          : <Text>{r.available_count} of {r.tube_count}</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_: unknown, r: Extract) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm
            title="Delete this extract?"
            description="Its tubes go with it."
            onConfirm={async () => {
              try {
                await deleteExtract.mutateAsync(r.id)
                message.success('Extract deleted')
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
        <Title level={2} style={{ margin: 0 }}>Extracted DNA</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Extract</Button>
      </div>

      <Card>
        <Input.Search
          placeholder="Search by code, organism, specimen or kit"
          allowClear
          onSearch={setSearch}
          onChange={(e) => { if (!e.target.value) setSearch('') }}
          style={{ maxWidth: 420, marginBottom: 16 }}
        />
        <Table
          columns={columns}
          dataSource={extracts}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 30 }}
        />
      </Card>

      <Modal
        title={editTarget ? 'Edit extract' : 'New extract'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        onOk={() => form.submit()}
        okText={editTarget ? 'Save' : 'Create'}
        confirmLoading={createExtract.isPending || updateExtract.isPending}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 8 }}>
          {!editTarget && (
            <ElementaExtractionPicker
              onPick={(e) => form.setFieldsValue({
                elementa_extraction_id: e.id,
                elementa_extraction_ref: `EXT-${e.id}`,
                specimen_code: e.specimen_code,
                kit: e.kit,
                extraction_date: e.date ? dayjs(e.date) : undefined,
                concentration_ng_ul: e.yield_ng_ul,
              })}
            />
          )}
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="code" label="Code" rules={[{ required: true }]} style={{ width: 200 }}>
              <Input placeholder="e.g. DNA-0001" />
            </Form.Item>
            <Form.Item name="source_organism" label="Organism" style={{ width: 240 }}>
              <Input placeholder="e.g. Litoria moorei" />
            </Form.Item>
            <Form.Item name="tissue_type" label="Tissue" style={{ width: 120 }}>
              <Input placeholder="e.g. liver" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="kit" label="Kit" style={{ width: 240 }}>
              <Select allowClear showSearch options={kits} placeholder="e.g. Qiagen DNeasy" />
            </Form.Item>
            <Form.Item name="extraction_date" label="Extraction date" style={{ width: 170 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="elementa_extraction_ref" label="Elementa ref" style={{ width: 150 }}>
              <Input placeholder="e.g. EXT-42" />
            </Form.Item>
          </Space>
          <TesseraSpecimenPicker onPick={(code) => form.setFieldsValue({ specimen_code: code })} />
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="concentration_ng_ul" label="Concentration (ng/µL)" style={{ width: 200 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="a260_280" label="A260/280" style={{ width: 140 }}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="is_shared" valuePropName="checked" style={{ marginBottom: 12 }}>
            <Checkbox>Shared lab stock</Checkbox>
          </Form.Item>
          {!isShared && (
            <Space style={{ width: '100%' }} align="start">
              <Form.Item name="owner_id" label="Owner" style={{ width: 240 }}>
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={users.map((u) => ({ value: u.id, label: u.full_name }))}
                />
              </Form.Item>
              <Form.Item name="owner_name" label="or a name" style={{ width: 240 }}>
                <Input placeholder="Someone without a login" />
              </Form.Item>
            </Space>
          )}
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
