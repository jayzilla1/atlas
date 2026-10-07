import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, ChevronDown, ClipboardList, Cog, Fingerprint, GraduationCap, FileText, Building2, AppWindow, Laptop, Lightbulb, Plus, Send, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/Page'
import { Card, CardHeader, DescriptionList, PlainEnglish, Callout } from '@/components/ui/Card'
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
import { ConfirmDialog, Modal } from '@/components/ui/Overlay'
import { Field, Select, Textarea } from '@/components/ui/Form'
import { Timeline } from '@/components/ui/Timeline'
import { Term } from '@/components/ui/Tooltip'
import { EmptyState } from '@/components/ui/Feedback'
import { Checkbox } from '@/components/ui/Form'
import { useToast } from '@/components/ui/Toast'
import { PersonLink, RelatedRecords } from '@/components/domain/entities'
import { TaskModal } from '@/components/domain/TaskModal'
import { PriorityBadge } from '@/components/domain/Badges'
import { ConfidenceBadge } from '@/components/ai/AiParts'
import { AtlasChat } from '@/components/ai/AtlasChat'
import { useStore } from '@/state/store'
import { isOpenRisk } from '@/data/risks'
import { dueLabel, formatDate, relativeDay } from '@/utils/dates'
import { usePageTitle } from '@/hooks/usePage'
import { RISK_QUESTIONS } from '@/ai/engine'
import { NotFoundPage } from './NotFound'
import type { Evidence, RiskStatus } from '@/data/types'
import { cn } from '@/utils/cn'

const EV_ICON: Record<Evidence['sourceType'], typeof Cog> = { identity: Fingerprint, hr: Users, application: AppWindow, vendor: Building2, training: GraduationCap, policy: FileText, device: Laptop }

export function RiskDetailPage() {
  const { id } = useParams(); const s = useStore(); const toast = useToast()
  const risk = s.riskById(id)
  usePageTitle(risk ? `${risk.id} ${risk.name}` : 'Risk not found')
  const [taskOpen, setTaskOpen] = useState(false); const [taskDraft, setTaskDraft] = useState<{ name?: string }>({})
  const [confirm, setConfirm] = useState<RiskStatus | null>(null)
  const [assignOpen, setAssignOpen] = useState(false); const [assignee, setAssignee] = useState('')
  const [note, setNote] = useState('')
  if (!risk) return <NotFoundPage what="risk" />
  const perm = s.permission('risks.write'); const taskPerm = s.permission('tasks.write')
  const tasks = s.tasks.filter((t) => t.riskId === risk.id)
  const d = dueLabel(risk.dueDate)
  const open = isOpenRisk(risk)
  const statusLabel: Record<RiskStatus, string> = { open: 'reopened', in_progress: 'in progress', accepted: 'accepted', resolved: 'resolved' }
  const doStatus = (st: RiskStatus) => {
    s.setRiskStatus(risk.id, st, st === 'resolved' ? 'Marked as resolved.' : st === 'accepted' ? 'Accepted the risk after review.' : st === 'in_progress' ? 'Started working on this risk.' : 'Reopened this risk.')
    s.log({ actor: s.currentUser.name, actorId: s.currentUser.id, kind: 'human', text: `marked “${risk.name}” as ${statusLabel[st]}.`, entity: { type: 'risk', id: risk.id } })
    toast({ tone: 'success', title: `Risk ${statusLabel[st]}`, description: st === 'resolved' ? 'Nice work. It moves to Closed and the health score updates overnight.' : undefined })
    setConfirm(null)
  }
  const reason = perm.allowed ? undefined : perm.reason
  const owners = s.people.filter((p) => p.status !== 'former').map((p) => ({ value: p.id, label: `${p.name} — ${p.title}` }))

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Risks', to: '/risks' }, { label: risk.id }]}
        eyebrow={<div className="flex flex-wrap items-center gap-2"><SeverityBadge severity={risk.severity} /><StatusBadge status={risk.status} /><ConfidenceBadge level={risk.confidence} /></div>}
        title={risk.name}
        description={risk.description}
        meta={<>
          <span className="flex items-center gap-2 text-body-sm text-ink-secondary">Owner <PersonLink id={risk.ownerId} /></span>
          <span className="text-body-sm text-ink-secondary">Identified <span className="font-medium text-ink">{formatDate(risk.identifiedOn)}</span></span>
          {open && <span className={cn('text-body-sm', d.overdue ? 'font-semibold text-critical-fg' : 'text-ink-secondary')}>Due <span className="font-medium">{formatDate(risk.dueDate)}</span> ({relativeDay(risk.dueDate)})</span>}
          <span className="text-body-sm text-ink-secondary">Category <span className="font-medium text-ink">{risk.category}</span></span>
        </>}
        actions={<>
          <Button iconLeft={<Plus className="h-4 w-4" />} disabledReason={taskPerm.allowed ? undefined : taskPerm.reason} onClick={() => { setTaskDraft({}); setTaskOpen(true) }}>Create task</Button>
          <Button disabledReason={reason} onClick={() => { setAssignee(risk.ownerId); setAssignOpen(true) }}>Assign</Button>
          <Dropdown label="Change status" items={[
            { id: 'ip', label: 'Start working', disabled: risk.status === 'in_progress' || !open || !perm.allowed, onSelect: () => doStatus('in_progress') },
            { id: 'res', label: 'Mark as resolved', description: 'The problem is fixed', disabled: !open || !perm.allowed, onSelect: () => setConfirm('resolved') },
            { id: 'acc', label: 'Accept this risk', description: 'Leadership has decided to live with it', disabled: !open || !perm.allowed, onSelect: () => setConfirm('accepted') },
            { id: 'reopen', separatorBefore: true, label: 'Reopen', disabled: open || !perm.allowed, onSelect: () => doStatus('open') },
          ]} trigger={(p) => <Button variant="primary" {...p} iconRight={<ChevronDown className="h-4 w-4" />} disabledReason={reason}>Status</Button>} />
        </>} />

      {!perm.allowed && <Callout tone="neutral" className="mb-5" title="You’re viewing this as read-only">{perm.reason} Switch roles in Demo controls to try the full experience.</Callout>}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <PlainEnglish title="Why this matters">
            <p>{risk.why}</p>
            {risk.glossary.length > 0 && <p className="mt-2 text-body-sm text-ink-secondary">Terms used here: {risk.glossary.map((g, i) => <span key={g}>{i > 0 && ', '}<Term id={g} /></span>)}.</p>}
          </PlainEnglish>

          <Card aria-labelledby="ev-h">
            <CardHeader id="ev-h" title="Evidence" description="What Atlas looked at to identify this risk. Check these before acting." icon={<ClipboardList className="h-5 w-5" />} />
            {risk.confidenceNote && <Callout tone="warning" className="mb-4" title={risk.confidence === 'needs_review' ? 'Needs review' : 'What Atlas can’t tell'}>{risk.confidenceNote}</Callout>}
            {risk.evidence.length === 0 ? <EmptyState compact title="No evidence recorded" description="This risk was closed before evidence collection started." /> : (
              <ul className="space-y-3">
                {risk.evidence.map((e, i) => { const Icon = EV_ICON[e.sourceType]; return (
                  <li key={i} className="flex gap-3 rounded-lg border border-line p-3.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sunken text-ink-secondary"><Icon className="h-4 w-4" aria-hidden /></span>
                    <div className="min-w-0"><p className="text-body font-semibold">{e.label}</p><p className="mt-0.5 text-body text-ink-secondary">{e.detail}</p>
                      <p className="mt-1.5 text-caption text-ink-tertiary">Source: {e.source} · observed {formatDate(e.observedAt)}</p></div>
                  </li>) })}
              </ul>
            )}
          </Card>

          <Card aria-labelledby="rec-h">
            <CardHeader id="rec-h" title="Recommended action" icon={<Lightbulb className="h-5 w-5" />} description={`Estimated effort: ${risk.recommended.effort}`} />
            <p className="text-body-lg font-medium">{risk.recommended.summary}</p>
            <ol className="mt-4 space-y-2">
              {risk.recommended.steps.map((st, i) => (
                <li key={i} className="flex items-start gap-3 rounded-lg border border-line p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunken text-caption font-semibold text-ink-secondary">{i + 1}</span>
                  <p className="min-w-0 flex-1 text-body">{st}</p>
                  {open && <Button size="sm" variant="ghost" disabledReason={taskPerm.allowed ? undefined : taskPerm.reason} onClick={() => { setTaskDraft({ name: st.replace(/\.$/, '') }); setTaskOpen(true) }}>Make task</Button>}
                </li>
              ))}
            </ol>
          </Card>

          <Card aria-labelledby="tasks-h">
            <CardHeader id="tasks-h" title="Related tasks" description={`${tasks.filter((t) => t.status !== 'completed').length} open of ${tasks.length}`} />
            {tasks.length === 0 ? <EmptyState compact title="No tasks yet" description="Turn the recommended steps into assigned work." action={<Button onClick={() => { setTaskDraft({}); setTaskOpen(true) }} disabledReason={taskPerm.allowed ? undefined : taskPerm.reason}>Create task</Button>} /> : (
              <ul className="-mx-2 divide-y divide-line">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-2 py-2.5">
                    <Checkbox label={<span className="sr-only">Mark “{t.name}” complete</span>} checked={t.status === 'completed'} disabled={!taskPerm.allowed} onChange={() => s.updateTask(t.id, t.status === 'completed' ? { status: 'in_progress', completedAt: undefined } : { status: 'completed', completedAt: '2026-10-07' })} />
                    <div className="min-w-0 flex-1"><p className={cn('truncate text-body', t.status === 'completed' && 'text-ink-tertiary line-through')}>{t.name}</p><p className="text-caption text-ink-secondary">{s.personById(t.ownerId)?.name} · {dueLabel(t.dueDate).text}</p></div>
                    <PriorityBadge priority={t.priority} /><StatusBadge status={t.status} />
                  </li>))}
              </ul>
            )}
          </Card>

          <Card aria-labelledby="ai-h">
            <CardHeader id="ai-h" title="Ask Atlas about this risk" description="Atlas answers using the evidence above. It can explain, but it won’t change anything without your approval." />
            <AtlasChat threadId={`risk-${risk.id}`} riskId={risk.id} suggestions={RISK_QUESTIONS} compact className="h-[36rem] rounded-lg bg-canvas p-3" emptyTitle="What would you like to understand?" emptyBody="Try one of these, or type your own question." />
          </Card>

          <Card aria-labelledby="act-h">
            <CardHeader id="act-h" title="Activity" />
            <Timeline items={[...risk.activity].reverse().map((a, i) => ({ id: String(i), at: a.at, actor: a.actor, kind: a.kind, text: a.text }))} />
            <form className="mt-5 border-t border-line pt-4" onSubmit={(e) => { e.preventDefault(); if (!note.trim()) return; s.noteOnRisk(risk.id, `commented: “${note.trim()}”`); setNote(''); toast({ title: 'Comment added', duration: 2500 }) }}>
              <Field label="Add a comment" hideLabel>{({ id }) => <Textarea id={id} rows={2} placeholder={perm.allowed ? 'Add a note for your team…' : 'Read-only: you can’t comment'} disabled={!perm.allowed} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
              <div className="mt-2 flex justify-end"><Button type="submit" size="sm" iconLeft={<Send className="h-4 w-4" />} disabled={!note.trim()} disabledReason={reason}>Comment</Button></div>
            </form>
          </Card>
        </div>

        <aside className="space-y-5" aria-label="Risk details">
          <Card aria-labelledby="det-h"><CardHeader id="det-h" title="Details" level={2} />
            <DescriptionList items={[
              { label: 'Risk ID', value: risk.id }, { label: 'Severity', value: <SeverityBadge severity={risk.severity} /> }, { label: 'Status', value: <StatusBadge status={risk.status} /> },
              { label: 'Owner', value: <PersonLink id={risk.ownerId} subtitle="" /> }, { label: 'Category', value: risk.category },
              { label: 'Date identified', value: formatDate(risk.identifiedOn) }, { label: 'Due date', value: open ? `${formatDate(risk.dueDate)} (${relativeDay(risk.dueDate)})` : '—' },
              { label: <Term id="confidence">AI confidence</Term>, value: <ConfidenceBadge level={risk.confidence} /> },
            ]} /></Card>
          <Card aria-labelledby="rel-h"><CardHeader id="rel-h" title="Related" description="People, apps, vendors and policies connected to this risk." />
            <RelatedRecords refs={risk.related} /></Card>
        </aside>
      </div>

      <TaskModal open={taskOpen} onClose={() => setTaskOpen(false)} draft={{ ...taskDraft, riskId: risk.id, ownerId: risk.ownerId, priority: risk.severity === 'critical' ? 'urgent' : risk.severity === 'high' ? 'high' : 'medium', entity: risk.related.find((r) => r.type !== 'policy') }} />
      <ConfirmDialog open={confirm !== null} onClose={() => setConfirm(null)} onConfirm={() => confirm && doStatus(confirm)} danger={false}
        title={confirm === 'accepted' ? 'Accept this risk?' : 'Mark this risk as resolved?'}
        description={confirm === 'accepted' ? 'Accepting means the company knowingly lives with this risk. It will be closed, and the decision is recorded in the activity log.' : 'Make sure the recommended actions are done. It moves to Closed, and the decision is recorded in the activity log.'}
        confirmLabel={confirm === 'accepted' ? 'Accept risk' : 'Mark resolved'} />
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign owner" size="sm"
        footer={<><Button onClick={() => setAssignOpen(false)}>Cancel</Button><Button variant="primary" iconLeft={<CheckCircle2 className="h-4 w-4" />} onClick={() => { s.assignRisk(risk.id, assignee); toast({ title: 'Owner updated', description: `${s.personById(assignee)?.name} now owns ${risk.id}.` }); setAssignOpen(false) }}>Assign</Button></>}>
        <Field label="New owner" hint="They’ll be notified and see this risk in their work.">{({ id }) => <Select id={id} value={assignee} onChange={(e) => setAssignee(e.target.value)} options={owners} />}</Field>
      </Modal>
    </>
  )
}
