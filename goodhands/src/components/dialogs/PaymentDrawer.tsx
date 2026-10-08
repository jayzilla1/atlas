import { useState } from 'react'
import { Drawer, ConfirmDialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Form'
import { useToast } from '@/components/ui/Toast'
import { PaymentBadge } from '@/components/domain/Status'
import { useActions, useData } from '@/state/store'
import { useSession } from '@/state/session'
import { paymentStatus } from '@/domain/payments'
import { childName } from '@/domain/people'
import { fmtFull, fmtMonthDay } from '@/utils/dates'
import { money } from '@/utils/format'
import type { PaymentMethod } from '@/types'

export function PaymentDrawer({ paymentId, onClose }: { paymentId: string; onClose: () => void }) {
  const d = useData()
  const act = useActions()
  const toast = useToast()
  const { today } = useSession()
  const p = d.payments.find((x) => x.id === paymentId)
  const child = d.children.find((c) => c.id === p?.childId)
  const [paidOn, setPaidOn] = useState(p?.paidOn ?? today)
  const [method, setMethod] = useState<PaymentMethod | ''>(p?.method ?? '')
  const [note, setNote] = useState(p?.note ?? '')
  const [confirmUnpay, setConfirmUnpay] = useState(false)
  if (!p || !child) return null
  const status = paymentStatus(p, today)

  const save = () => {
    if (p.paidOn) act.editPayment(p.id, { paidOn, method: method || undefined, note: note.trim() || undefined })
    else { act.markPaid(p.id, paidOn, method || undefined, note.trim() || undefined); toast({ title: `${child.firstName}’s payment marked as paid`, description: `${money(p.amount)} · ${fmtMonthDay(paidOn)}` }) }
    onClose()
  }

  return (
    <>
      <Drawer
        open onClose={onClose} title={`${childName(child)} · ${money(p.amount)}`} description={`Week of ${fmtFull(p.weekStart)} · due ${fmtMonthDay(p.dueDate)}`}
        footer={<>
          {p.paidOn && <Button variant="danger" onClick={() => setConfirmUnpay(true)} className="sm:mr-auto">Mark as unpaid</Button>}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>{p.paidOn ? 'Save changes' : 'Mark as paid'}</Button>
        </>}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between"><span className="text-small font-semibold">Status</span><PaymentBadge status={status} /></div>
          <Field label="Date received" required>{(f) => <Input {...f} type="date" value={paidOn} max={today} onChange={(e) => setPaidOn(e.target.value)} />}</Field>
          <Field label="Payment method" hint="Optional.">{(f) => (
            <Select {...f} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod | '')}>
              <option value="">Not recorded</option><option value="cash">Cash</option><option value="check">Check</option><option value="zelle">Zelle</option><option value="card">Card</option>
            </Select>)}
          </Field>
          <Field label="Note">{(f) => <Textarea {...f} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Check #1042" />}</Field>
          <p className="text-caption text-ink-secondary">GoodHands only tracks payments — it never moves money.</p>
        </div>
      </Drawer>
      <ConfirmDialog
        open={confirmUnpay} onClose={() => setConfirmUnpay(false)} tone="danger" title="Mark this payment as unpaid?"
        description={`${child.firstName}’s ${money(p.amount)} will go back to ${paymentStatus({ ...p, paidOn: undefined }, today) === 'overdue' ? 'overdue' : 'due'}. The payment date and method will be cleared.`}
        confirmLabel="Mark as unpaid" onConfirm={() => { act.markUnpaid(p.id); setConfirmUnpay(false); onClose(); toast({ title: 'Payment marked as unpaid', tone: 'info' }) }}
      />
    </>
  )
}
