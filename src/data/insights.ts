import { TODAY_ISO } from './clock'

/** Health score model. The overall score is the average of five area scores. */
export interface HealthArea { id: string; label: string; plain: string; now: number; lastMonth: number; href: string }
export const HEALTH_AREAS: HealthArea[] = [
  { id: 'people', label: 'People & training', plain: 'Everyone is trained and onboarded safely.', now: 90, lastMonth: 94, href: '/people' },
  { id: 'access', label: 'Access', plain: 'Only the right people can open the right tools.', now: 79, lastMonth: 88, href: '/applications' },
  { id: 'vendors', label: 'Vendors', plain: 'Companies we rely on are checked and documented.', now: 81, lastMonth: 85, href: '/vendors' },
  { id: 'policies', label: 'Policies', plain: 'Written rules are current and acknowledged.', now: 92, lastMonth: 92, href: '/policies' },
  { id: 'controls', label: 'Compliance controls', plain: 'Required safeguards are in place and evidenced.', now: 93, lastMonth: 96, href: '/reports' },
]
const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length)
export const HEALTH_SCORE = avg(HEALTH_AREAS.map((a) => a.now)) // 87
export const HEALTH_LAST_MONTH = avg(HEALTH_AREAS.map((a) => a.lastMonth)) // 91

export const MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
export const HEALTH_HISTORY = [84, 85, 86, 86, 88, 89, 90, 90, 91, 92, 91, HEALTH_SCORE]

/** Open risks by severity at the end of each month (last value matches today’s data). */
export const RISK_TREND = {
  critical: [1, 1, 2, 1, 1, 0, 1, 1, 0, 1, 1, 2],
  high: [4, 4, 5, 4, 4, 3, 3, 4, 3, 3, 2, 3],
  medium: [7, 8, 7, 8, 6, 6, 5, 6, 5, 4, 4, 5],
  low: [3, 3, 4, 3, 3, 4, 3, 2, 3, 2, 2, 2],
}
export const TRAINING_TREND = [91, 91, 92, 93, 92, 94, 96, 97, 96, 96, 95.6, 94.4]

export const WEEKS = ['Jul 22', 'Jul 29', 'Aug 5', 'Aug 12', 'Aug 19', 'Aug 26', 'Sep 2', 'Sep 9', 'Sep 16', 'Sep 23', 'Sep 30', 'Oct 7']
export const TASKS_CREATED_WEEKLY = [9, 11, 8, 12, 10, 9, 14, 11, 10, 13, 12, 9]
export const TASKS_COMPLETED_WEEKLY = [8, 10, 9, 10, 11, 8, 12, 12, 9, 11, 10, 7]

export type ControlState = 'passing' | 'attention' | 'failing'
export interface Control { id: string; name: string; area: string; state: ControlState; riskId?: string; evidence: string }
const c = (id: string, area: string, name: string, state: ControlState = 'passing', riskId?: string, evidence = 'Checked automatically'): Control => ({ id, area, name, state, riskId, evidence })
/** 42 controls (a "control" = a safeguard we’ve promised to have). 36 passing · 4 need attention · 2 failing. */
export const CONTROLS: Control[] = [
  c('C-01', 'Access', 'Accounts are removed when someone leaves', 'failing', 'R-101', 'Contractor account active 25 days after contract end'),
  c('C-02', 'Access', 'Admin access is reviewed every 180 days', 'failing', 'R-103', 'GitHub admin review 276 days old'),
  c('C-03', 'Access', 'Multi-factor authentication is required for all users', 'attention', 'R-104', '9 Salesforce users without MFA'),
  c('C-04', 'Access', 'User access reviews happen on schedule', 'attention', 'R-109', '4 apps overdue'),
  c('C-05', 'Access', 'Single sign-on is used for company apps'),
  c('C-06', 'Access', 'Shared accounts are prohibited'),
  c('C-07', 'Access', 'Passwords are stored in an approved password manager'),
  c('C-08', 'Access', 'New hires receive access through an approved request'),
  c('C-09', 'Access', 'Production access is limited to engineers on call'),
  c('C-10', 'Access', 'Inactive accounts are disabled after 90 days'),
  c('C-11', 'Data protection', 'Customer data is encrypted at rest'),
  c('C-12', 'Data protection', 'Customer data is encrypted in transit'),
  c('C-13', 'Data protection', 'Data is deleted according to the retention schedule', 'attention', 'R-108', 'Zoom recordings kept 180 days'),
  c('C-14', 'Data protection', 'Backups are taken daily and tested quarterly'),
  c('C-15', 'Data protection', 'Customer data is not used in test environments'),
  c('C-16', 'Data protection', 'Data exports are logged'),
  c('C-17', 'Data protection', 'Sensitive data is classified'),
  c('C-18', 'Data protection', 'Privacy requests are answered within 30 days'),
  c('C-19', 'People', 'Security awareness training is completed yearly', 'attention', 'R-107', '14 people incomplete'),
  c('C-20', 'People', 'Background checks are done before start'),
  c('C-21', 'People', 'Employees acknowledge the Acceptable Use Policy'),
  c('C-22', 'People', 'Confidentiality agreements are signed'),
  c('C-23', 'People', 'Offboarding checklist is completed for every leaver'),
  c('C-24', 'People', 'Phishing simulations run quarterly'),
  c('C-25', 'Vendors', 'Vendors with sensitive data have a current security report'),
  c('C-26', 'Vendors', 'Vendor reviews happen on schedule'),
  c('C-27', 'Vendors', 'Data processing agreements are signed where required'),
  c('C-28', 'Vendors', 'New vendors are approved before use'),
  c('C-29', 'Vendors', 'Vendor contracts include security terms'),
  c('C-30', 'Vendors', 'Vendor incidents are tracked'),
  c('C-31', 'Devices', 'Laptops use full-disk encryption'),
  c('C-32', 'Devices', 'Laptops lock automatically after 5 minutes'),
  c('C-33', 'Devices', 'Operating systems are kept up to date'),
  c('C-34', 'Devices', 'Lost devices can be wiped remotely'),
  c('C-35', 'Devices', 'Antivirus is active on all laptops'),
  c('C-36', 'Devices', 'Device inventory is up to date'),
  c('C-37', 'Policies', 'Policies are reviewed yearly'),
  c('C-38', 'Policies', 'Policies are approved by leadership'),
  c('C-39', 'Policies', 'Changes to policies are communicated'),
  c('C-40', 'Policies', 'An incident response plan exists and is tested'),
  c('C-41', 'Policies', 'A business continuity plan exists and is tested'),
  c('C-42', 'Policies', 'Risk assessments are done yearly'),
]
export const WORKSPACE = { name: 'Harborlight Software', industry: 'B2B software', plan: 'Atlas Business', lastSync: `${TODAY_ISO}T08:40` }
