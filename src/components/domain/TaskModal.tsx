import { useEffect, useState } from 'react'
import type { EntityRef, TaskPriority } from '@/data/types'
import { Modal } from '@/components/ui/Overlay'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Form'
import { useStore } from '@/state/store'
import { useToast } from '@/components/ui/Toast'
import { offsetFromToday, daysFromToday } from '@/utils/dates'
import { PRIORITY_OPTIONS } from './Badges'
import { EntityChip } from './entities'

export interface TaskDraft { name?: string; riskId?: string; entity?: EntityRef; ownerId?: string; priority?: TaskPriority; description?: string }

/** TaskModal — create a task. Demonstrates inline validation, helpful errors and a success toast with a link. */
export function TaskModal({ open, onClose, draft }: { open: boolean; onClose: () => void; draft?: TaskDraft }) {
  const s = useStore(); const toast = useToast()
  const [name, setName] = useState(''); const [owner, setOwner] = useState(''); const [due, setDue] = useState(''); const [prio, setPrio] = useState<TaskPriority>('medium'); const [desc, setDesc] = useState('')
  const [errors, setErrors] = useState<{ name?: string; due?: string; owner?: string }>({})
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) { setName(draft?.name ?? ''); setOwner(draft?.ownerId ?? s.currentUser.id); setDue(offsetFromToday(7)); setPrio(draft?.priority ?? 'medium'); setDesc(draft?.description ?? ''); setErrors({}); setBusy(false) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const submit = () => {
    const e: typeof errors = {}
    if (name.trim().length < 5) e.name = 'Give the task a short, specific name (at least 5 characters).'
    if (!owner) e.owner = 'Choose who is responsible.'
    if (!due) e.due = 'Choose a due date.'; else if (daysFromToday(due) < 0) e.due = 'The due date can’t be in the past.'
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    window.setTimeout(() => {
      s.addTasks([{ name: name.trim(), ownerId: owner, priority: prio, status: 'not_started', dueDate: due, riskId: draft?.riskId, entity: draft?.entity, createdAt: offsetFromToday(0), description: desc || undefined, createdBy: 'human' }])
      s.log({ actor: s.currentUser.name, actorId: s.currentUser.id, kind: 'human', text: `created task “${name.trim()}”.`, entity: draft?.riskId ? { type: 'risk', id: draft.riskId } : undefined })
      toast({ tone: 'success', title: 'Task created', description: `Assigned to ${s.personById(owner)?.name}.`, action: { label: 'View tasks', to: '/tasks' } })
      onClose()
    }, 450)
  }
  const owners = s.people.filter((p) => p.status !== 'former').map((p) => ({ value: p.id, label: `${p.name} — ${p.title}` }))
  return (
    <Modal open={open} onClose={onClose} title="New task" description="Tasks turn a risk into assigned, dated work." size="md"
      footer={<><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="primary" loading={busy} onClick={submit}>Create task</Button></>}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit() }} noValidate>
        <Field label="Task name" required error={errors.name} hint="Start with a verb: “Remove…”, “Request…”, “Review…”.">{({ id, describedBy, invalid }) => <Input id={id} data-autofocus aria-describedby={describedBy} invalid={invalid} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Owner" required error={errors.owner}>{({ id, describedBy }) => <Select id={id} aria-describedby={describedBy} value={owner} onChange={(e) => setOwner(e.target.value)} options={owners} />}</Field>
          <Field label="Priority">{({ id }) => <Select id={id} value={prio} onChange={(e) => setPrio(e.target.value as TaskPriority)} options={PRIORITY_OPTIONS} />}</Field>
          <Field label="Due date" required error={errors.due}>{({ id, describedBy, invalid }) => <Input id={id} type="date" aria-describedby={describedBy} invalid={invalid} value={due} onChange={(e) => setDue(e.target.value)} />}</Field>
        </div>
        <Field label="Notes" hint="Optional.">{({ id }) => <Textarea id={id} value={desc} onChange={(e) => setDesc(e.target.value)} />}</Field>
        {(draft?.riskId || draft?.entity) && (
          <div><p className="mb-1.5 text-body-sm font-medium">Linked to</p><div className="flex flex-wrap gap-2">
            {draft.riskId && <EntityChip entity={{ type: 'risk', id: draft.riskId }} />}{draft.entity && <EntityChip entity={draft.entity} />}</div></div>
        )}
      </form>
    </Modal>
  )
}
