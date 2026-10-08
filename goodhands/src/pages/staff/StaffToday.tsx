import { Link } from 'react-router-dom'
import { ArrowRight, CircleCheck, LogIn, Users } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { useToast } from '@/components/ui/Toast'
import { ShiftBadge } from '@/components/domain/Status'
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee'
import { useActions, useData } from '@/state/store'
import { useSession } from '@/state/session'
import { attendanceRows, summarize } from '@/domain/attendance'
import { shiftOn, shiftRecord, shiftState, taskProgress, taskState, tasksFor } from '@/domain/tasks'
import { fmtLong, fmtTime, toMinutes } from '@/utils/dates'
import { joinList, plural } from '@/utils/format'

export default function StaffToday() { return <Page id="staff-today"><Screen /></Page> }

function Screen() {
  const e = useCurrentEmployee()
  const d = useData()
  const act = useActions()
  const toast = useToast()
  const { now } = useSession()
  const shift = shiftOn(d, e.id, now.date)
  const rec = shiftRecord(d, e.id, now.date)
  const state = shiftState(d, e.id, now.date)
  const tasks = tasksFor(d, e.id, now.date)
  const prog = taskProgress(tasks)
  const next = tasks.find((t) => taskState(t, now) !== 'completed' && t.source !== 'closeout')
  const sum = summarize(attendanceRows(d, now.date, now))
  const waiting = attendanceRows(d, now.date, now).filter((r) => r.view.status === 'expected').map((r) => r.child.firstName)
  const nearEnd = shift && state === 'on_shift' && toMinutes(now.time) >= toMinutes(shift.end) - d.settings.closeoutNudgeMinutes
  const hour = toMinutes(now.time)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-small font-semibold text-ink-secondary">{fmtLong(now.date)}</p>
        <h1 className="text-h2 sm:text-h1">{hour < 720 ? 'Good morning' : hour < 1020 ? 'Good afternoon' : 'Good evening'}, {e.firstName}</h1>
      </header>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><p className="text-caption font-semibold uppercase tracking-wide text-ink-secondary">Your shift</p><p className="text-h3 tabular-nums">{shift ? `${fmtTime(shift.start)} – ${fmtTime(shift.end)}` : 'Not scheduled today'}</p></div>
          <ShiftBadge state={state} />
        </div>
        {state === 'not_started' && <Button variant="primary" size="lg" block icon={<LogIn className="h-5 w-5" />} onClick={() => { act.startShift(e.id, now.date, now.time); toast({ title: 'Shift started', description: `Checked in at ${fmtTime(now.time)}` }) }}>Start my shift</Button>}
        {state === 'on_shift' && <p className="text-small text-ink-secondary">Checked in at <strong className="text-ink">{fmtTime(rec?.checkIn)}</strong>.</p>}
        {state === 'done' && <p className="flex items-center gap-2 text-small font-semibold text-success-text"><CircleCheck className="h-4 w-4" aria-hidden />Checked out at {fmtTime(rec?.checkOut)}. Thank you!</p>}
      </Card>

      {nearEnd && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary-subtle p-4">
          <p className="font-semibold text-primary-text">Your shift ends at {fmtTime(shift!.end)}. Ready to wrap up?</p>
          <Link to="/closeout"><Button variant="primary">Start closeout</Button></Link>
        </div>
      )}

      {state !== 'off' && tasks.length > 0 && (
        <section aria-labelledby="next">
          <h2 id="next" className="mb-2 text-h3">Up next</h2>
          <Card className="space-y-3">
            {next ? (
              <>
                <div><p className="text-small font-semibold tabular-nums text-ink-secondary">{fmtTime(next.time)}{taskState(next, now) === 'overdue' && <span className="ml-2 text-warning-text">Overdue</span>}</p><p className="text-lead font-semibold">{next.title}</p>{next.notes && <p className="text-small text-ink-secondary">{next.notes}</p>}</div>
                <div className="flex gap-2"><Button variant="primary" onClick={() => act.completeTask(next.id, now.time)}>Complete</Button><Link to="/tasks"><Button iconAfter={<ArrowRight className="h-4 w-4" />}>See my whole day</Button></Link></div>
              </>
            ) : <p className="flex items-center gap-2 font-semibold text-success-text"><CircleCheck className="h-5 w-5" aria-hidden />Everything is done. Nice work.</p>}
            <Progress value={prog.done} max={prog.total} label="Tasks completed today" tone={prog.done === prog.total ? 'success' : 'primary'} />
          </Card>
        </section>
      )}

      <section aria-labelledby="kids">
        <h2 id="kids" className="mb-2 text-h3">Children right now</h2>
        <Link to="/attendance" className="block rounded-lg border border-line bg-surface p-4 transition-colors duration-fast hover:bg-surface-muted">
          <div className="flex items-center gap-3"><Users className="h-5 w-5 text-ink-secondary" aria-hidden /><p className="font-semibold">{sum.inCare} here · {sum.notArrived} still expected · {sum.checkedOut} gone home</p><ArrowRight className="ml-auto h-4 w-4 text-ink-tertiary" aria-hidden /></div>
          {waiting.length > 0 && <p className="mt-1 pl-8 text-small text-ink-secondary">Waiting for {joinList(waiting)}.</p>}
          {sum.absent + sum.vacation > 0 && <p className="pl-8 text-small text-ink-secondary">{plural(sum.absent + sum.vacation, 'child', 'children')} away today.</p>}
        </Link>
      </section>
    </div>
  )
}
