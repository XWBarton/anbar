import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Input, Progress, Space, Table, Tag, Typography } from 'antd'
import { useBoxes } from '../hooks/useBoxes'
import OwnerCell from '../components/OwnerCell'
import type { Box } from '../types'

const { Title, Text } = Typography

export default function BoxesPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const { data: boxes = [], isLoading } = useBoxes(undefined, q)

  const columns = [
    {
      title: 'Box',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, r: Box) => <a onClick={() => navigate(`/boxes/${r.id}`)}>{v}</a>,
    },
    {
      title: 'Freezer',
      key: 'freezer',
      render: (_: unknown, r: Box) =>
        r.freezer_name
          ? <a onClick={() => navigate(`/freezers/${r.freezer_id}`)}>{r.freezer_name}</a>
          : <Text type="secondary">not placed</Text>,
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
      title: 'Owner / Project',
      key: 'owner',
      width: 200,
      render: (_: unknown, r: Box) => <OwnerCell record={r} />,
    },
  ]

  return (
    <div>
      <Title level={2} style={{ marginTop: 0 }}>Boxes</Title>
      <Text type="secondary">
        Boxes usually belong to a project or a person. Search by box name or owner to jump
        straight in, whatever mix of primers, reagents or DNA it holds.
      </Text>

      <Card style={{ marginTop: 16 }}>
        <Input.Search
          size="large"
          autoFocus
          allowClear
          placeholder="Box name, project, or owner…"
          onSearch={setQ}
          onChange={(e) => { if (!e.target.value) setQ('') }}
          style={{ maxWidth: 480, marginBottom: 16 }}
        />
        <Table
          columns={columns}
          dataSource={boxes}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          locale={{ emptyText: q ? `No boxes matching "${q}"` : 'No boxes yet' }}
        />
      </Card>
    </div>
  )
}
