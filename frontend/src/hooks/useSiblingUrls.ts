import { useQuery } from '@tanstack/react-query'
import { getPublicSettings } from '../api/admin'

function clean(url?: string): string | null {
  const trimmed = (url ?? '').trim()
  return trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
    ? trimmed.replace(/\/$/, '')
    : null
}

/** Base URLs of the sibling apps, or null when unconfigured — every deep link
 *  in the UI is hidden rather than broken when a sibling is not set up. */
export function useSiblingUrls(): { elementa: string | null; tessera: string | null } {
  const { data } = useQuery({
    queryKey: ['public-settings'],
    queryFn: getPublicSettings,
    staleTime: 5 * 60 * 1000,
  })
  return { elementa: clean(data?.elementa_url), tessera: clean(data?.tessera_url) }
}
