import { useState } from 'react'
import { History } from 'lucide-react'
import { Drawer } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Form'
import { useToast } from '@/components/ui/Toast'
import { AttendanceBadge } from '@/components/domain/Status'
import { useActions, useData } from '@/state/store'
import { useSession } from '@/state/session'
import { attendanceView } from '@/domain/attendance'
import { childName } from '@/domain/people'
import { fmtFull, fmtTime } from '@/utils/dates'

/** Correct one child's day: times and notes. Works for past dates too — attendance is history we can fix, not erase. */
export function AttendanceEditDrawer({ childId, date, onClose }: { childId: string; date: string; onClose: () => void }) {
  const d = useData()
  const act = useActions()
  const toast = useToast()
  const { now } = useSession()
  const child = d.children.find((c) => c.id === childId)
  const rec = d.attendance.find((r) => r.childId === childId && r.date === date)
  const [checkIn, setCheckIn] = useState(rec?.checkIn ?? '')
  const [checkOut, setCheckOut] = useState(rec?.checkOut ?? '')
  const [note, setNote] = useState(rec?.note ?? '')
  if (!child) return null
  const view = attendanceView(d, child, date, now)
  const bad = !!checkIn && !!checkOut && checkOut <= checkIn
  const past = date < now.date

  const save = () => {
    if (bad) return
    act.correctAttendance(childId, date, { checkIn: checkIn || null, checkOut: checkIn ? checkOut || null : null, note: note.trim() || null })
    onClose()
    toast({ title: `${child.firstName}’s attendance updated`, description: fmtFull(date) })
  }

  return (
    <Drawer
      open onClose={onClose} title={`Edit ${childName(child)}`} description={fmtFull(date)}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} disabled={bad}>Save changes</Button></>}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between"><span className="text-small font-semibold">Current status</span><AttendanceBadge view={view} /></div>
        {past && (
          <p role="note" className="flex items-start gap-2 rounded-md bg-info-bg px-3 py-2.5 text-small text-info-text">
            <History className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />You’re correcting a previous day. The original day stays in history; this just fixes the record.
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Check-in" hint={rec?.checkIn ? undefined : 'Leave empty if they didn’t come.'}>{(p) => <Input {...p} type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />}</Field>
          <Field label="Check-out" error={bad ? 'Check-out must be after check-in.' : undefined}>{(p) => <Input {...p} type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} disabled={!checkIn} />}</Field>
        </div>
        {checkIn && <p className="text-caption text-ink-secondary">Arrival expected {fmtTime(child.schedule.arrival)}; grace period {d.settings.graceMinutes} min.</p>}
        <Field label="Note for the day">{(p) => <Textarea {...p} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
      </div>
    </Drawer>
  )
}
