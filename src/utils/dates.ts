/**
 * Date helpers. All dates in mock data are ISO `YYYY-MM-DD` strings and are
 * parsed as *local* dates to avoid timezone off-by-one surprises.
 */
import { TODAY_ISO } from '@/data/clock'

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function toISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
export const today = () => parseISO(TODAY_ISO)
export function addDays(iso: string, days: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}
/** Whole days from today to `iso` (negative = in the past). */
export function daysFromToday(iso: string): number {
  return Math.round((parseISO(iso).getTime() - today().getTime()) / 86_400_000)
}
export function offsetFromToday(days: number): string {
  return addDays(TODAY_ISO, days)
}
const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const fmtShort = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
export const formatDate = (iso?: string) => (iso ? fmt.format(parseISO(iso)) : '—')
export const formatDateShort = (iso?: string) => (iso ? fmtShort.format(parseISO(iso)) : '—')

/** "in 12 days", "3 days ago", "today", "tomorrow" */
export function relativeDay(iso: string): string {
  const n = daysFromToday(iso)
  if (n === 0) return 'today'
  if (n === 1) return 'tomorrow'
  if (n === -1) return 'yesterday'
  if (n > 0) return n >= 60 ? `in ${Math.round(n / 30)} months` : `in ${n} days`
  const a = Math.abs(n)
  return a >= 60 ? `${Math.round(a / 30)} months ago` : `${a} days ago`
}
/** Short due-date phrasing used on tasks and risks. */
export function dueLabel(iso: string): { text: string; overdue: boolean; soon: boolean } {
  const n = daysFromToday(iso)
  if (n < 0) return { text: `${Math.abs(n)}d overdue`, overdue: true, soon: false }
  if (n === 0) return { text: 'Due today', overdue: false, soon: true }
  if (n === 1) return { text: 'Due tomorrow', overdue: false, soon: true }
  return { text: `Due ${formatDateShort(iso)}`, overdue: false, soon: n <= 7 }
}
export function timeAgoFromISO(iso: string): string {
  // Activity timestamps are `YYYY-MM-DDTHH:mm`
  const now = new Date(`${TODAY_ISO}T09:30:00`).getTime()
  const t = new Date(iso).getTime()
  const mins = Math.round((now - t) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.round(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 14) return `${days} days ago`
  return formatDateShort(iso.slice(0, 10))
}
