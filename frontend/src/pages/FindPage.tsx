import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Empty, Input, List, Space, Spin, Tag, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { search } from '../api/search'
import ItemTypeTag from '../components/ItemTypeTag'
import StateTag from '../components/StateTag'
import type { SearchResult } from '../types'

const { Title, Text } = Typography

export default function FindPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const { data, isFetching } = useQuery({
    queryKey: ['find', query],
    queryFn: () => search(query),
    enabled: query.trim().length >= 2,
  })

  const results = data?.results ?? []

  const openRecord = (r: SearchResult) =>
    navigate(
      r.kind === 'primer' ? `/primers/${r.id}`
      : r.kind === 'reagent' ? `/reagents/${r.id}`
      : `/extracts/${r.id}`
    )

  return (
    <div>
      <Title level={2} style={{ marginTop: 0 }}>Find</Title>
      <Text type="secondary">One question: where is it?</Text>

      <Card style={{ marginTop: 16 }}>
        <Input.Search
          size="large"
          autoFocus
          allowClear
          placeholder="Primer name, reagent, organism, specimen code…"
          onSearch={setQuery}
          onChange={(e) => { if (!e.target.value) setQuery('') }}
          style={{ maxWidth: 560 }}
        />

        <div style={{ marginTop: 24 }}>
          {isFetching && <Spin />}

          {!isFetching && query.trim().length >= 2 && results.length === 0 && (
            <Empty description={`Nothing matching "${query}"`} />
          )}

          {!isFetching && results.length > 0 && (
            <List
              itemLayout="vertical"
              dataSource={results}
              renderItem={(r) => (
                <List.Item key={`${r.kind}-${r.id}`}>
                  <Space align="center" style={{ marginBottom: 8 }}>
                    <ItemTypeTag type={r.kind} />
                    <a style={{ fontSize: 16, fontWeight: 600 }} onClick={() => openRecord(r)}>
                      {r.name}
                    </a>
                    {r.subtitle && <Text type="secondary">{r.subtitle}</Text>}
                  </Space>

                  {r.tubes.length === 0 ? (
                    <div><Text type="secondary">No tubes recorded</Text></div>
                  ) : (
                    <List
                      size="small"
                      dataSource={r.tubes}
                      renderItem={(t) => (
                        <List.Item style={{ paddingLeft: 0, opacity: t.state === 'empty' ? 0.5 : 1 }}>
                          <Space wrap>
                            <StateTag state={t.state} />
                            <Text strong>{t.location}</Text>
                            {t.label && <Tag>{t.label}</Tag>}
                            {t.owner_display && <Text type="secondary">{t.owner_display}</Text>}
                          </Space>
                        </List.Item>
                      )}
                    />
                  )}
                </List.Item>
              )}
            />
          )}
        </div>
      </Card>
    </div>
  )
}
