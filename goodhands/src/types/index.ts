/**
 * The shape of everything GoodHands knows about.
 *
 * Plain-English note: a "type" is a description of what a piece of data looks like
 * (a Child has a name, a birthday, guardians...). TypeScript uses these descriptions
 * to catch mistakes before the app runs — for example, using a payment where a child
 * was expected. Think of it as a spell-checker for data.
 *
 * Dates are stored as 'YYYY-MM-DD' text and times of day as 'HH:mm' text. That keeps
 * the mock data readable, and is easy to swap for real timestamps once a backend exists.
 */
export type ISODate = string // '2026-10-07'
export type Clock = string // '07:42' (24h)
export type Role = 'owner' | 'staff'

export interface Session {
  role: Role
  /** For staff: which employee is signed in. Owner is a single person in V1. */
  employeeId?: string
}

/* ---------------------------------------------------------------- Children */
export interface Guardian {
  name: string
  relationship: string
  phone: string
  email: string
  primary?: boolean
}
export interface EmergencyContact { name: string; relationship: string; phone: string }
export type DiaperLevel = 'good' | 'low' | 'out'
export interface DiaperState {
  status: DiaperLevel
  updatedOn: ISODate
  /** Set when the owner has (simulated) notifying the parent for the current low/out period. */
  notified?: { date: ISODate; time: Clock; by: string; noticeId: string }
}
export interface Child {
  id: string
  firstName: string
  lastName: string
  dob: ISODate
  /** Optional photo, e.g. '/avatars/maya.jpg' (file in public/avatars). Falls back to initials. */
  photo?: string
  /** Legacy, unused by the neutral avatar. */
  tint?: number
  guardians: Guardian[]
  address: string
  emergencyContact?: EmergencyContact
  authorizedPickup: string[]
  allergies: string[]
  medications: string[]
  healthNotes?: string
  notes?: string
  enrolledOn: ISODate
  /** weekdays 0=Sun … 6=Sat */
  schedule: { days: number[]; arrival: Clock; departure: Clock }
  billing: { weeklyRate: number; dueWeekday: number }
  /** null = not in diapers, so the supply workflow doesn't apply */
  diaper: DiaperState | null
}

export type AbsenceKind = 'absent' | 'sick' | 'vacation' | 'other'
export interface Absence {
  id: string
  childId: string
  kind: AbsenceKind
  start: ISODate
  end: ISODate
  note?: string
}
export interface AttendanceRecord {
  childId: string
  date: ISODate
  checkIn?: Clock
  checkOut?: Clock
  note?: string
}
export type AttendanceStatus = 'expected' | 'present' | 'late' | 'absent' | 'vacation' | 'checked_out' | 'not_scheduled'
export interface AttendanceView {
  status: AttendanceStatus
  absence?: Absence
  /** minutes after expected arrival, when checked in */
  lateMinutes?: number
  /** today only: minutes past expected arrival with no check-in yet */
  overdueMinutes?: number
  record?: AttendanceRecord
}

/* --------------------------------------------------------------- Payments */
export type PaymentMethod = 'cash' | 'check' | 'zelle' | 'card'
export interface Payment {
  id: string
  childId: string
  /** Monday of the billed week */
  weekStart: ISODate
  amount: number
  dueDate: ISODate
  paidOn?: ISODate
  method?: PaymentMethod
  note?: string
}
export type PaymentStatus = 'paid' | 'due' | 'overdue'

/* -------------------------------------------------------------- Employees */
export interface Employee {
  id: string
  firstName: string
  lastName: string
  role: string
  phone: string
  email: string
  address: string
  emergencyContact: EmergencyContact
  hiredOn: ISODate
  photo?: string
  tint?: number
  /** weekday → shift. Missing weekday = not scheduled. */
  weekly: Partial<Record<number, { start: Clock; end: Clock }>>
}
export interface TimeOff { id: string; employeeId: string; start: ISODate; end: ISODate; reason: string }
export interface ShiftRecord {
  employeeId: string
  date: ISODate
  checkIn?: Clock
  checkOut?: Clock
  /** how the shift ended, so the owner can see patterns without surveillance-y detail */
  flag?: 'forgot_checkout' | 'left_early'
  openItemsAtExit?: number
  resolvedNote?: string
  /** end-of-day tally for past days (today's is computed live from shiftTasks) */
  tasks?: { done: number; total: number }
}
/** A repeating part of someone's day ("Prepare morning snack, 9:00"). Lives once; appears every working day. */
export interface RoutineTask { id: string; employeeId: string; time: Clock; title: string; notes?: string; kind: 'routine' | 'closeout' }
/** What an employee actually sees for one date: a routine (or one-time) task + whether it was completed that day. */
export interface ShiftTask {
  id: string
  employeeId: string
  date: ISODate
  time: Clock
  title: string
  notes?: string
  completedAt?: Clock
  source: 'routine' | 'one_time' | 'closeout'
}
export interface OneTimeTask { id: string; employeeId: string; date: ISODate; time: Clock; title: string; notes?: string }
export interface CloseoutManual { attendanceReviewed: boolean; classroomReset: boolean; belongingsCollected: boolean }
export type CloseoutStatus = 'not_started' | 'in_progress' | 'ready' | 'completed'

/* ---------------------------------------------------- Supplies & reminders */
export type SupplyLevel = 'good' | 'low' | 'restock'
export interface Supply { id: string; name: string; status: SupplyLevel; updatedOn: ISODate; note?: string }
export interface SupplyEvent { id: string; supplyId: string; date: ISODate; kind: 'status' | 'restocked'; to: SupplyLevel; by: string }

export type Recurrence =
  | { type: 'weekdays' }
  | { type: 'weekly'; weekday: number }
  | { type: 'every_n_weeks'; weekday: number; anchor: ISODate; n: number }
  | { type: 'once'; date: ISODate }
export type ReminderKind = 'blanket' | 'supply_check' | 'review' | 'payments' | 'custom'
export interface Reminder {
  id: string
  title: string
  detail?: string
  kind: ReminderKind
  recurrence: Recurrence
  /** show it on Home this many days ahead of the day it happens */
  leadDays: number
  link?: string
}
export type BlanketStatus = 'sent' | 'not_sent' | 'na'

/* -------------------------------------------------------------- Documents */
export type DocCategory = 'health' | 'contract' | 'emergency' | 'immunization' | 'child_other' | 'w2' | 'license' | 'employment' | 'employee_other'
export interface DocumentRecord {
  id: string
  title: string
  category: DocCategory
  ownerType: 'child' | 'employee'
  ownerId: string
  fileType: 'pdf' | 'jpg' | 'docx'
  sizeKb: number
  uploadedOn?: ISODate
  expiresOn?: ISODate
  /** a placeholder for a document we expect but don't have */
  missing?: boolean
  sensitive: boolean
}
export type DocStatus = 'current' | 'expiring' | 'expired' | 'missing'

/* --------------------------------------------------------------- Messages */
export interface ParentNotice {
  id: string
  childId: string
  kind: 'diapers_low' | 'diapers_out'
  date: ISODate
  time: Clock
  by: string
  message: string
  /** V1 never sends anything. This records that the owner *completed the step*. */
  channel: 'simulated_text' | 'simulated_email' | 'in_person'
}

export interface Settings {
  daycareName: string
  ownerName: string
  graceMinutes: number
  blanketLeadDays: number
  closeoutNudgeMinutes: number
  showStaffOnHome: boolean
}

/** Everything the app stores — the "database" for the prototype. */
export interface AppData {
  children: Child[]
  absences: Absence[]
  attendance: AttendanceRecord[]
  payments: Payment[]
  employees: Employee[]
  timeOff: TimeOff[]
  shifts: ShiftRecord[]
  routines: RoutineTask[]
  oneTimeTasks: OneTimeTask[]
  /** instance id (`taskId@date`) → time completed */
  taskDone: Record<string, Clock>
  closeouts: Record<string, CloseoutManual> // key: employeeId:date
  supplies: Supply[]
  supplyEvents: SupplyEvent[]
  supplyChecks: Record<string, boolean> // key: date:supplyId (weekly supply check ticks)
  reminders: Reminder[]
  reminderDone: Record<string, boolean> // key: reminderId:date
  blankets: Record<string, BlanketStatus> // key: date:childId
  documents: DocumentRecord[]
  notices: ParentNotice[]
  settings: Settings
}
