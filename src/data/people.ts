import type { AccessIssue, Person, TrainingStatus } from './types'
import { mulberry32, pick } from '@/utils/random'
import { addDays, offsetFromToday } from '@/utils/dates'
import { TODAY_ISO } from './clock'

/**
 * Harborlight Software — 248 current people (employees + contractors) and 4
 * former. A small hand-written cast carries the story; the rest are generated
 * deterministically so the directory feels like a real company.
 *
 * Story facts baked in here (and referenced by risks/AI):
 *  - exactly 14 people are missing required security training
 *  - exactly 9 Salesforce users have MFA switched off
 *  - Devon Park (contractor) left on Sep 12 but still has Google Workspace
 *  - Jordan Williams has Salesforce admin rights he hasn't used in 142 days
 */

interface Seed {
  id: string; name: string; title: string; department: string
  managerId?: string; type?: 'Employee' | 'Contractor'; location?: string; start?: string
}

export const CURRENT_USER_ID = 'maya-okafor'

const CAST: Seed[] = [
  { id: 'rachel-thompson', name: 'Rachel Thompson', title: 'Chief Executive Officer', department: 'Executive', location: 'Austin, TX', start: '2018-03-12' },
  { id: 'david-kim', name: 'David Kim', title: 'Chief Technology Officer', department: 'Executive', managerId: 'rachel-thompson', location: 'Austin, TX', start: '2018-03-12' },
  { id: 'elena-vasquez', name: 'Elena Vasquez', title: 'Chief Financial Officer', department: 'Executive', managerId: 'rachel-thompson', location: 'New York, NY', start: '2019-06-03' },
  { id: 'tomas-ibarra', name: 'Tomás Ibarra', title: 'Chief Revenue Officer', department: 'Executive', managerId: 'rachel-thompson', location: 'Denver, CO', start: '2020-01-13' },
  { id: 'marcus-lee', name: 'Marcus Lee', title: 'VP of Engineering', department: 'Engineering', managerId: 'david-kim', location: 'Austin, TX', start: '2018-09-17' },
  { id: 'sarah-chen', name: 'Sarah Chen', title: 'Engineering Manager', department: 'Engineering', managerId: 'marcus-lee', location: 'Remote — US', start: '2020-04-06' },
  { id: 'sofia-lindqvist', name: 'Sofia Lindqvist', title: 'Head of Product', department: 'Product', managerId: 'david-kim', location: 'London, UK', start: '2019-02-25' },
  { id: 'jordan-williams', name: 'Jordan Williams', title: 'Product Manager', department: 'Product', managerId: 'sofia-lindqvist', location: 'Austin, TX', start: '2021-05-17' },
  { id: 'hannah-muller', name: 'Hannah Müller', title: 'Head of Design', department: 'Design', managerId: 'sofia-lindqvist', location: 'Berlin, DE', start: '2020-08-31' },
  { id: 'camila-reyes', name: 'Camila Reyes', title: 'Head of Customer Success', department: 'Customer Success', managerId: 'tomas-ibarra', location: 'Denver, CO', start: '2020-10-05' },
  { id: 'owen-brooks', name: 'Owen Brooks', title: 'Head of Support', department: 'Support', managerId: 'camila-reyes', location: 'Remote — US', start: '2021-01-11' },
  { id: 'ben-whitaker', name: 'Ben Whitaker', title: 'Head of Marketing', department: 'Marketing', managerId: 'tomas-ibarra', location: 'New York, NY', start: '2021-03-01' },
  { id: 'aisha-rahman', name: 'Aisha Rahman', title: 'Director of People', department: 'People', managerId: 'rachel-thompson', location: 'Austin, TX', start: '2019-09-09' },
  { id: 'nina-petrov', name: 'Nina Petrov', title: 'General Counsel', department: 'Legal', managerId: 'rachel-thompson', location: 'New York, NY', start: '2020-02-17' },
  { id: 'priya-raman', name: 'Priya Raman', title: 'IT & Security Lead', department: 'IT & Security', managerId: 'david-kim', location: 'Austin, TX', start: '2019-11-04' },
  { id: 'maya-okafor', name: 'Maya Okafor', title: 'Security & Operations Manager', department: 'Operations', managerId: 'elena-vasquez', location: 'Austin, TX', start: '2021-07-12' },
]

const DEPARTMENTS: { name: string; count: number; head: string; mgrTitle?: string; titles: string[] }[] = [
  { name: 'Executive', count: 4, head: 'rachel-thompson', titles: [] },
  { name: 'Engineering', count: 82, head: 'marcus-lee', mgrTitle: 'Engineering Manager', titles: ['Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Site Reliability Engineer', 'QA Engineer', 'Data Engineer', 'Frontend Engineer', 'Backend Engineer'] },
  { name: 'Product', count: 18, head: 'sofia-lindqvist', mgrTitle: 'Group Product Manager', titles: ['Product Manager', 'Senior Product Manager', 'Product Analyst', 'Technical Program Manager'] },
  { name: 'Design', count: 12, head: 'hannah-muller', titles: ['Product Designer', 'Senior Product Designer', 'UX Researcher', 'Brand Designer', 'Content Designer'] },
  { name: 'Sales', count: 34, head: 'tomas-ibarra', mgrTitle: 'Sales Manager', titles: ['Account Executive', 'Senior Account Executive', 'Sales Development Rep', 'Solutions Engineer', 'Sales Operations Analyst'] },
  { name: 'Customer Success', count: 22, head: 'camila-reyes', mgrTitle: 'Customer Success Manager II', titles: ['Customer Success Manager', 'Onboarding Specialist', 'Renewals Manager'] },
  { name: 'Support', count: 20, head: 'owen-brooks', mgrTitle: 'Support Team Lead', titles: ['Support Specialist', 'Senior Support Specialist', 'Support Engineer'] },
  { name: 'Marketing', count: 16, head: 'ben-whitaker', titles: ['Content Marketer', 'Demand Generation Manager', 'Product Marketing Manager', 'Marketing Operations Specialist', 'Events Manager'] },
  { name: 'Finance', count: 10, head: 'elena-vasquez', titles: ['Accountant', 'Senior Accountant', 'Financial Analyst', 'Accounts Payable Specialist', 'Controller'] },
  { name: 'People', count: 8, head: 'aisha-rahman', titles: ['People Partner', 'Recruiter', 'Talent Coordinator', 'Compensation Analyst', 'Learning & Development Lead'] },
  { name: 'Legal', count: 4, head: 'nina-petrov', titles: ['Corporate Counsel', 'Paralegal', 'Privacy Counsel'] },
  { name: 'IT & Security', count: 8, head: 'priya-raman', titles: ['IT Support Engineer', 'Security Engineer', 'Systems Administrator', 'Compliance Analyst'] },
  { name: 'Operations', count: 10, head: 'maya-okafor', titles: ['Operations Analyst', 'Business Operations Manager', 'Workplace Coordinator', 'Procurement Specialist', 'Program Manager'] },
]

const FIRST = ['Aaliyah','Adrian','Akira','Alejandro','Amara','Andre','Anika','Arjun','Astrid','Beatrice','Caleb','Carmen','Chidi','Clara','Dana','Dario','Dmitri','Eleni','Emeka','Esther','Farah','Felix','Freya','Gabriel','Gita','Hugo','Imani','Isla','Ivan','Jasmine','Jonah','Kai','Kavya','Keiko','Lars','Layla','Leo','Lucia','Mateo','Mei','Mila','Nadia','Naveen','Noor','Olivia','Pablo','Quinn','Rafael','Rhea','Ravi','Sade','Samir','Saoirse','Soren','Tamsin','Theo','Uma','Valentina','Wes','Xavier','Yara','Yusuf','Zara','Zane','Ingrid','Tobias','Leila','Marisol','Hiro','Anneke','Callum','Dev','Elif','Finn']
const LAST = ['Abara','Alvarez','Andersson','Bianchi','Bose','Brennan','Castillo','Chaudhry','Dubois','Eriksen','Fitzgerald','Gallagher','Haddad','Hoang','Ito','Jankowski','Kapoor','Kowalski','Lindgren','Madrigal','Mbeki','Nakamura','Novak','Okonkwo','Olsen','Pereira','Quintero','Rosen','Sandoval','Sato','Schmidt','Silva','Soto','Takahashi','Tan','Thorne','Underwood','Varga','Vega','Walsh','Yamamoto','Zhou','Abernathy','Barros','Calloway','Delgado','Espinoza','Fairbanks','Gutierrez','Hartman','Iyer','Jensen','Kaplan','Lombardi','Moreau','Nwosu','Oyelaran','Prescott','Rahimi','Stavros','Tremblay','Volkov','Whitfield','Yilmaz','Zielinski']
const LOCATIONS = ['Austin, TX', 'Remote — US', 'New York, NY', 'Denver, CO', 'London, UK', 'Toronto, CA', 'Berlin, DE', 'Remote — US', 'Austin, TX']

const rng = mulberry32(20261007)
const used = new Set(CAST.map((c) => c.name))
function uniqueName(i: number) {
  let n = 0
  for (;;) {
    const f = FIRST[(i * 7 + n) % FIRST.length]
    const l = LAST[(i * 11 + Math.floor((i * 7 + n) / FIRST.length) * 5 + n * 3) % LAST.length]
    const name = `${f} ${l}`
    if (!used.has(name)) { used.add(name); return name }
    n++
  }
}
const slugOf = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '-').replace(/(^-|-$)/g, '')

function emailOf(name: string) {
  const [f, ...rest] = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(' ')
  return `${f}.${rest.join('').replace(/[^a-z]/g, '')}@harborlight.example`
}

const seeds: Seed[] = [...CAST]
let counter = 0
for (const dept of DEPARTMENTS) {
  const have = seeds.filter((s) => s.department === dept.name).length
  const toMake = dept.count - have
  const managersNeeded = dept.mgrTitle ? Math.max(0, Math.round(dept.count / 9) - seeds.filter((s) => s.department === dept.name && s.title.includes('Manager')).length) : 0
  const mgrIds: string[] = seeds.filter((s) => s.department === dept.name && /Manager|Lead/.test(s.title) && s.id !== dept.head).map((s) => s.id)
  for (let k = 0; k < toMake; k++) {
    const isMgr = k < managersNeeded
    const name = uniqueName(++counter)
    const id = slugOf(name)
    const s: Seed = {
      id, name, department: dept.name,
      title: isMgr ? dept.mgrTitle! : pick(rng, dept.titles),
      managerId: isMgr ? dept.head : mgrIds.length && rng() > 0.15 ? mgrIds[k % mgrIds.length] : dept.head,
      location: pick(rng, LOCATIONS),
      type: rng() < 0.05 && !isMgr ? 'Contractor' : 'Employee',
    }
    if (isMgr) mgrIds.push(id)
    seeds.push(s)
  }
}

function startDateFor(i: number) {
  const y = 2019 + Math.floor(rng() * 7.6)
  const m = 1 + Math.floor(rng() * 12)
  const d = 1 + Math.floor(rng() * 27)
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  return iso > '2026-09-20' ? `2026-0${3 + (i % 5)}-1${i % 9}` : iso
}

const basePeople: Person[] = seeds.map((s, i) => {
  const completedOn = addDays(TODAY_ISO, -Math.floor(20 + rng() * 280))
  const isLeave = rng() < 0.025 && !CAST.some((c) => c.id === s.id)
  return {
    id: s.id,
    name: s.name,
    email: emailOf(s.name),
    title: s.title,
    department: s.department,
    status: isLeave ? 'on_leave' : 'active',
    employmentType: s.type ?? 'Employee',
    managerId: s.managerId,
    location: s.location ?? pick(rng, LOCATIONS),
    startDate: s.start ?? startDateFor(i),
    training: { status: 'completed' as TrainingStatus, completedOn, dueOn: addDays(completedOn, 365) },
    accessReview: 'up_to_date',
    mfaEnabled: true,
    accessIssues: [],
  }
})

const byId = new Map(basePeople.map((p) => [p.id, p]))
const CAST_IDS = new Set(CAST.map((c) => c.id))
const generated = basePeople.filter((p) => !CAST_IDS.has(p.id) && p.status === 'active')
const isManager = new Set(basePeople.map((p) => p.managerId).filter(Boolean) as string[])

// --- Story: exactly 14 people missing required training --------------------------------------
const trainingPool = generated.filter((p) => !isManager.has(p.id) && p.department !== 'Sales')
const shuffled = [...trainingPool].sort(() => rng() - 0.5)
const trainingProfiles: { status: TrainingStatus; dueOffset: number }[] = [
  { status: 'overdue', dueOffset: -34 }, { status: 'overdue', dueOffset: -21 }, { status: 'overdue', dueOffset: -19 },
  { status: 'overdue', dueOffset: -12 }, { status: 'overdue', dueOffset: -9 }, { status: 'overdue', dueOffset: -4 },
  { status: 'in_progress', dueOffset: -2 }, { status: 'in_progress', dueOffset: 3 }, { status: 'in_progress', dueOffset: 6 },
  { status: 'in_progress', dueOffset: 9 }, { status: 'in_progress', dueOffset: 12 },
  { status: 'not_started', dueOffset: 5 }, { status: 'not_started', dueOffset: 11 }, { status: 'not_started', dueOffset: 14 },
]
trainingProfiles.forEach((tp, i) => {
  const p = shuffled[i]
  p.training = { status: tp.status, dueOn: offsetFromToday(tp.dueOffset) }
  if (tp.status === 'not_started') p.startDate = offsetFromToday(-20 - i) // new hires
})

// --- Story: 9 Salesforce users without MFA ---------------------------------------------------
const salesPool = generated.filter((p) => p.department === 'Sales' && !isManager.has(p.id))
const noMfa = salesPool.slice(0, 9)
noMfa.forEach((p) => {
  p.mfaEnabled = false
  p.accessReview = 'needs_attention'
  p.accessIssues.push({ kind: 'no_mfa', appId: 'salesforce', text: 'Signs in to Salesforce with a password only (no second check).', riskId: 'R-104' })
})

// --- Story: Sarah Chen finished training recently (appears in activity feed) ------------------
const sarah = byId.get('sarah-chen')!
sarah.training = { status: 'completed', completedOn: addDays(TODAY_ISO, -2), dueOn: addDays(TODAY_ISO, 363) }

// --- Story: Jordan Williams ------------------------------------------------------------------
const jordan = byId.get('jordan-williams')!
jordan.training = { status: 'completed', completedOn: addDays(TODAY_ISO, -118), dueOn: addDays(TODAY_ISO, 247) }
jordan.accessReview = 'needs_attention'
jordan.accessIssues.push({
  kind: 'unused_admin', appId: 'salesforce',
  text: 'Has Salesforce admin rights but hasn’t signed in as an admin for 142 days.',
})

// --- Story: GitHub owners that were never re-reviewed ----------------------------------------
const ghOwners = [byId.get('marcus-lee')!, byId.get('sarah-chen')!, generated.find((p) => p.department === 'Engineering' && p.title.includes('Staff'))!]
ghOwners.forEach((p) => {
  p.accessReview = 'needs_attention'
  p.accessIssues.push({ kind: 'admin_unreviewed', appId: 'github', text: 'Is an owner of the GitHub organization; admin rights were last reviewed 9 months ago.', riskId: 'R-103' })
})
export const GITHUB_OWNER_IDS = ghOwners.map((p) => p.id)

// A few people mid-review for realism
generated.filter((p) => p.accessReview === 'up_to_date' && p.department === 'Finance').slice(0, 2).forEach((p) => (p.accessReview = 'in_review'))

// --- Former people ---------------------------------------------------------------------------
const former = (seed: Seed & { end: string; issues?: AccessIssue[] }): Person => ({
  id: seed.id, name: seed.name, email: emailOf(seed.name), title: seed.title, department: seed.department, status: 'former',
  employmentType: seed.type ?? 'Employee', managerId: seed.managerId, location: seed.location ?? 'Remote — US',
  startDate: seed.start ?? '2022-01-10', endDate: seed.end,
  training: { status: 'completed', completedOn: '2025-11-12', dueOn: '2026-11-12' },
  accessReview: seed.issues?.length ? 'needs_attention' : 'up_to_date', mfaEnabled: true, accessIssues: seed.issues ?? [],
})
const formerPeople: Person[] = [
  former({
    id: 'devon-park', name: 'Devon Park', title: 'Contract Product Designer', department: 'Design', managerId: 'hannah-muller',
    type: 'Contractor', start: '2025-11-03', end: '2026-09-12', location: 'Remote — US',
    issues: [{ kind: 'former_user_access', appId: 'google-workspace', text: 'Contract ended Sep 12 but the Google Workspace account is still active.', riskId: 'R-101' }],
  }),
  former({ id: 'liam-foster', name: 'Liam Foster', title: 'Account Executive', department: 'Sales', managerId: 'tomas-ibarra', start: '2022-02-14', end: '2026-08-21' }),
  former({ id: 'grace-nakamura-former', name: 'Grace Nakamura', title: 'Backend Engineer', department: 'Engineering', managerId: 'sarah-chen', start: '2021-06-07', end: '2026-07-03' }),
  former({ id: 'omar-haddad', name: 'Omar Haddad', title: 'Support Specialist', department: 'Support', managerId: 'owen-brooks', start: '2023-04-17', end: '2026-09-30', type: 'Contractor' }),
]

export const people: Person[] = [...basePeople, ...formerPeople]
export const peopleById = new Map(people.map((p) => [p.id, p]))
export const getPerson = (id?: string) => (id ? peopleById.get(id) : undefined)
export const currentPeople = people.filter((p) => p.status !== 'former')
export const DEPARTMENT_NAMES = DEPARTMENTS.map((d) => d.name)
export const missingTraining = () => currentPeople.filter((p) => p.training.status !== 'completed')
