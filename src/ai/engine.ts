/**
 * Atlas AI — simulated reasoning engine.
 *
 * There is no model behind this. It matches the *intent* of a question, then
 * builds an answer from the real mock records (so every number and link is
 * consistent with the rest of the product). What we ARE simulating faithfully is
 * the product design of a probabilistic system: confidence, sources, caveats,
 * "I don't know", outages, and propose-then-approve for anything that changes data.
 */
import type { Person, Risk, Severity, Task } from '@/data/types'
import { applications } from '@/data/applications'
import { vendors } from '@/data/vendors'
import { policies } from '@/data/policies'
import { HEALTH_AREAS, HEALTH_LAST_MONTH, HEALTH_SCORE } from '@/data/insights'
import { daysFromToday, offsetFromToday } from '@/utils/dates'
import { isOpenRisk } from '@/data/risks'
import { isReviewOutdated, SEVERITY_ORDER, severityRank, vendorsDueSoon } from '@/data/selectors'
import type { AiResponse, AiSource, TaskProposal } from './types'

export interface EngineContext { risks: Risk[]; tasks: Task[]; people: Person[]; riskId?: string; outage?: boolean; byId: (id?: string) => Person | undefined }

const src = {
  risks: (n: number): AiSource => ({ label: `${n} open risks`, system: 'Atlas · Risk register', syncedAgo: 'live' }),
  directory: { label: 'People directory', system: 'Northstar HR', syncedAgo: 'synced 2 hours ago' } as AiSource,
  identity: { label: 'Sign-in & MFA records', system: 'Okta · Google Workspace', syncedAgo: 'synced 2 hours ago' } as AiSource,
  training: { label: 'Training completions', system: 'Lumen Learning', syncedAgo: 'synced 3 hours ago' } as AiSource,
  vendorDocs: { label: 'Vendor documents & contracts', system: 'Atlas · Vendor register', syncedAgo: 'live' } as AiSource,
  access: { label: 'Access reviews', system: 'Atlas · Applications', syncedAgo: 'live' } as AiSource,
  policies: { label: 'Policy library', system: 'Atlas · Policies', syncedAgo: 'live' } as AiSource,
  health: { label: 'Health score history', system: 'Atlas · Reports', syncedAgo: 'updated nightly' } as AiSource,
  tasks: (n: number): AiSource => ({ label: `${n} open tasks`, system: 'Atlas · Tasks', syncedAgo: 'live' }),
}
const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w))
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

export const SUGGESTED_QUESTIONS = [
  'What are the biggest risks I should address this week?',
  'Which employees have access issues?',
  'Which vendors need attention?',
  'Why is our health score lower than last month?',
  'What should I prioritize today?',
  'Show me the risks related to former employees.',
  'Find employees who haven’t completed required security training and create tasks for their managers.',
]
export const RISK_QUESTIONS = ['Why does this matter?', 'What should I do first?', 'Who should own this?', 'How confident are you in this?']

export function missingTrainingPeople(people: Person[]) {
  return people.filter((p) => p.status !== 'former' && p.training.status !== 'completed')
}

function trainingProposal(people: Person[]): TaskProposal {
  const list = missingTrainingPeople(people).sort((a, b) => a.training.dueOn.localeCompare(b.training.dueOn))
  return {
    id: `prop-${Math.random().toString(36).slice(2, 8)}`, kind: 'create_tasks', riskId: 'R-107',
    title: `Create ${list.length} follow-up tasks`,
    summary: `One task per person, assigned to their manager, due ${offsetFromToday(7)}. Linked to risk R-107.`,
    items: list.map((p) => ({
      key: p.id, personId: p.id, managerId: p.managerId ?? 'aisha-rahman', included: true,
      name: `Ask ${p.name.split(' ')[0]} ${p.name.split(' ').slice(-1)[0]} to complete security awareness training`,
      dueDate: offsetFromToday(7), priority: p.training.status === 'overdue' ? 'high' : 'medium',
    })),
    status: 'proposed', progress: 0,
    log: [{ at: '09:30:02', text: `Searched ${people.filter((p) => p.status !== 'former').length} people for incomplete required training` }, { at: '09:30:03', text: `Found ${list.length} people and looked up each manager` }, { at: '09:30:04', text: 'Prepared tasks — nothing has been created yet' }],
  }
}

export function respond(question: string, ctx: EngineContext): AiResponse {
  const q = question.toLowerCase()
  const open = ctx.risks.filter(isOpenRisk)
  const done = (r: Omit<AiResponse, 'thinking'> & { thinking?: string[] }): AiResponse => ({ thinking: ['Reading your question…', 'Searching Atlas records…', 'Checking the evidence…'], ...r })

  if (ctx.outage) {
    return done({ headline: 'Atlas AI is temporarily unavailable.', sources: [], confidence: 'needs_review', nextActions: [], error: { kind: 'outage', message: 'We couldn’t reach the AI service. Nothing was changed. You can retry, or keep working — everything outside Atlas AI is unaffected.' } })
  }

  // ---- Scoped to a single risk (asked from the risk page) ------------------------------------------
  if (ctx.riskId) {
    const r = ctx.risks.find((x) => x.id === ctx.riskId)
    if (r) {
      const owner = ctx.byId(r.ownerId)
      const base = { sources: [{ label: r.id + ' evidence', system: r.evidence[0]?.source ?? 'Atlas', syncedAgo: 'live', entity: { type: 'risk' as const, id: r.id } }, src.risks(open.length)], thinking: [`Opening ${r.id}…`, `Reading ${r.evidence.length} pieces of evidence…`, 'Comparing with similar past risks…'] }
      if (has(q, 'why', 'matter', 'important'))
        return done({ ...base, headline: `This matters because ${r.why.charAt(0).toLowerCase() + r.why.slice(1)}`, body: `Atlas rated it ${r.severity}. ${r.description}`, confidence: r.confidence, caveat: r.confidenceNote, nextActions: [{ label: 'See recommended action' }], records: r.related.slice(0, 5) })
      if (has(q, 'first', 'do', 'fix', 'next', 'action', 'resolve'))
        return done({ ...base, headline: r.recommended.summary, body: `Suggested order: ${r.recommended.steps.map((s, i) => `${i + 1}) ${s.replace(/\.$/, '')}`).join('; ')}. Estimated effort: ${r.recommended.effort}.`, confidence: r.confidence === 'high' ? 'high' : 'medium', caveat: 'These steps are suggestions based on similar situations. Check the evidence first and use your judgement.', nextActions: [{ label: 'Create a task for step 1', prompt: '' }] })
      if (has(q, 'who', 'owner', 'assign'))
        return done({ ...base, headline: `${owner?.name ?? 'Nobody'} is the current owner${owner ? ` (${owner.title})` : ''}.`, body: `Atlas suggests the owner is whoever manages the affected system. ${r.related.length} records are connected to this risk — see “Related”.`, confidence: 'medium', caveat: 'Ownership is a judgement call; Atlas only knows who manages the related systems.', nextActions: [], records: owner ? [{ type: 'person', id: owner.id }] : [] })
      if (has(q, 'confiden', 'sure', 'certain', 'wrong'))
        return done({ ...base, headline: r.confidence === 'high' ? 'High confidence — several consistent records support this.' : r.confidence === 'medium' ? 'Medium confidence — the data is consistent, but one thing Atlas can’t verify.' : 'Low confidence — please verify before acting.', body: r.confidenceNote ?? `Atlas found ${r.evidence.length} matching records from ${new Set(r.evidence.map((e) => e.source)).size} systems. None of them disagree.`, confidence: r.confidence, nextActions: [] })
      return done({ ...base, headline: `${r.name} — ${r.severity} severity, ${r.status.replace('_', ' ')}.`, body: r.description, confidence: r.confidence, caveat: r.confidenceNote ?? 'Atlas found evidence suggesting this may require attention. Review the underlying records before taking action.', nextActions: [{ label: 'Why does this matter?', prompt: 'Why does this matter?' }, { label: 'What should I do first?', prompt: 'What should I do first?' }] })
    }
  }

  // ---- Agentic: find people missing training + create tasks ---------------------------------------------
  const missing = missingTrainingPeople(ctx.people)
  if (has(q, 'training', 'trained') && has(q, 'task', 'create', 'manager', 'remind', 'follow')) {
    const prop = trainingProposal(ctx.people)
    const mgrs = new Set(prop.items.map((i) => i.managerId)).size
    return done({
      thinking: ['Searching training completions…', `Matching ${missing.length} people to their managers…`, 'Drafting tasks for review…'],
      headline: `I found ${missing.length} employees who haven’t completed required security training.`,
      body: `They report to ${mgrs} managers. I’ve drafted one follow-up task per person, assigned to their manager. Nothing has been created yet — please review the list and approve.`,
      confidence: 'high', sources: [src.training, src.directory, { label: 'Security Awareness Policy', system: 'Atlas · Policies', syncedAgo: 'live', entity: { type: 'policy', id: 'security-awareness' } }],
      records: [{ type: 'risk', id: 'R-107' }], proposal: prop, nextActions: [], followUps: ['Which of them are overdue?'],
      caveat: 'Training data syncs every few hours. If someone finished today, they may still appear on this list — you can untick them before approving.',
    })
  }

  // ---- Training status ------------------------------------------------------------------------------
  if (has(q, 'training', 'trained', 'overdue training')) {
    const overdue = missing.filter((p) => p.training.status === 'overdue')
    return done({
      thinking: ['Searching training completions…', 'Counting overdue vs. in progress…'],
      headline: `${missing.length} of ${ctx.people.filter((p) => p.status !== 'former').length} people haven’t completed security training — ${overdue.length} are overdue.`,
      body: `${missing.filter((p) => p.training.status === 'in_progress').length} are partway through and ${missing.filter((p) => p.training.status === 'not_started').length} haven’t started (mostly new hires). That’s up from 11 last month.`,
      confidence: 'high', sources: [src.training, src.directory], records: [{ type: 'risk', id: 'R-107' }, ...missing.slice(0, 6).map((p) => ({ type: 'person' as const, id: p.id }))],
      nextActions: [{ label: 'Create follow-up tasks for their managers', prompt: 'Find employees who haven’t completed required security training and create tasks for their managers.' }, { label: 'Open the risk', to: '/risks/R-107' }],
    })
  }

  // ---- Biggest risks / prioritise ---------------------------------------------------------------------
  if (has(q, 'biggest risk', 'top risk', 'this week', 'prioriti', 'priority', 'today', 'focus', 'urgent', 'most important')) {
    const week = open.filter((r) => daysFromToday(r.dueDate) <= 7).sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || a.dueDate.localeCompare(b.dueDate)).slice(0, 3)
    const tasksToday = ctx.tasks.filter((t) => t.status !== 'completed' && daysFromToday(t.dueDate) <= 1)
    return done({
      thinking: ['Ranking open risks by severity…', 'Checking due dates…', 'Looking for overdue tasks…'],
      headline: `I found ${week.length} areas that deserve attention ${has(q, 'today') ? 'today' : 'this week'}.`,
      findings: week.map((r) => ({ title: r.name, priority: r.severity, detail: `${r.recommended.summary} Due in ${daysFromToday(r.dueDate)} days.`, entity: { type: 'risk' as const, id: r.id } })),
      body: `${tasksToday.length} tasks are due today or overdue — the most urgent is “${tasksToday.sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]?.name ?? 'none'}”.`,
      confidence: 'high', sources: [src.risks(open.length), src.tasks(ctx.tasks.filter((t) => t.status !== 'completed').length), src.identity],
      nextActions: [{ label: 'Open all critical risks', to: '/risks?severity=critical' }, { label: 'Why is the health score lower?', prompt: 'Why is our health score lower than last month?' }],
      caveat: 'Ranking uses severity and due date. Atlas can’t see business context — such as an upcoming customer audit — that might change your priorities.',
    })
  }

  // ---- Access issues ---------------------------------------------------------------------------------
  if (has(q, 'access issue', 'access problem', 'who has access', 'employees have access', 'mfa', 'multi-factor')) {
    const withIssues = ctx.people.filter((p) => p.accessIssues.length)
    const grp = (k: string) => withIssues.filter((p) => p.accessIssues.some((i) => i.kind === k))
    const f = [
      { k: 'former_user_access', t: 'Former contractor with an active account', pr: 'critical' as Severity, rid: 'R-101', d: 'Contract ended Sep 12; Google Workspace is still active.' },
      { k: 'no_mfa', t: 'Salesforce users without multi-factor authentication', pr: 'high' as Severity, rid: 'R-104', d: 'These accounts are protected by a password only.' },
      { k: 'admin_unreviewed', t: 'GitHub owners whose admin rights weren’t reviewed', pr: 'high' as Severity, rid: 'R-103', d: 'Last review was 276 days ago.' },
      { k: 'unused_admin', t: 'Admin rights that aren’t being used', pr: 'medium' as Severity, rid: '', d: 'Jordan Williams has Salesforce admin access, last used as admin 142 days ago.' },
    ].filter((x) => grp(x.k).length)
    return done({
      thinking: ['Checking sign-in and MFA records…', 'Comparing accounts with HR status…', 'Looking for unused admin rights…'],
      headline: `${withIssues.length} people have access issues, in ${f.length} groups.`,
      findings: f.map((x) => ({ title: `${grp(x.k).length} · ${x.t}`, priority: x.pr, detail: x.d, entity: x.rid ? { type: 'risk' as const, id: x.rid } : { type: 'person' as const, id: grp(x.k)[0].id } })),
      records: withIssues.slice(0, 8).map((p) => ({ type: 'person' as const, id: p.id })),
      confidence: 'medium', sources: [src.identity, src.directory, src.access],
      caveat: 'Atlas can see who has access, but not whether each person still needs it. “Unused admin rights” is an inference from sign-in history — confirm with the person’s manager.',
      nextActions: [{ label: 'Open Jordan Williams’ access review', to: '/people/jordan-williams' }, { label: 'View all access risks', to: '/risks?category=Access' }],
    })
  }

  // ---- Former employees ----------------------------------------------------------------------------------
  if (has(q, 'former', 'ex-employee', 'left the company', 'leaver', 'offboard', 'contractor')) {
    const rel = open.filter((r) => r.glossary.includes('offboarding') || r.related.some((x) => x.type === 'person' && ctx.byId(x.id)?.status === 'former'))
    const formerPeople = ctx.people.filter((p) => p.status === 'former')
    return done({
      thinking: ['Finding people marked as former…', 'Comparing with active accounts…'],
      headline: `${rel.length === 1 ? '1 open risk relates' : `${rel.length} open risks relate`} to former employees or contractors.`,
      findings: rel.map((r) => ({ title: r.name, priority: r.severity, detail: r.description, entity: { type: 'risk' as const, id: r.id } })),
      body: `Atlas checked all ${formerPeople.length} people who left in the last 90 days. The other ${formerPeople.length - 1} were fully offboarded — no active accounts found.`,
      records: formerPeople.map((p) => ({ type: 'person' as const, id: p.id })),
      confidence: 'high', sources: [src.directory, src.identity, src.risks(open.length)],
      nextActions: [{ label: 'Open risk R-101', to: '/risks/R-101' }, { label: 'Open Devon Park', to: '/people/devon-park' }],
    })
  }

  // ---- Vendors -----------------------------------------------------------------------------------------------
  if (has(q, 'vendor', 'supplier', 'third party', 'third-party')) {
    const bad = vendors.filter((v) => v.securityDoc.status === 'expired' || v.securityDoc.status === 'expiring' || v.reviewStatus === 'overdue' || (v.contract.status !== 'active' && v.dataAccess !== 'None') || (!v.dpa && v.dataAccess === 'Employee data')).slice(0, 6)
    const soon = vendorsDueSoon()
    return done({
      thinking: ['Checking 31 vendors…', 'Looking at security documents…', 'Checking review dates…'],
      headline: `${bad.length} vendors need attention, and ${soon.length} reviews are due in the next 30 days.`,
      findings: bad.map((v) => ({ title: v.name, priority: v.securityDoc.status === 'expired' || v.reviewStatus === 'overdue' ? ('critical' as Severity) : ('medium' as Severity), detail: v.securityDoc.status === 'expired' ? 'Security report has expired and the review is overdue.' : v.securityDoc.status === 'expiring' ? `Security report expires ${v.securityDoc.expiresOn}.` : !v.dpa ? 'No signed data processing agreement on file.' : `Contract ${v.contract.status.replace('_', ' ')}.`, entity: { type: 'vendor' as const, id: v.id } })),
      confidence: 'high', sources: [src.vendorDocs, src.risks(open.length)],
      caveat: 'Atlas only reads documents uploaded to the vendor register. A document stored elsewhere (such as an email) would not appear here.',
      nextActions: [{ label: 'Open the Vendors list', to: '/vendors' }, { label: 'Open risk R-102', to: '/risks/R-102' }],
    })
  }

  // ---- Health score ------------------------------------------------------------------------------------------------
  if (has(q, 'health', 'score')) {
    const diffs = [...HEALTH_AREAS].map((a) => ({ a, d: a.now - a.lastMonth })).sort((x, y) => x.d - y.d)
    return done({
      thinking: ['Comparing this month with last month…', 'Finding the biggest drops…', 'Linking drops to open risks…'],
      headline: `Your health score is ${HEALTH_SCORE}, down ${HEALTH_LAST_MONTH - HEALTH_SCORE} from ${HEALTH_LAST_MONTH} last month.`,
      body: `Most of the drop comes from ${diffs[0].a.label.toLowerCase()} (${diffs[0].d}) and ${diffs[1].a.label.toLowerCase()} (${diffs[1].d}). Policies didn’t change.`,
      findings: diffs.filter((x) => x.d < 0).slice(0, 3).map((x) => ({
        title: `${x.a.label}: ${x.a.lastMonth} → ${x.a.now}`, priority: x.d <= -8 ? 'high' as Severity : 'medium' as Severity,
        detail: x.a.id === 'access' ? 'A former contractor account, 9 users without MFA and 4 overdue access reviews.' : x.a.id === 'vendors' ? 'An expired payroll security report and 7 reviews coming due.' : x.a.id === 'people' ? '14 people incomplete on security training (up from 11).' : 'Three controls now need attention.',
        entity: { type: 'risk' as const, id: x.a.id === 'access' ? 'R-101' : x.a.id === 'vendors' ? 'R-102' : x.a.id === 'people' ? 'R-107' : 'R-109' },
      })),
      confidence: 'medium', sources: [src.health, src.risks(open.length), src.training],
      caveat: 'The score is a weighted summary of five areas. It shows where to look, but a lower number doesn’t mean something is broken — and a high number doesn’t guarantee you’re safe.',
      nextActions: [{ label: 'See score breakdown in Reports', to: '/reports' }],
    })
  }

  // ---- Applications ------------------------------------------------------------------------------------------------------
  if (has(q, 'application', ' app', 'apps', 'software', 'access review')) {
    const out = applications.filter(isReviewOutdated)
    return done({
      thinking: ['Checking 73 applications…', 'Looking at review dates…'],
      headline: `${out.length} applications are overdue for an access review.`,
      findings: out.map((a) => ({ title: a.name, priority: 'medium' as Severity, detail: `Last reviewed ${-daysFromToday(a.lastReview)} days ago (policy: every 180 days).`, entity: { type: 'application' as const, id: a.id } })),
      confidence: 'high', sources: [src.access, src.policies], nextActions: [{ label: 'Open risk R-109', to: '/risks/R-109' }],
    })
  }

  // ---- Tasks -------------------------------------------------------------------------------------------------------------------
  if (has(q, 'task', 'overdue', 'to-do', 'todo')) {
    const o = ctx.tasks.filter((t) => t.status !== 'completed')
    const od = o.filter((t) => daysFromToday(t.dueDate) < 0)
    return done({
      thinking: ['Reading open tasks…'], headline: `You have ${plural(o.length, 'open task')}; ${od.length} ${od.length === 1 ? 'is' : 'are'} overdue.`,
      findings: od.map((t) => ({ title: t.name, priority: 'medium' as Severity, detail: `Was due ${t.dueDate}.`, entity: { type: 'task' as const, id: t.id } })),
      confidence: 'high', sources: [src.tasks(o.length)], nextActions: [{ label: 'Open Tasks', to: '/tasks' }],
    })
  }

  // ---- Policies / audit ----------------------------------------------------------------------------------------------------------
  if (has(q, 'audit', 'compliance', 'ready', 'soc')) {
    return done({
      thinking: ['Checking 42 controls…', 'Counting failing controls…'],
      headline: '36 of 42 compliance controls are passing — 2 are failing and 4 need attention.',
      body: 'I can show you what an auditor would likely flag today, but I can’t predict whether you’ll pass an audit.',
      records: [{ type: 'risk', id: 'R-101' }, { type: 'risk', id: 'R-103' }],
      confidence: 'needs_review', sources: [{ label: '42 compliance controls', system: 'Atlas · Reports', syncedAgo: 'checked nightly' }, src.policies],
      caveat: 'Atlas only sees evidence in connected systems, and auditors use their own judgement. Treat this as a preparation checklist, not a prediction.',
      nextActions: [{ label: 'View controls', to: '/reports' }],
    })
  }
  if (has(q, 'policy', 'policies')) {
    const stale = policies.filter((p) => daysFromToday(p.nextReview) < 0 || p.status === 'needs_update')
    return done({ thinking: ['Reading 18 policies…'], headline: `${stale.length} ${stale.length === 1 ? 'policy needs' : 'policies need'} review.`, findings: stale.map((p) => ({ title: p.name, priority: 'medium' as Severity, detail: `Review date was ${p.nextReview}.`, entity: { type: 'policy' as const, id: p.id } })), confidence: 'high', sources: [src.policies], nextActions: [{ label: 'Open Policies', to: '/policies' }] })
  }

  if (has(q, 'what can you', 'help', 'hello', 'hi ', 'who are you', 'capabilities')) {
    return done({
      headline: 'I can answer questions about your risks, people, applications, vendors, policies and tasks — and prepare work for your approval.',
      body: 'Every answer shows its sources and how confident I am. I never change anything without asking you first, and anything I create can be undone.',
      confidence: 'high', sources: [src.risks(open.length), src.directory], nextActions: SUGGESTED_QUESTIONS.slice(0, 3).map((s) => ({ label: s, prompt: s })),
    })
  }

  // ---- Fallback: honest "I don’t know" ----------------------------------------------------------------------------------------
  return done({
    headline: 'I couldn’t find enough information to answer this confidently.',
    body: 'I can only answer from the records connected to Atlas — risks, people, applications, vendors, policies and tasks. Nothing I searched matched your question closely enough, and I’d rather say so than guess.',
    confidence: 'needs_review', sources: [src.risks(open.length), src.directory, src.vendorDocs],
    error: { kind: 'no_data', message: 'Try asking about a specific risk, person, vendor or application.' },
    nextActions: SUGGESTED_QUESTIONS.slice(0, 4).map((s) => ({ label: s, prompt: s })),
  })
}

export const severityOrder = SEVERITY_ORDER
