import type { Clock, ISODate } from '@/types'

/**
 * Date helpers. Dates are 'YYYY-MM-DD' strings; we build real Date objects at *noon local time*
 * so daylight-saving shifts can never nudge a date into the neighbouring day.
 */
const pad = (n: number) => String(n).padStart(2, '0')
export const toDate = (iso: ISODate) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}
export const toISO = (d: Date): ISODate => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const addDays = (iso: ISODate, n: number): ISODate => { const d = toDate(iso); d.setDate(d.getDate() + n); return toISO(d) }
export const weekdayOf = (iso: ISODate) => toDate(iso).getDay()
export const daysBetween = (a: ISODate, b: ISODate) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86400000)
export const mondayOf = (iso: ISODate) => { const w = weekdayOf(iso); return addDays(iso, w === 0 ? -6 : 1 - w) }
export const isWeekend = (iso: ISODate) => [0, 6].includes(weekdayOf(iso))
export const eachDay = (start: ISODate, end: ISODate) => { const out: ISODate[] = []; for (let d = start; d <= end; d = addDays(d, 1)) out.push(d); return out }

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const monthName = (i: number) => MONTHS[i]

export const fmtLong = (iso: ISODate) => { const d = toDate(iso); return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}` }
export const fmtMonthDay = (iso: ISODate) => { const d = toDate(iso); return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}` }
export const fmtFull = (iso: ISODate) => { const d = toDate(iso); return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` }
export const fmtMonthYear = (iso: ISODate) => { const d = toDate(iso); return `${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
export const fmtRange = (a: ISODate, b: ISODate) => {
  if (a === b) return fmtMonthDay(a)
  const [da, db] = [toDate(a), toDate(b)]
  return da.getMonth() === db.getMonth() ? `${MONTHS[da.getMonth()].slice(0, 3)} ${da.getDate()}–${db.getDate()}` : `${fmtMonthDay(a)} – ${fmtMonthDay(b)}`
}

/** '14:05' → '2:05 PM' */
export const fmtTime = (t?: Clock) => {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`
}
export const toMinutes = (t: Clock) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
export const fromMinutes = (n: number): Clock => `${pad(Math.floor(n / 60) % 24)}:${pad(n % 60)}`
export const clockOf = (d: Date): Clock => `${pad(d.getHours())}:${pad(d.getMinutes())}`
export const durationLabel = (mins: number) => {
  const m = Math.abs(Math.round(mins))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60), r = m % 60
  return r ? `${h} hr ${r} min` : `${h} hr`
}

/** Age in whole years + months, as of a given date. */
export const ageOn = (dob: ISODate, ref: ISODate) => {
  const a = toDate(dob), b = toDate(ref)
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  if (b.getDate() < a.getDate()) months -= 1
  return { years: Math.floor(months / 12), months: months % 12, totalMonths: months }
}
/** Compact: '2 yrs 4 mo', '8 mo', '1 yr' */
export const fmtAge = (dob: ISODate, ref: ISODate, style: 'short' | 'long' = 'short') => {
  const { years, months, totalMonths } = ageOn(dob, ref)
  if (totalMonths < 12) return style === 'long' ? `${totalMonths} months` : `${totalMonths} mo`
  const y = style === 'long' ? `${years} year${years === 1 ? '' : 's'}` : `${years} yr${years === 1 ? '' : 's'}`
  const mo = style === 'long' ? `${months} month${months === 1 ? '' : 's'}` : `${months} mo`
  return months ? `${y}${style === 'long' ? ', ' : ' '}${mo}` : y
}

export const relativeDay = (iso: ISODate, today: ISODate) => {
  const n = daysBetween(today, iso)
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n === -1) return 'Yesterday'
  if (n > 1 && n < 7) return WEEKDAYS[weekdayOf(iso)]
  return fmtMonthDay(iso)
}
