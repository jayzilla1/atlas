import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Lock, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, DetailList } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Dialog'
import { Field, Input, Textarea } from '@/components/ui/Form'
import { EmptyState } from '@/components/ui/States'
import { Table, THead, TR, TH, TD } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { ShiftBadge } from '@/components/domain/Status'
import { DocumentCard } from '@/components/domain/DocumentCard'
import { StaffDay } from '@/components/domain/StaffDay'
import { useActions, useData } from '@/state/store'
import { useSession } from '@/state/session'
import { employeeName } from '@/domain/people'
import { shiftOn, shiftState, tasksFor } from '@/domain/tasks'
import { fmtFull, fmtLong, fmtTime, WEEKDAYS_SHORT } from '@/utils/dates'
import { plural } from '@/utils/format'
import type { ShiftRecord } from '@/types'

type Tab = 'overview' | 'shifts' | 'tasks' | 'documents'
export default function EmployeeProfile() { return <Page id="employee-profile"><Screen /></Page> }

function Screen() {
  const { id } = useParams()
  const d = useData()
  const { now } = useSession()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) ?? 'overview'
  const [resolveDate, setResolveDate] = useState<string | null>(params.get('resolve'))
  const e = d.employees.find((x) => x.id === id)
  if (!e) return <EmptyState title="Employee not found" />
  const shifts = d.shifts.filter((s) => s.employeeId === e.id).sort((a, b) => b.date.localeCompare(a.date))
  const resolve = resolveDate ? shifts.find((s) => s.date === resolveDate && s.checkIn && (!s.checkOut)) ?? null : null
  const setResolve = (s: ShiftRecord | null) => { setResolveDate(s?.date ?? null); if (!s && params.get('resolve')) { const p = new URLSearchParams(params); p.delete('resolve'); setParams(p, { replace: true }) } }
  const docs = d.documents.filter((x) => x.ownerType === 'employee' && x.ownerId === e.id)
  const unresolved = shifts.filter((s) => s.date < now.date && s.checkIn && !s.checkOut).length

  return (
    <>
      <PageHeader
        breadcrumbs={<Breadcrumbs items={[{ label: 'Employees', to: '/employees' }, { label: employeeName(e) }]} />}
        title={<span className="flex items-center gap-4"><Avatar first={e.firstName} last={e.lastName} src={e.photo} size="lg" />{employeeName(e)}</span>}
        description={`${e.role} · hired ${fmtFull(e.hiredOn)}`}
        actions={<ShiftBadge state={shiftState(d, e.id, now.date)} />}
      />
      <Tabs<Tab> label="Employee record" idBase="emp" value={tab} onChange={(v) => setParams({ tab: v }, { replace: true })} items={[
        { id: 'overview', label: 'Overview' }, { id: 'shifts', label: 'Shifts & checkout', count: unresolved || undefined }, { id: 'tasks', label: 'Today’s tasks' }, { id: 'documents', label: 'Documents', icon: <Lock className="h-3.5 w-3.5" /> },
      ]} />
      <div role="tabpanel" id={`emp-panel-${tab}`} tabIndex={0} className="pt-6 focus-visible:outline-offset-4">
        {tab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card><DetailList columns={1} items={[
              { label: 'Phone', value: <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-ink-tertiary" aria-hidden />{e.phone}</span> },
              { label: 'Email', value: <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-ink-tertiary" aria-hidden />{e.email}</span> },
              { label: 'Address', value: <span className="flex items-start gap-2"><MapPin className="mt-1 h-4 w-4 shrink-0 text-ink-tertiary" aria-hidden />{e.address}</span> },
            ]} /></Card>
            <Card><DetailList columns={1} items={[
              { label: 'Emergency contact', value: <>{e.emergencyContact.name} ({e.emergencyContact.relationship})<br />{e.emergencyContact.phone}</> },
              { label: 'Usual schedule', value: Object.entries(e.weekly).map(([k, v]) => `${WEEKDAYS_SHORT[+k]} ${fmtTime(v!.start)}–${fmtTime(v!.end)}`).join(' · ') },
            ]} /></Card>
            <p className="flex items-start gap-2 text-small text-ink-secondary lg:col-span-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Personal details and documents are only visible to the owner. Employees can’t see other employees’ records.</p>
          </div>
        )}
        {tab === 'shifts' && (
          <>
            <Card padded={false}>
              <Table caption={`${e.firstName}'s check-in and check-out history`}>
                <THead><TR><TH>Date</TH><TH>In</TH><TH>Out</TH><TH>Tasks</TH><TH>Note</TH><TH><span className="sr-only">Action</span></TH></TR></THead>
                <tbody>{shifts.map((s) => {
                  const missing = s.date < now.date && s.checkIn && !s.checkOut
                  return (
                    <TR key={s.date} className={missing ? 'bg-warning-bg/40' : ''}>
                      <TD className="whitespace-nowrap font-semibold">{fmtLong(s.date)}</TD>
                      <TD className="whitespace-nowrap tabular-nums">{fmtTime(s.checkIn)}</TD>
                      <TD className="whitespace-nowrap tabular-nums">{missing ? <Badge tone="warning">No checkout</Badge> : fmtTime(s.checkOut)}</TD>
                      <TD className="whitespace-nowrap tabular-nums">{s.tasks ? `${s.tasks.done}/${s.tasks.total}` : s.date === now.date ? 'In progress' : '—'}</TD>
                      <TD className="text-small text-ink-secondary">{s.flag === 'left_early' ? `Left with ${plural(s.openItemsAtExit ?? 0, 'item')} open` : s.resolvedNote ?? ''}</TD>
                      <TD className="w-px">{missing && <Button size="sm" variant="primary" onClick={() => setResolve(s)}>Review closeout</Button>}</TD>
                    </TR>
                  )
                })}</tbody>
              </Table>
            </Card>
            {resolve && <ResolveDialog shift={resolve} name={e.firstName} end={shiftOn(d, e.id, resolve.date)?.end} onClose={() => setResolve(null)} />}
          </>
        )}
        {tab === 'tasks' && (tasksFor(d, e.id, now.date).length ? <div className="max-w-2xl"><StaffDay tasks={tasksFor(d, e.id, now.date)} /></div> : <EmptyState title="No tasks today" description={`${e.firstName} isn't scheduled today.`} />)}
        {tab === 'documents' && (
          <>
            <p className="mb-4 flex items-center gap-2 text-small text-ink-secondary"><Lock className="h-4 w-4" aria-hidden />Restricted: W-2s and licenses ask for confirmation before opening.</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{docs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}</div>
          </>
        )}
      </div>
    </>
  )
}

function ResolveDialog({ shift, name, end, onClose }: { shift: ShiftRecord; name: string; end?: string; onClose: () => void }) {
  const act = useActions()
  const toast = useToast()
  const [time, setTime] = useState(end ?? '17:00')
  const [note, setNote] = useState(`Confirmed with ${name}.`)
  return (
    <Modal open onClose={onClose} title={`Review ${name}’s closeout`} description={`${fmtLong(shift.date)} — checked in at ${fmtTime(shift.checkIn)}, no checkout recorded.`}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => { act.resolveShift(shift.employeeId, shift.date, time, note); toast({ title: 'Checkout recorded', description: `${name} · ${fmtTime(time)}` }); onClose() }}>Save checkout time</Button></>}>
      <div className="space-y-4">
        <p className="text-small text-ink-secondary">Forgetting happens. Confirm when {name} actually left (their scheduled end was {fmtTime(end)}).</p>
        <Field label="Left at" required>{(p) => <Input {...p} type="time" value={time} onChange={(e) => setTime(e.target.value)} />}</Field>
        <Field label="Note">{(p) => <Textarea {...p} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
      </div>
    </Modal>
  )
}
