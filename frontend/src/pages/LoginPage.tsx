import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import { login } from '../api/auth'

const { Text } = Typography

export default function LoginPage() {
  const { user, login: authLogin } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form] = Form.useForm()
  const redirect = searchParams.get('redirect') || '/dashboard'

  useEffect(() => {
    if (user) navigate(redirect, { replace: true })
  }, [user, navigate, redirect])

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      const token = await login(values.username, values.password)
      await authLogin(token.access_token)
      navigate(redirect, { replace: true })
    } catch {
      message.error('Invalid username or password')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F6E7E6 0%, #E0BEBB 100%)',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 8px 40px rgba(140,47,57,0.15)', borderRadius: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/anbar-logo.png"
            alt="anbār"
            style={{ height: 72, marginBottom: 12, objectFit: 'contain' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div
            className="brand-title"
            style={{ fontSize: 36, color: '#8C2F39', marginBottom: 6, lineHeight: 1.1 }}
          >
            anbār
          </div>
          <Text type="secondary" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 11 }}>
            Cold Storage
          </Text>
        </div>
        <Form form={form} onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: 'Username required' }]}>
            <Input prefix={<UserOutlined />} placeholder="Username" autoFocus onPressEnter={() => form.submit()} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Password required' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" onPressEnter={() => form.submit()} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
