import type { AppData } from '@/types'
import type { Now } from './now'
import { attendanceRows } from './attendance'
import { employeeName } from './people'
import { paymentStatus } from './payments'
import { restockTodos } from './reminders'
import { shiftOn, shiftRecord } from './tasks'
import { joinList, money, plural } from '@/utils/format'
import { addDays, fmtTime, toMinutes, WEEKDAYS, weekdayOf } from '@/utils/dates'

export type Tone = 'danger' | 'warning' | 'info'
export type AttentionAction =
  | { kind: 'notify_parent'; childId: string; label: string }
  | { kind: 'navigate'; to: string; label: string }
export interface AttentionItem {
  id: string
  tone: Tone
  icon: 'diaper' | 'money' | 'clock' | 'box' | 'user-x' | 'file'
  title: string
  detail?: string
  action: AttentionAction
}

/**
 * THE one list of "what needs the owner's attention". Home reads it, the assistant reads it.
 * Rule of thumb baked in here: only things that need action *today* qualify. Slow-moving
 * issues (an expiring document next month) live in their own section instead of crowding Home.
 */
export function attentionItems(d: AppData, now: Now): AttentionItem[] {
  const items: AttentionItem[] = []

  // 1. Diapers: low/out and the parent hasn't been told yet.
  for (const c of d.children) {
    if (!c.diaper || c.diaper.status === 'good' || c.diaper.notified) continue
    const out = c.diaper.status === 'out'
    items.push({
      id: `diaper-${c.id}`, tone: out ? 'danger' : 'warning', icon: 'diaper',
      title: out ? `${c.firstName}’s diapers are out` : `${c.firstName}’s diapers are running low`,
      detail: out ? 'Needs diapers today.' : 'Let the family know.',
      action: { kind: 'notify_parent', childId: c.id, label: 'Notify parent' },
    })
  }

  // 2. Payments: group, so it is one calm line not ten.
  const unpaidNow = d.payments.filter((p) => !p.paidOn)
  const overdue = unpaidNow.filter((p) => paymentStatus(p, now.date) === 'overdue')
  const dueToday = unpaidNow.filter((p) => p.dueDate === now.date)
  if (overdue.length || dueToday.length) {
    const name = (id: string) => d.children.find((c) => c.id === id)?.firstName ?? 'Someone'
    const parts = [
      ...overdue.map((p) => `${name(p.childId)} overdue · ${money(p.amount)}`),
      ...dueToday.map((p) => `${name(p.childId)} due today · ${money(p.amount)}`),
    ]
    items.push({
      id: 'payments', tone: overdue.length ? 'danger' : 'warning', icon: 'money',
      title: `${plural(overdue.length + dueToday.length, 'payment')} need follow-up`,
      detail: parts.join('  ·  '),
      action: { kind: 'navigate', to: '/payments', label: 'Open payments' },
    })
  }

  // 3. Staff who didn't check out (any earlier day), or are overdue to leave today.
  for (const s of d.shifts) {
    const e = d.employees.find((x) => x.id === s.employeeId)
    if (!e) continue
    if (s.date < now.date && s.checkIn && !s.checkOut && !s.resolvedNote) {
      items.push({
        id: `checkout-${e.id}-${s.date}`, tone: 'warning', icon: 'clock',
        title: `${e.firstName} didn’t check out ${s.date === prevDay(now.date) ? 'yesterday' : `on ${WEEKDAYS[weekdayOf(s.date)]}`}`,
        detail: `Checked in ${fmtTime(s.checkIn)}. Confirm when they left.`,
        action: { kind: 'navigate', to: `/employees/${e.id}?tab=shifts&resolve=${s.date}`, label: 'Review closeout' },
      })
    }
  }
  for (const e of d.employees) {
    const rec = shiftRecord(d, e.id, now.date), shift = shiftOn(d, e.id, now.date)
    if (rec?.checkIn && !rec.checkOut && shift && toMinutes(now.time) > toMinutes(shift.end) + 20) {
      items.push({
        id: `closeout-${e.id}`, tone: 'warning', icon: 'clock', title: `${employeeName(e)} hasn’t checked out`,
        detail: `Shift ended at ${fmtTime(shift.end)}.`, action: { kind: 'navigate', to: `/employees/${e.id}?tab=shifts`, label: 'Review closeout' },
      })
    }
  }

  // 4. Children more than 30 minutes past expected arrival, with no word from the family.
  for (const r of attendanceRows(d, now.date, now)) {
    if (r.view.status === 'expected' && (r.view.overdueMinutes ?? 0) >= 15) {
      items.push({
        id: `late-${r.child.id}`, tone: 'warning', icon: 'user-x', title: `${r.child.firstName} hasn’t arrived yet`,
        detail: `Expected at ${fmtTime(r.child.schedule.arrival)}.`, action: { kind: 'navigate', to: '/attendance', label: 'Open attendance' },
      })
    }
  }

  // 5. Supplies.
  const todo = restockTodos(d)
  if (todo.length) {
    items.push({
      id: 'supplies', tone: todo.some((s) => s.status === 'restock') ? 'danger' : 'warning', icon: 'box',
      title: `${plural(todo.length, 'supply', 'supplies')} to restock`,
      detail: joinList(todo.map((s) => `${s.name} (${s.status === 'low' ? 'low' : 'out'})`)),
      action: { kind: 'navigate', to: '/tasks?tab=supplies', label: 'See supplies' },
    })
  }

  const rank: Record<Tone, number> = { danger: 0, warning: 1, info: 2 }
  return items.sort((a, b) => rank[a.tone] - rank[b.tone])
}
const prevDay = (iso: string) => addDays(iso, -1)
