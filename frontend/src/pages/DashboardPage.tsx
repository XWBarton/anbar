import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Card, Checkbox, Col, Drawer, Empty, List, Progress, Row, Space, Statistic,
  Typography,
} from 'antd'
import {
  ExperimentOutlined, GoldOutlined, HolderOutlined, InboxOutlined,
  MedicineBoxOutlined, SettingOutlined,
} from '@ant-design/icons'
import { useSummary } from '../hooks/useSummary'
import { useFreezers } from '../hooks/useFreezers'
import FreezerMapWidget from '../components/FreezerMapWidget'
import StateTag from '../components/StateTag'
import ItemTypeTag from '../components/ItemTypeTag'

const { Title, Text } = Typography

// Which freezer maps this person wants on their dashboard, and in what order.
// Kept per browser, the same way Tessera stores its widget choices.
const STORAGE_KEY = 'anbar_dashboard_freezers'

function loadChosen(): number[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as number[]) : null
  } catch {
    return null
  }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: summary, isLoading } = useSummary()
  const { data: freezers = [] } = useFreezers()

  // null means "never chosen" — show every freezer until they say otherwise.
  const [chosen, setChosen] = useState<number[] | null>(loadChosen)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [draft, setDraft] = useState<number[]>([])
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  // Drop freezers that have since been deleted.
  useEffect(() => {
    if (chosen && freezers.length) {
      const live = chosen.filter((id) => freezers.some((f) => f.id === id))
      if (live.length !== chosen.length) setChosen(live)
    }
  }, [freezers])

  if (isLoading || !summary) return <Card loading />

  const shownIds = chosen ?? freezers.map((f) => f.id)
  const shown = shownIds
    .map((id) => freezers.find((f) => f.id === id))
    .filter((f): f is NonNullable<typeof f> => !!f)

  const openDrawer = () => {
    setDraft(shownIds)
    setDrawerOpen(true)
  }

  const saveAndClose = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    setChosen(draft)
    setDrawerOpen(false)
  }

  const toggleDraft = (id: number, checked: boolean) =>
    setDraft((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))

  const handleDrop = (targetId: number) => {
    if (dragId === null || dragId === targetId) return
    setDraft((prev) => {
      const next = prev.filter((x) => x !== dragId)
      next.splice(next.indexOf(targetId), 0, dragId)
      return next
    })
    setDragId(null)
    setDragOver(null)
  }

  const stats = [
    { title: 'Primer tubes', value: summary.primers, icon: <ExperimentOutlined />, to: '/primers' },
    { title: 'Reagent bottles', value: summary.reagents, icon: <MedicineBoxOutlined />, to: '/reagents' },
    { title: 'DNA tubes', value: summary.extracts, icon: <GoldOutlined />, to: '/extracts' },
    { title: 'Boxes', value: summary.boxes, icon: <InboxOutlined />, to: '/freezers' },
  ]

  // Ordered so unchosen freezers are still reachable at the bottom of the list.
  const drawerOrder = [...draft, ...freezers.map((f) => f.id).filter((id) => !draft.includes(id))]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Dashboard</Title>
        <Button icon={<SettingOutlined />} onClick={openDrawer} disabled={freezers.length === 0}>
          Customise
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col xs={12} md={6} key={s.title}>
            <Card hoverable onClick={() => navigate(s.to)}>
              <Statistic title={s.title} value={s.value} prefix={s.icon} />
            </Card>
          </Col>
        ))}
      </Row>

      {freezers.length === 0 ? (
        <Card style={{ marginTop: 16 }}>
          <Empty description="No freezers yet">
            <Button type="primary" onClick={() => navigate('/freezers')}>Add a freezer</Button>
          </Empty>
        </Card>
      ) : shown.length === 0 ? (
        <Card style={{ marginTop: 16 }}>
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            <SettingOutlined style={{ fontSize: 28, marginBottom: 12, display: 'block' }} />
            No freezer maps shown. Click <strong>Customise</strong> to choose which appear here.
          </div>
        </Card>
      ) : (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {shown.map((f) => (
            <Col xs={24} xl={shown.length === 1 ? 24 : 12} key={f.id}>
              <FreezerMapWidget freezerId={f.id} />
            </Col>
          ))}
        </Row>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Freezer occupancy">
            {freezers.length === 0 ? (
              <Empty description="No freezers yet" />
            ) : (
              <List
                dataSource={freezers}
                renderItem={(f) => {
                  const capacity = f.shelf_count * f.slots_per_shelf
                  return (
                    <List.Item
                      key={f.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/freezers/${f.id}`)}
                    >
                      <div style={{ width: '100%' }}>
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                          <Text strong>{f.name}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {f.box_count} / {capacity} positions · {f.item_count} tubes
                          </Text>
                        </Space>
                        <Progress
                          percent={capacity ? Math.round((f.box_count / capacity) * 100) : 0}
                          size="small"
                          showInfo={false}
                          strokeColor="#8C2F39"
                        />
                      </div>
                    </List.Item>
                  )
                }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Worth a look"
            extra={<Text type="secondary" style={{ fontSize: 12 }}>Marked low or empty</Text>}
          >
            {summary.needs_attention.length === 0 ? (
              <Empty description="Nothing marked low or empty" />
            ) : (
              <List
                dataSource={summary.needs_attention.slice(0, 10)}
                renderItem={(i) => (
                  <List.Item key={i.id}>
                    <Space wrap>
                      <ItemTypeTag type={i.item_type} />
                      <Text strong>{i.name}</Text>
                      <StateTag state={i.state} />
                      <Text type="secondary">{i.location}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Recently added">
            {summary.recent.length === 0 ? (
              <Empty description="Nothing stored yet" />
            ) : (
              <List
                dataSource={summary.recent}
                renderItem={(i) => (
                  <List.Item key={i.id}>
                    <Space wrap>
                      <ItemTypeTag type={i.item_type} />
                      <Text strong>{i.name}</Text>
                      <StateTag state={i.state} />
                      <Text type="secondary">{i.location}</Text>
                      {i.owner_display && <Text type="secondary">· {i.owner_display}</Text>}
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Drawer
        title="Freezer maps"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={320}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={saveAndClose}>Save</Button>
          </div>
        }
      >
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          Tick the freezers to show on your dashboard. Drag them to reorder.
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {drawerOrder.map((id) => {
            const freezer = freezers.find((f) => f.id === id)
            if (!freezer) return null
            const isEnabled = draft.includes(id)
            const isDragging = dragId === id
            const isOver = dragOver === id
            return (
              <div
                key={id}
                draggable={isEnabled}
                onDragStart={isEnabled ? () => setDragId(id) : undefined}
                onDragOver={isEnabled ? (e) => { e.preventDefault(); setDragOver(id) } : undefined}
                onDrop={isEnabled ? (e) => { e.preventDefault(); handleDrop(id) } : undefined}
                onDragEnd={() => { setDragId(null); setDragOver(null) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 6,
                  background: isDragging ? '#f5f5f5' : isOver ? '#F8EFEE' : 'transparent',
                  border: `1px solid ${isOver ? '#8C2F39' : 'transparent'}`,
                  opacity: isDragging ? 0.4 : 1,
                  cursor: isEnabled ? 'grab' : 'default',
                  userSelect: 'none',
                }}
              >
                <HolderOutlined style={{ color: isEnabled ? '#bbb' : 'transparent', fontSize: 14, flexShrink: 0 }} />
                <Checkbox checked={isEnabled} onChange={(e) => toggleDraft(id, e.target.checked)}>
                  {freezer.name}
                  {freezer.kind && <Text type="secondary" style={{ marginLeft: 6 }}>{freezer.kind}</Text>}
                </Checkbox>
              </div>
            )
          })}
        </div>
      </Drawer>
    </div>
  )
}
