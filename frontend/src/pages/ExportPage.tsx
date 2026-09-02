import { useState } from 'react'
import { Button, Card, Checkbox, Select, Space, Typography, message } from 'antd'
import { DatabaseOutlined, DownloadOutlined, FileZipOutlined } from '@ant-design/icons'
import client from '../api/client'
import { useFreezers } from '../hooks/useFreezers'
import { useAuth } from '../context/AuthContext'

const { Title, Text } = Typography

function downloadBlob(data: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ExportPage() {
  const { user } = useAuth()
  const { data: freezers = [] } = useFreezers()
  const [itemType, setItemType] = useState<string | undefined>()
  const [freezerId, setFreezerId] = useState<number | undefined>()
  const [includeEmpty, setIncludeEmpty] = useState(true)
  const [loading, setLoading] = useState(false)
  const [zipLoading, setZipLoading] = useState(false)
  const [dbLoading, setDbLoading] = useState(false)

  const download = async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/export/items.csv', {
        params: { item_type: itemType, freezer_id: freezerId, include_empty: includeEmpty },
        responseType: 'blob',
      })
      downloadBlob(data, 'anbar-inventory.csv', 'text/csv')
    } catch {
      message.error('Export failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadBoxesZip = async () => {
    setZipLoading(true)
    try {
      const { data } = await client.get('/export/boxes.zip', { responseType: 'blob' })
      downloadBlob(data, 'anbar-boxes.zip', 'application/zip')
    } catch {
      message.error('Export failed')
    } finally {
      setZipLoading(false)
    }
  }

  const downloadDatabase = async () => {
    setDbLoading(true)
    try {
      const { data } = await client.get('/export/database.sqlite', { responseType: 'blob' })
      downloadBlob(data, 'anbar-backup.db', 'application/vnd.sqlite3')
    } catch {
      message.error('Export failed')
    } finally {
      setDbLoading(false)
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

      <Card style={{ maxWidth: 620, marginTop: 24 }}>
        <Text type="secondary">
          One CSV per box (plus one for unplaced tubes), bundled into a zip.
        </Text>
        <div style={{ marginTop: 16 }}>
          <Button icon={<FileZipOutlined />} loading={zipLoading} onClick={downloadBoxesZip}>
            Download CSV per box (.zip)
          </Button>
        </div>
      </Card>

      {user?.is_admin && (
        <Card style={{ maxWidth: 620, marginTop: 24 }}>
          <Text type="secondary">
            A full, consistent snapshot of the underlying SQLite database — every table, not just
            inventory. Restore it by replacing the database file on the server.
          </Text>
          <div style={{ marginTop: 16 }}>
            <Button icon={<DatabaseOutlined />} loading={dbLoading} onClick={downloadDatabase}>
              Download full database (.db)
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
