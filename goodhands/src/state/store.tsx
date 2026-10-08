import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import type {
  Absence, AbsenceKind, AppData, Reminder, BlanketStatus, Clock, CloseoutManual, DiaperLevel, DocumentRecord, ISODate, OneTimeTask,
  ParentNotice, PaymentMethod, Settings, SupplyLevel,
} from '@/types'
import { createSeed } from '@/data/seed'
import { addDays } from '@/utils/dates'
import { closeoutKey, EMPTY_CLOSEOUT } from '@/domain/tasks'

/**
 * THE STORE — the app's memory.
 *
 * Plain-English version: every screen reads from this one place, and every change goes through
 * a named "action" like `checkIn` or `markPaid`. That way, checking Amari in on the Attendance
 * page automatically updates the Home snapshot, the child's profile and what the assistant says —
 * nothing has to be copied between screens. When a real backend exists, these actions are the
 * only code that would change: instead of editing local data, they would call the server.
 *
 * A "reducer" is just a function: (current data, what happened) → new data.
 */
type Action =
  | { type: 'attendance/set'; childId: string; date: ISODate; patch: { checkIn?: Clock | null; checkOut?: Clock | null; note?: string | null } }
  | { type: 'absence/add'; absence: Absence }
  | { type: 'absence/removeDay'; childId: string; date: ISODate }
  | { type: 'absence/remove'; id: string }
  | { type: 'payment/pay'; id: string; paidOn: ISODate; method?: PaymentMethod; note?: string }
  | { type: 'payment/edit'; id: string; patch: { paidOn?: ISODate; method?: PaymentMethod; note?: string } }
  | { type: 'payment/unpay'; id: string }
  | { type: 'diaper/set'; childId: string; status: DiaperLevel; date: ISODate }
  | { type: 'diaper/notify'; notice: ParentNotice }
  | { type: 'supply/set'; id: string; status: SupplyLevel; by: string; date: ISODate }
  | { type: 'supplyCheck/toggle'; key: string }
  | { type: 'reminder/toggle'; key: string }
  | { type: 'reminder/add'; reminder: Reminder }
  | { type: 'reminder/remove'; id: string }
  | { type: 'blanket/set'; entries: Record<string, BlanketStatus> }
  | { type: 'task/done'; id: string; time: Clock | null }
  | { type: 'task/add'; task: OneTimeTask }
  | { type: 'task/remove'; id: string }
  | { type: 'shift/start'; employeeId: string; date: ISODate; time: Clock }
  | { type: 'shift/finish'; employeeId: string; date: ISODate; time: Clock; leftEarly?: number }
  | { type: 'shift/resolve'; employeeId: string; date: ISODate; checkOut: Clock; note: string }
  | { type: 'closeout/toggle'; employeeId: string; date: ISODate; key: keyof CloseoutManual }
  | { type: 'document/add'; doc: DocumentRecord }
  | { type: 'settings/update'; patch: Partial<Settings> }
  | { type: 'reset' }

function reducer(d: AppData, a: Action): AppData {
  switch (a.type) {
    case 'attendance/set': {
      const existing = d.attendance.find((r) => r.childId === a.childId && r.date === a.date)
      const next = { childId: a.childId, date: a.date, ...existing }
      for (const k of ['checkIn', 'checkOut', 'note'] as const) {
        const v = a.patch[k]
        if (v === null) delete next[k]
        else if (v !== undefined) next[k] = v
      }
      const rest = d.attendance.filter((r) => r !== existing)
      return { ...d, attendance: next.checkIn || next.note ? [...rest, next] : rest }
    }
    case 'absence/add': {
      // Marking someone absent replaces any attendance they had recorded for that day.
      return { ...d, absences: [...d.absences, a.absence] }
    }
    case 'absence/removeDay': {
      const out: Absence[] = []
      for (const ab of d.absences) {
        if (ab.childId !== a.childId || a.date < ab.start || a.date > ab.end) { out.push(ab); continue }
        if (ab.start < a.date) out.push({ ...ab, end: addDays(a.date, -1) })
        if (ab.end > a.date) out.push({ ...ab, id: ab.id + (ab.start < a.date ? '-b' : ''), start: addDays(a.date, 1) })
      }
      return { ...d, absences: out }
    }
    case 'absence/remove': return { ...d, absences: d.absences.filter((x) => x.id !== a.id) }
    case 'payment/edit':
      return { ...d, payments: d.payments.map((p) => (p.id === a.id ? { ...p, ...a.patch } : p)) }
    case 'payment/pay':
      return { ...d, payments: d.payments.map((p) => (p.id === a.id ? { ...p, paidOn: a.paidOn, method: a.method, note: a.note ?? p.note } : p)) }
    case 'payment/unpay':
      return { ...d, payments: d.payments.map((p) => (p.id === a.id ? { ...p, paidOn: undefined, method: undefined } : p)) }
    case 'diaper/set':
      return {
        ...d,
        children: d.children.map((c) => {
          if (c.id !== a.childId || !c.diaper) return c
          // A new level is a new situation: a parent told about "low" has not been told it is now "out".
          return { ...c, diaper: { status: a.status, updatedOn: a.date, notified: a.status === c.diaper.status ? c.diaper.notified : undefined } }
        }),
      }
    case 'diaper/notify':
      return {
        ...d,
        notices: [a.notice, ...d.notices],
        children: d.children.map((c) =>
          c.id === a.notice.childId && c.diaper ? { ...c, diaper: { ...c.diaper, notified: { date: a.notice.date, time: a.notice.time, by: a.notice.by, noticeId: a.notice.id } } } : c),
      }
    case 'supply/set':
      return {
        ...d,
        supplies: d.supplies.map((s) => (s.id === a.id ? { ...s, status: a.status, updatedOn: a.date } : s)),
        supplyEvents: [...d.supplyEvents, { id: `se-${d.supplyEvents.length + 1}-${a.id}`, supplyId: a.id, date: a.date, kind: a.status === 'good' ? 'restocked' : 'status', to: a.status, by: a.by }],
      }
    case 'supplyCheck/toggle': return { ...d, supplyChecks: { ...d.supplyChecks, [a.key]: !d.supplyChecks[a.key] } }
    case 'reminder/toggle': return { ...d, reminderDone: { ...d.reminderDone, [a.key]: !d.reminderDone[a.key] } }
    case 'reminder/add': return { ...d, reminders: [...d.reminders, a.reminder] }
    case 'reminder/remove': return { ...d, reminders: d.reminders.filter((r) => r.id !== a.id) }
    case 'blanket/set': return { ...d, blankets: { ...d.blankets, ...a.entries } }
    case 'task/done': {
      const taskDone = { ...d.taskDone }
      if (a.time) taskDone[a.id] = a.time
      else delete taskDone[a.id]
      return { ...d, taskDone }
    }
    case 'task/add': return { ...d, oneTimeTasks: [...d.oneTimeTasks, a.task] }
    case 'task/remove': return { ...d, oneTimeTasks: d.oneTimeTasks.filter((t) => t.id !== a.id) }
    case 'shift/start': {
      if (d.shifts.some((s) => s.employeeId === a.employeeId && s.date === a.date)) return d
      return { ...d, shifts: [...d.shifts, { employeeId: a.employeeId, date: a.date, checkIn: a.time }] }
    }
    case 'shift/finish':
      return {
        ...d,
        shifts: d.shifts.map((s) => (s.employeeId === a.employeeId && s.date === a.date
          ? { ...s, checkOut: a.time, ...(a.leftEarly ? { flag: 'left_early' as const, openItemsAtExit: a.leftEarly } : {}) }
          : s)),
      }
    case 'shift/resolve':
      return { ...d, shifts: d.shifts.map((s) => (s.employeeId === a.employeeId && s.date === a.date ? { ...s, checkOut: a.checkOut, flag: 'forgot_checkout' as const, resolvedNote: a.note } : s)) }
    case 'closeout/toggle': {
      const k = closeoutKey(a.employeeId, a.date)
      const cur = d.closeouts[k] ?? EMPTY_CLOSEOUT
      return { ...d, closeouts: { ...d.closeouts, [k]: { ...cur, [a.key]: !cur[a.key] } } }
    }
    case 'document/add': return { ...d, documents: [a.doc, ...d.documents.filter((x) => !(x.missing && x.ownerId === a.doc.ownerId && x.category === a.doc.category))] }
    case 'settings/update': return { ...d, settings: { ...d.settings, ...a.patch } }
    case 'reset': return createSeed()
  }
}

const DataCtx = createContext<AppData | null>(null)
const ActionsCtx = createContext<ReturnType<typeof buildActions> | null>(null)

function buildActions(dispatch: (a: Action) => void) {
  let seq = 100
  const uid = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`
  return {
    checkIn: (childId: string, date: ISODate, time: Clock) => dispatch({ type: 'attendance/set', childId, date, patch: { checkIn: time } }),
    checkOut: (childId: string, date: ISODate, time: Clock) => dispatch({ type: 'attendance/set', childId, date, patch: { checkOut: time } }),
    undoCheckIn: (childId: string, date: ISODate) => dispatch({ type: 'attendance/set', childId, date, patch: { checkIn: null, checkOut: null } }),
    undoCheckOut: (childId: string, date: ISODate) => dispatch({ type: 'attendance/set', childId, date, patch: { checkOut: null } }),
    correctAttendance: (childId: string, date: ISODate, patch: { checkIn?: Clock | null; checkOut?: Clock | null; note?: string | null }) => dispatch({ type: 'attendance/set', childId, date, patch }),
    addAbsence: (v: { childId: string; kind: AbsenceKind; start: ISODate; end: ISODate; note?: string }) => { const id = uid('abs'); dispatch({ type: 'absence/add', absence: { id, ...v } }); return id },
    removeAbsenceDay: (childId: string, date: ISODate) => dispatch({ type: 'absence/removeDay', childId, date }),
    removeAbsence: (id: string) => dispatch({ type: 'absence/remove', id }),
    editPayment: (id: string, patch: { paidOn?: ISODate; method?: PaymentMethod; note?: string }) => dispatch({ type: 'payment/edit', id, patch }),
    markPaid: (id: string, paidOn: ISODate, method?: PaymentMethod, note?: string) => dispatch({ type: 'payment/pay', id, paidOn, method, note }),
    markUnpaid: (id: string) => dispatch({ type: 'payment/unpay', id }),
    setDiaper: (childId: string, status: DiaperLevel, date: ISODate) => dispatch({ type: 'diaper/set', childId, status, date }),
    notifyParent: (n: Omit<ParentNotice, 'id'>) => { const id = uid('n'); dispatch({ type: 'diaper/notify', notice: { id, ...n } }); return id },
    setSupply: (id: string, status: SupplyLevel, by: string, date: ISODate) => dispatch({ type: 'supply/set', id, status, by, date }),
    toggleSupplyCheck: (date: ISODate, supplyId: string) => dispatch({ type: 'supplyCheck/toggle', key: `${date}:${supplyId}` }),
    toggleReminder: (reminderId: string, date: ISODate) => dispatch({ type: 'reminder/toggle', key: `${reminderId}:${date}` }),
    addReminder: (r: Omit<Reminder, 'id'>) => dispatch({ type: 'reminder/add', reminder: { id: uid('rem'), ...r } }),
    removeReminder: (id: string) => dispatch({ type: 'reminder/remove', id }),
    setBlankets: (date: ISODate, entries: Record<string, BlanketStatus>) => dispatch({ type: 'blanket/set', entries: Object.fromEntries(Object.entries(entries).map(([childId, s]) => [`${date}:${childId}`, s])) }),
    completeTask: (instanceId: string, time: Clock) => dispatch({ type: 'task/done', id: instanceId, time }),
    uncompleteTask: (instanceId: string) => dispatch({ type: 'task/done', id: instanceId, time: null }),
    addTask: (t: Omit<OneTimeTask, 'id'>) => dispatch({ type: 'task/add', task: { id: uid('task'), ...t } }),
    removeTask: (id: string) => dispatch({ type: 'task/remove', id }),
    startShift: (employeeId: string, date: ISODate, time: Clock) => dispatch({ type: 'shift/start', employeeId, date, time }),
    finishShift: (employeeId: string, date: ISODate, time: Clock, leftEarly?: number) => dispatch({ type: 'shift/finish', employeeId, date, time, leftEarly }),
    resolveShift: (employeeId: string, date: ISODate, checkOut: Clock, note: string) => dispatch({ type: 'shift/resolve', employeeId, date, checkOut, note }),
    toggleCloseout: (employeeId: string, date: ISODate, key: keyof CloseoutManual) => dispatch({ type: 'closeout/toggle', employeeId, date, key }),
    addDocument: (doc: Omit<DocumentRecord, 'id'>) => dispatch({ type: 'document/add', doc: { id: uid('doc'), ...doc } }),
    updateSettings: (patch: Partial<Settings>) => dispatch({ type: 'settings/update', patch }),
    resetDemo: () => dispatch({ type: 'reset' }),
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, createSeed)
  const actions = useMemo(() => buildActions(dispatch), [])
  return (
    <DataCtx.Provider value={data}>
      <ActionsCtx.Provider value={actions}>{children}</ActionsCtx.Provider>
    </DataCtx.Provider>
  )
}
export function useData() { const v = useContext(DataCtx); if (!v) throw new Error('useData must be used inside <DataProvider>'); return v }
export function useActions() { const v = useContext(ActionsCtx); if (!v) throw new Error('useActions must be used inside <DataProvider>'); return v }
