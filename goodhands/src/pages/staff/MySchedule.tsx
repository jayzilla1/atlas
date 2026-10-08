import { Page } from '@/components/ui/Page'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee'
import { useData } from '@/state/store'
import { useSession } from '@/state/session'
import { shiftOn, timeOffOn } from '@/domain/tasks'
import { addDays, fmtMonthDay, fmtTime, mondayOf, WEEKDAYS } from '@/utils/dates'
import { joinList } from '@/utils/format'
import { cn } from '@/utils/cn'

/** Only the employee's own shifts — plus *first names* of who they're working with, nothing personal. */
export default function MySchedule() {
  const e = useCurrentEmployee()
  const d = useData()
  const { now } = useSession()
  const monday = mondayOf(now.date)
  const weeks = [monday, addDays(monday, 7)]
  return (
    <Page id="my-schedule">
      <div className="mx-auto max-w-2xl">
        <PageHeader title="My Schedule" description="Your shifts for this week and next." />
        {weeks.map((w, wi) => (
          <section key={w} className="mb-8" aria-labelledby={`wk-${wi}`}>
            <h2 id={`wk-${wi}`} className="mb-2 text-h3">{wi === 0 ? 'This week' : 'Next week'}</h2>
            <ul className="divide-y divide-line-subtle rounded-lg border border-line bg-surface">
              {[0, 1, 2, 3, 4].map((i) => {
                const day = addDays(w, i)
                const shift = shiftOn(d, e.id, day)
                const off = timeOffOn(d, e.id, day)
                const mates = d.employees.filter((x) => x.id !== e.id && shiftOn(d, x.id, day)).map((x) => x.firstName)
                return (
                  <li key={day} className={cn('flex items-center gap-4 px-4 py-3', day === now.date && 'bg-primary-subtle/50')}>
                    <div className="w-24 shrink-0"><p className="font-semibold">{WEEKDAYS[(i + 1) % 7].slice(0, 3)}{day === now.date && <span className="ml-1.5 text-caption text-primary-text">Today</span>}</p><p className="text-caption text-ink-secondary">{fmtMonthDay(day)}</p></div>
                    <div className="min-w-0 flex-1">
                      {shift ? <><p className="font-semibold tabular-nums">{fmtTime(shift.start)} – {fmtTime(shift.end)}</p><p className="text-small text-ink-secondary">{mates.length ? `With ${joinList(mates)}` : 'Working solo'}</p></> : off ? <Badge tone="info">Time off · {off.reason}</Badge> : <span className="text-small text-ink-secondary">Not scheduled</span>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </Page>
  )
}
