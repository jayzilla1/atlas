import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCheck, CircleCheck, LogOut, Zap } from 'lucide-react'
import type { Employee } from '@/types'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Dialog'
import { Progress } from '@/components/ui/Progress'
import { useToast } from '@/components/ui/Toast'
import { CloseoutBadge } from './Status'
import { useActions, useData } from '@/state/store'
import { useSession } from '@/state/session'
import { closeoutItems, closeoutStatus, shiftRecord } from '@/domain/tasks'
import { fmtTime } from '@/utils/dates'
import { plural } from '@/utils/format'
import { cn } from '@/utils/cn'

/**
 * DAILY CLOSEOUT — the answer to "employees forget to check out".
 * Instead of nagging with a notification, checking out becomes the *last step of a short checklist*
 * people already do. Some items GoodHands checks itself from real data (children checked out,
 * tasks done); others the person ticks. The big button is never disabled — if something's missing it
 * explains calmly and offers a way forward, so nobody gets stuck or feels policed.
 */
export function CloseoutPanel({ employee }: { employee: Employee }) {
  const d = useData()
  const act = useActions()
  const { now } = useSession()
  const toast = useToast()
  const [blocked, setBlocked] = useState(false)
  const items = closeoutItems(d, employee.id, now)
  const status = closeoutStatus(d, employee.id, now)
  const rec = shiftRecord(d, employee.id, now.date)
  const open = items.filter((i) => !i.done)
  const doneCount = items.length - open.length

  if (!rec?.checkIn) {
    return <div className="rounded-lg border border-line bg-surface p-6 text-center"><p className="font-semibold">You haven’t started your shift yet.</p><p className="mt-1 text-small text-ink-secondary">Start your shift from Today, then your closeout checklist will be here at the end of the day.</p><Link to="/today" className="mt-4 inline-block"><Button variant="primary">Go to Today</Button></Link></div>
  }
  if (status === 'completed') {
    return (
      <div className="rounded-lg border border-success/30 bg-success-bg/50 p-8 text-center anim-fade-in">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success text-white anim-pop"><CheckCheck className="h-7 w-7" aria-hidden /></span>
        <h2 className="text-h2">All done — thank you, {employee.firstName}.</h2>
        <p className="mt-1 text-body text-ink-secondary">Checked out at <strong>{fmtTime(rec.checkOut)}</strong>. Have a good evening!</p>
        {rec.flag === 'left_early' && <p className="mx-auto mt-3 max-w-sm text-small text-ink-secondary">The owner can see {plural(rec.openItemsAtExit ?? 0, 'item')} were left open.</p>}
      </div>
    )
  }

  const finish = (leftEarly?: number) => {
    act.finishShift(employee.id, now.date, now.time, leftEarly)
    setBlocked(false)
    toast({ title: 'Shift complete — you’re checked out', description: fmtTime(now.time) })
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <CloseoutBadge status={status} />
        <p className="text-small text-ink-secondary">{doneCount} of {items.length} done</p>
      </div>
      <Progress value={doneCount} max={items.length} label="Closeout progress" tone={open.length === 0 ? 'success' : 'primary'} className="mb-5" />

      <ul className="divide-y divide-line-subtle rounded-lg border border-line bg-surface px-4" aria-label="End-of-day checklist">
        {items.map((it) => (
          <li key={it.key} className="py-1.5">
            {it.auto ? (
              <div className="flex items-start gap-3 py-2">
                <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2', it.done ? 'border-success bg-success text-white' : 'border-line-strong bg-surface-sunken text-ink-tertiary')} aria-hidden>{it.done ? <CircleCheck className="h-4 w-4" /> : <Zap className="h-3.5 w-3.5" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{it.label} <span className="sr-only">{it.done ? '— done' : '— not done yet'}</span></p>
                  <p className="text-small text-ink-secondary">{it.hint} <span className="text-caption text-ink-tertiary">· checked automatically</span></p>
                  {it.fix && <Link to={it.fix.to} className="mt-1 inline-block rounded text-small font-semibold text-primary-text underline-offset-2 hover:underline">{it.fix.label}</Link>}
                </div>
              </div>
            ) : (
              <Checkbox
                size="lg" checked={it.done} label={it.label} description={it.hint}
                onChange={() => act.toggleCloseout(employee.id, now.date, it.key === 'attendance' ? 'attendanceReviewed' : it.key === 'reset' ? 'classroomReset' : 'belongingsCollected')}
              />
            )}
          </li>
        ))}
      </ul>

      <Button variant="primary" size="lg" block className="mt-5" icon={<LogOut className="h-5 w-5" />} onClick={() => (open.length ? setBlocked(true) : finish())}>
        Complete Shift &amp; Check Out
      </Button>
      <p className="mt-2 text-center text-caption text-ink-secondary">Checking out here is how GoodHands knows you’ve finished for the day.</p>

      <Modal
        open={blocked} onClose={() => setBlocked(false)} size="sm" title="Your shift isn’t complete yet."
        description={`You still have ${plural(open.length, 'required item')}.`}
        footer={<><Button variant="ghost" onClick={() => finish(open.length)}>Check out anyway</Button><Button variant="primary" autoFocus onClick={() => setBlocked(false)}>Review Closeout</Button></>}
      >
        <ul className="space-y-2">{open.map((i) => <li key={i.key} className="flex items-start gap-2 text-body"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden />{i.label}<span className="sr-only"> — not done</span></li>)}</ul>
        <p className="mt-4 text-small text-ink-secondary">Need to go? “Check out anyway” works — the owner will simply see that {plural(open.length, 'item')} {open.length === 1 ? 'was' : 'were'} left open.</p>
      </Modal>
    </div>
  )
}
