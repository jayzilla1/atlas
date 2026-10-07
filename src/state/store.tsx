import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { AccessGrant, ActivityEvent, Application, Person, Risk, RiskStatus, Task } from '@/data/types'
import { people as seedPeople } from '@/data/people'
import { applications as seedApps, accessGrants as seedGrants } from '@/data/applications'
import { risks as seedRisks } from '@/data/risks'
import { initialTasks } from '@/data/tasks'
import { initialActivity } from '@/data/activity'
import { TODAY_ISO } from '@/data/clock'
import { CURRENT_USER_ID } from '@/data/people'
import { can, PERMISSION_REASON, type Permission, type Role } from './permissions'

export type AccessDecision = 'keep' | 'reduce' | 'remove'
export type ThemePref = 'system' | 'light' | 'dark'
export interface DemoFlags { failNextLoad: boolean; aiOutage: boolean; slowLoads: boolean }

interface State {
  tasks: Task[]
  risks: Risk[]
  people: Person[]
  apps: Application[]
  grants: AccessGrant[]
  activity: ActivityEvent[]
  taskBatches: Record<string, string[]>
  role: Role
  theme: ThemePref
  inspect: boolean
  demo: DemoFlags
  nextTaskNumber: number
}

const NOW = `${TODAY_ISO}T09:30`
const initial = (): State => ({
  tasks: initialTasks, risks: seedRisks, people: seedPeople, apps: seedApps, grants: seedGrants, activity: initialActivity,
  taskBatches: {}, role: 'admin', theme: 'system', inspect: false, demo: { failNextLoad: false, aiOutage: false, slowLoads: false },
  nextTaskNumber: 301,
})

type Action =
  | { type: 'addTasks'; tasks: Omit<Task, 'id'>[]; batchId?: string }
  | { type: 'updateTask'; id: string; patch: Partial<Task> }
  | { type: 'undoBatch'; batchId: string }
  | { type: 'updateRisk'; id: string; patch: Partial<Risk>; note?: { actor: string; text: string } }
  | { type: 'submitAccessReview'; personId: string; decisions: Record<string, AccessDecision> }
  | { type: 'revokeAll'; personId: string }
  | { type: 'completeAppReview'; appId: string }
  | { type: 'log'; event: Omit<ActivityEvent, 'id' | 'at'> }
  | { type: 'setRole'; role: Role }
  | { type: 'setTheme'; theme: ThemePref }
  | { type: 'setInspect'; on: boolean }
  | { type: 'setDemo'; patch: Partial<DemoFlags> }
  | { type: 'reset' }

let evCounter = 100
function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'addTasks': {
      const created = a.tasks.map((t, i) => ({ ...t, id: `T-${s.nextTaskNumber + i}` }))
      return {
        ...s, tasks: [...created, ...s.tasks], nextTaskNumber: s.nextTaskNumber + created.length,
        taskBatches: a.batchId ? { ...s.taskBatches, [a.batchId]: created.map((t) => t.id) } : s.taskBatches,
      }
    }
    case 'updateTask':
      return { ...s, tasks: s.tasks.map((t) => (t.id === a.id ? { ...t, ...a.patch } : t)) }
    case 'undoBatch': {
      const ids = new Set(s.taskBatches[a.batchId] ?? [])
      return { ...s, tasks: s.tasks.filter((t) => !ids.has(t.id)), taskBatches: { ...s.taskBatches, [a.batchId]: [] } }
    }
    case 'updateRisk':
      return {
        ...s,
        risks: s.risks.map((r) =>
          r.id !== a.id ? r : {
            ...r, ...a.patch,
            activity: a.note ? [...r.activity, { at: NOW, actor: a.note.actor, text: a.note.text, kind: 'human' as const }] : r.activity,
          }),
      }
    case 'submitAccessReview': {
      let grants = s.grants
      const decisions = a.decisions
      grants = grants
        .filter((g) => !(g.personId === a.personId && decisions[g.appId] === 'remove'))
        .map((g) => (g.personId === a.personId && decisions[g.appId] === 'reduce' ? { ...g, role: 'Member', lastUsedDaysAgo: g.lastUsedDaysAgo } : g))
      const people = s.people.map((p) => (p.id === a.personId ? { ...p, accessReview: 'up_to_date' as const, accessIssues: p.accessIssues.filter((i) => decisions[i.appId] === 'keep' && i.kind === 'no_mfa') } : p))
      return { ...s, grants, people }
    }
    case 'revokeAll':
      return {
        ...s, grants: s.grants.filter((g) => g.personId !== a.personId),
        people: s.people.map((p) => (p.id === a.personId ? { ...p, accessReview: 'up_to_date' as const, accessIssues: [] } : p)),
      }
    case 'completeAppReview':
      return { ...s, apps: s.apps.map((x) => (x.id === a.appId ? { ...x, lastReview: TODAY_ISO } : x)) }
    case 'log':
      return { ...s, activity: [{ ...a.event, id: `ev${++evCounter}`, at: NOW }, ...s.activity] }
    case 'setRole': return { ...s, role: a.role }
    case 'setTheme': return { ...s, theme: a.theme }
    case 'setInspect': return { ...s, inspect: a.on }
    case 'setDemo': return { ...s, demo: { ...s.demo, ...a.patch } }
    case 'reset': return { ...initial(), theme: s.theme, role: s.role }
  }
}

export interface Store extends State {
  currentUser: Person
  personById: (id?: string) => Person | undefined
  appById: (id?: string) => Application | undefined
  riskById: (id?: string) => Risk | undefined
  grantsForPerson: (id: string) => AccessGrant[]
  grantsForApp: (id: string) => AccessGrant[]
  /** Permission check. `reason` is shown in disabled-state tooltips. */
  permission: (p: Permission) => { allowed: boolean; reason?: string }
  addTasks: (t: Omit<Task, 'id'>[], batchId?: string) => void
  updateTask: (id: string, patch: Partial<Task>) => void
  completeTask: (id: string) => void
  undoBatch: (batchId: string) => void
  setRiskStatus: (id: string, status: RiskStatus, note?: string) => void
  assignRisk: (id: string, ownerId: string) => void
  noteOnRisk: (id: string, text: string) => void
  submitAccessReview: (personId: string, d: Record<string, AccessDecision>) => void
  revokeAll: (personId: string) => void
  completeAppReview: (appId: string) => void
  log: (e: Omit<ActivityEvent, 'id' | 'at'>) => void
  setRole: (r: Role) => void
  setTheme: (t: ThemePref) => void
  setInspect: (on: boolean) => void
  setDemo: (p: Partial<DemoFlags>) => void
  reset: () => void
}

const Ctx = createContext<Store | null>(null)

function readTheme(): ThemePref {
  try { const t = localStorage.getItem('atlas-theme'); if (t === 'light' || t === 'dark' || t === 'system') return t } catch { /* storage unavailable */ }
  return 'system'
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({ ...initial(), theme: readTheme() }))

  // Apply theme to <html>
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = state.theme === 'dark' || (state.theme === 'system' && mq.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    }
    apply()
    mq.addEventListener('change', apply)
    try { localStorage.setItem('atlas-theme', state.theme) } catch { /* ignore */ }
    return () => mq.removeEventListener('change', apply)
  }, [state.theme])
  useEffect(() => { document.documentElement.dataset.inspect = state.inspect ? 'on' : 'off' }, [state.inspect])

  const maps = useMemo(() => {
    const pm = new Map(state.people.map((p) => [p.id, p]))
    const am = new Map(state.apps.map((p) => [p.id, p]))
    const rm = new Map(state.risks.map((p) => [p.id, p]))
    const gp = new Map<string, AccessGrant[]>(); const ga = new Map<string, AccessGrant[]>()
    for (const g of state.grants) {
      if (!gp.has(g.personId)) gp.set(g.personId, [])
      gp.get(g.personId)!.push(g)
      if (!ga.has(g.appId)) ga.set(g.appId, [])
      ga.get(g.appId)!.push(g)
    }
    return { pm, am, rm, gp, ga }
  }, [state.people, state.apps, state.risks, state.grants])

  const me = maps.pm.get(CURRENT_USER_ID)!
  const store = useMemo<Store>(() => ({
    ...state,
    currentUser: me,
    personById: (id) => (id ? maps.pm.get(id) : undefined),
    appById: (id) => (id ? maps.am.get(id) : undefined),
    riskById: (id) => (id ? maps.rm.get(id) : undefined),
    grantsForPerson: (id) => maps.gp.get(id) ?? [],
    grantsForApp: (id) => maps.ga.get(id) ?? [],
    permission: (p) => (can(state.role, p) ? { allowed: true } : { allowed: false, reason: PERMISSION_REASON[p] }),
    addTasks: (tasks, batchId) => dispatch({ type: 'addTasks', tasks, batchId }),
    updateTask: (id, patch) => dispatch({ type: 'updateTask', id, patch }),
    completeTask: (id) => dispatch({ type: 'updateTask', id, patch: { status: 'completed', completedAt: TODAY_ISO } }),
    undoBatch: (batchId) => dispatch({ type: 'undoBatch', batchId }),
    setRiskStatus: (id, status, note) => dispatch({ type: 'updateRisk', id, patch: { status }, note: { actor: me.name, text: note ?? `Changed status to ${status.replace('_', ' ')}.` } }),
    assignRisk: (id, ownerId) => dispatch({ type: 'updateRisk', id, patch: { ownerId }, note: { actor: me.name, text: `Assigned to ${maps.pm.get(ownerId)?.name ?? 'someone'}.` } }),
    noteOnRisk: (id, text) => dispatch({ type: 'updateRisk', id, patch: {}, note: { actor: me.name, text } }),
    submitAccessReview: (personId, decisions) => dispatch({ type: 'submitAccessReview', personId, decisions }),
    revokeAll: (personId) => dispatch({ type: 'revokeAll', personId }),
    completeAppReview: (appId) => dispatch({ type: 'completeAppReview', appId }),
    log: (event) => dispatch({ type: 'log', event }),
    setRole: (role) => dispatch({ type: 'setRole', role }),
    setTheme: (theme) => dispatch({ type: 'setTheme', theme }),
    setInspect: (on) => dispatch({ type: 'setInspect', on }),
    setDemo: (patch) => dispatch({ type: 'setDemo', patch }),
    reset: () => dispatch({ type: 'reset' }),
  }), [state, maps, me])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside <StoreProvider>')
  return s
}
export const usePermission = (p: Permission) => useStore().permission(p)

/** Convenience used by many pages */
export function useOwnerName() {
  const { personById } = useStore()
  return useCallback((id?: string) => personById(id)?.name ?? 'Unassigned', [personById])
}
