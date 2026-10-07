import type { Confidence, EntityRef, Severity, Task } from '@/data/types'

/** What Atlas AI knows how to say. Every answer is a structured object — never just a blob of text —
 *  so the UI can always show sources, confidence, caveats and next steps. */
export interface AiFinding { title: string; priority?: Severity; detail: string; entity: EntityRef }
export interface AiSource { label: string; system: string; syncedAgo: string; entity?: EntityRef }
export interface AiNextAction { label: string; to?: string; prompt?: string }

export interface TaskProposalItem { key: string; personId: string; managerId: string; name: string; dueDate: string; priority: Task['priority']; included: boolean }
export type ProposalStatus = 'proposed' | 'running' | 'done' | 'cancelled' | 'undone' | 'failed'
export interface ProposalLogEntry { at: string; text: string }
export interface TaskProposal {
  id: string
  kind: 'create_tasks'
  title: string
  summary: string
  riskId?: string
  items: TaskProposalItem[]
  status: ProposalStatus
  progress: number
  batchId?: string
  log: ProposalLogEntry[]
}

export interface AiResponse {
  headline: string
  body?: string
  findings?: AiFinding[]
  records?: EntityRef[]
  sources: AiSource[]
  confidence: Confidence
  caveat?: string
  nextActions: AiNextAction[]
  followUps?: string[]
  proposal?: TaskProposal
  /** Set when Atlas cannot answer. `outage` = service problem, `no_data` = not enough information. */
  error?: { kind: 'outage' | 'no_data'; message: string }
  thinking: string[]
}

export type MessageStatus = 'thinking' | 'streaming' | 'done' | 'stopped'
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text?: string
  question?: string
  status?: MessageStatus
  response?: AiResponse
  shown?: number // characters of headline+body revealed so far
  stepIndex?: number
  feedback?: 'up' | 'down'
}
export interface Thread { id: string; title: string; messages: ChatMessage[]; riskId?: string }
