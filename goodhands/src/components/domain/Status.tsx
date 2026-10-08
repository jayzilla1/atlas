import type { ReactNode } from 'react'
import {
  CircleAlert, CircleCheck, CircleDashed, Clock, Clock3, FileCheck2, FileClock, FileX2, ListChecks, LogOut, PackageX, Plane, TrendingDown, TriangleAlert, UserCheck, UserX, Lock, Droplets, Bell, BellRing, Hourglass, Ban, CheckCheck, CirclePlay,
} from 'lucide-react'
import type { AttendanceView, CloseoutStatus, DiaperLevel, DocStatus, PaymentStatus, SupplyLevel } from '@/types'
import { Badge, type Tone } from '@/components/ui/Badge'
import { ABSENCE_LABEL } from '@/domain/attendance'
import { CLOSEOUT_LABEL } from '@/domain/tasks'
import { DOC_STATUS_LABEL } from '@/domain/documents'
import { DIAPER_LABEL, SUPPLY_LABEL } from '@/domain/supplies'
import { PAYMENT_LABEL } from '@/domain/payments'
import { durationLabel, fmtTime } from '@/utils/dates'

/**
 * STATUS COMPONENTS — one per kind of status in the product.
 * Each pairs a colour, an icon and a text label, so no status depends on colour alone
 * (important for colour-blind users and for glancing at a screen in bright daylight).
 */
const i = 'h-3.5 w-3.5'

export function AttendanceBadge({ view, size }: { view: AttendanceView; size?: 'sm' | 'md' }) {
  let tone: Tone = 'neutral', icon: ReactNode = <Clock className={i} />, label = ''
  switch (view.status) {
    case 'expected': tone = 'info'; icon = <Hourglass className={i} />; label = 'Expected'; break
    case 'present': tone = 'success'; icon = <UserCheck className={i} />; label = 'Present'; break
    case 'late': tone = 'warning'; icon = <Clock3 className={i} />; label = `Late · ${durationLabel(view.lateMinutes ?? 0)}`; break
    case 'absent': tone = 'danger'; icon = <UserX className={i} />; label = view.absence ? (view.absence.kind === 'sick' ? 'Absent · Sick' : view.absence.kind === 'other' ? 'Absent · Other' : 'Absent') : 'Absent'; break
    case 'vacation': tone = 'neutral'; icon = <Plane className={i} />; label = 'Vacation'; break
    case 'checked_out': tone = 'neutral'; icon = <LogOut className={i} />; label = 'Checked out'; break
    case 'not_scheduled': tone = 'neutral'; icon = <Ban className={i} />; label = 'Not scheduled'; break
  }
  return <Badge tone={tone} icon={icon} size={size}>{label}</Badge>
}
export const absenceText = (k: keyof typeof ABSENCE_LABEL) => ABSENCE_LABEL[k]

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, [Tone, ReactNode]> = { paid: ['success', <CircleCheck className={i} />], due: ['warning', <Clock className={i} />], overdue: ['danger', <CircleAlert className={i} />] }
  return <Badge tone={map[status][0]} icon={map[status][1]}>{PAYMENT_LABEL[status]}</Badge>
}

export function SupplyBadge({ status }: { status: SupplyLevel }) {
  const map: Record<SupplyLevel, [Tone, ReactNode]> = { good: ['success', <CircleCheck className={i} />], low: ['warning', <TrendingDown className={i} />], restock: ['danger', <PackageX className={i} />] }
  return <Badge tone={map[status][0]} icon={map[status][1]}>{SUPPLY_LABEL[status]}</Badge>
}

export function DiaperBadge({ status, notified }: { status: DiaperLevel; notified?: boolean }) {
  const map: Record<DiaperLevel, [Tone, ReactNode]> = { good: ['success', <Droplets className={i} />], low: ['warning', <TrendingDown className={i} />], out: ['danger', <PackageX className={i} />] }
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge tone={map[status][0]} icon={map[status][1]}>{DIAPER_LABEL[status]}</Badge>
      {notified && status !== 'good' && <Badge tone="info" icon={<BellRing className={i} />}>Parent notified</Badge>}
    </span>
  )
}

export function CloseoutBadge({ status }: { status: CloseoutStatus }) {
  const map: Record<CloseoutStatus, [Tone, ReactNode]> = { not_started: ['neutral', <CircleDashed className={i} />], in_progress: ['info', <ListChecks className={i} />], ready: ['primary', <CirclePlay className={i} />], completed: ['success', <CheckCheck className={i} />] }
  return <Badge tone={map[status][0]} icon={map[status][1]}>{CLOSEOUT_LABEL[status]}</Badge>
}

export function DocBadge({ status }: { status: DocStatus }) {
  const map: Record<DocStatus, [Tone, ReactNode]> = { current: ['success', <FileCheck2 className={i} />], expiring: ['warning', <FileClock className={i} />], expired: ['danger', <FileX2 className={i} />], missing: ['danger', <FileX2 className={i} />] }
  return <Badge tone={map[status][0]} icon={map[status][1]}>{DOC_STATUS_LABEL[status]}</Badge>
}

export function SensitiveBadge({ label = 'Restricted' }: { label?: string }) {
  return <Badge tone="neutral" icon={<Lock className={i} />}>{label}</Badge>
}

export function ShiftBadge({ state }: { state: 'off' | 'not_started' | 'on_shift' | 'done' }) {
  const map = {
    off: ['neutral', <Ban className={i} key="a" />, 'Off today'],
    not_started: ['info', <Hourglass className={i} key="b" />, 'Not in yet'],
    on_shift: ['success', <UserCheck className={i} key="c" />, 'On shift'],
    done: ['neutral', <LogOut className={i} key="d" />, 'Checked out'],
  } as const
  return <Badge tone={map[state][0]} icon={map[state][1]}>{map[state][2]}</Badge>
}

export function NotifiedBadge({ date, time, today }: { date: string; time: string; today: string }) {
  return <Badge tone="info" icon={<Bell className={i} />}>Parent notified · {date === today ? 'Today' : date}, {fmtTime(time)}</Badge>
}
export { TriangleAlert }
