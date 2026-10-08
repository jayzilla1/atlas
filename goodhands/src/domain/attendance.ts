import type { Absence, AppData, AttendanceStatus, AttendanceView, Child, ISODate } from '@/types'
import type { Now } from './now'
import { toMinutes, weekdayOf } from '@/utils/dates'

/**
 * Attendance is HISTORICAL DATA, not a list that gets wiped each morning.
 * A child's status for any date is *derived* from three things we keep forever:
 *   1. the check-in/check-out record for that date (if any)
 *   2. any absence or vacation covering that date
 *   3. their normal weekly schedule
 * "Starting a fresh day" therefore needs no reset button: a new date simply has no records yet,
 * so everyone scheduled shows as Expected — while yesterday stays exactly as it was.
 */
export const absenceCovering = (d: AppData, childId: string, date: ISODate): Absence | undefined =>
  d.absences.find((a) => a.childId === childId && date >= a.start && date <= a.end)

export function attendanceView(d: AppData, child: Child, date: ISODate, now: Now): AttendanceView {
  const record = d.attendance.find((r) => r.childId === child.id && r.date === date)
  const arrival = toMinutes(child.schedule.arrival)
  if (record?.checkIn) {
    const lateMinutes = Math.max(0, toMinutes(record.checkIn) - arrival)
    const isLate = lateMinutes > d.settings.graceMinutes
    return { status: record.checkOut ? 'checked_out' : isLate ? 'late' : 'present', lateMinutes: isLate ? lateMinutes : 0, record }
  }
  const absence = absenceCovering(d, child.id, date)
  if (absence) return { status: absence.kind === 'vacation' ? 'vacation' : 'absent', absence, record }
  if (!child.schedule.days.includes(weekdayOf(date)) || date < child.enrolledOn) return { status: 'not_scheduled', record }
  // Scheduled, no record, no absence. In the past that means "no one recorded them" → treated as absent.
  if (date < now.date) return { status: 'absent', record }
  const overdueMinutes = date === now.date ? Math.max(0, toMinutes(now.time) - arrival - d.settings.graceMinutes) : 0
  return { status: 'expected', overdueMinutes, record }
}

export interface AttendanceRow { child: Child; view: AttendanceView }

/** Everyone relevant on a date: scheduled children, plus anyone who checked in even if not scheduled. */
export function attendanceRows(d: AppData, date: ISODate, now: Now): AttendanceRow[] {
  return d.children
    .map((child) => ({ child, view: attendanceView(d, child, date, now) }))
    .filter((r) => r.view.status !== 'not_scheduled')
    .sort((a, b) => ORDER[a.view.status] - ORDER[b.view.status] || a.child.firstName.localeCompare(b.child.firstName))
}
// "Needs a look" first: not arrived, then here, then done.
const ORDER: Record<AttendanceStatus, number> = { expected: 0, late: 1, present: 2, absent: 3, vacation: 4, checked_out: 5, not_scheduled: 6 }

export interface AttendanceSummary {
  /** scheduled and not on vacation — who we plan for */
  expected: number
  present: number
  notArrived: number
  absent: number
  vacation: number
  checkedOut: number
  late: number
  /** here right now (present or late, not yet out) */
  inCare: number
}
export function summarize(rows: AttendanceRow[]): AttendanceSummary {
  const n = (...s: AttendanceStatus[]) => rows.filter((r) => s.includes(r.view.status)).length
  const vacation = n('vacation')
  return {
    expected: rows.length - vacation,
    present: n('present', 'late', 'checked_out'),
    notArrived: n('expected'),
    absent: n('absent'),
    vacation,
    checkedOut: n('checked_out'),
    late: n('late'),
    inCare: n('present', 'late'),
  }
}

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  expected: 'Expected', present: 'Present', late: 'Late', absent: 'Absent', vacation: 'Vacation', checked_out: 'Checked out', not_scheduled: 'Not scheduled',
}
export const ABSENCE_LABEL = { absent: 'Absent', sick: 'Sick', vacation: 'Vacation', other: 'Other' } as const
