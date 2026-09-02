import { Tooltip } from 'antd'
import type { BoxCell, ItemType } from '../types'
import { TYPE_COLOURS } from './ItemTypeTag'

interface Props {
  rows: number
  cols: number
  cells: BoxCell[]
  selected?: { row: number; col: number } | null
  onCellClick?: (cell: BoxCell) => void
  cellSize?: number
}

/** The rows x cols map of one box. Rows are lettered A, B, C…; columns numbered. */
export default function BoxGrid({ rows, cols, cells, selected, onCellClick, cellSize = 62 }: Props) {
  const byPosition = new Map(cells.map((c) => [`${c.row}:${c.col}`, c]))

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `24px repeat(${cols}, ${cellSize}px)`,
          gap: 4,
          width: 'max-content',
        }}
      >
        <div />
        {Array.from({ length: cols }, (_, i) => (
          <div key={`head-${i}`} className="grid-axis" style={{ height: 20 }}>
            {i + 1}
          </div>
        ))}

        {Array.from({ length: rows }, (_, r) => {
          const rowNumber = r + 1
          const letter = String.fromCharCode(65 + r)
          return [
            <div key={`axis-${rowNumber}`} className="grid-axis">{letter}</div>,
            ...Array.from({ length: cols }, (_, c) => {
              const colNumber = c + 1
              const cell = byPosition.get(`${rowNumber}:${colNumber}`)
              const item = cell?.item ?? null
              const isSelected = selected?.row === rowNumber && selected?.col === colNumber
              const classes = ['grid-cell']
              if (!item) classes.push('is-empty')
              if (isSelected) classes.push('is-selected')

              const body = (
                <div
                  key={`${rowNumber}-${colNumber}`}
                  className={classes.join(' ')}
                  style={{
                    height: cellSize,
                    borderLeft: item ? `3px solid ${TYPE_COLOURS[item.item_type as ItemType]}` : undefined,
                    opacity: item?.state === 'empty' ? 0.5 : 1,
                  }}
                  onClick={() => cell && onCellClick?.(cell)}
                >
                  <div className="cell-label">{letter}{colNumber}</div>
                  {item && <div className="cell-name">{item.name}</div>}
                </div>
              )

              return item ? (
                <Tooltip
                  key={`${rowNumber}-${colNumber}`}
                  title={
                    <>
                      <div><strong>{item.name}</strong></div>
                      {item.label && <div>{item.label}</div>}
                      <div>{item.state}</div>
                      {item.owner_display && <div>{item.owner_display}</div>}
                    </>
                  }
                >
                  {body}
                </Tooltip>
              ) : body
            }),
          ]
        })}
      </div>
    </div>
  )
}
