/**
 * Demo roles. Switching role (profile menu → “View as”) lets reviewers see
 * permission-restricted states without any real auth.
 *   Admin    — everything
 *   Manager  — can work on risks/tasks/reviews and approve AI actions, cannot change settings
 *   Auditor  — read-only: sees everything, changes nothing (typical for external auditors)
 */
export type Role = 'admin' | 'manager' | 'auditor'
export type Permission = 'tasks.write' | 'risks.write' | 'access.review' | 'ai.approve' | 'settings.manage' | 'reports.export'

export const ROLE_LABEL: Record<Role, string> = { admin: 'Admin', manager: 'Manager', auditor: 'Auditor (read-only)' }
export const ROLE_DESCRIPTION: Record<Role, string> = {
  admin: 'Full access, including workspace settings and AI controls.',
  manager: 'Can work on risks and tasks, complete reviews and approve Atlas AI actions.',
  auditor: 'Read-only. Can view everything and export reports, but can’t change anything.',
}
const MATRIX: Record<Role, Permission[]> = {
  admin: ['tasks.write', 'risks.write', 'access.review', 'ai.approve', 'settings.manage', 'reports.export'],
  manager: ['tasks.write', 'risks.write', 'access.review', 'ai.approve', 'reports.export'],
  auditor: ['reports.export'],
}
export const can = (role: Role, p: Permission) => MATRIX[role].includes(p)
export const PERMISSION_REASON: Record<Permission, string> = {
  'tasks.write': 'Creating and editing tasks needs the Manager or Admin role.',
  'risks.write': 'Changing risks needs the Manager or Admin role.',
  'access.review': 'Completing access reviews needs the Manager or Admin role.',
  'ai.approve': 'Approving Atlas AI actions needs the Manager or Admin role.',
  'settings.manage': 'Only Admins can change workspace settings.',
  'reports.export': 'Exporting reports needs the Admin, Manager or Auditor role.',
}
