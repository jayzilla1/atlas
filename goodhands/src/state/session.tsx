import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Clock, ISODate, Role, Session } from '@/types'
import { DEMO_START_TIME, DEMO_TODAY } from '@/data/clock'
import type { Now } from '@/domain/now'
import { clockOf, toDate, toISO } from '@/utils/dates'

/**
 * SESSION: who is signed in (role), the demo clock, and the demo-only switches.
 * There is no real login in V1 — the "Viewing as" switcher stands in for it. The role is
 * read by every screen through `can(role, ...)`, which is how the same app can show an
 * owner everything and an employee only their day.
 */
interface DemoFlags { forceLoadError: boolean; aiOutage: boolean }
interface SessionValue {
  session: Session
  setSession: (s: Session) => void
  role: Role
  now: Now
  today: ISODate
  /** Move the demo clock, e.g. to see 7:30 AM, end of day, or the next morning. */
  jumpTo: (date: ISODate, time: Clock) => void
  demo: DemoFlags
  setDemo: (patch: Partial<DemoFlags>) => void
}
const Ctx = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  // Remember who you're viewing as across page reloads (this tab only). Data is NOT persisted — see store.tsx.
  const [session, setSessionState] = useState<Session>(() => {
    try { const v = sessionStorage.getItem('goodhands.session'); if (v) return JSON.parse(v) as Session } catch { /* storage unavailable: fine */ }
    return { role: 'owner' }
  })
  const setSession = useCallback((s: Session) => {
    setSessionState(s)
    try { sessionStorage.setItem('goodhands.session', JSON.stringify(s)) } catch { /* ignore */ }
  }, [])
  const [demo, setDemoState] = useState<DemoFlags>({ forceLoadError: false, aiOutage: false })
  const anchor = useRef<{ sim: Date; real: number } | null>(null)
  if (!anchor.current) {
    const start = toDate(DEMO_TODAY)
    const [h, m] = DEMO_START_TIME.split(':').map(Number)
    start.setHours(h, m, 0, 0)
    anchor.current = { sim: start, real: Date.now() }
  }
  const [, bump] = useState(0)
  // The clock keeps moving in real time after you set it. Re-render every 20s so "5 minutes late" stays true.
  useEffect(() => { const t = setInterval(() => bump((n) => n + 1), 20000); return () => clearInterval(t) }, [])

  const sim = new Date(anchor.current.sim.getTime() + (Date.now() - anchor.current.real))
  const date = toISO(sim), time = clockOf(sim)
  const now = useMemo<Now>(() => ({ date, time }), [date, time])

  const jumpTo = useCallback((d: ISODate, t: Clock) => {
    const nd = toDate(d); const [h, m] = t.split(':').map(Number); nd.setHours(h, m, 0, 0)
    anchor.current = { sim: nd, real: Date.now() }; bump((n) => n + 1)
  }, [])
  const setDemo = useCallback((p: Partial<DemoFlags>) => setDemoState((s) => ({ ...s, ...p })), [])

  const value = useMemo(() => ({ session, setSession, role: session.role, now, today: now.date, jumpTo, demo, setDemo }), [session, setSession, now, jumpTo, demo, setDemo])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useSession() { const v = useContext(Ctx); if (!v) throw new Error('useSession must be used inside <SessionProvider>'); return v }
