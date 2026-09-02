import { useState } from 'react'
import { Button, Card, Checkbox, Select, Space, Typography, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import client from '../api/client'
import { useFreezers } from '../hooks/useFreezers'

const { Title, Text } = Typography

export default function ExportPage() {
  const { data: freezers = [] } = useFreezers()
  const [itemType, setItemType] = useState<string | undefined>()
  const [freezerId, setFreezerId] = useState<number | undefined>()
  const [includeEmpty, setIncludeEmpty] = useState(true)
  const [loading, setLoading] = useState(false)

  const download = async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/export/items.csv', {
        params: { item_type: itemType, freezer_id: freezerId, include_empty: includeEmpty },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(new Blob([data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'anbar-inventory.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      message.error('Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Title level={2} style={{ marginTop: 0 }}>Export</Title>
      <Card style={{ maxWidth: 620 }}>
        <Text type="secondary">
          One row per tube, with its resolved location written exactly as it appears in the app.
        </Text>
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 24 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>Item type</Text>
            <Select
              allowClear
              style={{ width: 260 }}
              placeholder="Everything"
              value={itemType}
              onChange={setItemType}
              options={[
                { value: 'primer', label: 'Primers' },
                { value: 'reagent', label: 'Reagents' },
                { value: 'extract', label: 'Extracted DNA' },
              ]}
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>Freezer</Text>
            <Select
              allowClear
              style={{ width: 260 }}
              placeholder="All freezers"
              value={freezerId}
              onChange={setFreezerId}
              options={freezers.map((f) => ({ value: f.id, label: f.name }))}
            />
          </div>
          <Checkbox checked={includeEmpty} onChange={(e) => setIncludeEmpty(e.target.checked)}>
            Include tubes marked empty
          </Checkbox>
          <Button type="primary" icon={<DownloadOutlined />} loading={loading} onClick={download}>
            Download CSV
          </Button>
        </Space>
      </Card>
    </div>
  )
}
