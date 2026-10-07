import { Link } from 'react-router-dom'
import { CheckCircle2, Lock, Undo2, ListChecks, XCircle } from 'lucide-react'
import type { TaskProposal } from '@/ai/types'
import { useAssistant } from '@/ai/AssistantContext'
import { useStore } from '@/state/store'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Form'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/Feedback'
import { Callout, Disclosure } from '@/components/ui/Card'
import { Term } from '@/components/ui/Tooltip'
import { AiBadge } from './AiParts'
import { formatDateShort } from '@/utils/dates'

/**
 * AiActionCard — the human-in-the-loop pattern.
 *   proposed  → “Review before creating” (nothing has happened; every row can be unticked)
 *   running   → visible progress
 *   done      → result + Undo + activity log
 *   cancelled / undone → clear statement that nothing (or nothing remaining) changed
 */
export function AiActionCard({ threadId, messageId, proposal }: { threadId: string; messageId: string; proposal: TaskProposal }) {
  const a = useAssistant()
  const { personById, permission } = useStore()
  const perm = permission('ai.approve')
  const chosen = proposal.items.filter((i) => i.included)
  const managers = new Set(chosen.map((i) => i.managerId)).size
  const locked = proposal.status !== 'proposed'

  return (
    <section aria-label="Proposed action" data-ds="AiActionCard" data-ds-variant={proposal.status} className="overflow-hidden rounded-lg border border-ai-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ai-border bg-ai-subtle px-4 py-2.5">
        <AiBadge label="Proposed action" />
        {proposal.status === 'proposed' && <Badge tone="warning" icon={<Lock />}>Needs your approval</Badge>}
        {proposal.status === 'running' && <Badge tone="info">Creating…</Badge>}
        {proposal.status === 'done' && <StatusBadge status="completed" label="Done" />}
        {proposal.status === 'cancelled' && <Badge tone="neutral" icon={<XCircle />}>Cancelled</Badge>}
        {proposal.status === 'undone' && <Badge tone="neutral" icon={<Undo2 />}>Undone</Badge>}
      </div>

      <div className="p-4">
        {proposal.status === 'proposed' && (
          <>
            <h3 className="text-title-3">Review before creating</h3>
            <p className="mt-1 text-body text-ink-secondary">{proposal.summary} Untick anyone you don’t want a task for.</p>
          </>
        )}
        {proposal.status === 'running' && (
          <>
            <h3 className="text-title-3">Creating {chosen.length} tasks…</h3>
            <ProgressBar className="mt-3" tone="ai" value={proposal.progress} max={chosen.length} label="Creating tasks" />
            <p className="mt-2 text-body-sm text-ink-secondary" role="status">{proposal.progress} of {chosen.length} created</p>
          </>
        )}
        {proposal.status === 'done' && (
          <Callout tone="success" role="status" title={`${chosen.length} tasks created.`}
            actions={<><Link to="/tasks" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 text-body-sm font-medium hover:bg-hover"><ListChecks className="h-4 w-4" aria-hidden />View in Tasks</Link>
              <Button size="sm" iconLeft={<Undo2 className="h-4 w-4" />} onClick={() => a.undoProposal(threadId, messageId)} disabledReason={perm.allowed ? undefined : perm.reason}>Undo</Button></>}>
            Each manager has been assigned a task and linked to risk {proposal.riskId}. You can undo this until the tasks are started.
          </Callout>
        )}
        {proposal.status === 'cancelled' && <Callout tone="neutral" title="Cancelled — nothing was created." actions={<Button size="sm" onClick={() => a.reopenProposal(threadId, messageId)}>Review again</Button>}>Your tasks and records are unchanged.</Callout>}
        {proposal.status === 'undone' && <Callout tone="neutral" title="Undone — the tasks were removed.">Your tasks are back to how they were before.</Callout>}

        {(proposal.status === 'proposed' || proposal.status === 'running') && (
          <div className="mt-3 overflow-hidden rounded-md border border-line">
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 border-b border-line bg-sunken px-3 py-2 text-caption font-semibold text-ink-secondary sm:grid-cols-[auto_1.2fr_1fr_auto]">
              <span className="w-4" /><span>Person → task owner (their manager)</span><span className="hidden sm:block">Proposed task</span><span className="hidden sm:block">Due</span>
            </div>
            <ul className="scroll-thin max-h-72 divide-y divide-line overflow-y-auto" aria-label="Proposed tasks">
              {proposal.items.map((it) => {
                const p = personById(it.personId); const m = personById(it.managerId)
                if (!p) return null
                return (
                  <li key={it.key} className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 px-3 py-2.5 sm:grid-cols-[auto_1.2fr_1fr_auto]">
                    <Checkbox label={<span className="sr-only">Create task for {p.name}</span>} checked={it.included} disabled={locked} onChange={() => a.toggleItem(threadId, messageId, it.key)} />
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar name={p.name} size="sm" />
                      <div className="min-w-0"><p className="truncate text-body-sm font-medium">{p.name}</p>
                        <p className="truncate text-caption text-ink-secondary">{p.training.status === 'overdue' ? 'Overdue' : p.training.status === 'in_progress' ? 'In progress' : 'Not started'} · → {m?.name ?? 'No manager'}</p></div>
                    </div>
                    <p className="col-start-2 truncate text-caption text-ink-secondary sm:col-start-auto sm:text-body-sm">{it.name}</p>
                    <p className="col-start-2 text-caption tabular-nums text-ink-secondary sm:col-start-auto sm:text-body-sm">{formatDateShort(it.dueDate)}</p>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {proposal.status === 'proposed' && (
          <>
            <p className="mt-3 text-body-sm text-ink-secondary" aria-live="polite">{chosen.length} of {proposal.items.length} selected · {managers} {managers === 1 ? 'manager' : 'managers'} will be notified. This is a <Term id="human-in-the-loop">human-approved</Term> action.</p>
            <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => a.cancelProposal(threadId, messageId)}>Cancel</Button>
              <Button variant="primary" iconLeft={<CheckCircle2 className="h-4 w-4" />} disabled={chosen.length === 0}
                disabledReason={!perm.allowed ? perm.reason : undefined} onClick={() => a.approveProposal(threadId, messageId)}>
                Approve &amp; create {chosen.length} tasks
              </Button>
            </div>
          </>
        )}

        <Disclosure className="mt-3 border-t border-line pt-2" summary={`Activity log (${proposal.log.length})`} defaultOpen={proposal.status === 'done'}>
          <ol className="space-y-1.5 py-1">
            {proposal.log.map((l, i) => <li key={i} className="flex gap-3 text-body-sm"><time className="w-16 shrink-0 tabular-nums text-ink-tertiary">{l.at}</time><span className="text-ink-secondary">{l.text}</span></li>)}
          </ol>
        </Disclosure>
      </div>
    </section>
  )
}
