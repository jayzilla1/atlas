import type { Role } from '@/types'

/**
 * ROLE-BASED ACCESS, in one place.
 * Screens never ask "is this person Pamela?" — they ask "can this role see financials?".
 * To change who can do what (or add a Parent role later), you edit this table only.
 */
export type Capability =
  | 'financials' // payments, tuition amounts
  | 'sensitive_employee_records' // W-2, driver's license, other staff's personal info
  | 'full_child_records' // address, guardians' contact details, documents
  | 'care_card' // allergies, medications, pickup list — what you need to care for a child safely
  | 'manage_staff'
  | 'settings'
  | 'assistant'
  | 'reports'
  | 'documents'
  | 'attendance_edit_past' // correct previous days

const MATRIX: Record<Role, Capability[]> = {
  owner: ['financials', 'sensitive_employee_records', 'full_child_records', 'care_card', 'manage_staff', 'settings', 'assistant', 'reports', 'documents', 'attendance_edit_past'],
  staff: ['care_card'],
}
export const can = (role: Role, cap: Capability) => MATRIX[role].includes(cap)

export const PERMISSION_ROWS: Array<{ label: string; detail: string; cap: Capability | 'attendance_basic' | 'own_tasks' }> = [
  { label: 'Check children in and out', detail: 'Daily attendance', cap: 'attendance_basic' },
  { label: 'Own schedule, tasks and closeout', detail: 'Their own day only', cap: 'own_tasks' },
  { label: 'Allergies, medications and pickup list', detail: 'Care card for each child', cap: 'care_card' },
  { label: 'Full child records', detail: 'Address, guardian contact, documents', cap: 'full_child_records' },
  { label: 'Payments and tuition', detail: 'Who has paid, amounts', cap: 'financials' },
  { label: 'Employee records and sensitive documents', detail: 'W-2, driver’s license, personal details', cap: 'sensitive_employee_records' },
  { label: 'Reports and the Assistant', detail: 'Operational summaries', cap: 'reports' },
  { label: 'Settings and permissions', detail: 'Daycare configuration', cap: 'settings' },
]
export const roleHas = (role: Role, cap: (typeof PERMISSION_ROWS)[number]['cap']) =>
  cap === 'attendance_basic' || cap === 'own_tasks' ? true : can(role, cap)

export interface NavItem { to: string; label: string; icon: string; end?: boolean }
export const OWNER_NAV: NavItem[] = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/attendance', label: 'Attendance', icon: 'attendance' },
  { to: '/children', label: 'Children', icon: 'children' },
  { to: '/payments', label: 'Payments', icon: 'payments' },
  { to: '/tasks', label: 'Tasks & Reminders', icon: 'tasks' },
  { to: '/employees', label: 'Employees', icon: 'employees' },
  { to: '/schedule', label: 'Schedule', icon: 'schedule' },
  { to: '/documents', label: 'Documents', icon: 'documents' },
  { to: '/reports', label: 'Reports', icon: 'reports' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]
export const STAFF_NAV: NavItem[] = [
  { to: '/today', label: 'Today', icon: 'home', end: true },
  { to: '/attendance', label: 'Attendance', icon: 'attendance' },
  { to: '/schedule', label: 'My Schedule', icon: 'schedule' },
  { to: '/tasks', label: 'My Tasks', icon: 'tasks' },
  { to: '/closeout', label: 'Closeout', icon: 'closeout' },
]
