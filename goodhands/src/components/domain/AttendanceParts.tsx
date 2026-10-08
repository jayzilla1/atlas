import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ExternalLink, LogIn, LogOut, MoreHorizontal, Pencil, Plane, Undo2, IdCard, UserX } from 'lucide-react'
import type { AttendanceView, Child, ISODate } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Button, IconButton } from '@/components/ui/Button'
import { Menu, type MenuItem } from '@/components/ui/Menu'
import { AttendanceBadge } from './Status'
import { useAttendanceActions } from '@/hooks/useAttendanceActions'
import { useSession } from '@/state/session'
import { useActions } from '@/state/store'
import { useDialogs } from '@/state/dialogs'
import { can } from '@/state/permissions'
import { childName } from '@/domain/people'
import { durationLabel, fmtAge, fmtRange, fmtTime } from '@/utils/dates'
import { cn } from '@/utils/cn'

/** Avatar + name + age (+ allergy flag). The name opens the full profile for the owner, or the limited care card for staff. */
export function ChildCell({ child, date, compact }: { child: Child; date: string; compact?: boolean }) {
  const { role } = useSession()
  const dialogs = useDialogs()
  const age = fmtAge(child.dob, date)
  const name = (
    <span className="font-semibold text-ink group-hover:underline underline-offset-2">{compact ? child.firstName : childName(child)}</span>
  )
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar first={child.firstName} last={child.lastName} tint={child.tint} size={compact ? 'sm' : 'md'} />
      <div className="min-w-0">
        {can(role, 'full_child_records')
          ? <Link to={`/children/${child.id}`} className="group rounded">{name}</Link>
          : <button type="button" onClick={() => dialogs.careCard(child.id)} className="group rounded text-left">{name}</button>}
        <p className="flex flex-wrap items-center gap-x-2 text-caption text-ink-secondary">
          <span>{age}</span>
          {child.allergies.length > 0 && <span className="inline-flex items-center gap-1 font-semibold text-danger-text"><AlertTriangle className="h-3 w-3" aria-hidden />Allergy: {child.allergies.join(', ')}</span>}
        </p>
      </div>
    </div>
  )
}

/** The status plus the single most useful sentence about it ("Expected 8:00 AM · 42 min ago"). */
export function StatusCell({ child, view }: { child: Child; view: AttendanceView }) {
  let sub: string | undefined
  if (view.status === 'expected') sub = view.overdueMinutes ? `Expected ${fmtTime(child.schedule.arrival)} · ${durationLabel(view.overdueMinutes)} past` : `Expected by ${fmtTime(child.schedule.arrival)}`
  else if (view.status === 'vacation' && view.absence) sub = fmtRange(view.absence.start, view.absence.end)
  else if (view.status === 'absent' && view.absence?.note) sub = view.absence.note
  else if (view.status === 'absent' && !view.absence) sub = 'No check-in recorded'
  return (
    <div className="min-w-0">
      <span key={view.status} className="inline-block anim-pop"><AttendanceBadge view={view} /></span>
      {sub && <p className={cn('mt-1 text-caption', view.status === 'expected' && view.overdueMinutes ? 'font-semibold text-warning-text' : 'text-ink-secondary')}>{sub}</p>}
    </div>
  )
}

/** The one big action for a row (Check in / Check out) plus a "more" menu for everything else. */
export function RowActions({ child, view, date, size = 'md' }: { child: Child; view: AttendanceView; date: ISODate; size?: 'md' | 'lg' }) {
  const { role, now } = useSession()
  const act = useActions()
  const nav = useNavigate()
  const dialogs = useDialogs()
  const a = useAttendanceActions()
  const past = date < now.date
  const future = date > now.date
  const s = view.status

  // Staff can run today, but only the owner can rewrite history.
  const primary = (() => {
    if (past || future) return null
    if (s === 'expected' || s === 'absent' || s === 'vacation') return <Button size={size} variant={s === 'expected' ? 'primary' : 'secondary'} icon={<LogIn className="h-4 w-4" />} onClick={() => a.checkIn(child, date)} aria-label={`Check in ${child.firstName}`}>Check in</Button>
    if (s === 'present' || s === 'late') return <Button size={size} variant="secondary" icon={<LogOut className="h-4 w-4" />} onClick={() => a.checkOut(child, date)} aria-label={`Check out ${child.firstName}`} className="border-primary/40 text-primary-text hover:bg-primary-subtle">Check out</Button>
    if (s === 'checked_out') return <Button size={size} variant="ghost" icon={<Undo2 className="h-4 w-4" />} onClick={() => a.undoCheckOut(child, date)} aria-label={`Undo check-out for ${child.firstName}`}>Undo</Button>
    return null
  })()

  const items: MenuItem[] = []
  const mayEdit = !past || can(role, 'attendance_edit_past')
  if (mayEdit) {
    if (s === 'present' || s === 'late') items.push({ label: 'Undo check-in', icon: <Undo2 />, onSelect: () => a.undoCheckIn(child, date) })
    if (s === 'present' || s === 'late' || s === 'checked_out' || past) items.push({ label: 'Edit times and notes', icon: <Pencil />, onSelect: () => dialogs.editAttendance(child.id, date) })
    if (s === 'expected' || future) items.push({ label: 'Mark absent or on vacation…', icon: <Plane />, onSelect: () => dialogs.markAway(child.id, date) })
    if ((s === 'absent' || s === 'vacation') && view.absence) {
      const ab = view.absence
      items.push({
        label: s === 'vacation' ? 'Remove this vacation day' : 'Remove absence', icon: <UserX />,
        onSelect: () => a.clearAway(child, date, () => act.addAbsence({ childId: child.id, kind: ab.kind, start: date, end: date, note: ab.note })),
      })
    }
  }
  items.push({ label: role === 'owner' ? 'Open profile' : 'View care card', icon: role === 'owner' ? <ExternalLink /> : <IdCard />, onSelect: () => (role === 'owner' ? nav(`/children/${child.id}`) : dialogs.careCard(child.id)), separatorBefore: items.length > 0 })

  return (
    <div className="flex items-center justify-end gap-1.5">
      {primary}
      <Menu label={`More actions for ${child.firstName}`} trigger={(p) => <IconButton {...p} label={`More actions for ${child.firstName}`} size={size === 'lg' ? 'lg' : 'md'} tooltip={false}><MoreHorizontal className="h-5 w-5" /></IconButton>} items={items} />
    </div>
  )
}
