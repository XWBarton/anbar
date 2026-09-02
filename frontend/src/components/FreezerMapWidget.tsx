import { useNavigate } from 'react-router-dom'
import { Card, Empty, Skeleton, Typography } from 'antd'
import { useFreezerMap } from '../hooks/useFreezers'
import FreezerGrid from './FreezerGrid'

const { Text } = Typography

/** A live shelf x slot map of one freezer, for the dashboard. */
export default function FreezerMapWidget({ freezerId }: { freezerId: number }) {
  const navigate = useNavigate()
  const { data: map, isLoading } = useFreezerMap(freezerId)

  if (isLoading || !map) {
    return <Card><Skeleton active paragraph={{ rows: 3 }} /></Card>
  }

  return (
    <Card
      title={<a onClick={() => navigate(`/freezers/${freezerId}`)}>{map.freezer.name}</a>}
      extra={
        <Text type="secondary" style={{ fontSize: 12 }}>
          {map.freezer.box_count} boxes · {map.freezer.item_count} tubes
        </Text>
      }
      styles={{ body: { paddingTop: 12 } }}
    >
      {map.boxes.length === 0 && map.unplaced_boxes.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No boxes yet" />
      ) : (
        <FreezerGrid
          shelfCount={map.shelf_count}
          slotsPerShelf={map.slots_per_shelf}
          boxes={map.boxes}
          onSlotClick={(_shelf, _slot, box) => {
            if (box) navigate(`/boxes/${box.id}`)
            else navigate(`/freezers/${freezerId}`)
          }}
        />
      )}
    </Card>
  )
}
