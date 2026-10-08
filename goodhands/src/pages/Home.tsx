import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarClock, ChevronDown, CircleCheck, Hourglass, Plane, Sparkles, UserCheck, UserX, Users } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { Ring } from '@/components/ui/Ring'
import { Hero } from '@/components/domain/Hero'
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
      <Hero
        eyebrow={fmtLong(now.date)}
        title={<>{greeting(now.time)}, {d.settings.ownerName.split(' ')[0]}</>}
        actions={<>
          <Button size="lg" onClick={() => openAssistant('What do I need to know today?')} icon={<Sparkles className="h-4 w-4" />} className="!bg-white !text-ink hover:!bg-primary-subtle">What do I need to know today?</Button>
          <Link to="/attendance"><Button size="lg" className="!border-white/60 !bg-transparent !text-white hover:!bg-white/15">Open Attendance</Button></Link>
        </>}
        aside={
          <Ring value={s.inCare + s.checkedOut} max={s.expected} size={148} stroke={14} label={`${s.inCare + s.checkedOut} of ${s.expected} expected children have arrived`}>
            <span className="font-display text-[2.5rem] font-semibold leading-none">{s.inCare + s.checkedOut}<span className="text-lead font-medium text-white/80">/{s.expected}</span></span>
            <span className="mt-1 text-caption font-semibold text-white">here today</span>
          </Ring>
        }
      >
        {attention.length > 0 ? <>{plural(attention.length, 'thing')} need{attention.length === 1 ? 's' : ''} you today.</> : 'Everything is on track.'}
        {s.notArrived > 0 && <> {s.notArrived} {s.notArrived === 1 ? 'child hasn’t' : 'children haven’t'} arrived yet.</>}
      </Hero>

      {/* TODAY'S SNAPSHOT — soft tinted tiles, one per status. Icon + word + number, never colour alone. */}
      <section aria-labelledby="snap" className="mb-8 mt-5">
        <h2 id="snap" className="sr-only">Today’s snapshot</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Tile label="Expected" value={s.expected} icon={<Users />} tint="bg-primary-subtle text-primary-text" hint={s.vacation ? `${s.vacation} on vacation not counted` : undefined} />
          <Tile label="Present" value={s.inCare + s.checkedOut} icon={<UserCheck />} tint="bg-success-bg text-success-text" hint={s.late ? `${s.late} arrived late` : undefined} />
          <Tile label="Not arrived" value={s.notArrived} icon={<Hourglass />} tint="bg-warning-bg text-warning-text" />
          <Tile label="Absent" value={s.absent} icon={<UserX />} tint="bg-danger-bg text-danger-text" />
          <Tile label="Vacation" value={s.vacation} icon={<Plane />} tint="bg-info-bg text-info-text" />
        </ul>
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

function Tile({ label, value, icon, tint, hint }: { label: string; value: number; icon: React.ReactNode; tint: string; hint?: string }) {
  return (
    <li className={cn('rounded-lg p-4', tint)}>
      <div className="flex items-center justify-between">
        <p className="text-caption font-bold uppercase tracking-wide">{label}</p>
        <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 [&>svg]:h-[1.1rem] [&>svg]:w-[1.1rem]">{icon}</span>
      </div>
      <p className="mt-2 font-display text-display tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-caption font-medium">{hint}</p>}
    </li>
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
