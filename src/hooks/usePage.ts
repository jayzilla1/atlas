import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '@/state/store'

export function usePageTitle(title: string) {
  useEffect(() => { document.title = `${title} · Atlas` }, [title])
}

const seen = new Set<string>()
/**
 * Simulated data loading so the loading / error states can be demonstrated.
 * First visit to a view in a session shows a short skeleton; “Demo controls → Fail next load”
 * forces the error state once, and `retry` recovers. (A real app would wrap its data fetching here.)
 */
export function useSimulatedLoad(key: string) {
  const { demo, setDemo } = useStore()
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(() => (seen.has(key) && !demo.failNextLoad ? 'ready' : 'loading'))
  const timer = useRef<number>(0)
  const run = useCallback(() => {
    setState('loading')
    window.clearTimeout(timer.current)
    const ms = demo.slowLoads ? 2600 : 520
    timer.current = window.setTimeout(() => {
      if (demo.failNextLoad) { setDemo({ failNextLoad: false }); setState('error'); return }
      seen.add(key); setState('ready')
    }, ms)
  }, [demo.slowLoads, demo.failNextLoad, key, setDemo])
  useEffect(() => { if (state === 'loading') run(); return () => window.clearTimeout(timer.current) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return { state, retry: run, loading: state === 'loading', error: state === 'error' }
}
