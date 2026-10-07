import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, MoreHorizontal, Plus, UserPlus, PartyPopper } from 'lucide-react'
import { PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { Tabs } from '@/components/ui/Tabs'
import { Badge, StatusBadge, STATUS } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { Checkbox, Field, Select } from '@/components/ui/Form'
import { Dropdown } from '@/components/ui/Dropdown'
import { Modal } from '@/components/ui/Overlay'
import { EmptyState, ErrorState, NoResults, TableSkeleton } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toast'
import { EntityChip, PersonLink } from '@/components/domain/entities'
import { PRIORITY_OPTIONS, PRIORITY_RANK, PriorityBadge } from '@/components/domain/Badges'
import { TaskModal } from '@/components/domain/TaskModal'
import { useStore } from '@/state/store'
import type { Task, TaskStatus } from '@/data/types'
import { daysFromToday, dueLabel, formatDate } from '@/utils/dates'
import { useQueryFilters } from '@/hooks/useQueryFilters'
import { usePageTitle, useSimulatedLoad } from '@/hooks/usePage'
import { cn } from '@/utils/cn'
import { Sparkles } from 'lucide-react'

const STATUSES: TaskStatus[] = ['not_started', 'in_progress', 'waiting', 'completed']

export function TasksPage() {
  usePageTitle('Tasks')
  const s = useStore(); const toast = useToast()
  const load = useSimulatedLoad('tasks')
  const f = useQueryFilters(['status', 'owner', 'priority', 'due', 'view', 'source'] as const, { view: 'open' })
  const [newOpen, setNewOpen] = useState(false)
  const [assigning, setAssigning] = useState<Task | null>(null); const [assignee, setAssignee] = useState('')
  const perm = s.permission('tasks.write')

  const counts = useMemo(() => ({ open: s.tasks.filter((t) => t.status !== 'completed').length, completed: s.tasks.filter((t) => t.status === 'completed').length, all: s.tasks.length }), [s.tasks])
  const owners = useMemo(() => Array.from(new Set(s.tasks.map((t) => t.ownerId))).map((id) => ({ value: id, label: (s.personById(id)?.name ?? id) + (id === s.currentUser.id ? ' (you)' : '') })).sort((a, b) => a.label.localeCompare(b.label)), [s.tasks, s.personById, s.currentUser.id])

  const rows = useMemo(() => s.tasks.filter((t) => {
    const q = f.search.trim().toLowerCase()
    if (f.values.view === 'open' && t.status === 'completed') return false
    if (f.values.view === 'completed' && t.status !== 'completed') return false
    if (q && !(t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || (t.riskId ?? '').toLowerCase().includes(q) || (s.personById(t.ownerId)?.name ?? '').toLowerCase().includes(q))) return false
    if (f.values.status !== 'all' && t.status !== f.values.status) return false
    if (f.values.owner !== 'all' && t.ownerId !== f.values.owner) return false
    if (f.values.priority !== 'all' && t.priority !== f.values.priority) return false
    if (f.values.source === 'ai' && t.createdBy !== 'ai') return false
    const n = daysFromToday(t.dueDate)
    if (f.values.due === 'overdue' && !(n < 0 && t.status !== 'completed')) return false
    if (f.values.due === 'week' && !(n >= 0 && n <= 7)) return false
    if (f.values.due === 'month' && !(n >= 0 && n <= 30)) return false
    return true
  }), [s.tasks, f.values, f.search, s.personById])

  const complete = (t: Task) => {
    s.completeTask(t.id)
    toast({ tone: 'success', title: 'Task completed', description: t.name, action: { label: 'Undo', onClick: () => s.updateTask(t.id, { status: 'in_progress', completedAt: undefined }) } })
  }
  const columns: Column<Task>[] = [
    { id: 'name', header: 'Task', mobile: 'title', sortValue: (t) => t.name, cell: (t) => (
      <div className="flex min-w-0 items-start gap-3">
        <Checkbox className="mt-0.5" label={<span className="sr-only">{t.status === 'completed' ? 'Reopen' : 'Complete'} “{t.name}”</span>} checked={t.status === 'completed'} disabled={!perm.allowed}
          onChange={() => (t.status === 'completed' ? s.updateTask(t.id, { status: 'in_progress', completedAt: undefined }) : complete(t))} />
        <div className="min-w-0"><p className={cn('font-medium', t.status === 'completed' && 'text-ink-tertiary line-through')}>{t.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-caption text-ink-secondary">{t.id}{t.createdBy === 'ai' && <Badge tone="ai" size="sm" icon={<Sparkles />}>Created by Atlas AI</Badge>}</p></div>
      </div>) },
    { id: 'owner', header: 'Owner', hideBelow: 'lg', sortValue: (t) => s.personById(t.ownerId)?.name ?? '', cell: (t) => <PersonLink id={t.ownerId} /> },
    { id: 'priority', header: 'Priority', sortValue: (t) => PRIORITY_RANK[t.priority], cell: (t) => <PriorityBadge priority={t.priority} /> },
    { id: 'status', header: 'Status', sortValue: (t) => STATUSES.indexOf(t.status), cell: (t) => (
      <Dropdown label={`Change status of ${t.name}`} placement="bottom-start" width="w-48"
        items={STATUSES.map((st) => ({ id: st, label: STATUS[st].label, checked: t.status === st, disabled: !perm.allowed, onSelect: () => (st === 'completed' ? complete(t) : s.updateTask(t.id, { status: st, completedAt: undefined })) }))}
        trigger={(p) => <button {...p} disabled={!perm.allowed} aria-label={`Status: ${STATUS[t.status].label}. Change status`} className="group inline-flex items-center gap-1 rounded-sm disabled:cursor-not-allowed"><StatusBadge status={t.status} /><ChevronDown className="h-3.5 w-3.5 text-ink-tertiary group-hover:text-ink group-disabled:hidden" aria-hidden /></button>} />) },
    { id: 'due', header: 'Due', sortValue: (t) => t.dueDate, cell: (t) => { const d = dueLabel(t.dueDate); const done = t.status === 'completed'; return <span className={cn('whitespace-nowrap text-body-sm tabular-nums', !done && d.overdue ? 'font-semibold text-critical-fg' : !done && d.soon ? 'font-medium text-warning-fg' : 'text-ink-secondary')}>{done ? `Done ${formatDate(t.completedAt)}` : d.text}</span> } },
    { id: 'related', header: 'Related', hideBelow: 'xl', cell: (t) => <div className="flex flex-wrap gap-1.5">{t.riskId && <EntityChip entity={{ type: 'risk', id: t.riskId }} className="max-w-[9rem]" />}{!t.riskId && !t.entity && <span className="text-ink-tertiary">—</span>}</div> },
    { id: 'actions', header: 'Actions', mobile: 'hide', align: 'right', cell: (t) => (
      <Dropdown label={`Actions for ${t.name}`} items={[
        { id: 'assign', label: 'Assign…', icon: <UserPlus className="h-4 w-4" />, disabled: !perm.allowed, disabledReason: perm.reason, onSelect: () => { setAssigning(t); setAssignee(t.ownerId) } },
        { id: 'done', label: t.status === 'completed' ? 'Reopen' : 'Mark complete', icon: <CheckCircle2 className="h-4 w-4" />, disabled: !perm.allowed, onSelect: () => (t.status === 'completed' ? s.updateTask(t.id, { status: 'in_progress', completedAt: undefined }) : complete(t)) },
        ...(t.riskId ? [{ id: 'risk', separatorBefore: true, label: `Open ${t.riskId}`, to: `/risks/${t.riskId}` }] : []),
      ]} trigger={(p) => <IconButton {...p} label="More actions" size="sm"><MoreHorizontal className="h-4 w-4" /></IconButton>} />) },
  ]
  const overdueCount = s.tasks.filter((t) => t.status !== 'completed' && daysFromToday(t.dueDate) < 0).length
  const emptyAll = f.values.view === 'open' && counts.open === 0

  return (
    <>
      <PageHeader title="Tasks" description="The work that turns risks into progress. Every task has an owner and a due date, and links back to the risk it addresses."
        actions={<Button variant="primary" iconLeft={<Plus className="h-4 w-4" />} onClick={() => setNewOpen(true)} disabledReason={perm.allowed ? undefined : perm.reason}>New task</Button>} />
      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-1">
          <Tabs label="Task view" value={f.values.view} onChange={(v) => f.set('view', v)} tabs={[{ id: 'open', label: 'Open', count: counts.open }, { id: 'completed', label: 'Completed', count: counts.completed }, { id: 'all', label: 'All', count: counts.all }]} className="border-b-0" />
          {overdueCount > 0 && f.values.due !== 'overdue' && <button type="button" onClick={() => f.set('due', 'overdue')} className="rounded-md py-2 text-body-sm font-medium text-critical-fg hover:underline">{overdueCount} overdue →</button>}
        </div>
        <FilterBar search={f.search} onSearch={f.setSearch} searchLabel="Search tasks" searchPlaceholder="Search tasks, owners or risk IDs" noun="tasks" resultCount={rows.length}
          values={f.values} onChange={(id, v) => f.set(id as never, v)} onClear={() => { const v = f.values.view; f.clear(); if (v !== 'open') f.set('view', v) }}
          filters={[
            { id: 'owner', label: 'Owner', options: owners },
            { id: 'status', label: 'Status', options: STATUSES.map((x) => ({ value: x, label: STATUS[x].label })) },
            { id: 'priority', label: 'Priority', options: PRIORITY_OPTIONS },
            { id: 'due', label: 'Due', options: [{ value: 'overdue', label: 'Overdue' }, { value: 'week', label: 'Next 7 days' }, { value: 'month', label: 'Next 30 days' }] },
            { id: 'source', label: 'Created by', options: [{ value: 'ai', label: 'Atlas AI' }] },
          ]} />
        {load.loading ? <TableSkeleton label="Loading tasks" /> : load.error ? <ErrorState title="We couldn’t load your tasks" onRetry={load.retry} detail="Error 503 · task-service timed out (simulated)" />
          : emptyAll ? <EmptyState icon={<PartyPopper />} title="You’re all caught up" description="There are no open tasks. New tasks appear here when risks need work." action={<Button onClick={() => setNewOpen(true)}>Create a task</Button>} />
          : rows.length === 0 ? <NoResults query={f.search} onClear={f.clear} />
          : <DataTable caption="Tasks" columns={columns} rows={rows} getRowKey={(t) => t.id} defaultSort={{ id: 'due', dir: 'asc' }} noun="tasks" resetPageKey={JSON.stringify(f.values) + f.search}
            renderExpanded={(t) => (
              <div className="grid gap-3 text-body-sm sm:grid-cols-3">
                <div className="sm:col-span-2"><p className="font-semibold">Notes</p><p className="mt-0.5 text-ink-secondary">{t.description ?? 'No notes yet.'}</p></div>
                <div className="space-y-1.5"><p className="font-semibold">Linked records</p><div className="flex flex-wrap gap-1.5">{t.riskId && <EntityChip entity={{ type: 'risk', id: t.riskId }} />}{t.entity && <EntityChip entity={t.entity} />}{!t.riskId && !t.entity && <span className="text-ink-tertiary">None</span>}</div>
                  <p className="text-ink-secondary">Created {formatDate(t.createdAt)}{t.createdBy === 'ai' ? ' by Atlas AI after approval' : ''}</p></div>
              </div>)} />}
      </Card>
      <TaskModal open={newOpen} onClose={() => setNewOpen(false)} />
      <Modal open={assigning !== null} onClose={() => setAssigning(null)} title="Assign task" description={assigning?.name} size="sm"
        footer={<><Button onClick={() => setAssigning(null)}>Cancel</Button><Button variant="primary" onClick={() => { if (assigning) { s.updateTask(assigning.id, { ownerId: assignee }); toast({ title: 'Task reassigned', description: `Now owned by ${s.personById(assignee)?.name}.` }) } setAssigning(null) }}>Assign</Button></>}>
        <Field label="Owner">{({ id }) => <Select id={id} value={assignee} onChange={(e) => setAssignee(e.target.value)} options={s.people.filter((p) => p.status !== 'former').map((p) => ({ value: p.id, label: `${p.name} — ${p.title}` }))} />}</Field>
      </Modal>
    </>
  )
}
