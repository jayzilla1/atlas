import type { AppData, CloseoutManual, CloseoutStatus, ISODate, ShiftRecord, ShiftTask } from '@/types'
import type { Now } from './now'
import { attendanceRows, summarize } from './attendance'
import { employeeName } from './people'
import { toMinutes, weekdayOf, fmtTime } from '@/utils/dates'

/* --------------------------------------------------------------- scheduling */
export const timeOffOn = (d: AppData, employeeId: string, date: ISODate) => d.timeOff.find((t) => t.employeeId === employeeId && date >= t.start && date <= t.end)
export const shiftOn = (d: AppData, employeeId: string, date: ISODate) => {
  const e = d.employees.find((x) => x.id === employeeId)
  if (!e || date < e.hiredOn || timeOffOn(d, employeeId, date)) return undefined
  return e.weekly[weekdayOf(date)]
}
export const shiftRecord = (d: AppData, employeeId: string, date: ISODate): ShiftRecord | undefined => d.shifts.find((s) => s.employeeId === employeeId && s.date === date)

/* -------------------------------------------------------------------- tasks */
/** The employee's checklist for one date: routine tasks (if they work that day) + any one-time tasks. */
export function tasksFor(d: AppData, employeeId: string, date: ISODate): ShiftTask[] {
  const works = !!shiftOn(d, employeeId, date)
  const routine: ShiftTask[] = works
    ? d.routines.filter((r) => r.employeeId === employeeId).map((r) => ({
        id: `${r.id}@${date}`, employeeId, date, time: r.time, title: r.title, notes: r.notes, source: r.kind === 'closeout' ? 'closeout' : 'routine', completedAt: d.taskDone[`${r.id}@${date}`],
      }))
    : []
  const once: ShiftTask[] = d.oneTimeTasks.filter((t) => t.employeeId === employeeId && t.date === date)
    .map((t) => ({ ...t, source: 'one_time' as const, completedAt: d.taskDone[`${t.id}@${date}`] }))
  return [...routine, ...once].sort((a, b) => a.time.localeCompare(b.time))
}
export type TaskState = 'completed' | 'overdue' | 'upcoming'
export function taskState(t: ShiftTask, now: Now): TaskState {
  if (t.completedAt) return 'completed'
  if (t.date < now.date) return 'overdue'
  if (t.date === now.date && toMinutes(t.time) < toMinutes(now.time)) return 'overdue'
  return 'upcoming'
}
export function taskProgress(tasks: ShiftTask[]) {
  const real = tasks.filter((t) => t.source !== 'closeout')
  return { done: real.filter((t) => t.completedAt).length, total: real.length }
}

/* ----------------------------------------------------------------- closeout */
export type CloseoutKey = 'children' | 'attendance' | 'tasks' | 'reset' | 'belongings'
export interface CloseoutItem {
  key: CloseoutKey
  label: string
  /** Automatic items are checked by GoodHands from real data; manual ones are ticked by the person. */
  auto: boolean
  done: boolean
  hint?: string
  fix?: { label: string; to: string }
}
export const closeoutKey = (employeeId: string, date: ISODate) => `${employeeId}:${date}`
export const EMPTY_CLOSEOUT: CloseoutManual = { attendanceReviewed: false, classroomReset: false, belongingsCollected: false }

export function closeoutItems(d: AppData, employeeId: string, now: Now): CloseoutItem[] {
  const manual = d.closeouts[closeoutKey(employeeId, now.date)] ?? EMPTY_CLOSEOUT
  const summary = summarize(attendanceRows(d, now.date, now))
  // Is a colleague still on duty after me? Then remaining children are theirs.
  const myEnd = shiftOn(d, employeeId, now.date)?.end ?? '00:00'
  const cover = d.employees.find((e) => {
    if (e.id === employeeId) return false
    const r = shiftRecord(d, e.id, now.date), s = shiftOn(d, e.id, now.date)
    return r?.checkIn && !r.checkOut && s && s.end > myEnd
  })
  const childrenDone = summary.inCare === 0 || !!cover
  const prog = taskProgress(tasksFor(d, employeeId, now.date))
  const left = prog.total - prog.done
  return [
    {
      key: 'children', label: 'All children checked out', auto: true, done: childrenDone,
      hint: summary.inCare === 0 ? 'Everyone has been picked up.' : cover ? `${cover.firstName} is still on until ${fmtTime(shiftOn(d, cover.id, now.date)?.end)}, so they’ll take it from here.` : `${summary.inCare} ${summary.inCare === 1 ? 'child is' : 'children are'} still here.`,
      fix: childrenDone ? undefined : { label: 'Open Attendance', to: '/attendance' },
    },
    { key: 'attendance', label: 'Attendance reviewed', auto: false, done: manual.attendanceReviewed, hint: 'Skim today’s list — anything look off?', fix: { label: 'Open Attendance', to: '/attendance' } },
    { key: 'tasks', label: 'Daily tasks completed', auto: true, done: left === 0, hint: left === 0 ? `All ${prog.total} tasks done.` : `${left} ${left === 1 ? 'task' : 'tasks'} left.`, fix: left === 0 ? undefined : { label: 'Open My Tasks', to: '/tasks' } },
    { key: 'reset', label: 'Classroom reset', auto: false, done: manual.classroomReset, hint: 'Toys away, mats stacked, surfaces wiped.' },
    { key: 'belongings', label: 'Personal belongings collected', auto: false, done: manual.belongingsCollected, hint: 'Phone, keys, bag, jacket.' },
  ]
}
export function closeoutStatus(d: AppData, employeeId: string, now: Now): CloseoutStatus {
  const rec = shiftRecord(d, employeeId, now.date)
  if (rec?.checkOut) return 'completed'
  const items = closeoutItems(d, employeeId, now)
  if (items.every((i) => i.done)) return 'ready'
  const m = d.closeouts[closeoutKey(employeeId, now.date)]
  return m && (m.attendanceReviewed || m.classroomReset || m.belongingsCollected) ? 'in_progress' : 'not_started'
}
export const CLOSEOUT_LABEL: Record<CloseoutStatus, string> = { not_started: 'Not started', in_progress: 'In progress', ready: 'Ready to check out', completed: 'Completed' }

/** Where the shift stands right now, for owner + staff views. */
export type OnShiftState = 'off' | 'not_started' | 'on_shift' | 'done'
export function shiftState(d: AppData, employeeId: string, date: ISODate): OnShiftState {
  const rec = shiftRecord(d, employeeId, date)
  if (rec?.checkOut) return 'done'
  if (rec?.checkIn) return 'on_shift'
  return shiftOn(d, employeeId, date) ? 'not_started' : 'off'
}
export const employeeLabel = employeeName
