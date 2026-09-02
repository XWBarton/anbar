import { useState } from 'react'
import { AutoComplete, Form, Spin } from 'antd'
import { searchElementaExtractions, searchTesseraSpecimens } from '../api/admin'
import { useSiblingUrls } from '../hooks/useSiblingUrls'
import type { ElementaExtraction, TesseraSpecimen } from '../api/admin'

/** Resolve a Tessera specimen code or an Elementa extraction against the live
 *  sibling instead of typing it from memory. Hidden when unconfigured, and a
 *  failed lookup just yields no suggestions — never a blocked save. */

export function TesseraSpecimenPicker({ onPick }: { onPick: (code: string) => void }) {
  const { tessera } = useSiblingUrls()
  const [options, setOptions] = useState<{ value: string; label: string }[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async (q: string) => {
    if (q.trim().length < 2) { setOptions([]); return }
    setSearching(true)
    try {
      const results = await searchTesseraSpecimens(q)
      setOptions(results.map((s: TesseraSpecimen) => ({
        value: s.specimen_code,
        label: [s.specimen_code, s.project_code, s.collection_date].filter(Boolean).join(' · '),
      })))
    } catch {
      setOptions([])
    } finally {
      setSearching(false)
    }
  }

  return (
    <Form.Item
      name="specimen_code"
      label="Tessera specimen"
      tooltip={tessera ? 'Search Tessera for the source tube' : 'Set a Tessera URL in Settings to search'}
    >
      <AutoComplete
        options={options}
        onSearch={tessera ? handleSearch : undefined}
        notFoundContent={searching ? <Spin size="small" /> : null}
        onSelect={onPick}
        placeholder="e.g. AMPH2026-004"
      />
    </Form.Item>
  )
}

export function ElementaExtractionPicker({
  onPick,
}: {
  onPick: (extraction: ElementaExtraction) => void
}) {
  const { elementa } = useSiblingUrls()
  const [options, setOptions] = useState<{ value: string; label: string; record: ElementaExtraction }[]>([])
  const [searching, setSearching] = useState(false)

  if (!elementa) return null

  const handleSearch = async (q: string) => {
    if (q.trim().length < 2) { setOptions([]); return }
    setSearching(true)
    try {
      const results = await searchElementaExtractions(q)
      setOptions(results.map((e) => ({
        value: String(e.id),
        label: [e.specimen_code, e.extraction_type, e.kit, e.date].filter(Boolean).join(' · '),
        record: e,
      })))
    } catch {
      setOptions([])
    } finally {
      setSearching(false)
    }
  }

  return (
    <Form.Item label="Link to an Elementa extraction" tooltip="Fills the kit, date and specimen code from the run">
      <AutoComplete
        options={options}
        onSearch={handleSearch}
        notFoundContent={searching ? <Spin size="small" /> : null}
        placeholder="Search Elementa extractions…"
        onSelect={(_v, option) => onPick((option as unknown as { record: ElementaExtraction }).record)}
      />
    </Form.Item>
  )
}
