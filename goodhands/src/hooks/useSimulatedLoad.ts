import { useCallback, useEffect, useState } from 'react'
import { useSession } from '@/state/session'

/**
 * Real apps wait for a server. This prototype has none, so to show what loading and error
 * states look like, the first visit to each screen "loads" briefly. The demo switch can force
 * the error state so the retry experience can be designed and reviewed.
 */
const seen = new Set<string>()
export type LoadState = 'loading' | 'error' | 'ready'

export function useSimulatedLoad(key: string, ms = 450): { state: LoadState; retry: () => void } {
  const { demo, setDemo } = useSession()
  const [ready, setReady] = useState(seen.has(key))
  useEffect(() => {
    if (ready) return
    const t = setTimeout(() => { seen.add(key); setReady(true) }, ms)
    return () => clearTimeout(t)
  }, [ready, key, ms])
  const retry = useCallback(() => { setDemo({ forceLoadError: false }); setReady(false) }, [setDemo])
  return { state: demo.forceLoadError ? 'error' : ready ? 'ready' : 'loading', retry }
}
