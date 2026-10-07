import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Filters live in the URL (?severity=critical&q=contractor) so a dashboard card can deep-link
 * to a pre-filtered list, filtered views are shareable, and the Back button works.
 */
export function useQueryFilters<K extends string>(keys: readonly K[], defaults: Partial<Record<K, string>> = {}) {
  const [params, setParams] = useSearchParams()
  const values = Object.fromEntries(keys.map((k) => [k, params.get(k) ?? defaults[k] ?? 'all'])) as Record<K, string>
  const search = params.get('q') ?? ''
  const set = useCallback((key: K | 'q', v: string) => {
    setParams((p) => { const n = new URLSearchParams(p); if (!v || v === 'all') n.delete(key); else n.set(key, v); return n }, { replace: true })
  }, [setParams])
  const clear = useCallback(() => setParams({}, { replace: true }), [setParams])
  return { values, search, set, setSearch: (v: string) => set('q', v), clear }
}
