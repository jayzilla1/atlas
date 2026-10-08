import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, History, Sunrise, Info } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Page } from '@/components/ui/Page'
import { Button, IconButton } from '@/components/ui/Button'
import { DatePickerButton } from '@/components/ui/Calendar'
import { Metric } from '@/components/ui/Metric'
import { SearchInput } from '@/components/ui/Form'
import { EmptyState, NoResults } from '@/components/ui/States'
import { Table, THead, TR, TH, TD } from '@/components/ui/Table'
import { Card } from '@/components/ui/Card'
import { ChildCell, RowActions, StatusCell } from '@/components/domain/AttendanceParts'
import { useData } from '@/state/store'
import { useSession } from '@/state/session'
import { attendanceRows, summarize, type AttendanceRow } from '@/domain/attendance'
import { addDays, fmtLong, fmtMonthDay, fmtTime, isWeekend, weekdayOf } from '@/utils/dates'
import { plural } from '@/utils/format'
import { cn } from '@/utils/cn'

type Filter = 'all' | 'present' | 'expected' | 'absent' | 'vacation' | 'checked_out'
/** The daycare is a weekday business, so ← / → hop over weekends. */
const step = (d: string, dir: 1 | -1) => { let n = addDays(d, dir); while (isWeekend(n)) n = addDays(n, dir); return n }

export default function Attendance() {
  return <Page id="attendance"><AttendanceScreen /></Page>
}

function AttendanceScreen() {
  const d = useData()
  const { now, role } = useSession()
  const [params, setParams] = useSearchParams()
  const date = params.get('date') ?? now.date
  const setDate = (v: string) => setParams(v === now.date ? {} : { date: v }, { replace: true })
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')

  const rows = useMemo(() => attendanceRows(d, date, now), [d, date, now])
  const s = summarize(rows)
  const isToday = date === now.date, past = date < now.date, future = date > now.date
  const visible = rows.filter((r) => {
    const st = r.view.status
    const matchFilter = filter === 'all' || (filter === 'present' ? st === 'present' || st === 'late' : st === filter)
    return matchFilter && `${r.child.firstName} ${r.child.lastName}`.toLowerCase().includes(q.trim().toLowerCase())
  })
  const markedDates = useMemo(() => new Set(d.attendance.map((r) => r.date)), [d.attendance])
  const freshDay = isToday && s.present === 0 && rows.length > 0
  const prev = step(date, -1), next = step(date, 1)

  const headline = past ? `${s.present} of ${s.expected} children attended` : `${plural(s.expected, 'child', 'children')} expected`

  return (
    <>
      <PageHeader
        title="Attendance"
        description={isToday ? 'Today’s check-ins, at a glance.' : past ? 'A saved day. You can review and correct it.' : 'Who’s planned for this day.'}
        actions={
          <div className="flex items-center gap-1.5" role="group" aria-label="Choose date">
            <Button size="md" icon={<ChevronLeft className="h-4 w-4" />} onClick={() => setDate(prev)} aria-label={`Previous day, ${fmtLong(prev)}`}><span className="hidden sm:inline">{fmtMonthDay(prev)}</span></Button>
            <DatePickerButton value={date} onChange={setDate} today={now.date} marked={markedDates} markedLabel="has attendance">
              {(p) => <Button {...p} variant="secondary" icon={<CalendarDays className="h-4 w-4" />} className="min-w-[10.5rem] justify-center">{fmtMonthDay(date)}{isToday && ' · Today'}</Button>}
            </DatePickerButton>
            <Button size="md" iconAfter={<ChevronRight className="h-4 w-4" />} onClick={() => setDate(next)} aria-label={`Next day, ${fmtLong(next)}`}><span className="hidden sm:inline">{fmtMonthDay(next)}</span></Button>
            {!isToday && <Button variant="subtle" onClick={() => setDate(now.date)}>Today</Button>}
          </div>
        }
      />

      <div className="mb-1 flex flex-wrap items-baseline gap-x-3">
        <h2 className="text-h3">{fmtLong(date)}</h2>
        <p className="text-small font-semibold text-ink-secondary" aria-live="polite">{headline}</p>
      </div>

      {past && (
        <p role="note" className="mb-3 mt-2 flex items-start gap-2 rounded-md bg-info-bg px-3 py-2.5 text-small text-info-text">
          <History className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {role === 'owner' ? <>This day is saved history. To fix a mistake, use <strong>⋯ → Edit times and notes</strong> on a child.</> : <>This day is saved history. Only the owner can change past attendance.</>}
        </p>
      )}
      {future && (
        <p role="note" className="mb-3 mt-2 flex items-start gap-2 rounded-md bg-info-bg px-3 py-2.5 text-small text-info-text">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Planning ahead — vacations and absences you’ve already recorded appear here automatically.
        </p>
      )}
      {freshDay && (
        <p role="note" className="mb-3 mt-2 flex items-start gap-2 rounded-md bg-primary-subtle px-3 py-2.5 text-small text-primary-text">
          <Sunrise className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />A fresh day. Everyone scheduled starts as Expected. Yesterday’s attendance is saved — use ← to review it.
        </p>
      )}

      {/* The status counts double as filters: tap one to see only those children. */}
      <div className="-mx-1 mb-4 mt-3 grid grid-cols-3 gap-1 sm:grid-cols-5" role="group" aria-label="Filter by status">
        <Metric label="Present" value={s.inCare} tone="success" pressed={filter === 'present'} onClick={() => setFilter(filter === 'present' ? 'all' : 'present')} className="[&_.text-display]:text-h1 sm:[&_.text-display]:text-display" />
        <Metric label="Not arrived" value={s.notArrived} tone={s.notArrived && isToday ? 'warning' : 'neutral'} pressed={filter === 'expected'} onClick={() => setFilter(filter === 'expected' ? 'all' : 'expected')} className="[&_.text-display]:text-h1 sm:[&_.text-display]:text-display" />
        <Metric label="Absent" value={s.absent} tone={s.absent ? 'danger' : 'neutral'} pressed={filter === 'absent'} onClick={() => setFilter(filter === 'absent' ? 'all' : 'absent')} className="[&_.text-display]:text-h1 sm:[&_.text-display]:text-display" />
        <Metric label="Vacation" value={s.vacation} pressed={filter === 'vacation'} onClick={() => setFilter(filter === 'vacation' ? 'all' : 'vacation')} className="[&_.text-display]:text-h1 sm:[&_.text-display]:text-display" />
        <Metric label="Checked out" value={s.checkedOut} pressed={filter === 'checked_out'} onClick={() => setFilter(filter === 'checked_out' ? 'all' : 'checked_out')} className="[&_.text-display]:text-h1 sm:[&_.text-display]:text-display" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Find a child" label="Find a child" className="w-full sm:w-72" />
        {(filter !== 'all' || q) && <Button variant="ghost" onClick={() => { setFilter('all'); setQ('') }}>Clear filters</Button>}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<CalendarDays />} title="No one is scheduled this day" description={isWeekend(date) ? 'GoodHands is set up for weekdays. Use the arrows to move to the next weekday.' : 'No children have this weekday in their schedule.'} action={<Button onClick={() => setDate(next)}>Next weekday</Button>} />
      ) : visible.length === 0 ? (
        <NoResults query={q} onClear={() => { setFilter('all'); setQ('') }} />
      ) : (
        <>
          <Card padded={false} className="hidden overflow-visible lg:block">
            <Table caption={`Attendance for ${fmtLong(date)}`}>
              <THead><TR><TH>Child</TH><TH>Status</TH><TH>Check-in</TH><TH>Check-out</TH><TH>Notes</TH><TH className="text-right"><span className="sr-only">Actions</span></TH></TR></THead>
              <tbody>{visible.map((r) => <DesktopRow key={r.child.id} r={r} date={date} />)}</tbody>
            </Table>
          </Card>
          <ul className="space-y-3 lg:hidden" aria-label={`Attendance for ${fmtLong(date)}`}>{visible.map((r) => <MobileCard key={r.child.id} r={r} date={date} />)}</ul>
        </>
      )}
      {weekdayOf(date) === 5 && !past && <p className="mt-4 text-small text-ink-secondary">Heads up: check <strong>Tasks & Reminders</strong> for Blanket Day on Fridays.</p>}
    </>
  )
}

function Times({ r }: { r: AttendanceRow }) {
  const { view } = r
  return (
    <>
      <div>
        <span className="font-semibold tabular-nums">{fmtTime(view.record?.checkIn)}</span>
        {view.status === 'late' && <p className="text-caption font-semibold text-warning-text">{view.lateMinutes} min after {fmtTime(r.child.schedule.arrival)}</p>}
      </div>
    </>
  )
}

function DesktopRow({ r, date }: { r: AttendanceRow; date: string }) {
  const { view, child } = r
  return (
    <TR className={cn(view.status === 'vacation' && 'bg-surface-muted/60')}>
      <TD className="min-w-[14rem]"><ChildCell child={child} date={date} /></TD>
      <TD><StatusCell child={child} view={view} /></TD>
      <TD className="whitespace-nowrap"><Times r={r} /></TD>
      <TD className="whitespace-nowrap font-semibold tabular-nums">{fmtTime(view.record?.checkOut)}</TD>
      <TD className="max-w-[14rem] text-ink-secondary">{view.record?.note ?? ''}</TD>
      <TD className="w-px whitespace-nowrap"><RowActions child={child} view={view} date={date} /></TD>
    </TR>
  )
}

function MobileCard({ r, date }: { r: AttendanceRow; date: string }) {
  const { view, child } = r
  return (
    <li className={cn('rounded-lg border border-line bg-surface p-3.5', view.status === 'vacation' && 'bg-surface-muted')}>
      <ChildCell child={child} date={date} />
      <div className="mt-3 flex items-start justify-between gap-3">
        <StatusCell child={child} view={view} />
        <dl className="flex gap-4 text-right text-small">
          <div><dt className="text-caption text-ink-tertiary">In</dt><dd className="font-semibold tabular-nums">{fmtTime(view.record?.checkIn)}</dd></div>
          <div><dt className="text-caption text-ink-tertiary">Out</dt><dd className="font-semibold tabular-nums">{fmtTime(view.record?.checkOut)}</dd></div>
        </dl>
      </div>
      {view.record?.note && <p className="mt-2 text-small text-ink-secondary">{view.record.note}</p>}
      <div className="mt-3"><RowActions child={child} view={view} date={date} size="lg" /></div>
    </li>
  )
}
export { IconButton }
