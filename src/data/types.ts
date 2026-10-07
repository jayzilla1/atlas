/** Shared domain types. These mirror the data model in docs/ARCHITECTURE.md. */

export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type RiskStatus = 'open' | 'in_progress' | 'accepted' | 'resolved'
export type RiskCategory = 'Access' | 'Vendors' | 'People & training' | 'Policies' | 'Data protection' | 'Devices'
export type EntityType = 'person' | 'application' | 'vendor' | 'policy' | 'risk' | 'task'
export interface EntityRef { type: EntityType; id: string }

export type TrainingStatus = 'completed' | 'in_progress' | 'not_started' | 'overdue'
export type AccessReviewStatus = 'up_to_date' | 'needs_attention' | 'in_review'
export type PersonStatus = 'active' | 'on_leave' | 'former'

export interface AccessIssue {
  kind: 'former_user_access' | 'no_mfa' | 'unused_admin' | 'admin_unreviewed'
  appId: string
  text: string
  riskId?: string
}

export interface Person {
  id: string
  name: string
  email: string
  title: string
  department: string
  status: PersonStatus
  employmentType: 'Employee' | 'Contractor'
  managerId?: string
  location: string
  startDate: string
  endDate?: string
  training: { status: TrainingStatus; dueOn: string; completedOn?: string }
  accessReview: AccessReviewStatus
  mfaEnabled: boolean
  accessIssues: AccessIssue[]
}

export interface AccessGrant {
  personId: string
  appId: string
  role: string
  lastUsedDaysAgo: number
}

export type ConnectionStatus = 'connected' | 'needs_reauth' | 'sync_error' | 'manual'
export interface Application {
  id: string
  name: string
  category: string
  description: string
  ownerId: string
  status: 'active' | 'trial' | 'being_retired'
  connection: ConnectionStatus
  baselineRisk: Severity
  lastReview: string
  reviewCadenceDays: number
  ssoEnforced: boolean
  mfaEnforced: boolean
  dataSensitivity: 'Low' | 'Moderate' | 'High'
  vendorId?: string
}

export type DocStatus = 'valid' | 'expiring' | 'expired' | 'missing'
export interface Vendor {
  id: string
  name: string
  category: string
  description: string
  ownerId: string
  dataAccess: 'None' | 'Company data' | 'Employee data' | 'Customer data'
  baselineRisk: Severity
  reviewStatus: 'current' | 'due_soon' | 'overdue' | 'in_progress'
  lastReview: string
  nextReview: string
  contract: { status: 'active' | 'expiring' | 'expired' | 'in_negotiation'; start: string; end: string; annualValue: number }
  securityDoc: { type: string; status: DocStatus; expiresOn?: string }
  dpa: boolean
  appId?: string
}

export interface Policy {
  id: string
  name: string
  summary: string
  keyPoints: string[]
  ownerId: string
  status: 'published' | 'in_review' | 'draft' | 'needs_update'
  version: string
  lastUpdated: string
  nextReview: string
  ackRate: number // target acknowledgement share (0-1) used by the deterministic ack generator
  appliesTo: 'Everyone' | 'Engineering' | 'Managers' | 'Contractors'
}

export interface Evidence {
  label: string
  detail: string
  source: string
  sourceType: 'identity' | 'hr' | 'application' | 'vendor' | 'training' | 'policy' | 'device'
  observedAt: string
}
export interface ActivityEntry { at: string; actor: string; text: string; kind?: 'ai' | 'human' | 'system' }
export type Confidence = 'high' | 'medium' | 'needs_review'

export interface Risk {
  id: string
  name: string
  severity: Severity
  status: RiskStatus
  ownerId: string
  category: RiskCategory
  identifiedOn: string
  dueDate: string
  description: string
  why: string
  evidence: Evidence[]
  recommended: { summary: string; steps: string[]; effort: string }
  related: EntityRef[]
  confidence: Confidence
  confidenceNote?: string
  glossary: string[]
  activity: ActivityEntry[]
}

export type TaskStatus = 'not_started' | 'in_progress' | 'waiting' | 'completed'
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'
export interface Task {
  id: string
  name: string
  description?: string
  ownerId: string
  priority: TaskPriority
  status: TaskStatus
  dueDate: string
  riskId?: string
  entity?: EntityRef
  createdAt: string
  completedAt?: string
  createdBy?: 'ai' | 'human'
}

export interface ActivityEvent {
  id: string
  at: string
  actor: string
  actorId?: string
  text: string
  kind: 'human' | 'system' | 'ai'
  entity?: EntityRef
}

export interface GlossaryEntry {
  id: string
  term: string
  short: string // one sentence, shown in tooltips
  long: string // a few sentences, shown on the Help page
  example: string
  aka?: string[]
}
