import { useState } from 'react'
import { Alert, AutoComplete, Form, Spin } from 'antd'
import { searchElementaPrimers } from '../api/admin'
import { useSiblingUrls } from '../hooks/useSiblingUrls'
import type { ElementaPrimer } from '../api/admin'

/** Pull a primer design straight out of Elementa's library rather than retyping
 *  it. Renders nothing at all when Elementa is not configured. */
export default function ElementaPrimerPicker({
  onPick,
}: {
  onPick: (primer: Partial<ElementaPrimer> & { elementa_primer_id?: number }) => void
}) {
  const { elementa } = useSiblingUrls()
  const [options, setOptions] = useState<{ value: string; primer: ElementaPrimer }[]>([])
  const [searching, setSearching] = useState(false)

  if (!elementa) return null

  const handleSearch = async (q: string) => {
    if (q.trim().length < 2) { setOptions([]); return }
    setSearching(true)
    try {
      const results = await searchElementaPrimers(q)
      setOptions(results.map((p) => ({ value: p.name, primer: p })))
    } catch {
      setOptions([])
    } finally {
      setSearching(false)
    }
  }

  return (
    <Form.Item label="Import from Elementa" tooltip="Search Elementa's primer library and fill this form from it">
      <AutoComplete
        style={{ width: '100%' }}
        options={options}
        onSearch={handleSearch}
        notFoundContent={searching ? <Spin size="small" /> : null}
        placeholder="Search Elementa primers…"
        onSelect={(_value, option) => {
          const p = (option as unknown as { primer: ElementaPrimer }).primer
          onPick({
            name: p.name,
            sequence: p.sequence,
            direction: p.direction,
            target_gene: p.target_gene,
            target_organism: p.target_organism,
            tm_c: p.tm_c,
            reference: p.reference,
            elementa_primer_id: p.id,
          })
        }}
      />
      <Alert
        type="info"
        showIcon
        style={{ marginTop: 8 }}
        message="anbār keeps its own copy of the design and tracks the physical tubes. Elementa stays the record of what the primer is."
      />
    </Form.Item>
  )
}
