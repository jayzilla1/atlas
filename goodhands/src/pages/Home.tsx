import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarClock, ChevronDown, CircleCheck, Plane, Sparkles, Users } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { Card, Section } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Form'
import { Progress } from '@/components/ui/Progress'
import { Table, THead, TR, TH, TD } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { AttentionList } from '@/components/domain/Attention'
import { ChildCell, RowActions, StatusCell } from '@/components/domain/AttendanceParts'
import { ShiftBadge } from '@/components/domain/Status'
import { useAssistant } from '@/ai/AssistantContext'
import { useActions, useData } from '@/state/store'
import { useSession } from '@/state/session'
import { attentionItems } from '@/domain/attention'
import { attendanceRows, summarize } from '@/domain/attendance'
import { remindersForToday, restockTodos, upcomingReminders } from '@/domain/reminders'
import { shiftOn, shiftState, taskProgress, tasksFor } from '@/domain/tasks'
import { addDays, daysBetween, fmtLong, fmtRange, fmtTime, relativeDay, toMinutes, WEEKDAYS } from '@/utils/dates'
import { weekdayOf } from '@/utils/dates'
import { plural } from '@/utils/format'
import { cn } from '@/utils/cn'

export default function Home() { return <Page id="home"><HomeScreen /></Page> }

const greeting = (t: string) => { const m = toMinutes(t); return m < 12 * 60 ? 'Good morning' : m < 17 * 60 ? 'Good afternoon' : 'Good evening' }

function HomeScreen() {
  const d = useData()
  const act = useActions()
  const toast = useToast()
  const { now } = useSession()
  const { openAssistant } = useAssistant()
  const [showAll, setShowAll] = useState(false)

  const rows = useMemo(() => attendanceRows(d, now.date, now), [d, now])
  const s = summarize(rows)
  const attention = useMemo(() => attentionItems(d, now), [d, now])
  const shown = showAll ? attention : attention.slice(0, 5)
  const reminders = remindersForToday(d, now.date)
  const restock = restockTodos(d)
  const upcoming = useMemo(() => buildUpcoming(d, now.date), [d, now.date])
  const staffToday = d.employees.filter((e) => shiftOn(d, e.id, now.date))

  return (
    <div>
      <header className="mb-6">
        <p className="text-small font-semibold text-ink-secondary">{fmtLong(now.date)}</p>
        <h1 className="text-h2 sm:text-h1">{greeting(now.time)}, {d.settings.ownerName.split(' ')[0]}</h1>
        <button type="button" onClick={() => openAssistant('What do I need to know today?')} className="group mt-3 flex min-h-control w-full max-w-xl items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-left text-small text-ink-secondary transition-colors duration-fast hover:border-primary/50 hover:bg-primary-subtle/40">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          <span className="flex-1">Ask GoodHands: <span className="font-semibold text-ink">What do I need to know today?</span></span>
          <ArrowRight className="h-4 w-4 text-ink-tertiary transition-transform duration-fast group-hover:translate-x-0.5" aria-hidden />
        </button>
      </header>

      {/* TODAY'S SNAPSHOT — numbers, not cards. */}
      <section aria-labelledby="snap" className="mb-8">
        <h2 id="snap" className="sr-only">Today’s snapshot</h2>
        <dl className="grid grid-cols-3 gap-y-5 border-y border-line py-5 sm:grid-cols-5">
          <Stat label="Expected" value={s.expected} hint={s.vacation ? `${s.vacation} on vacation not counted` : undefined} />
          <Stat label="Present" value={s.inCare + s.checkedOut} tone="success" hint={s.late ? `${s.late} arrived late` : undefined} />
          <Stat label="Not arrived" value={s.notArrived} tone={s.notArrived ? 'warning' : undefined} />
          <Stat label="Absent" value={s.absent} tone={s.absent ? 'danger' : undefined} />
          <Stat label="Vacation" value={s.vacation} />
        </dl>
      </section>

      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-8">
          <Section
            title={attention.length ? <>Attention needed <span className="ml-1 rounded-full bg-primary-subtle px-2 py-0.5 align-middle text-small font-bold text-primary-text">{attention.length}</span></> : 'Attention needed'}
            description={attention.length ? `${plural(attention.length, 'thing')} that need you today.` : undefined}
            id="attn"
          >
            {attention.length === 0 ? (
              <Card className="flex items-center gap-3 bg-success-bg/60"><CircleCheck className="h-6 w-6 text-success" aria-hidden /><p className="font-semibold text-success-text">You’re all caught up — nothing needs you right now.</p></Card>
            ) : (
              <Card padded={false} className="px-4 sm:px-5">
                <AttentionList items={shown} />
                {attention.length > 5 && (
                  <div className="border-t border-line-subtle py-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll} iconAfter={<ChevronDown className={cn('h-4 w-4 transition-transform duration-fast', showAll && 'rotate-180')} />}>
                      {showAll ? 'Show fewer' : `Show ${attention.length - 5} more`}
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </Section>

          <Section title="Today’s attendance" id="att" actions={<Link to="/attendance" className="inline-flex items-center gap-1 rounded text-small font-semibold text-primary-text underline-offset-2 hover:underline">Open Attendance <ArrowRight className="h-4 w-4" aria-hidden /></Link>}>
            <Card padded={false} className="overflow-visible">
              <Table caption="Today’s attendance" className="hidden sm:block">
                <THead><TR><TH>Child</TH><TH>Status</TH><TH>Check-in</TH><TH className="text-right"><span className="sr-only">Actions</span></TH></TR></THead>
                <tbody>
                  {rows.map(({ child, view }) => (
                    <TR key={child.id}>
                      <TD><ChildCell child={child} date={now.date} compact /></TD>
                      <TD><StatusCell child={child} view={view} /></TD>
                      <TD className="whitespace-nowrap font-semibold tabular-nums">{fmtTime(view.record?.checkIn)}</TD>
                      <TD className="w-px whitespace-nowrap"><RowActions child={child} view={view} date={now.date} /></TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
              <ul className="divide-y divide-line-subtle sm:hidden" aria-label="Today’s attendance">
                {rows.map(({ child, view }) => (
                  <li key={child.id} className="space-y-2 p-3.5">
                    <div className="flex items-start justify-between gap-3"><ChildCell child={child} date={now.date} compact /><StatusCell child={child} view={view} /></div>
                    <RowActions child={child} view={view} date={now.date} size="lg" />
                  </li>
                ))}
              </ul>
            </Card>
          </Section>
        </div>

        <aside className="min-w-0 space-y-8" aria-label="Reminders and upcoming">
          <Section title="Today’s reminders" id="rem">
            <Card padded={false} className="px-4 py-2">
              {reminders.length + restock.length === 0 ? <p className="py-3 text-small text-ink-secondary">No reminders today.</p> : (
                <ul>
                  {reminders.map((o) => {
                    const lead = o.daysAway > 0
                    return (
                      <li key={`${o.reminder.id}-${o.date}`}>
                        <Checkbox
                          checked={o.done}
                          onChange={() => act.toggleReminder(o.reminder.id, o.date)}
                          label={<>{o.reminder.title}{lead && <span className="font-normal text-ink-secondary"> — {relativeDay(o.date, now.date)}</span>}</>}
                          description={o.reminder.link ? <Link to={o.reminder.link} aria-label={`Open ${o.reminder.title}`} className="font-semibold text-primary-text underline-offset-2 hover:underline">Open</Link> : undefined}
                        />
                      </li>
                    )
                  })}
                  {restock.map((sup) => (
                    <li key={sup.id}>
                      <Checkbox
                        checked={false}
                        onChange={() => { const prev = sup.status; act.setSupply(sup.id, 'good', d.settings.ownerName.split(' ')[0], now.date); toast({ title: `${sup.name} restocked`, description: 'Marked as good.', action: { label: 'Undo', onClick: () => act.setSupply(sup.id, prev, d.settings.ownerName.split(' ')[0], now.date) } }) }}
                        label={`Restock ${sup.name.toLowerCase()}`}
                        description={sup.status === 'restock' ? 'Out — tick when restocked' : 'Running low — tick when restocked'}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Section>

          <Section title="Upcoming" description="The next 7 days" id="up">
            {upcoming.length === 0 ? <p className="text-small text-ink-secondary">Nothing coming up this week.</p> : (
              <ul className="space-y-1">
                {upcoming.map((u) => (
                  <li key={u.key} className="flex gap-3 rounded-md px-1 py-1.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink-secondary" aria-hidden>{u.icon}</span>
                    <p className="text-small"><span className="font-semibold">{u.when}</span> — {u.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {d.settings.showStaffOnHome && staffToday.length > 0 && (
            <Section title="Today’s staff" id="staff" actions={<Link to="/employees" className="text-small font-semibold text-primary-text underline-offset-2 hover:underline">All staff</Link>}>
              <Card padded={false} className="divide-y divide-line-subtle">
                {staffToday.map((e) => {
                  const prog = taskProgress(tasksFor(d, e.id, now.date))
                  const state = shiftState(d, e.id, now.date)
                  return (
                    <Link key={e.id} to={`/employees/${e.id}`} className="block space-y-2 p-3.5 transition-colors duration-fast hover:bg-surface-muted">
                      <div className="flex items-center justify-between gap-2"><span className="font-semibold">{e.firstName}</span><ShiftBadge state={state} /></div>
                      <Progress value={prog.done} max={prog.total} label={`${e.firstName}’s tasks`} tone={prog.done === prog.total && prog.total > 0 ? 'success' : 'primary'} />
                      <p className="text-caption text-ink-secondary">{state === 'not_started' ? `Starts ${fmtTime(shiftOn(d, e.id, now.date)?.start)}` : `${prog.done} of ${prog.total} tasks done`}</p>
                    </Link>
                  )
                })}
              </Card>
            </Section>
          )}
        </aside>
      </div>
    </div>
  )
}

function Stat({ label, value, tone, hint }: { label: string; value: number; tone?: 'success' | 'warning' | 'danger'; hint?: string }) {
  const color = tone === 'success' ? 'text-success-text' : tone === 'warning' ? 'text-warning-text' : tone === 'danger' ? 'text-danger-text' : 'text-ink'
  return (
    <div className="px-2 text-center first:pl-0 sm:border-l sm:border-line-subtle sm:first:border-l-0 sm:text-left sm:px-5 sm:first:pl-0">
      <dt className="text-caption font-semibold uppercase tracking-wide text-ink-secondary">{label}</dt>
      <dd className={cn('mt-1 text-display tabular-nums', color)}>{value}</dd>
      {hint && <p className="mt-1 text-caption text-ink-secondary">{hint}</p>}
    </div>
  )
}

/** Merges the different kinds of "coming up" into one short, dated list. */
function buildUpcoming(d: ReturnType<typeof useData>, today: string) {
  type U = { key: string; date: string; when: string; text: string; icon: React.ReactNode }
  const out: U[] = []
  const label = (date: string) => (daysBetween(today, date) === 1 ? 'Tomorrow' : WEEKDAYS[weekdayOf(date)])
  for (const o of upcomingReminders(d, today, 7)) out.push({ key: `r-${o.reminder.id}-${o.date}`, date: o.date, when: label(o.date), text: o.reminder.title, icon: <CalendarClock className="h-3.5 w-3.5" /> })
  for (const a of d.absences) {
    if (a.kind === 'vacation' && a.start > today && a.start <= addDays(today, 7)) {
      const c = d.children.find((x) => x.id === a.childId)
      if (c) out.push({ key: `a-${a.id}`, date: a.start, when: label(a.start), text: `${c.firstName} on vacation (${fmtRange(a.start, a.end)})`, icon: <Plane className="h-3.5 w-3.5" /> })
    }
  }
  for (const t of d.timeOff) {
    if (t.end >= today && t.start <= addDays(today, 7)) {
      const e = d.employees.find((x) => x.id === t.employeeId)
      if (e && t.start > today) out.push({ key: `t-${t.id}`, date: t.start, when: label(t.start), text: `${e.firstName} is off (${fmtRange(t.start, t.end)})`, icon: <Users className="h-3.5 w-3.5" /> })
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6)
}
