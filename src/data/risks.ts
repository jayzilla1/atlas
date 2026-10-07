import type { Risk } from './types'
import { offsetFromToday } from '@/utils/dates'
import { GITHUB_OWNER_IDS, people } from './people'

const d = offsetFromToday
const at = (n: number, hhmm: string) => `${offsetFromToday(n)}T${hhmm}`

const noMfaIds = people.filter((p) => p.accessIssues.some((i) => i.kind === 'no_mfa')).map((p) => p.id)

/**
 * 12 open risks (2 critical · 3 high · 5 medium · 2 low) + 6 closed ones that
 * feed the trend charts. Everything here is referenced by IDs elsewhere.
 */
export const risks: Risk[] = [
  {
    id: 'R-101', name: 'Former contractor still has access to Google Workspace', severity: 'critical', status: 'in_progress',
    ownerId: 'priya-raman', category: 'Access', identifiedOn: d(-3), dueDate: d(3),
    description: 'Devon Park’s contract ended on Sep 12, but their company Google account is still active and was used 3 days ago from a device Atlas hasn’t seen before.',
    why: 'When a contractor leaves, their accounts should be switched off the same day. An active account of someone who no longer works here can open company documents and email — and nobody is watching it. Even if Devon means no harm, a forgotten account is easy for someone else to take over.',
    evidence: [
      { label: 'Contract end date', detail: 'HR record shows Devon Park’s contract ended Sep 12, 2026.', source: 'Northstar HR · People directory', sourceType: 'hr', observedAt: at(-3, '08:05') },
      { label: 'Account still active', detail: 'Google Workspace shows devon.park@harborlight.example as Active with 31 shared documents.', source: 'Google Workspace · Directory', sourceType: 'identity', observedAt: at(-3, '08:07') },
      { label: 'Recent sign-in', detail: 'Last sign-in Oct 4 from a Chrome browser on Windows in Portland, OR. Devon’s usual device is a Mac.', source: 'Google Workspace · Sign-in log', sourceType: 'identity', observedAt: at(-3, '08:07') },
      { label: 'Why the last review missed it', detail: 'The Sep 30 Google Workspace access review covered employees only; contractor accounts were outside its scope.', source: 'Atlas · Access reviews', sourceType: 'application', observedAt: at(-3, '08:10') },
    ],
    recommended: {
      summary: 'Suspend the account today, then check what was accessed after Sep 12.',
      steps: ['Suspend Devon Park’s Google Workspace account (reversible).', 'Remove Devon from Figma and Notion.', 'Review sign-in and file activity since Sep 12.', 'Transfer ownership of 31 shared documents to Hannah Müller.', 'Add contractor accounts to the quarterly access review.'],
      effort: '≈ 30 minutes',
    },
    related: [{ type: 'person', id: 'devon-park' }, { type: 'application', id: 'google-workspace' }, { type: 'application', id: 'figma' }, { type: 'application', id: 'notion' }, { type: 'policy', id: 'access-control' }],
    confidence: 'high', glossary: ['offboarding', 'access-review', 'least-privilege'],
    activity: [
      { at: at(-3, '08:12'), actor: 'Atlas AI', text: 'Identified a potential access risk and created this risk.', kind: 'ai' },
      { at: at(-3, '09:40'), actor: 'Maya Okafor', text: 'Assigned to Priya Raman and set severity to Critical.', kind: 'human' },
      { at: at(-2, '11:15'), actor: 'Priya Raman', text: 'Started investigating. Confirmed with Hannah Müller that the contract ended.', kind: 'human' },
    ],
  },
  {
    id: 'R-102', name: 'Payroll vendor’s security report expired 23 days ago', severity: 'critical', status: 'open',
    ownerId: 'elena-vasquez', category: 'Vendors', identifiedOn: d(-9), dueDate: d(5),
    description: 'Meridian Payroll’s SOC 2 report expired Sep 14 and no newer one is on file. Meridian holds bank and salary details for every employee, and its scheduled review is now 6 days overdue.',
    why: 'A SOC 2 report is an outside auditor’s check that a provider protects customer information properly. When it lapses we can’t show that the company holding every employee’s bank details is still safe. Your own auditors and customers will ask for it.',
    evidence: [
      { label: 'Report expired', detail: 'SOC 2 Type II report on file expired Sep 14, 2026.', source: 'Atlas · Vendor documents', sourceType: 'vendor', observedAt: at(-9, '07:50') },
      { label: 'Sensitive data', detail: 'Meridian Payroll stores bank accounts, salaries and tax IDs for 248 people.', source: 'Atlas · Vendor profile', sourceType: 'vendor', observedAt: at(-9, '07:50') },
      { label: 'Review overdue', detail: 'Annual vendor review was due Oct 1; no review is in progress.', source: 'Atlas · Vendor reviews', sourceType: 'vendor', observedAt: at(-6, '09:00') },
    ],
    recommended: {
      summary: 'Ask Meridian for their latest SOC 2 report and start the overdue review.',
      steps: ['Email Meridian’s account manager requesting the current SOC 2 Type II report.', 'Check the report’s date range and exceptions.', 'Mark the vendor review complete in Atlas.', 'If no report exists, escalate to Finance leadership.'],
      effort: '≈ 1 hour, plus vendor response time',
    },
    related: [{ type: 'vendor', id: 'meridian-payroll' }, { type: 'application', id: 'meridian-payroll' }, { type: 'policy', id: 'vendor-management' }],
    confidence: 'high', glossary: ['soc2', 'third-party-risk'],
    activity: [
      { at: at(-9, '07:55'), actor: 'Atlas AI', text: 'Detected expired document and created this risk.', kind: 'ai' },
      { at: at(-8, '10:20'), actor: 'Elena Vasquez', text: 'Took ownership. Emailed Meridian’s account manager.', kind: 'human' },
    ],
  },
  {
    id: 'R-103', name: 'Admin privileges haven’t been reviewed in 9 months', severity: 'high', status: 'open',
    ownerId: 'marcus-lee', category: 'Access', identifiedOn: d(-21), dueDate: d(14),
    description: 'Three people are owners of the GitHub organization (the highest level of control over the company’s source code). The last review of these admin rights was 276 days ago.',
    why: 'Admin accounts can change anything — including who else has access. If one is stolen or misused the damage is far larger than a regular account. Good practice is to keep the number of admins small and re-check them regularly.',
    evidence: [
      { label: 'Last review', detail: 'GitHub access review last completed 276 days ago (policy: every 180 days).', source: 'Atlas · Access reviews', sourceType: 'application', observedAt: at(-21, '08:30') },
      { label: 'Owner accounts', detail: '3 organization owners: Marcus Lee, Sarah Chen and one staff engineer.', source: 'GitHub · Members', sourceType: 'application', observedAt: at(-21, '08:31') },
    ],
    recommended: {
      summary: 'Confirm each owner still needs full control; downgrade the rest.',
      steps: ['Ask Marcus Lee to confirm which owners are still required.', 'Downgrade unneeded owners to “maintainer”.', 'Record the review in Atlas.'],
      effort: '≈ 45 minutes',
    },
    related: [{ type: 'application', id: 'github' }, ...GITHUB_OWNER_IDS.map((id) => ({ type: 'person' as const, id })), { type: 'policy', id: 'access-control' }],
    confidence: 'medium', confidenceNote: 'Atlas can see who the owners are, but cannot tell whether each one still needs that level of access.',
    glossary: ['admin-privileges', 'access-review', 'least-privilege'],
    activity: [{ at: at(-21, '08:35'), actor: 'Atlas AI', text: 'Flagged overdue admin review.', kind: 'ai' }, { at: at(-18, '14:05'), actor: 'Maya Okafor', text: 'Assigned to Marcus Lee.', kind: 'human' }],
  },
  {
    id: 'R-104', name: 'Nine Salesforce users sign in without multi-factor authentication', severity: 'high', status: 'in_progress',
    ownerId: 'tomas-ibarra', category: 'Access', identifiedOn: d(-15), dueDate: d(9),
    description: 'Nine people in Sales can open Salesforce — which holds customer contact details — with just a password. Salesforce doesn’t currently require a second check.',
    why: 'Passwords are stolen constantly through fake emails. A second check, like a code on a phone, stops a stolen password from being enough on its own. It is one of the simplest ways to prevent break-ins.',
    evidence: [
      { label: 'MFA status', detail: '9 of 77 Salesforce users have MFA switched off.', source: 'Okta · MFA enrolment', sourceType: 'identity', observedAt: at(-15, '08:00') },
      { label: 'App setting', detail: 'Salesforce does not enforce MFA at the organization level.', source: 'Salesforce · Security settings', sourceType: 'application', observedAt: at(-15, '08:02') },
    ],
    recommended: {
      summary: 'Turn on required MFA in Salesforce and help the nine users enrol.',
      steps: ['Email the nine users with setup steps.', 'Switch on “require MFA” in Salesforce after a 7-day grace period.', 'Confirm enrolment in Atlas.'],
      effort: '≈ 30 minutes + 1 week grace period',
    },
    related: [{ type: 'application', id: 'salesforce' }, ...noMfaIds.map((id) => ({ type: 'person' as const, id })), { type: 'policy', id: 'password' }],
    confidence: 'high', glossary: ['mfa', 'phishing'],
    activity: [{ at: at(-15, '08:05'), actor: 'Atlas AI', text: 'Detected users without MFA.', kind: 'ai' }, { at: at(-12, '16:20'), actor: 'Tomás Ibarra', text: 'Agreed to enforce MFA after a one-week notice.', kind: 'human' }],
  },
  {
    id: 'R-105', name: 'HR vendor renewal approaching without a data processing agreement', severity: 'high', status: 'open',
    ownerId: 'aisha-rahman', category: 'Vendors', identifiedOn: d(-12), dueDate: d(20),
    description: 'Northstar HR stores employee records and its contract renews in 58 days. Atlas couldn’t find a signed data processing agreement.',
    why: 'Privacy laws expect a written agreement whenever a vendor handles personal data on your behalf. It says what they can do with it and what happens if something goes wrong. Without one, you may be non-compliant — and have little recourse after a breach.',
    evidence: [
      { label: 'No agreement on file', detail: 'No document labelled “DPA” is attached to the Northstar HR contract.', source: 'Atlas · Vendor documents', sourceType: 'vendor', observedAt: at(-12, '09:10') },
      { label: 'Data handled', detail: 'Northstar HR stores names, addresses, benefits and tax IDs of employees.', source: 'Atlas · Vendor profile', sourceType: 'vendor', observedAt: at(-12, '09:10') },
      { label: 'Renewal', detail: 'Contract ends in 58 days.', source: 'Atlas · Contracts', sourceType: 'vendor', observedAt: at(-12, '09:10') },
    ],
    recommended: {
      summary: 'Check with Legal whether an agreement exists; if not, request one before renewal.',
      steps: ['Ask Legal whether a DPA was signed outside Atlas.', 'If not, request Northstar’s standard DPA.', 'Upload the signed copy to the vendor record.'],
      effort: '≈ 1 hour + legal review',
    },
    related: [{ type: 'vendor', id: 'northstar-hr' }, { type: 'application', id: 'northstar-hr' }, { type: 'policy', id: 'vendor-management' }],
    confidence: 'needs_review', confidenceNote: 'Atlas only looks at documents uploaded to connected systems. The agreement may exist in an email thread or a shared drive Atlas can’t see.',
    glossary: ['dpa', 'third-party-risk'],
    activity: [{ at: at(-12, '09:15'), actor: 'Atlas AI', text: 'Flagged missing agreement. Marked “needs review” because the document may exist outside connected systems.', kind: 'ai' }],
  },
  {
    id: 'R-106', name: 'Vendor security documentation expires in 12 days', severity: 'medium', status: 'open',
    ownerId: 'david-kim', category: 'Vendors', identifiedOn: d(-5), dueDate: d(12),
    description: 'Cloudline Hosting’s SOC 2 report expires in 12 days. Cloudline hosts the staging and backup environments, which include copies of customer data.',
    why: 'Security reports have an expiry date because the auditor’s check only covers a period of time. Requesting the new one before the old one lapses avoids a gap that auditors and customers would notice.',
    evidence: [
      { label: 'Expiry', detail: 'SOC 2 Type II report valid until Oct 19, 2026.', source: 'Atlas · Vendor documents', sourceType: 'vendor', observedAt: at(-5, '08:00') },
      { label: 'Data handled', detail: 'Hosts backups containing customer data.', source: 'Atlas · Vendor profile', sourceType: 'vendor', observedAt: at(-5, '08:00') },
    ],
    recommended: { summary: 'Request the renewed report now so there is no gap.', steps: ['Email Cloudline’s security contact for the new SOC 2 report.', 'Upload it and update the expiry date.'], effort: '≈ 15 minutes' },
    related: [{ type: 'vendor', id: 'cloudline-hosting' }, { type: 'policy', id: 'vendor-management' }],
    confidence: 'high', glossary: ['soc2'],
    activity: [{ at: at(-5, '08:02'), actor: 'Atlas AI', text: 'Detected an upcoming document expiry.', kind: 'ai' }, { at: at(-4, '13:40'), actor: 'David Kim', text: 'Requested the new report from Cloudline.', kind: 'human' }],
  },
  {
    id: 'R-107', name: '14 employees have not completed security training', severity: 'medium', status: 'in_progress',
    ownerId: 'maya-okafor', category: 'People & training', identifiedOn: d(-7), dueDate: d(7),
    description: '14 of 248 people haven’t completed the required yearly security awareness course — 6 are overdue, 5 are partway through and 3 haven’t started. That’s up from 11 last month.',
    why: 'Most security incidents start with someone being tricked by a fake email, not a technical failure. The yearly course teaches people to spot those. Frameworks like SOC 2 require everyone to complete it, and auditors check the completion rate.',
    evidence: [
      { label: 'Completion rate', detail: '234 of 248 people (94%) have completed the 2026 course; target is 100%.', source: 'Lumen Learning · Completions', sourceType: 'training', observedAt: at(-7, '06:00') },
      { label: 'Trend', detail: 'Missing completions rose from 11 to 14 over the last 30 days (+27%).', source: 'Atlas · Training history', sourceType: 'training', observedAt: at(-7, '06:00') },
      { label: 'Overdue', detail: '6 people are past their due date, the longest by 34 days.', source: 'Lumen Learning · Assignments', sourceType: 'training', observedAt: at(-7, '06:00') },
    ],
    recommended: { summary: 'Ask each person’s manager to follow up; Atlas can prepare the tasks for you.', steps: ['Review the 14 people.', 'Create a follow-up task for each manager.', 'Re-check completion in a week.'], effort: '≈ 10 minutes with Atlas' },
    related: [{ type: 'policy', id: 'security-awareness' }, { type: 'vendor', id: 'lumen-learning' }],
    confidence: 'high', glossary: ['security-training', 'phishing'],
    activity: [{ at: at(-7, '06:05'), actor: 'Atlas AI', text: 'Detected rising number of incomplete trainings.', kind: 'ai' }, { at: at(-6, '09:30'), actor: 'Maya Okafor', text: 'Took ownership.', kind: 'human' }],
  },
  {
    id: 'R-108', name: 'Zoom recordings are kept longer than company policy allows', severity: 'medium', status: 'open',
    ownerId: 'nina-petrov', category: 'Data protection', identifiedOn: d(-14), dueDate: d(25),
    description: 'Zoom keeps meeting recordings for 180 days, but the Data Retention Policy says 90. Older recordings include customer calls.',
    why: 'Keeping data longer than needed increases the damage of any leak and can breach privacy rules. Companies are expected to follow their own written retention rules.',
    evidence: [
      { label: 'Zoom setting', detail: 'Cloud recording auto-delete is set to 180 days.', source: 'Zoom · Account settings', sourceType: 'application', observedAt: at(-14, '08:30') },
      { label: 'Policy', detail: 'Data Retention Policy v2.0 §3: recordings are deleted after 90 days.', source: 'Atlas · Policies', sourceType: 'policy', observedAt: at(-14, '08:30') },
    ],
    recommended: { summary: 'Change the Zoom setting to 90 days and delete older recordings after Legal agrees.', steps: ['Change Zoom auto-delete to 90 days.', 'Ask Legal whether any recordings are under hold.', 'Delete recordings older than 90 days.'], effort: '≈ 30 minutes' },
    related: [{ type: 'application', id: 'zoom' }, { type: 'policy', id: 'data-retention' }],
    confidence: 'high', glossary: ['data-retention'],
    activity: [{ at: at(-14, '08:35'), actor: 'Atlas AI', text: 'Detected mismatch between policy and app setting.', kind: 'ai' }],
  },
  {
    id: 'R-109', name: '4 applications have outdated access reviews', severity: 'medium', status: 'open',
    ownerId: 'priya-raman', category: 'Access', identifiedOn: d(-10), dueDate: d(16),
    description: 'GitHub, AWS, Zoom and BrightDesk haven’t had an access review in more than 180 days — the maximum allowed by the Access Control Policy.',
    why: 'People change roles and projects end, but permissions tend to stay. A regular access review removes access nobody needs anymore. Auditors look for evidence that reviews happen on schedule.',
    evidence: [
      { label: 'Overdue reviews', detail: 'GitHub 276 days · AWS 214 days · Zoom 201 days · BrightDesk 193 days since last review.', source: 'Atlas · Access reviews', sourceType: 'application', observedAt: at(-10, '08:00') },
      { label: 'Policy', detail: 'Access Control Policy: reviews at least every 180 days.', source: 'Atlas · Policies', sourceType: 'policy', observedAt: at(-10, '08:00') },
    ],
    recommended: { summary: 'Start the four reviews, beginning with GitHub and AWS (highest sensitivity).', steps: ['Ask each app owner to complete the review in Atlas.', 'Remove or reduce access nobody needs.', 'Add calendar reminders every 90 days.'], effort: '≈ 1–2 hours per app' },
    related: [{ type: 'application', id: 'github' }, { type: 'application', id: 'aws' }, { type: 'application', id: 'zoom' }, { type: 'application', id: 'brightdesk' }, { type: 'policy', id: 'access-control' }],
    confidence: 'high', glossary: ['access-review', 'least-privilege'],
    activity: [{ at: at(-10, '08:05'), actor: 'Atlas AI', text: 'Grouped four overdue reviews into one risk.', kind: 'ai' }],
  },
  {
    id: 'R-110', name: 'Password Policy is overdue for its yearly review', severity: 'medium', status: 'open',
    ownerId: 'priya-raman', category: 'Policies', identifiedOn: d(-17), dueDate: d(10),
    description: 'The Password Policy was last updated 385 days ago and its review date (17 days ago) has passed.',
    why: 'Written policies must be reviewed regularly so they stay accurate — for example, guidance on passwords has moved toward passkeys. An out-of-date policy is a common audit finding.',
    evidence: [{ label: 'Review date', detail: 'Next review date passed 17 days ago.', source: 'Atlas · Policies', sourceType: 'policy', observedAt: at(-17, '08:00') }],
    recommended: { summary: 'Review the policy, update it and publish a new version.', steps: ['Review wording with the security team.', 'Update guidance on passkeys and MFA.', 'Publish and ask everyone to acknowledge the new version.'], effort: '≈ 2 hours' },
    related: [{ type: 'policy', id: 'password' }],
    confidence: 'high', glossary: ['audit', 'mfa'],
    activity: [{ at: at(-17, '08:02'), actor: 'Atlas AI', text: 'Detected overdue policy review.', kind: 'ai' }],
  },
  {
    id: 'R-111', name: 'Three laptops haven’t reported disk-encryption status', severity: 'low', status: 'open',
    ownerId: 'priya-raman', category: 'Devices', identifiedOn: d(-8), dueDate: d(30),
    description: 'Three leased laptops haven’t checked in with device management for over 30 days, so Atlas can’t confirm their disks are encrypted.',
    why: 'Encryption scrambles the data on a laptop so that if it is lost or stolen, nobody can read it. If we can’t confirm it’s on, we can’t promise a lost laptop is safe.',
    evidence: [{ label: 'No check-in', detail: '3 devices last reported 34, 41 and 58 days ago.', source: 'Kestrel Devices · Fleet report', sourceType: 'device', observedAt: at(-8, '07:30') }],
    recommended: { summary: 'Ask the owners to connect to the VPN so the laptops can report in.', steps: ['Message the three device owners.', 'Re-check status after 3 days.'], effort: '≈ 15 minutes' },
    related: [{ type: 'vendor', id: 'kestrel-devices' }],
    confidence: 'medium', confidenceNote: 'The laptops may be fine — Atlas just hasn’t heard from them. This is a gap in evidence, not proof of a problem.',
    glossary: ['encryption', 'compliance-control'],
    activity: [{ at: at(-8, '07:32'), actor: 'Atlas AI', text: 'Flagged missing device reports.', kind: 'ai' }],
  },
  {
    id: 'R-112', name: 'Recruiting tool connection has expired', severity: 'low', status: 'open',
    ownerId: 'aisha-rahman', category: 'Access', identifiedOn: d(-4), dueDate: d(28),
    description: 'Atlas lost its connection to Lever (the older recruiting tool being retired), so access data for 4 recruiters is out of date.',
    why: 'Atlas can only watch what it can see. When a connection lapses, access checks for that app silently stop — which is why Atlas surfaces it.',
    evidence: [{ label: 'Connection', detail: 'Lever authorisation expired 9 days ago.', source: 'Atlas · Integrations', sourceType: 'application', observedAt: at(-4, '07:00') }],
    recommended: { summary: 'Reconnect Lever, or finish retiring it if it’s no longer used.', steps: ['Confirm Lever is still needed.', 'Reconnect or remove it from Atlas.'], effort: '≈ 10 minutes' },
    related: [{ type: 'application', id: 'lever' }],
    confidence: 'high', glossary: ['access-review'],
    activity: [{ at: at(-4, '07:01'), actor: 'Atlas', text: 'Detected expired connection.', kind: 'system' }],
  },
  // ---- closed -------------------------------------------------------------------------------------
  { id: 'R-088', name: 'Shared admin login used for Zendesk', severity: 'high', status: 'resolved', ownerId: 'owen-brooks', category: 'Access', identifiedOn: d(-71), dueDate: d(-50), description: 'Support shared one admin login, so actions couldn’t be traced to a person.', why: 'Shared logins make it impossible to know who did what.', evidence: [], recommended: { summary: 'Create named admin accounts.', steps: ['Create named accounts', 'Disable shared login'], effort: '≈ 1 hour' }, related: [{ type: 'application', id: 'zendesk' }], confidence: 'high', glossary: ['admin-privileges'], activity: [{ at: at(-52, '10:00'), actor: 'Owen Brooks', text: 'Replaced the shared login with named accounts. Marked resolved.', kind: 'human' }] },
  { id: 'R-091', name: 'Four laptops without disk encryption', severity: 'medium', status: 'resolved', ownerId: 'priya-raman', category: 'Devices', identifiedOn: d(-64), dueDate: d(-40), description: 'Four laptops were found without disk encryption.', why: 'Lost devices should be unreadable.', evidence: [], recommended: { summary: 'Enable encryption.', steps: ['Enable encryption'], effort: '≈ 1 hour' }, related: [], confidence: 'high', glossary: ['encryption'], activity: [{ at: at(-45, '15:00'), actor: 'Priya Raman', text: 'Encryption enabled on all four devices.', kind: 'human' }] },
  { id: 'R-093', name: 'Legacy VPN vendor has no security report', severity: 'low', status: 'accepted', ownerId: 'priya-raman', category: 'Vendors', identifiedOn: d(-80), dueDate: d(-55), description: 'The VPN vendor, being retired in Q1, never supplied a security report.', why: 'Retiring soon; leadership accepted the short-term risk.', evidence: [], recommended: { summary: 'Accept until retirement.', steps: ['Retire in Q1'], effort: '—' }, related: [], confidence: 'high', glossary: ['soc2'], activity: [{ at: at(-60, '09:00'), actor: 'Rachel Thompson', text: 'Risk accepted until the vendor is retired in Q1 2027.', kind: 'human' }] },
  { id: 'R-095', name: 'Mailchimp list export open to all marketers', severity: 'medium', status: 'resolved', ownerId: 'ben-whitaker', category: 'Data protection', identifiedOn: d(-52), dueDate: d(-30), description: 'Everyone in Marketing could export the full subscriber list.', why: 'Exports of contact lists are a common way data leaves a company.', evidence: [], recommended: { summary: 'Restrict exports.', steps: ['Limit export to two admins'], effort: '≈ 20 minutes' }, related: [{ type: 'application', id: 'mailchimp' }], confidence: 'high', glossary: ['least-privilege'], activity: [{ at: at(-33, '11:00'), actor: 'Ben Whitaker', text: 'Restricted export permission.', kind: 'human' }] },
  { id: 'R-097', name: 'Benefits provider missing a data processing agreement', severity: 'high', status: 'resolved', ownerId: 'aisha-rahman', category: 'Vendors', identifiedOn: d(-95), dueDate: d(-70), description: 'No signed agreement was on file for Harbor Benefits Group.', why: 'Required whenever personal data is shared.', evidence: [], recommended: { summary: 'Obtain a signed DPA.', steps: ['Request DPA'], effort: '≈ 1 hour' }, related: [{ type: 'vendor', id: 'harbor-benefits' }], confidence: 'high', glossary: ['dpa'], activity: [{ at: at(-74, '12:00'), actor: 'Aisha Rahman', text: 'Signed DPA uploaded.', kind: 'human' }] },
  { id: 'R-099', name: 'Two former employees still in Slack', severity: 'medium', status: 'resolved', ownerId: 'priya-raman', category: 'Access', identifiedOn: d(-33), dueDate: d(-20), description: 'Two people who left in July were still active in Slack.', why: 'Former employees shouldn’t see internal conversations.', evidence: [], recommended: { summary: 'Deactivate accounts.', steps: ['Deactivate'], effort: '≈ 5 minutes' }, related: [{ type: 'application', id: 'slack' }], confidence: 'high', glossary: ['offboarding'], activity: [{ at: at(-25, '09:00'), actor: 'Priya Raman', text: 'Both accounts deactivated.', kind: 'human' }] },
]

export const risksById = new Map(risks.map((r) => [r.id, r]))
export const getRisk = (id?: string) => (id ? risksById.get(id) : undefined)
export const isOpenRisk = (r: Risk) => r.status === 'open' || r.status === 'in_progress'
