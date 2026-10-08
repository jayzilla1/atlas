import type { AppData, ISODate, Recurrence, Reminder, Supply } from '@/types'
import { addDays, daysBetween, isWeekend, weekdayOf } from '@/utils/dates'

/** Does a repeating rule land on this date? This is the whole "recurring workflow" engine. */
export function occursOn(r: Recurrence, date: ISODate): boolean {
  switch (r.type) {
    case 'weekdays': return !isWeekend(date)
    case 'weekly': return weekdayOf(date) === r.weekday
    case 'every_n_weeks': { const diff = daysBetween(r.anchor, date); return weekdayOf(date) === r.weekday && diff >= 0 && diff % (7 * r.n) === 0 }
    case 'once': return r.date === date
  }
}
export function describeRecurrence(r: Recurrence): string {
  const day = (n: number) => ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][n]
  switch (r.type) {
    case 'weekdays': return 'Every weekday'
    case 'weekly': return `Every ${day(r.weekday).slice(0, -1)}`
    case 'every_n_weeks': return r.n === 2 ? `Every other ${day(r.weekday).slice(0, -1)}` : `Every ${r.n} weeks on ${day(r.weekday)}`
    case 'once': return 'One time'
  }
}
export const leadDaysOf = (d: AppData, r: Reminder) => (r.kind === 'blanket' ? d.settings.blanketLeadDays : r.leadDays)
export const reminderKey = (id: string, date: ISODate) => `${id}:${date}`

export interface ReminderOccurrence { reminder: Reminder; date: ISODate; done: boolean; daysAway: number }

/** The next time a reminder happens on/after `from`, looking up to `horizon` days ahead. */
export function nextOccurrence(r: Reminder, from: ISODate, horizon = 60): ISODate | undefined {
  for (let i = 0; i <= horizon; i++) { const day = addDays(from, i); if (occursOn(r.recurrence, day)) return day }
}

/**
 * What belongs in "Today's reminders": things that happen today, plus things whose
 * lead-time window has started (e.g. Blanket Day shows from 2 days before).
 */
export function remindersForToday(d: AppData, today: ISODate): ReminderOccurrence[] {
  const out: ReminderOccurrence[] = []
  for (const r of d.reminders) {
    const next = nextOccurrence(r, today, 14)
    if (!next) continue
    const daysAway = daysBetween(today, next)
    if (daysAway <= leadDaysOf(d, r)) out.push({ reminder: r, date: next, daysAway, done: !!d.reminderDone[reminderKey(r.id, next)] })
  }
  return out.sort((a, b) => a.daysAway - b.daysAway)
}

/** Next-7-days list for "Upcoming", skipping anything already surfaced in today's reminders. */
export function upcomingReminders(d: AppData, today: ISODate, days = 7): ReminderOccurrence[] {
  const surfaced = new Set(remindersForToday(d, today).map((o) => `${o.reminder.id}:${o.date}`))
  const out: ReminderOccurrence[] = []
  for (let i = 1; i <= days; i++) {
    const date = addDays(today, i)
    for (const r of d.reminders) {
      if (r.recurrence.type === 'weekdays') continue // daily chores aren't "upcoming"
      if (occursOn(r.recurrence, date) && !surfaced.has(`${r.id}:${date}`)) out.push({ reminder: r, date, daysAway: i, done: false })
    }
  }
  return out
}

/** Supplies that are not 'good' become restock to-dos automatically — nobody has to remember to write them down. */
export const restockTodos = (d: AppData): Supply[] => d.supplies.filter((s) => s.status !== 'good')
