import { useEffect, useState } from 'react'
import { BellRing, CircleCheck, Mail, MessageSquare } from 'lucide-react'
import type { ParentNotice } from '@/types'
import { Modal } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, RadioGroup, Textarea } from '@/components/ui/Form'
import { useToast } from '@/components/ui/Toast'
import { DiaperBadge } from '@/components/domain/Status'
import { useActions, useData } from '@/state/store'
import { useSession } from '@/state/session'
import { useActor } from '@/hooks/useActor'
import { primaryGuardian } from '@/domain/people'
import { fmtTime } from '@/utils/dates'

type Via = ParentNotice['channel']

/**
 * The signature diaper workflow, step by step:
 *   1. GoodHands notices a low supply and puts it in "Attention".
 *   2. The owner reviews who would be told and the message — and can edit it.
 *   3. She sends it (simulated in V1 — nothing leaves the app) or records she told them in person.
 *   4. The child's record now says "Parent notified · Today, 10:14 AM" so nobody asks twice.
 */
export function NotifyParentDialog({ childId, onClose }: { childId: string; onClose: () => void }) {
  const d = useData()
  const act = useActions()
  const { now } = useSession()
  const { name } = useActor()
  const toast = useToast()
  const child = d.children.find((c) => c.id === childId)
  const guardian = child ? primaryGuardian(child) : undefined
  const out = child?.diaper?.status === 'out'
  const [via, setVia] = useState<Via>('simulated_text')
  const [message, setMessage] = useState('')
  const [phase, setPhase] = useState<'compose' | 'sending' | 'sent'>('compose')
  const [sentAt, setSentAt] = useState(now.time)

  useEffect(() => {
    if (child && guardian) setMessage(`Hi ${guardian.name.split(' ')[0]} — ${child.firstName} is ${out ? 'out of' : 'running low on'} diapers. Could you bring some ${out ? 'today' : 'tomorrow'}? Thank you! — ${d.settings.daycareName}`)
  }, [child, guardian, out, d.settings.daycareName])

  if (!child || !guardian || !child.diaper) return null

  const record = (channel: Via) => {
    act.notifyParent({ childId, kind: out ? 'diapers_out' : 'diapers_low', date: now.date, time: now.time, by: name, message: channel === 'in_person' ? 'Told in person.' : message, channel })
    setSentAt(now.time)
  }
  const send = () => {
    setPhase('sending')
    setTimeout(() => { record(via); setPhase('sent'); toast({ title: `${guardian.name.split(' ')[0]} has been notified`, description: `Recorded on ${child.firstName}’s supply history.` }) }, 900)
  }

  if (phase === 'sent') {
    return (
      <Modal open onClose={onClose} title="Parent notified" size="sm" footer={<Button variant="primary" onClick={onClose} autoFocus>Done</Button>}>
        <div className="flex flex-col items-center py-2 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-success anim-pop"><CircleCheck className="h-6 w-6" aria-hidden /></span>
          <p className="text-lead font-semibold">{guardian.name} · {via === 'in_person' ? 'told in person' : 'notified'}</p>
          <p className="mt-1 text-small text-ink-secondary">Today, {fmtTime(sentAt)}. {child.firstName}’s record now shows this, so no one needs to remember whether the family was told.</p>
          {via !== 'in_person' && <p className="mt-3 rounded-md bg-info-bg px-3 py-2 text-caption text-info-text">In this version nothing is actually sent — GoodHands records the step. Messaging can be connected later.</p>}
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open onClose={onClose} title={`Notify ${child.firstName}’s family`} description="Review who will be told and what the message says. Nothing is sent until you approve."
      footer={<>
        <Button onClick={onClose} disabled={phase === 'sending'}>Cancel</Button>
        <Button onClick={() => { record('in_person'); setVia('in_person'); setPhase('sent') }} disabled={phase === 'sending'}>I told them in person</Button>
        <Button variant="primary" icon={<BellRing className="h-4 w-4" />} loading={phase === 'sending'} onClick={send}>{phase === 'sending' ? 'Sending…' : 'Send notification'}</Button>
      </>}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-muted p-3">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wide text-ink-tertiary">To</p>
            <p className="font-semibold">{guardian.name} <span className="font-normal text-ink-secondary">({guardian.relationship})</span></p>
            <p className="text-small text-ink-secondary">{guardian.phone} · {guardian.email}</p>
          </div>
          <DiaperBadge status={child.diaper.status} />
        </div>
        <RadioGroup<Via> legend="How should it go out?" value={via === 'in_person' ? 'simulated_text' : via} onChange={setVia} inline
          options={[{ value: 'simulated_text', label: 'Text message' }, { value: 'simulated_email', label: 'Email' }]} />
        <Field label="Message" hint="You can edit this before sending.">
          {(p) => <Textarea {...p} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />}
        </Field>
        <p className="flex items-start gap-2 text-caption text-ink-secondary">
          {via === 'simulated_email' ? <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> : <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />}
          Prototype note: sending is simulated. GoodHands records that you notified the family.
        </p>
      </div>
    </Modal>
  )
}
