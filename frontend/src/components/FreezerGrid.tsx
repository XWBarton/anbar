import { Progress, Tooltip } from 'antd'
import type { FreezerMapBox } from '../types'

interface Props {
  shelfCount: number
  slotsPerShelf: number
  boxes: FreezerMapBox[]
  onSlotClick?: (shelf: number, slot: number, box?: FreezerMapBox) => void
}

/** Shelves x slots inside one freezer — where each box physically sits. */
export default function FreezerGrid({ shelfCount, slotsPerShelf, boxes, onSlotClick }: Props) {
  const byPosition = new Map(boxes.map((b) => [`${b.shelf}:${b.slot}`, b]))

  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `72px repeat(${slotsPerShelf}, minmax(150px, 1fr))`,
          gap: 8,
          minWidth: 'min-content',
        }}
      >
        <div />
        {Array.from({ length: slotsPerShelf }, (_, i) => (
          <div key={`head-${i}`} className="grid-axis" style={{ height: 20 }}>
            Slot {i + 1}
          </div>
        ))}

        {Array.from({ length: shelfCount }, (_, s) => {
          const shelf = s + 1
          return [
            <div key={`axis-${shelf}`} className="grid-axis" style={{ justifyContent: 'flex-end', paddingRight: 8 }}>
              Shelf {shelf}
            </div>,
            ...Array.from({ length: slotsPerShelf }, (_, i) => {
              const slot = i + 1
              const box = byPosition.get(`${shelf}:${slot}`)
              const percent = box && box.capacity ? Math.round((box.filled / box.capacity) * 100) : 0

              return (
                <div
                  key={`${shelf}-${slot}`}
                  className={`grid-cell${box ? '' : ' is-empty'}`}
                  style={{ height: 84, padding: 8, alignItems: 'stretch', justifyContent: 'center' }}
                  onClick={() => onSlotClick?.(shelf, slot, box)}
                >
                  {box ? (
                    <Tooltip title={`${box.filled} of ${box.capacity} slots used`}>
                      <div style={{ width: '100%' }}>
                        <div className="cell-name" style={{ fontSize: 13, marginBottom: 4 }}>{box.name}</div>
                        <Progress percent={percent} size="small" showInfo={false} strokeColor="#8C2F39" />
                        <div className="cell-label" style={{ marginTop: 2 }}>
                          {box.filled} / {box.capacity}
                        </div>
                      </div>
                    </Tooltip>
                  ) : (
                    <div className="cell-label">Empty slot</div>
                  )}
                </div>
              )
            }),
          ]
        })}
      </div>
    </div>
  )
}
