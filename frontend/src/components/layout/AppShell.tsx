import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Typography, Space, Grid } from 'antd'
import {
  DashboardOutlined,
  ExperimentOutlined,
  ExportOutlined,
  InboxOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
  GoldOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'

const { Header, Sider, Content } = Layout
const { Text } = Typography
const { useBreakpoint } = Grid

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/find', icon: <SearchOutlined />, label: 'Find' },
  { key: '/primers', icon: <ExperimentOutlined />, label: 'Primers' },
  { key: '/reagents', icon: <MedicineBoxOutlined />, label: 'Reagents' },
  { key: '/extracts', icon: <GoldOutlined />, label: 'Extracted DNA' },
  { key: '/freezers', icon: <InboxOutlined />, label: 'Freezers' },
  { key: '/export', icon: <ExportOutlined />, label: 'Export' },
]

const adminItems = [{ key: '/admin', icon: <SettingOutlined />, label: 'Settings' }]
const bottomItems = [{ key: '/help', icon: <QuestionCircleOutlined />, label: 'Help' }]

export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const screens = useBreakpoint()
  const [collapsed, setCollapsed] = useState(!screens.md)

  const allItems = user?.is_admin ? [...menuItems, ...adminItems] : menuItems

  const selectedKey =
    [...allItems, ...bottomItems].find((item) => location.pathname.startsWith(item.key))?.key ||
    (location.pathname.startsWith('/boxes') ? '/freezers' : '/dashboard')

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={220}
        style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
        breakpoint="md"
        collapsedWidth={screens.xs ? 0 : 80}
      >
        <div
          style={{
            padding: collapsed ? '16px 8px' : '16px',
            borderBottom: '1px solid #f0f0f0',
            textAlign: 'center',
          }}
        >
          {!collapsed ? (
            <>
              <div className="brand-title" style={{ fontSize: 22, fontWeight: 700, color: '#8C2F39', lineHeight: 1.2 }}>
                anbār
              </div>
              <Text type="secondary" style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Cold Storage
              </Text>
            </>
          ) : (
            <div style={{ fontSize: 22, color: '#8C2F39', fontWeight: 700 }}>ا</div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={allItems}
            onClick={({ key }) => navigate(key)}
            style={{ borderRight: 0, marginTop: 8 }}
            inlineCollapsed={collapsed}
          />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={bottomItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, borderTop: '1px solid #f0f0f0' }}
          inlineCollapsed={collapsed}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 16px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Space>
            <UserOutlined style={{ color: '#999' }} />
            <Text strong style={{ fontSize: 13 }}>{user?.full_name}</Text>
            {user?.is_admin && <Text type="secondary" style={{ fontSize: 11 }}>(Admin)</Text>}
            <Button icon={<LogoutOutlined />} type="text" onClick={logout}>
              {screens.md ? 'Logout' : ''}
            </Button>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#F8F2F1', overflowY: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
