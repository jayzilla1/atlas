import type { EntityRef, Task, TaskPriority, TaskStatus } from './types'
import { offsetFromToday } from '@/utils/dates'

type T = [id: string, name: string, owner: string, priority: TaskPriority, status: TaskStatus, due: number, risk?: string, entity?: EntityRef, description?: string]
const e = (type: EntityRef['type'], id: string): EntityRef => ({ type, id })

/** 27 outstanding tasks (everything not “completed”) + 14 completed ones for history and charts. */
const rows: T[] = [
  ['T-201', 'Suspend Devon Park’s Google Workspace account', 'priya-raman', 'urgent', 'in_progress', 1, 'R-101', e('person', 'devon-park'), 'Suspending (not deleting) keeps files and email recoverable while you investigate.'],
  ['T-202', 'Review Devon Park’s sign-in and file activity since Sep 12', 'priya-raman', 'high', 'not_started', 2, 'R-101', e('application', 'google-workspace')],
  ['T-203', 'Transfer ownership of Devon’s shared design files to Hannah Müller', 'hannah-muller', 'medium', 'waiting', 4, 'R-101', e('person', 'hannah-muller'), 'Waiting for IT to finish the account suspension.'],
  ['T-204', 'Remove Devon Park from Figma and Notion', 'priya-raman', 'high', 'not_started', 3, 'R-101', e('application', 'figma')],
  ['T-205', 'Request Meridian Payroll’s latest SOC 2 report', 'elena-vasquez', 'urgent', 'waiting', 3, 'R-102', e('vendor', 'meridian-payroll'), 'Emailed account manager Oct 1. No reply yet.'],
  ['T-206', 'Decide whether to keep using Meridian Payroll if no report exists', 'elena-vasquez', 'high', 'not_started', 5, 'R-102', e('vendor', 'meridian-payroll')],
  ['T-207', 'Review the three GitHub organization owners', 'marcus-lee', 'high', 'not_started', 14, 'R-103', e('application', 'github')],
  ['T-208', 'Require approval for admin role changes in GitHub', 'sarah-chen', 'medium', 'not_started', 21, 'R-103', e('application', 'github')],
  ['T-209', 'Turn on required MFA in Salesforce', 'tomas-ibarra', 'high', 'in_progress', 7, 'R-104', e('application', 'salesforce')],
  ['T-210', 'Email the nine Salesforce users with MFA setup steps', 'maya-okafor', 'medium', 'in_progress', 5, 'R-104', e('application', 'salesforce')],
  ['T-211', 'Ask Northstar HR for a signed data processing agreement', 'aisha-rahman', 'high', 'not_started', 10, 'R-105', e('vendor', 'northstar-hr')],
  ['T-212', 'Confirm Northstar HR renewal terms with Legal', 'nina-petrov', 'medium', 'not_started', 15, 'R-105', e('vendor', 'northstar-hr')],
  ['T-213', 'Request Cloudline Hosting’s renewed SOC 2 report', 'david-kim', 'high', 'waiting', 9, 'R-106', e('vendor', 'cloudline-hosting')],
  ['T-214', 'Schedule yearly review call with Cloudline Hosting', 'david-kim', 'low', 'not_started', 18, 'R-106', e('vendor', 'cloudline-hosting')],
  ['T-215', 'Send overdue-training reminder to the 14 people', 'maya-okafor', 'medium', 'in_progress', -1, 'R-107', e('policy', 'security-awareness')],
  ['T-216', 'Report training completion rate to leadership', 'aisha-rahman', 'low', 'not_started', 12, 'R-107', e('policy', 'security-awareness')],
  ['T-217', 'Change Zoom recording auto-delete from 180 to 90 days', 'priya-raman', 'medium', 'not_started', 14, 'R-108', e('application', 'zoom')],
  ['T-218', 'Delete Zoom recordings older than 90 days (after legal hold check)', 'nina-petrov', 'medium', 'waiting', 20, 'R-108', e('application', 'zoom')],
  ['T-219', 'Complete the GitHub access review', 'marcus-lee', 'high', 'in_progress', 10, 'R-109', e('application', 'github')],
  ['T-220', 'Complete the AWS access review', 'david-kim', 'high', 'not_started', 14, 'R-109', e('application', 'aws')],
  ['T-221', 'Complete the Zoom access review', 'priya-raman', 'medium', 'not_started', 16, 'R-109', e('application', 'zoom')],
  ['T-222', 'Complete the BrightDesk access review', 'priya-raman', 'low', 'not_started', 22, 'R-109', e('application', 'brightdesk')],
  ['T-223', 'Update the Password Policy to cover passkeys', 'priya-raman', 'medium', 'in_progress', -3, 'R-110', e('policy', 'password')],
  ['T-224', 'Send the updated Password Policy for leadership approval', 'maya-okafor', 'low', 'not_started', 12, 'R-110', e('policy', 'password')],
  ['T-225', 'Renew the Lumen Learning contract', 'aisha-rahman', 'medium', 'not_started', 20, undefined, e('vendor', 'lumen-learning')],
  ['T-226', 'Prepare the auditor evidence folder for the January audit', 'maya-okafor', 'medium', 'in_progress', 30],
  ['T-227', 'Ask the three laptop owners to reconnect to VPN', 'priya-raman', 'low', 'not_started', 6, 'R-111', e('vendor', 'kestrel-devices')],
  // completed
  ['T-180', 'Complete Q3 Google Workspace access review', 'priya-raman', 'high', 'completed', -6, undefined, e('application', 'google-workspace')],
  ['T-181', 'Restrict Mailchimp list exports to two admins', 'ben-whitaker', 'medium', 'completed', -33, 'R-095', e('application', 'mailchimp')],
  ['T-182', 'Deactivate two former employees in Slack', 'priya-raman', 'high', 'completed', -25, 'R-099', e('application', 'slack')],
  ['T-183', 'Upload Harbor Benefits signed DPA', 'aisha-rahman', 'high', 'completed', -74, 'R-097', e('vendor', 'harbor-benefits')],
  ['T-184', 'Enable encryption on four laptops', 'priya-raman', 'medium', 'completed', -45, 'R-091'],
  ['T-185', 'Replace shared Zendesk admin login', 'owen-brooks', 'high', 'completed', -52, 'R-088', e('application', 'zendesk')],
  ['T-186', 'Publish Data Protection Policy v5.0', 'nina-petrov', 'medium', 'completed', -62, undefined, e('policy', 'data-protection')],
  ['T-187', 'Renew Orbit Payments PCI attestation', 'elena-vasquez', 'medium', 'completed', -40, undefined, e('vendor', 'orbit-payments')],
  ['T-188', 'Complete Salesforce access review', 'tomas-ibarra', 'medium', 'completed', -88, undefined, e('application', 'salesforce')],
  ['T-189', 'Onboard Quanta Backup as a vendor', 'marcus-lee', 'medium', 'completed', -110, undefined, e('vendor', 'quanta-backup')],
  ['T-190', 'Run the September phishing simulation', 'priya-raman', 'low', 'completed', -19],
  ['T-191', 'Refresh the vendor register', 'maya-okafor', 'low', 'completed', -14],
  ['T-192', 'Close out Q2 audit findings', 'maya-okafor', 'high', 'completed', -28],
  ['T-193', 'Review Notion workspace guests', 'maya-okafor', 'medium', 'completed', -9, undefined, e('application', 'notion')],
]

export const initialTasks: Task[] = rows.map(([id, name, ownerId, priority, status, due, riskId, entity, description]) => ({
  id, name, ownerId, priority, status, dueDate: offsetFromToday(due), riskId, entity, description,
  createdAt: offsetFromToday(Math.min(due, 0) - 6),
  completedAt: status === 'completed' ? offsetFromToday(due) : undefined,
  createdBy: id === 'T-210' || id === 'T-202' ? 'ai' : 'human',
}))
