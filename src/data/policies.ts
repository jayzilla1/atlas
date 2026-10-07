import type { Policy } from './types'
import { offsetFromToday } from '@/utils/dates'
import { currentPeople } from './people'
import { hashString } from '@/utils/random'

type P = Omit<Policy, 'lastUpdated' | 'nextReview'> & { updatedAgo: number; reviewIn: number }

const rows: P[] = [
  { id: 'acceptable-use', name: 'Acceptable Use Policy', summary: 'What people may and may not do with company laptops, accounts and networks.', keyPoints: ['Use company devices and accounts for work purposes first.', 'Never share passwords or let others use your account.', 'Report lost devices or suspicious messages within 24 hours.'], ownerId: 'priya-raman', status: 'published', version: '4.2', updatedAgo: 140, reviewIn: 225, ackRate: 0.98, appliesTo: 'Everyone' },
  { id: 'password', name: 'Password Policy', summary: 'How passwords and multi-factor authentication must be set up.', keyPoints: ['Use the company password manager for every work login.', 'Passwords must be at least 14 characters or a passphrase.', 'Multi-factor authentication is required for every app that supports it.'], ownerId: 'priya-raman', status: 'needs_update', version: '3.1', updatedAgo: 385, reviewIn: -17, ackRate: 0.94, appliesTo: 'Everyone' },
  { id: 'data-protection', name: 'Data Protection Policy', summary: 'How customer and employee information is classified, stored, shared and deleted.', keyPoints: ['Customer data may only be stored in approved systems.', 'Data is encrypted in transit and at rest.', 'Recordings and exports follow the retention schedule.'], ownerId: 'nina-petrov', status: 'published', version: '5.0', updatedAgo: 62, reviewIn: 303, ackRate: 0.96, appliesTo: 'Everyone' },
  { id: 'security-awareness', name: 'Security Awareness Policy', summary: 'The yearly training everyone completes and how reminders and follow-ups work.', keyPoints: ['Every employee and contractor completes training within 30 days of starting, then yearly.', 'Managers are told when a team member is overdue.', 'Repeated non-completion is escalated to People.'], ownerId: 'aisha-rahman', status: 'published', version: '2.4', updatedAgo: 210, reviewIn: 155, ackRate: 0.97, appliesTo: 'Everyone' },
  { id: 'vendor-management', name: 'Vendor Management Policy', summary: 'How new vendors are approved and how existing ones are reviewed.', keyPoints: ['Vendors touching customer or employee data need a current security report.', 'High-risk vendors are reviewed every 6 months, others yearly.', 'A signed data processing agreement is required when personal data is shared.'], ownerId: 'maya-okafor', status: 'published', version: '3.3', updatedAgo: 96, reviewIn: 269, ackRate: 0.91, appliesTo: 'Managers' },
  { id: 'access-control', name: 'Access Control Policy', summary: 'Who gets access to what, and how often it is checked.', keyPoints: ['Access is the minimum needed for a person’s role.', 'App owners complete an access review at least every 180 days.', 'Access is removed on the last day of employment or contract.'], ownerId: 'priya-raman', status: 'published', version: '4.0', updatedAgo: 118, reviewIn: 247, ackRate: 0.95, appliesTo: 'Everyone' },
  { id: 'incident-response', name: 'Incident Response Policy', summary: 'What to do when something goes wrong — who to tell and what happens next.', keyPoints: ['Report suspected incidents immediately in #security-help.', 'The security lead decides severity within one hour.', 'Customers are notified within the legal deadline.'], ownerId: 'priya-raman', status: 'published', version: '2.2', updatedAgo: 175, reviewIn: 190, ackRate: 0.93, appliesTo: 'Everyone' },
  { id: 'business-continuity', name: 'Business Continuity Policy', summary: 'How Harborlight keeps operating during outages or disasters.', keyPoints: ['Critical systems have tested backups.', 'The recovery plan is tested twice a year.', 'Every team lead keeps an emergency contact list.'], ownerId: 'maya-okafor', status: 'in_review', version: '1.8', updatedAgo: 301, reviewIn: 24, ackRate: 0.88, appliesTo: 'Managers' },
  { id: 'data-retention', name: 'Data Retention Policy', summary: 'How long different kinds of data are kept before deletion.', keyPoints: ['Meeting recordings are deleted after 90 days.', 'Customer data is deleted within 30 days of contract end.', 'Legal holds override automatic deletion.'], ownerId: 'nina-petrov', status: 'published', version: '2.0', updatedAgo: 82, reviewIn: 283, ackRate: 0.9, appliesTo: 'Everyone' },
  { id: 'remote-work', name: 'Remote Work Policy', summary: 'Security expectations when working away from the office.', keyPoints: ['Use the company VPN on public networks.', 'Lock your screen when stepping away.', 'No company data on personal cloud storage.'], ownerId: 'aisha-rahman', status: 'published', version: '3.0', updatedAgo: 250, reviewIn: 115, ackRate: 0.96, appliesTo: 'Everyone' },
  { id: 'mobile-device', name: 'Mobile Device Policy', summary: 'Using phones and tablets for work.', keyPoints: ['Devices must have a screen lock and be updated.', 'Company email requires device enrolment.', 'IT can wipe company data from lost devices.'], ownerId: 'priya-raman', status: 'published', version: '1.5', updatedAgo: 322, reviewIn: 43, ackRate: 0.89, appliesTo: 'Everyone' },
  { id: 'encryption', name: 'Encryption Policy', summary: 'Where encryption is required and how keys are managed.', keyPoints: ['All laptops use full-disk encryption.', 'Production data is encrypted at rest and in transit.', 'Encryption keys are rotated yearly.'], ownerId: 'david-kim', status: 'published', version: '2.1', updatedAgo: 150, reviewIn: 215, ackRate: 0.92, appliesTo: 'Engineering' },
  { id: 'change-management', name: 'Change Management Policy', summary: 'How changes to the product and infrastructure are approved and released.', keyPoints: ['All production changes are peer-reviewed.', 'Emergency changes are documented within 24 hours.', 'Releases can be rolled back.'], ownerId: 'marcus-lee', status: 'published', version: '3.2', updatedAgo: 105, reviewIn: 260, ackRate: 0.94, appliesTo: 'Engineering' },
  { id: 'code-of-conduct', name: 'Code of Conduct', summary: 'The behaviour Harborlight expects from everyone.', keyPoints: ['Treat colleagues, customers and partners with respect.', 'Raise concerns without fear of retaliation.', 'Declare conflicts of interest.'], ownerId: 'aisha-rahman', status: 'published', version: '6.0', updatedAgo: 190, reviewIn: 175, ackRate: 0.99, appliesTo: 'Everyone' },
  { id: 'privacy', name: 'Privacy Policy (Internal)', summary: 'How personal information about customers and employees is handled.', keyPoints: ['Collect only what is needed.', 'Honour access and deletion requests within 30 days.', 'Report privacy concerns to Legal.'], ownerId: 'nina-petrov', status: 'in_review', version: '4.4', updatedAgo: 18, reviewIn: 347, ackRate: 0.84, appliesTo: 'Everyone' },
  { id: 'physical-security', name: 'Physical Security Policy', summary: 'Office access, visitors and equipment.', keyPoints: ['Badges are required in all offices.', 'Visitors are signed in and escorted.', 'Lost badges are reported the same day.'], ownerId: 'maya-okafor', status: 'published', version: '1.9', updatedAgo: 270, reviewIn: 95, ackRate: 0.93, appliesTo: 'Everyone' },
  { id: 'risk-management', name: 'Risk Management Policy', summary: 'How risks are identified, scored and tracked — including in Atlas.', keyPoints: ['Every risk has an owner and due date.', 'Critical risks are reviewed weekly.', 'Accepting a risk requires leadership approval.'], ownerId: 'maya-okafor', status: 'draft', version: '0.9', updatedAgo: 9, reviewIn: 356, ackRate: 0, appliesTo: 'Managers' },
]

export const policies: Policy[] = rows.map(({ updatedAgo, reviewIn, ...rest }) => ({
  ...rest, lastUpdated: offsetFromToday(-updatedAgo), nextReview: offsetFromToday(reviewIn),
}))
// 18 policies in total — one more short one
policies.push(
  { id: 'clean-desk', name: 'Clean Desk & Screen Policy', summary: 'Keeping sensitive information out of sight.', keyPoints: ['Lock your screen when away.', 'Shred printed confidential papers.', 'No sensitive information on whiteboards left up overnight.'], ownerId: 'maya-okafor', status: 'published', version: '1.2', lastUpdated: offsetFromToday(-300), nextReview: offsetFromToday(65), ackRate: 0.92, appliesTo: 'Everyone' },
)
export const policiesById = new Map(policies.map((p) => [p.id, p]))
export const getPolicy = (id?: string) => (id ? policiesById.get(id) : undefined)

/** Deterministic "has this person acknowledged this policy?" — drives counts and lists consistently. */
export function hasAcknowledged(personId: string, policyId: string): boolean {
  const pol = policiesById.get(policyId)
  if (!pol) return false
  if (pol.status === 'draft') return false
  const h = (hashString(personId + policyId) % 1000) / 1000
  return h < pol.ackRate
}
export function policyRequiredPeople(policyId: string) {
  const pol = policiesById.get(policyId)!
  return currentPeople.filter((p) => {
    if (pol.appliesTo === 'Everyone') return true
    if (pol.appliesTo === 'Engineering') return p.department === 'Engineering'
    if (pol.appliesTo === 'Contractors') return p.employmentType === 'Contractor'
    return currentPeople.some((x) => x.managerId === p.id) // Managers
  })
}
export function policyAckStats(policyId: string) {
  const req = policyRequiredPeople(policyId)
  const done = req.filter((p) => hasAcknowledged(p.id, policyId)).length
  return { required: req.length, acknowledged: done }
}
