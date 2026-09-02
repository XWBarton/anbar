import { useEffect, useState } from 'react'
import {
  Alert, Button, Card, Checkbox, Form, Input, Modal, Popconfirm, Space, Table, Tabs,
  Tag, Typography, message,
} from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminSettings, setSetting, testSibling } from '../api/admin'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useUsers'
import { useLookups, useAddLookup, useDeleteLookup } from '../hooks/useLookups'
import type { LookupCategory } from '../api/lookups'
import type { User } from '../types'

const { Title, Text, Paragraph } = Typography

const LOOKUP_TABS: { key: LookupCategory; label: string }[] = [
  { key: 'freezer_kind', label: 'Freezer kinds' },
  { key: 'box_kind', label: 'Box kinds' },
  { key: 'reagent_category', label: 'Reagent categories' },
  { key: 'extraction_kit', label: 'Extraction kits' },
  { key: 'concentration_unit', label: 'Concentration units' },
]

export default function AdminPage() {
  return (
    <div>
      <Title level={2} style={{ marginTop: 0 }}>Settings</Title>
      <Tabs
        items={[
          { key: 'users', label: 'Users', children: <UsersTab /> },
          { key: 'integrations', label: 'Integrations', children: <IntegrationsTab /> },
          { key: 'lookups', label: 'Dropdown options', children: <LookupsTab /> },
        ]}
      />
    </div>
  )
}

function UsersTab() {
  const { data: users = [], isLoading } = useUsers()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const columns = [
    { title: 'Name', dataIndex: 'full_name', key: 'name' },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Role',
      key: 'role',
      width: 110,
      render: (_: unknown, r: User) => (r.is_admin ? <Tag color="#8C2F39">Admin</Tag> : <Tag>Member</Tag>),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_: unknown, r: User) =>
        r.is_active ? <Tag color="green">Active</Tag> : <Tag>Deactivated</Tag>,
    },
    {
      title: '',
      key: 'actions',
      width: 140,
      render: (_: unknown, r: User) => (
        <Space size="small">
          <Button
            size="small"
            onClick={() => updateUser.mutate({ id: r.id, payload: { is_admin: !r.is_admin } })}
          >
            {r.is_admin ? 'Demote' : 'Make admin'}
          </Button>
          {r.is_active && (
            <Popconfirm title="Deactivate this user?" onConfirm={() => deleteUser.mutate(r.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Add User</Button>}
    >
      <Table columns={columns} dataSource={users} rowKey="id" loading={isLoading} pagination={false} />
      <Modal
        title="New user"
        open={open}
        onCancel={() => { setOpen(false); form.resetFields() }}
        onOk={() => form.submit()}
        confirmLoading={createUser.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 8 }}
          onFinish={async (values) => {
            try {
              await createUser.mutateAsync(values)
              message.success('User created')
              setOpen(false)
              form.resetFields()
            } catch (e) {
              const err = e as { response?: { data?: { detail?: string } } }
              message.error(err.response?.data?.detail || 'Could not create the user')
            }
          }}
        >
          <Form.Item name="full_name" label="Full name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true }, { min: 3 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }, { type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }, { min: 8 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="is_admin" valuePropName="checked">
            <Checkbox>Administrator</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

function IntegrationsTab() {
  const qc = useQueryClient()
  const { data: settings } = useQuery({ queryKey: ['admin-settings'], queryFn: getAdminSettings })
  const [form] = Form.useForm()
  const [testing, setTesting] = useState<string | null>(null)

  useEffect(() => {
    if (settings) {
      form.setFieldsValue({
        elementa_url: settings.elementa_url,
        tessera_url: settings.tessera_url,
      })
    }
  }, [settings])

  const save = async (values: Record<string, string>) => {
    try {
      for (const [key, value] of Object.entries(values)) {
        if (value !== undefined && value !== '') await setSetting(key, value)
      }
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      qc.invalidateQueries({ queryKey: ['public-settings'] })
      message.success('Saved')
      form.setFieldsValue({ elementa_api_token: '', tessera_api_token: '', anbar_api_token: '' })
    } catch {
      message.error('Could not save the settings')
    }
  }

  const test = async (app: 'elementa' | 'tessera') => {
    setTesting(app)
    try {
      await testSibling(app)
      message.success(`${app === 'elementa' ? 'Elementa' : 'Tessera'} reachable`)
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err.response?.data?.detail || 'Could not reach it')
    } finally {
      setTesting(null)
    }
  }

  return (
    <Card style={{ maxWidth: 720 }}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
        message="anbār only reads from Elementa and Tessera, and they only read from anbār."
        description="Leave any of these blank and the matching links and search boxes simply do not appear."
      />
      <Form form={form} layout="vertical" onFinish={save}>
        <Title level={5}>Elementa</Title>
        <Form.Item name="elementa_url" label="URL">
          <Input placeholder="https://elementa.example.org" />
        </Form.Item>
        <Form.Item
          name="elementa_api_token"
          label="API token"
          extra={settings?.elementa_token_set ? 'A token is set — type a new one to replace it' : 'Not set'}
        >
          <Input.Password placeholder="Paste an Elementa token" autoComplete="new-password" />
        </Form.Item>
        <Button onClick={() => test('elementa')} loading={testing === 'elementa'} style={{ marginBottom: 24 }}>
          Test Elementa
        </Button>

        <Title level={5}>Tessera</Title>
        <Form.Item name="tessera_url" label="URL">
          <Input placeholder="https://tessera.example.org" />
        </Form.Item>
        <Form.Item
          name="tessera_api_token"
          label="API token"
          extra={settings?.tessera_token_set ? 'A token is set — type a new one to replace it' : 'Not set'}
        >
          <Input.Password placeholder="Paste a Tessera token" autoComplete="new-password" />
        </Form.Item>
        <Button onClick={() => test('tessera')} loading={testing === 'tessera'} style={{ marginBottom: 24 }}>
          Test Tessera
        </Button>

        <Title level={5}>This instance</Title>
        <Paragraph type="secondary" style={{ marginTop: 0 }}>
          The token Elementa and Tessera must send to ask anbār where something is. Until one is set,
          the <Text code>/integration/…</Text> endpoints refuse every request.
        </Paragraph>
        <Form.Item
          name="anbar_api_token"
          label="anbār API token"
          extra={settings?.anbar_token_set ? 'A token is set — type a new one to replace it' : 'Not set'}
        >
          <Input.Password placeholder="Choose a long random string" autoComplete="new-password" />
        </Form.Item>

        <Button type="primary" htmlType="submit">Save</Button>
      </Form>
    </Card>
  )
}

function LookupsTab() {
  return (
    <Tabs
      tabPosition="left"
      items={LOOKUP_TABS.map((t) => ({
        key: t.key,
        label: t.label,
        children: <LookupList category={t.key} label={t.label} />,
      }))}
    />
  )
}

function LookupList({ category, label }: { category: LookupCategory; label: string }) {
  const { data = [], isLoading } = useLookups(category)
  const addLookup = useAddLookup()
  const deleteLookup = useDeleteLookup()
  const [value, setValue] = useState('')

  const add = async () => {
    if (!value.trim()) return
    try {
      await addLookup.mutateAsync({ category, value })
      setValue('')
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err.response?.data?.detail || 'Could not add the option')
    }
  }

  return (
    <Card title={label} size="small" style={{ maxWidth: 480 }}>
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPressEnter={add}
          placeholder="New option"
        />
        <Button type="primary" onClick={add} loading={addLookup.isPending}>Add</Button>
      </Space.Compact>
      <Table
        size="small"
        loading={isLoading}
        pagination={false}
        rowKey="id"
        showHeader={false}
        dataSource={data}
        columns={[
          { title: 'Value', dataIndex: 'value' },
          {
            title: '',
            key: 'actions',
            width: 50,
            render: (_: unknown, r: { id: number }) => (
              <Popconfirm
                title="Remove this option?"
                description="Records already using it keep their value."
                onConfirm={() => deleteLookup.mutate({ category, id: r.id })}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ),
          },
        ]}
      />
    </Card>
  )
}
