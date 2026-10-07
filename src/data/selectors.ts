/**
 * Derived facts about the workspace. Every number shown in the UI (and quoted by
 * Atlas AI) comes from here, so a dashboard figure always equals the list behind it.
 * These take live state (tasks/risks that can change) as arguments where needed.
 */
import type { Application, Risk, Severity, Task, Vendor } from './types'
import { applications, userCount } from './applications'
import { vendors } from './vendors'
import { policies } from './policies'
import { currentPeople, people, missingTraining } from './people'
import { daysFromToday } from '@/utils/dates'
import { isOpenRisk } from './risks'
import { CONTROLS } from './insights'

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low']
export const severityRank = (s: Severity) => SEVERITY_ORDER.indexOf(s)
export const maxSeverity = (a: Severity, b: Severity): Severity => (severityRank(a) <= severityRank(b) ? a : b)

export const openRisks = (risks: Risk[]) => risks.filter(isOpenRisk)
export const countBySeverity = (risks: Risk[]) =>
  SEVERITY_ORDER.reduce((acc, s) => ({ ...acc, [s]: openRisks(risks).filter((r) => r.severity === s).length }), {} as Record<Severity, number>)

export const outstandingTasks = (tasks: Task[]) => tasks.filter((t) => t.status !== 'completed')
export const overdueTasks = (tasks: Task[]) => outstandingTasks(tasks).filter((t) => daysFromToday(t.dueDate) < 0)

/** Effective risk level of an entity = the worse of its baseline and its open risks. */
export function entityRiskLevel(type: 'application' | 'vendor', id: string, baseline: Severity, risks: Risk[]): Severity {
  return openRisks(risks)
    .filter((r) => r.related.some((x) => x.type === type && x.id === id))
    .reduce<Severity>((acc, r) => maxSeverity(acc, r.severity), baseline)
}

export const daysSinceReview = (a: Application) => -daysFromToday(a.lastReview)
export const isReviewOutdated = (a: Application) => daysSinceReview(a) > a.reviewCadenceDays
export const outdatedReviewApps = () => applications.filter(isReviewOutdated)
export const vendorReviewDueSoon = (v: Vendor) => { const n = daysFromToday(v.nextReview); return n >= 0 && n <= 30 }
export const vendorsDueSoon = () => vendors.filter(vendorReviewDueSoon)

export function companyFacts(risks: Risk[], tasks: Task[]) {
  const open = openRisks(risks)
  const bySeverity = countBySeverity(risks)
  return {
    employees: currentPeople.length,
    applications: applications.length,
    vendors: vendors.length,
    policies: policies.length,
    controls: CONTROLS.length,
    controlsPassing: CONTROLS.filter((c) => c.state === 'passing').length,
    openRisks: open.length,
    bySeverity,
    outstandingTasks: outstandingTasks(tasks).length,
    overdueTasks: overdueTasks(tasks).length,
    missingTraining: missingTraining().length,
    vendorsDueSoon: vendorsDueSoon().length,
    outdatedReviews: outdatedReviewApps().length,
    formerPeopleWithAccess: people.filter((p) => p.status === 'former' && p.accessIssues.some((i) => i.kind === 'former_user_access')).length,
    appsNeedingConnection: applications.filter((a) => a.connection === 'needs_reauth' || a.connection === 'sync_error').length,
  }
}
export { userCount }
