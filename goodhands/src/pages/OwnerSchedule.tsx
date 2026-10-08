import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, Section } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Dialog'
import { Field, Input, Textarea } from '@/components/ui/Form'
import { EmptyState } from '@/components/ui/States'
import { Table, THead, TR, TH, TD } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { StaffDay } from '@/components/domain/StaffDay'
import { useActions, useData } from '@/state/store'
import { useSession } from '@/state/session'
import { shiftOn, tasksFor, timeOffOn } from '@/domain/tasks'
import { addDays, fmtLong, fmtMonthDay, fmtTime, mondayOf, WEEKDAYS_SHORT } from '@/utils/dates'
import { cn } from '@/utils/cn'

export default function OwnerSchedule() { return <Page id="schedule"><Screen /></Page> }

function Screen() {
  const d = useData()
  const act = useActions()
  const toast = useToast()
  const { now } = useSession()
  const [monday, setMonday] = useState(mondayOf(now.date))
  const [emp, setEmp] = useState(d.employees[0].id)
  const [adding, setAdding] = useState(false)
  const days = [0, 1, 2, 3, 4].map((i) => addDays(monday, i))
  const tasks = tasksFor(d, emp, now.date)
  const empObj = d.employees.find((e) => e.id === emp)!
  const once = d.oneTimeTasks.filter((t) => t.employeeId === emp && t.date === now.date)

  return (
    <>
      <PageHeader title="Schedule" description="Who’s working, and what each person needs to do today."
        actions={<div className="flex items-center gap-1.5" role="group" aria-label="Choose week"><IconButton label="Previous week" variant="secondary" onClick={() => setMonday(addDays(monday, -7))}><ChevronLeft className="h-4 w-4" /></IconButton><span className="min-w-[9rem] text-center text-small font-semibold">Week of {fmtMonthDay(monday)}</span><IconButton label="Next week" variant="secondary" onClick={() => setMonday(addDays(monday, 7))}><ChevronRight className="h-4 w-4" /></IconButton></div>} />
      <Card padded={false} className="mb-10">
        <Table caption={`Staff schedule, week of ${monday}`}>
          <THead><TR><TH>Employee</TH>{days.map((day) => <TH key={day} className={cn(day === now.date && 'text-primary-text')}>{WEEKDAYS_SHORT[new Date(day + 'T12:00').getDay()]} {fmtMonthDay(day).split(' ')[1]}{day === now.date && ' · Today'}</TH>)}</TR></THead>
          <tbody>{d.employees.map((e) => (
            <TR key={e.id}>
              <TD className="whitespace-nowrap font-semibold">{e.firstName} <span className="block text-caption font-normal text-ink-secondary">{e.role}</span></TD>
              {days.map((day) => { const s = shiftOn(d, e.id, day); const off = timeOffOn(d, e.id, day); return (
                <TD key={day} className={cn('whitespace-nowrap text-small', day === now.date && 'bg-primary-subtle/40')}>{s ? <span className="tabular-nums">{fmtTime(s.start).replace(':00', '')}–{fmtTime(s.end).replace(':00', '')}</span> : off ? <Badge tone="info" size="sm">Off · {off.reason}</Badge> : <span className="text-ink-tertiary">—</span>}</TD>
              ) })}
            </TR>
          ))}</tbody>
        </Table>
      </Card>

      <Section title="Today’s checklists" description={fmtLong(now.date)} actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>Add a task</Button>} id="lists">
        <div className="mb-4"><Segmented<string> label="Choose employee" value={emp} onChange={setEmp} items={d.employees.map((e) => ({ id: e.id, label: e.firstName }))} /></div>
        {tasks.length === 0 ? <EmptyState icon={<Plus />} title={`${empObj.firstName} isn’t scheduled today`} description="You can still add a one-time task for another day from the schedule." /> : <div className="max-w-2xl"><StaffDay tasks={tasks} /></div>}
        {once.length > 0 && (
          <div className="mt-6 max-w-2xl"><h3 className="mb-2 text-small font-bold">One-time tasks you added</h3>
            <ul className="divide-y divide-line-subtle rounded-lg border border-line bg-surface">{once.map((t) => <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5"><span><span className="tabular-nums text-ink-secondary">{fmtTime(t.time)}</span> · {t.title}</span><IconButton label={`Remove ${t.title}`} size="sm" onClick={() => { act.removeTask(t.id); toast({ title: 'Task removed', tone: 'info' }) }}><Trash2 className="h-4 w-4" /></IconButton></li>)}</ul>
          </div>
        )}
        <p className="mt-6 max-w-2xl text-small text-ink-secondary">Everyone’s daily routine repeats each working day. A one-time task appears only today.</p>
      </Section>
      {adding && <AddTask employeeId={emp} date={now.date} onClose={() => setAdding(false)} />}
    </>
  )
}

function AddTask({ employeeId, date, onClose }: { employeeId: string; date: string; onClose: () => void }) {
  const act = useActions()
  const toast = useToast()
  const { now } = useSession()
  const [title, setTitle] = useState('')
  const [time, setTime] = useState(now.time > '16:00' ? '16:30' : '14:30')
  const [notes, setNotes] = useState('')
  const [err, setErr] = useState('')
  return (
    <Modal open onClose={onClose} title="Add a one-time task" description="It appears on this person’s list for today only." footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => { if (!title.trim()) { setErr('Describe the task.'); return } act.addTask({ employeeId, date, time, title: title.trim(), notes: notes.trim() || undefined }); toast({ title: 'Task added' }); onClose() }}>Add task</Button></>}>
      <div className="space-y-4">
        <Field label="Task" required error={err}>{(p) => <Input {...p} value={title} onChange={(e) => { setTitle(e.target.value); setErr('') }} placeholder="e.g. Wipe down the high chairs" />}</Field>
        <Field label="Time" required>{(p) => <Input {...p} type="time" value={time} onChange={(e) => setTime(e.target.value)} />}</Field>
        <Field label="Notes">{(p) => <Textarea {...p} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />}</Field>
      </div>
    </Modal>
  )
}
