import { useState } from 'react'
import type { AbsenceKind } from '@/types'
import { Modal } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, Input, RadioGroup, Textarea } from '@/components/ui/Form'
import { useToast } from '@/components/ui/Toast'
import { useActions, useData } from '@/state/store'
import { addDays, fmtRange, isWeekend } from '@/utils/dates'

const KINDS: Array<{ value: AbsenceKind; label: string; description: string }> = [
  { value: 'absent', label: 'Absent', description: 'Not coming in, no particular reason.' },
  { value: 'sick', label: 'Sick', description: 'Illness. Good to know for health tracking.' },
  { value: 'vacation', label: 'Vacation', description: 'Planned time away. Attendance fills in automatically for every day.' },
  { value: 'other', label: 'Other', description: 'Appointment, family event, etc.' },
]

/** Marks absence/vacation for a date range. Because it's a *range*, no one has to mark Noah absent every morning. */
export function MarkAbsentDialog({ childId, date, onClose }: { childId: string; date: string; onClose: () => void }) {
  const d = useData()
  const act = useActions()
  const toast = useToast()
  const child = d.children.find((c) => c.id === childId)
  const [kind, setKind] = useState<AbsenceKind>('absent')
  const [start, setStart] = useState(date)
  const [end, setEnd] = useState(date)
  const [note, setNote] = useState('')
  if (!child) return null
  const invalid = end < start
  const checkedIn = d.attendance.some((r) => r.childId === childId && r.date === start && r.checkIn)

  const pickKind = (k: AbsenceKind) => {
    setKind(k)
    if (k === 'vacation' && end === start) { let e = addDays(start, 4); while (isWeekend(e)) e = addDays(e, -1); setEnd(e) }
    if (k !== 'vacation' && end !== start && kind === 'vacation') setEnd(start)
  }
  const save = () => {
    if (invalid) return
    const id = act.addAbsence({ childId, kind, start, end, note: note.trim() || undefined })
    onClose()
    toast({ title: `${child.firstName} marked ${kind === 'absent' ? 'absent' : kind}`, description: fmtRange(start, end), action: { label: 'Undo', onClick: () => act.removeAbsence(id) } })
  }

  return (
    <Modal
      open onClose={onClose} title={`Mark ${child.firstName} away`} description="Choose a reason and the days."
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} disabled={invalid}>Save</Button></>}
    >
      <div className="space-y-5">
        <RadioGroup<AbsenceKind> legend="Reason" value={kind} onChange={pickKind} options={KINDS} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From" required>{(p) => <Input {...p} type="date" value={start} onChange={(e) => { setStart(e.target.value); if (end < e.target.value) setEnd(e.target.value) }} />}</Field>
          <Field label="Through" required error={invalid ? 'The last day can’t be before the first day.' : undefined}>{(p) => <Input {...p} type="date" min={start} value={end} onChange={(e) => setEnd(e.target.value)} />}</Field>
        </div>
        <Field label="Note" hint="Optional — e.g. “Mom called at 6:50.”">{(p) => <Textarea {...p} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
        {checkedIn && <p role="note" className="rounded-md bg-warning-bg px-3 py-2 text-small text-warning-text">{child.firstName} is already checked in on {fmtRange(start, start)}. Their check-in will take priority — undo it first if they didn’t actually come.</p>}
      </div>
    </Modal>
  )
}
