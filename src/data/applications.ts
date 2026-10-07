import type { AccessGrant, Application, ConnectionStatus, Severity } from './types'
import { currentPeople, people, peopleById, GITHUB_OWNER_IDS } from './people'
import { mulberry32, pick } from '@/utils/random'
import { offsetFromToday } from '@/utils/dates'

/**
 * 73 applications. ~20 are hand-described (they appear in risks and stories);
 * the rest are generated from a compact table so the inventory feels real.
 * Access grants (who can use what) are generated per department "scope".
 */

type Scope = 'all' | string[]
interface Def {
  id: string; name: string; category: string; description: string; scope: Scope; share?: number
  owner: string; baseline?: Severity; reviewedDaysAgo: number; sensitivity?: 'Low' | 'Moderate' | 'High'
  connection?: ConnectionStatus; sso?: boolean; mfa?: boolean; vendorId?: string; status?: Application['status']
}


const CORE: Def[] = [
  { id: 'google-workspace', name: 'Google Workspace', category: 'Productivity', description: 'Company email, calendar, documents and shared drives.', scope: 'all', owner: 'priya-raman', reviewedDaysAgo: 6, sensitivity: 'High', baseline: 'medium' },
  { id: 'slack', name: 'Slack', category: 'Communication', description: 'Team messaging and channels.', scope: 'all', owner: 'priya-raman', reviewedDaysAgo: 41, sensitivity: 'Moderate' },
  { id: 'zoom', name: 'Zoom', category: 'Communication', description: 'Video meetings and webinars, including recorded customer calls.', scope: 'all', owner: 'priya-raman', reviewedDaysAgo: 201, sensitivity: 'Moderate', baseline: 'medium', mfa: false },
  { id: 'okta', name: 'Okta', category: 'Identity', description: 'Single sign-on and login security for all work apps.', scope: 'all', owner: 'priya-raman', reviewedDaysAgo: 18, sensitivity: 'High' },
  { id: '1password', name: '1Password', category: 'Identity', description: 'Shared password vault for teams.', scope: 'all', owner: 'priya-raman', reviewedDaysAgo: 33, sensitivity: 'High' },
  { id: 'notion', name: 'Notion', category: 'Productivity', description: 'Company wiki, project plans and meeting notes.', scope: 'all', share: 0.78, owner: 'maya-okafor', reviewedDaysAgo: 52, sensitivity: 'Moderate' },
  { id: 'salesforce', name: 'Salesforce', category: 'Sales & CRM', description: 'Customer records, deals and pipeline. Contains customer contact data.', scope: ['Sales', 'Customer Success', 'Marketing', 'Executive'], owner: 'tomas-ibarra', reviewedDaysAgo: 88, sensitivity: 'High', baseline: 'medium' },
  { id: 'github', name: 'GitHub', category: 'Engineering', description: 'Source code hosting and code review.', scope: ['Engineering', 'IT & Security'], owner: 'marcus-lee', reviewedDaysAgo: 276, sensitivity: 'High', baseline: 'medium' },
  { id: 'aws', name: 'AWS', category: 'Infrastructure', description: 'Cloud servers and databases that run the Harborlight product.', scope: ['Engineering', 'IT & Security'], share: 0.3, owner: 'david-kim', reviewedDaysAgo: 214, sensitivity: 'High', baseline: 'medium' },
  { id: 'jira', name: 'Jira', category: 'Engineering', description: 'Engineering and product work tracking.', scope: ['Engineering', 'Product', 'Design', 'IT & Security'], owner: 'sofia-lindqvist', reviewedDaysAgo: 64, sensitivity: 'Low' },
  { id: 'figma', name: 'Figma', category: 'Design', description: 'Product design files and prototypes.', scope: ['Design', 'Product', 'Marketing', 'Engineering'], share: 0.55, owner: 'hannah-muller', reviewedDaysAgo: 73, sensitivity: 'Low' },
  { id: 'microsoft-365', name: 'Microsoft 365', category: 'Productivity', description: 'Excel, Word and Outlook, used mainly by Finance, Legal and People teams.', scope: ['Finance', 'Legal', 'People', 'Executive'], owner: 'elena-vasquez', reviewedDaysAgo: 97, sensitivity: 'Moderate' },
  { id: 'hubspot', name: 'HubSpot', category: 'Marketing', description: 'Email campaigns, landing pages and lead tracking.', scope: ['Marketing', 'Sales'], share: 0.7, owner: 'ben-whitaker', reviewedDaysAgo: 59, sensitivity: 'Moderate' },
  { id: 'zendesk', name: 'Zendesk', category: 'Support', description: 'Customer support tickets and help centre.', scope: ['Support', 'Customer Success'], owner: 'owen-brooks', reviewedDaysAgo: 80, sensitivity: 'High', baseline: 'medium' },
  { id: 'datadog', name: 'Datadog', category: 'Engineering', description: 'System monitoring and alerts.', scope: ['Engineering'], share: 0.45, owner: 'marcus-lee', reviewedDaysAgo: 105, sensitivity: 'Moderate' },
  // Vendor-linked apps
  { id: 'northstar-hr', name: 'Northstar HR', category: 'HR', description: 'Employee records, onboarding paperwork and time off.', scope: ['People', 'Finance', 'Executive'], share: 0.9, owner: 'aisha-rahman', reviewedDaysAgo: 46, sensitivity: 'High', baseline: 'medium', vendorId: 'northstar-hr' },
  { id: 'meridian-payroll', name: 'Meridian Payroll', category: 'Finance', description: 'Pays employees and withholds taxes. Holds bank and salary details.', scope: ['Finance', 'People'], share: 0.7, owner: 'elena-vasquez', reviewedDaysAgo: 28, sensitivity: 'High', baseline: 'medium', vendorId: 'meridian-payroll', connection: 'manual' },
  { id: 'brightdesk', name: 'BrightDesk', category: 'IT', description: 'Internal IT help desk for employee equipment and access requests.', scope: ['IT & Security', 'Operations', 'People'], share: 0.8, owner: 'priya-raman', reviewedDaysAgo: 193, sensitivity: 'Low', baseline: 'medium', vendorId: 'brightdesk' },
  { id: 'acme-analytics', name: 'Acme Analytics', category: 'Analytics', description: 'Product usage analytics. Receives anonymised customer activity.', scope: ['Product', 'Marketing', 'Engineering', 'Design'], share: 0.4, owner: 'sofia-lindqvist', reviewedDaysAgo: 67, sensitivity: 'Moderate', vendorId: 'acme-analytics' },
]

// Long tail: [name, category, scope, owner, description, sensitivity?]
const TAIL: [string, string, Scope, string, string, ('Low' | 'Moderate' | 'High')?][] = [
  ['Asana', 'Project management', ['Marketing', 'Operations', 'Product'], 'maya-okafor', 'Cross-team project plans.'],
  ['Box', 'Storage', ['Legal', 'Finance', 'Sales'], 'nina-petrov', 'Secure file sharing with customers and counsel.', 'High'],
  ['Dropbox', 'Storage', ['Marketing', 'Design'], 'ben-whitaker', 'Large creative file storage.'],
  ['DocuSign', 'Legal', ['Legal', 'Sales', 'People', 'Finance'], 'nina-petrov', 'Electronic signatures for contracts.', 'High'],
  ['Gong', 'Sales & CRM', ['Sales', 'Customer Success'], 'tomas-ibarra', 'Records and analyses sales calls.', 'Moderate'],
  ['Intercom', 'Support', ['Support', 'Customer Success', 'Product'], 'owen-brooks', 'In-product customer chat.', 'Moderate'],
  ['Mixpanel', 'Analytics', ['Product', 'Marketing'], 'sofia-lindqvist', 'Funnel and retention analytics.'],
  ['Miro', 'Collaboration', ['Product', 'Design', 'Operations'], 'hannah-muller', 'Whiteboards for workshops.'],
  ['Loom', 'Communication', 'all', 'maya-okafor', 'Short screen-recorded videos.'],
  ['Calendly', 'Scheduling', ['Sales', 'Customer Success', 'People'], 'tomas-ibarra', 'Meeting scheduling links.'],
  ['Airtable', 'Productivity', ['Operations', 'Marketing', 'Finance'], 'maya-okafor', 'Lightweight databases and trackers.'],
  ['Canva', 'Design', ['Marketing', 'People'], 'ben-whitaker', 'Quick marketing graphics.'],
  ['Lucidchart', 'Collaboration', ['Engineering', 'Product', 'Operations'], 'maya-okafor', 'Diagrams and process maps.'],
  ['Looker', 'Analytics', ['Finance', 'Product', 'Sales', 'Operations'], 'elena-vasquez', 'Business dashboards.', 'Moderate'],
  ['Tableau', 'Analytics', ['Finance', 'Operations'], 'elena-vasquez', 'Executive reporting.', 'Moderate'],
  ['PagerDuty', 'Engineering', ['Engineering', 'IT & Security'], 'marcus-lee', 'On-call alerts when systems fail.'],
  ['Sentry', 'Engineering', ['Engineering'], 'marcus-lee', 'Error tracking for the product.'],
  ['CircleCI', 'Engineering', ['Engineering'], 'sarah-chen', 'Automated builds and tests.', 'Moderate'],
  ['Vercel', 'Infrastructure', ['Engineering', 'Marketing'], 'marcus-lee', 'Website hosting.'],
  ['Twilio', 'Infrastructure', ['Engineering'], 'marcus-lee', 'SMS and voice messaging.', 'Moderate'],
  ['SendGrid', 'Infrastructure', ['Engineering', 'Marketing'], 'marcus-lee', 'Transactional email delivery.', 'Moderate'],
  ['Mailchimp', 'Marketing', ['Marketing'], 'ben-whitaker', 'Newsletters.', 'Moderate'],
  ['Greenhouse', 'HR', ['People'], 'aisha-rahman', 'Recruiting and applicant tracking.', 'High'],
  ['Lever', 'HR', ['People'], 'aisha-rahman', 'Legacy recruiting tool being retired.', 'Moderate'],
  ['Lattice', 'HR', ['People', 'Executive'], 'aisha-rahman', 'Performance reviews and goals.', 'High'],
  ['Culture Amp', 'HR', ['People'], 'aisha-rahman', 'Employee surveys.', 'Moderate'],
  ['Carta', 'Finance', ['Finance', 'Legal', 'Executive'], 'elena-vasquez', 'Equity and cap table.', 'High'],
  ['Expensify', 'Finance', 'all', 'elena-vasquez', 'Employee expense reports.', 'Moderate'],
  ['Bill.com', 'Finance', ['Finance'], 'elena-vasquez', 'Pays supplier invoices.', 'High'],
  ['QuickBooks', 'Finance', ['Finance'], 'elena-vasquez', 'Bookkeeping.', 'High'],
  ['NetSuite', 'Finance', ['Finance', 'Operations'], 'elena-vasquez', 'Company accounting system.', 'High'],
  ['Confluence', 'Productivity', ['Engineering', 'Product', 'IT & Security'], 'sofia-lindqvist', 'Engineering documentation.'],
  ['Linear', 'Engineering', ['Engineering', 'Design'], 'marcus-lee', 'Issue tracking for one platform team (pilot).', 'Low'],
  ['Postman', 'Engineering', ['Engineering'], 'sarah-chen', 'API testing.'],
  ['LaunchDarkly', 'Engineering', ['Engineering', 'Product'], 'marcus-lee', 'Feature flags.'],
  ['Snowflake', 'Data', ['Engineering', 'Finance', 'Product'], 'david-kim', 'Company data warehouse containing customer usage data.', 'High'],
  ['dbt Cloud', 'Data', ['Engineering'], 'david-kim', 'Data transformations.', 'Moderate'],
  ['Fivetran', 'Data', ['Engineering'], 'david-kim', 'Moves data between systems.', 'Moderate'],
  ['Segment', 'Data', ['Engineering', 'Marketing', 'Product'], 'sofia-lindqvist', 'Customer event collection.', 'Moderate'],
  ['Amplitude', 'Analytics', ['Product'], 'sofia-lindqvist', 'Product analytics (being consolidated).'],
  ['FullStory', 'Analytics', ['Product', 'Design', 'Support'], 'hannah-muller', 'Session replays of how customers use the product.', 'Moderate'],
  ['Hotjar', 'Analytics', ['Marketing', 'Design'], 'ben-whitaker', 'Website heatmaps.'],
  ['Webflow', 'Marketing', ['Marketing', 'Design'], 'ben-whitaker', 'Marketing website.'],
  ['WordPress', 'Marketing', ['Marketing'], 'ben-whitaker', 'Company blog.'],
  ['Semrush', 'Marketing', ['Marketing'], 'ben-whitaker', 'Search ranking research.'],
  ['Buffer', 'Marketing', ['Marketing'], 'ben-whitaker', 'Social media scheduling.'],
  ['Grammarly', 'Productivity', 'all', 'maya-okafor', 'Writing assistant.', 'Moderate'],
  ['Zapier', 'Automation', ['Operations', 'Marketing', 'Sales', 'Customer Success'], 'maya-okafor', 'No-code automations between apps.', 'Moderate'],
  ['Typeform', 'Marketing', ['Marketing', 'Customer Success', 'People'], 'ben-whitaker', 'Forms and surveys.'],
  ['SurveyMonkey', 'Marketing', ['Customer Success', 'Marketing'], 'camila-reyes', 'Customer satisfaction surveys.'],
  ['Outreach', 'Sales & CRM', ['Sales'], 'tomas-ibarra', 'Automated sales email sequences.', 'Moderate'],
  ['ZoomInfo', 'Sales & CRM', ['Sales', 'Marketing'], 'tomas-ibarra', 'Prospect contact database.', 'Moderate'],
  ['Retool', 'Engineering', ['Engineering', 'Operations', 'Support'], 'marcus-lee', 'Internal admin tools — can read and edit customer records.', 'High'],
  ['Clari', 'Sales & CRM', ['Sales', 'Executive'], 'tomas-ibarra', 'Sales forecasting.'],
]

const OUTDATED_ISH = new Set(['lever'])
const SPECIAL_CONNECTION: Record<string, ConnectionStatus> = {
  mailchimp: 'needs_reauth', lever: 'needs_reauth', box: 'sync_error', wordpress: 'manual', 'meridian-payroll': 'manual',
}

const rng = mulberry32(73)
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const defs: Def[] = [
  ...CORE,
  ...TAIL.map(([name, category, scope, owner, description, sens]): Def => {
    const id = slugify(name)
    return {
      id, name, category, description, scope, owner, sensitivity: sens ?? 'Low',
      reviewedDaysAgo: 22 + Math.floor(rng() * 135), share: scope === 'all' ? 0.65 : 0.55 + rng() * 0.45,
      status: OUTDATED_ISH.has(id) ? 'being_retired' : name === 'Linear' ? 'trial' : 'active',
      baseline: sens === 'High' ? 'medium' : 'low',
    }
  }),
]

export const applications: Application[] = defs.map((d) => ({
  id: d.id, name: d.name, category: d.category, description: d.description, ownerId: d.owner,
  status: d.status ?? 'active', connection: d.connection ?? SPECIAL_CONNECTION[d.id] ?? 'connected',
  baselineRisk: d.baseline ?? 'low', lastReview: offsetFromToday(-d.reviewedDaysAgo), reviewCadenceDays: 180,
  ssoEnforced: d.sso ?? !['wordpress', 'meridian-payroll', 'zoom', 'lever', 'mailchimp'].includes(d.id),
  mfaEnforced: d.mfa ?? !['wordpress', 'zoom', 'lever', 'mailchimp', 'salesforce'].includes(d.id),
  dataSensitivity: d.sensitivity ?? 'Low', vendorId: d.vendorId,
}))
export const applicationsById = new Map(applications.map((a) => [a.id, a]))
export const getApplication = (id?: string) => (id ? applicationsById.get(id) : undefined)

// ---- Access grants -------------------------------------------------------------------------
const grants: AccessGrant[] = []
const jordanApps: Record<string, { role: string; used: number }> = {
  slack: { role: 'Member', used: 0 }, notion: { role: 'Editor', used: 1 },
  'google-workspace': { role: 'Member', used: 0 }, salesforce: { role: 'Admin', used: 142 },
}
const grng = mulberry32(4242)
const adminCandidates = new Set(['priya-raman'])
const dormantRoles = ['Member', 'Member', 'Member', 'Editor', 'Viewer']

for (const d of defs) {
  const app = applicationsById.get(d.id)!
  const pool = currentPeople.filter((p) => d.scope === 'all' || d.scope.includes(p.department))
  for (const p of pool) {
    if (p.id === 'jordan-williams') continue // hand-written below
    const forced = (d.id === 'salesforce' && p.accessIssues.some((i) => i.kind === 'no_mfa')) ||
      (d.id === 'github' && GITHUB_OWNER_IDS.includes(p.id)) || p.id === app.ownerId
    const include = forced || d.scope === 'all' && (d.share ?? 1) >= 1 || grng() < (d.share ?? 1)
    if (!include) continue
    let role = pick(grng, dormantRoles)
    if (d.id === 'github' && GITHUB_OWNER_IDS.includes(p.id)) role = 'Owner'
    else if (p.id === app.ownerId || (p.department === 'IT & Security' && grng() < 0.5) || adminCandidates.has(p.id)) role = 'Admin'
    const used = grng() < 0.08 ? 60 + Math.floor(grng() * 90) : Math.floor(grng() * 21)
    grants.push({ personId: p.id, appId: d.id, role, lastUsedDaysAgo: used })
  }
}
// Jordan Williams — exactly four apps
for (const [appId, g] of Object.entries(jordanApps)) grants.push({ personId: 'jordan-williams', appId, role: g.role, lastUsedDaysAgo: g.used })
// Devon Park — contract ended Sep 12; Google still active and signed in 3 days ago
grants.push({ personId: 'devon-park', appId: 'google-workspace', role: 'Member', lastUsedDaysAgo: 3 })
grants.push({ personId: 'devon-park', appId: 'figma', role: 'Editor', lastUsedDaysAgo: 1 })
grants.push({ personId: 'devon-park', appId: 'notion', role: 'Guest', lastUsedDaysAgo: 11 })

export const accessGrants: AccessGrant[] = grants
const byApp = new Map<string, AccessGrant[]>()
const byPerson = new Map<string, AccessGrant[]>()
for (const g of grants) {
  ;(byApp.get(g.appId) ?? byApp.set(g.appId, []).get(g.appId)!).push(g)
  ;(byPerson.get(g.personId) ?? byPerson.set(g.personId, []).get(g.personId)!).push(g)
}
export const grantsForApp = (appId: string) => byApp.get(appId) ?? []
export const grantsForPerson = (personId: string) => byPerson.get(personId) ?? []
export const userCount = (appId: string) => grantsForApp(appId).length
export const allPeopleCount = people.length
export { peopleById }
