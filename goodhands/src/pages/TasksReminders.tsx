import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Baby, BellRing, CalendarClock, Plus, Repeat, ShoppingBasket, Shirt } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Card, Section } from '@/components/ui/Card'
import { Checkbox, Field, Input, Select } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { Segmented } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/ui/States'
import { Table, THead, TR, TH, TD } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { SupplyBadge, DiaperBadge } from '@/components/domain/Status'
import { ChildCell } from '@/components/domain/AttendanceParts'
import { useActions, useData } from '@/state/store'
import { useSession } from '@/state/session'
import { useDialogs } from '@/state/dialogs'
import { useActor } from '@/hooks/useActor'
import { describeRecurrence, leadDaysOf, nextOccurrence, remindersForToday } from '@/domain/reminders'
import { attendanceView } from '@/domain/attendance'
import { SUPPLY_LABEL } from '@/domain/supplies'
import { fmtLong, fmtMonthDay, relativeDay, weekdayOf } from '@/utils/dates'
import type { BlanketStatus, Recurrence, SupplyLevel } from '@/types'
import { plural } from '@/utils/format'

type Tab = 'reminders' | 'supplies' | 'blanket' | 'diapers'
export default function TasksReminders() { return <Page id="tasks"><Screen /></Page> }

function Screen() {
  const d = useData()
  const { today } = useSession()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) ?? 'reminders'
  const restock = d.supplies.filter((s) => s.status !== 'good').length
  const diaperNeeds = d.children.filter((c) => c.diaper && c.diaper.status !== 'good' && !c.diaper.notified).length
  const blanketNext = nextOccurrence(d.reminders.find((r) => r.kind === 'blanket')!, today)
  return (
    <>
      <PageHeader title="Tasks & Reminders" description="Recurring routines that remember things so you don’t have to." />
      <Tabs<Tab> label="Task areas" idBase="tasks" value={tab} onChange={(v) => setParams({ tab: v }, { replace: true })} items={[
        { id: 'reminders', label: 'Reminders', icon: <CalendarClock className="h-4 w-4" /> },
        { id: 'supplies', label: 'Supplies', icon: <ShoppingBasket className="h-4 w-4" />, count: restock || undefined },
        { id: 'blanket', label: 'Blanket Day', icon: <Shirt className="h-4 w-4" /> },
        { id: 'diapers', label: 'Diapers', icon: <Baby className="h-4 w-4" />, count: diaperNeeds || undefined },
      ]} />
      <div role="tabpanel" id={`tasks-panel-${tab}`} tabIndex={0} className="pt-6 focus-visible:outline-offset-4">
        {tab === 'reminders' && <Reminders />}
        {tab === 'supplies' && <Supplies />}
        {tab === 'blanket' && <Blanket date={blanketNext!} />}
        {tab === 'diapers' && <Diapers />}
      </div>
    </>
  )
}

/* ------------------------------------------------------------- Reminders */
function Reminders() {
  const d = useData()
  const act = useActions()
  const { today } = useSession()
  const [adding, setAdding] = useState(false)
  const todays = remindersForToday(d, today)
  return (
    <div className="space-y-8">
      <Section title="Today" id="today-rem" actions={<Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>Add reminder</Button>}>
        {todays.length === 0 ? <EmptyState compact icon={<BellRing />} title="No reminders today" /> : (
          <Card padded={false} className="px-4 py-1">{todays.map((o) => (
            <Checkbox key={o.reminder.id + o.date} checked={o.done} onChange={() => act.toggleReminder(o.reminder.id, o.date)} label={<>{o.reminder.title}{o.daysAway > 0 && <span className="font-normal text-ink-secondary"> — {relativeDay(o.date, today)}</span>}</>} description={o.reminder.detail} />
          ))}</Card>
        )}
      </Section>
      <Section title="All recurring reminders" description="GoodHands works out when each one is next due — no one has to remember.">
        <Card padded={false}>
          <Table caption="Recurring reminders">
            <THead><TR><TH>Reminder</TH><TH>Repeats</TH><TH>Next</TH><TH>Heads-up</TH></TR></THead>
            <tbody>{d.reminders.map((r) => {
              const next = nextOccurrence(r, today, 120)
              return (
                <TR key={r.id}>
                  <TD><p className="font-semibold">{r.title}</p>{r.detail && <p className="text-caption text-ink-secondary">{r.detail}</p>}</TD>
                  <TD className="whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><Repeat className="h-3.5 w-3.5 text-ink-tertiary" aria-hidden />{describeRecurrence(r.recurrence)}</span></TD>
                  <TD className="whitespace-nowrap">{next ? <>{relativeDay(next, today)}<span className="text-ink-secondary"> · {fmtMonthDay(next)}</span></> : '—'}</TD>
                  <TD className="whitespace-nowrap text-ink-secondary">{leadDaysOf(d, r) ? `${plural(leadDaysOf(d, r), 'day')} ahead` : 'Same day'}</TD>
                </TR>
              )
            })}</tbody>
          </Table>
        </Card>
      </Section>
      {adding && <AddReminder onClose={() => setAdding(false)} />}
    </div>
  )
}

function AddReminder({ onClose }: { onClose: () => void }) {
  const act = useActions()
  const toast = useToast()
  const { today } = useSession()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today)
  const [repeat, setRepeat] = useState<'once' | 'weekly' | 'biweekly' | 'weekdays'>('once')
  const [err, setErr] = useState('')
  const save = () => {
    if (!title.trim()) { setErr('Give the reminder a name.'); return }
    const wd = weekdayOf(date)
    const recurrence: Recurrence = repeat === 'once' ? { type: 'once', date } : repeat === 'weekly' ? { type: 'weekly', weekday: wd } : repeat === 'biweekly' ? { type: 'every_n_weeks', weekday: wd, anchor: date, n: 2 } : { type: 'weekdays' }
    act.addReminder({ title: title.trim(), kind: 'custom', recurrence, leadDays: 0 })
    toast({ title: 'Reminder added', description: title.trim() }); onClose()
  }
  return (
    <Modal open onClose={onClose} title="Add a reminder" footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Add reminder</Button></>}>
      <div className="space-y-4">
        <Field label="What should it say?" required error={err}>{(p) => <Input {...p} value={title} onChange={(e) => { setTitle(e.target.value); setErr('') }} placeholder="e.g. Order craft supplies" />}</Field>
        <Field label="Starting on" required>{(p) => <Input {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
        <Field label="Repeats">{(p) => <Select {...p} value={repeat} onChange={(e) => setRepeat(e.target.value as typeof repeat)}><option value="once">Doesn’t repeat</option><option value="weekly">Every week on this day</option><option value="biweekly">Every other week on this day</option><option value="weekdays">Every weekday</option></Select>}</Field>
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------- Supplies */
function Supplies() {
  const d = useData()
  const act = useActions()
  const toast = useToast()
  const { today } = useSession()
  const { name } = useActor()
  const isFriday = weekdayOf(today) === 5
  const checkedCount = d.supplies.filter((s) => d.supplyChecks[`${today}:${s.id}`]).length
  const set = (id: string, nm: string, status: SupplyLevel, prev: SupplyLevel) => {
    act.setSupply(id, status, name, today)
    toast({ title: `${nm}: ${SUPPLY_LABEL[status]}`, tone: status === 'good' ? 'success' : 'info', action: { label: 'Undo', onClick: () => act.setSupply(id, prev, name, today) } })
  }
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-8">
        <Section title="Supplies" description="A lightweight reminder list — not an inventory system.">
          <Card padded={false}>
            <Table caption="Supplies">
              <THead><TR><TH>Item</TH><TH>Status</TH><TH>Update</TH><TH className="text-right"><span className="sr-only">Action</span></TH></TR></THead>
              <tbody>{d.supplies.map((s) => (
                <TR key={s.id}>
                  <TD><p className="font-semibold">{s.name}</p>{s.note && <p className="text-caption text-ink-secondary">{s.note}</p>}</TD>
                  <TD><SupplyBadge status={s.status} /></TD>
                  <TD><label className="sr-only" htmlFor={`sup-${s.id}`}>Set status for {s.name}</label><Select id={`sup-${s.id}`} className="w-44" value={s.status} onChange={(e) => set(s.id, s.name, e.target.value as SupplyLevel, s.status)}><option value="good">Good</option><option value="low">Running low</option><option value="restock">Need to restock</option></Select></TD>
                  <TD className="text-right">{s.status !== 'good' ? <Button variant="primary" size="sm" onClick={() => set(s.id, s.name, 'good', s.status)}>Mark restocked</Button> : <span className="text-ink-tertiary">—</span>}</TD>
                </TR>
              ))}</tbody>
            </Table>
          </Card>
        </Section>
        <Section title="Recent restocking" headingLevel={3}>
          <ul className="divide-y divide-line-subtle rounded-lg border border-line bg-surface">
            {[...d.supplyEvents].reverse().slice(0, 6).map((e) => { const s = d.supplies.find((x) => x.id === e.supplyId); return <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-small"><span><strong>{s?.name}</strong> · {e.kind === 'restocked' ? 'restocked' : SUPPLY_LABEL[e.to].toLowerCase()}</span><span className="text-ink-secondary">{fmtMonthDay(e.date)} · {e.by}</span></li> })}
          </ul>
        </Section>
      </div>
      <Section title="Weekly supply check" description={isFriday ? 'It’s Friday — tick as you go.' : 'Every Friday. You can start it early.'} id="wsc">
        <Card padded={false} className="px-4 py-1">
          {d.supplies.map((s) => <Checkbox key={s.id} checked={!!d.supplyChecks[`${today}:${s.id}`]} onChange={() => act.toggleSupplyCheck(today, s.id)} label={`Check ${s.name.toLowerCase()}`} description={SUPPLY_LABEL[s.status]} />)}
        </Card>
        <p className="mt-2 text-small text-ink-secondary" aria-live="polite">{checkedCount === d.supplies.length ? 'All checked. Anything low becomes a restock reminder automatically.' : `${checkedCount} of ${d.supplies.length} checked.`}</p>
      </Section>
    </div>
  )
}

/* ---------------------------------------------------------------- Blanket */
function Blanket({ date }: { date: string }) {
  const d = useData()
  const act = useActions()
  const { today, now } = useSession()
  const toast = useToast()
  const kids = useMemo(() => d.children.map((c) => ({ c, v: attendanceView(d, c, date, now) })).filter((r) => r.v.status !== 'not_scheduled'), [d, date, now])
  const key = (id: string) => `${date}:${id}`
  const get = (id: string, v: ReturnType<typeof attendanceView>): BlanketStatus => d.blankets[key(id)] ?? (v.status === 'vacation' || v.status === 'absent' ? 'na' : 'not_sent')
  const counted = kids.filter((r) => get(r.c.id, r.v) !== 'na').length
  const sent = kids.filter((r) => get(r.c.id, r.v) === 'sent').length
  const diff = Math.round((new Date(date).getTime() - new Date(today).getTime()) / 86400000)
  const markAll = () => { act.setBlankets(date, Object.fromEntries(kids.filter((r) => get(r.c.id, r.v) !== 'na').map((r) => [r.c.id, 'sent' as BlanketStatus]))); toast({ title: 'All blankets marked as sent home' }) }
  return (
    <div className="max-w-3xl space-y-5">
      <div className="rounded-lg border border-primary/25 bg-primary-subtle/60 p-4">
        <p className="flex items-center gap-2 font-bold text-primary-text"><Shirt className="h-5 w-5" aria-hidden />{diff === 0 ? 'Today is Blanket Day' : diff === 1 ? 'Tomorrow: Blanket Day' : `Next Blanket Day: ${fmtLong(date)}`}</p>
        <p className="mt-1 text-small text-ink-secondary">Every other Friday, children take their blankets home to be washed. GoodHands counts them and reminds you {plural(d.settings.blanketLeadDays, 'day')} ahead.</p>
      </div>
      <Section title={`${counted} blankets expected`} description={fmtLong(date)} actions={<Button onClick={markAll}>Mark all sent home</Button>}>
        <p className="mb-2 text-small text-ink-secondary" aria-live="polite">{sent} of {counted} sent home</p>
        <ul className="divide-y divide-line-subtle rounded-lg border border-line bg-surface">
          {kids.map(({ c, v }) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <ChildCell child={c} date={date} compact />
              {get(c.id, v) === 'na' && !d.blankets[key(c.id)] && <Badge tone="neutral">Away that day</Badge>}
              <Segmented<BlanketStatus> label={`Blanket for ${c.firstName}`} value={get(c.id, v)} onChange={(s) => act.setBlankets(date, { [c.id]: s })} items={[{ id: 'sent', label: 'Sent home' }, { id: 'not_sent', label: 'Not sent' }, { id: 'na', label: 'N/A' }]} />
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

/* ---------------------------------------------------------------- Diapers */
function Diapers() {
  const d = useData()
  const act = useActions()
  const dialogs = useDialogs()
  const { today } = useSession()
  const rows = d.children.filter((c) => c.diaper)
  const order = { out: 0, low: 1, good: 2 }
  rows.sort((a, b) => order[a.diaper!.status] - order[b.diaper!.status])
  return (
    <Section title="Diaper supply" description="Mark a child as running low and GoodHands turns it into a parent-notification step.">
      <Card padded={false}>
        <Table caption="Diaper supply by child">
          <THead><TR><TH>Child</TH><TH>Status</TH><TH className="text-right"><span className="sr-only">Action</span></TH></TR></THead>
          <tbody>{rows.map((c) => (
            <TR key={c.id}>
              <TD><ChildCell child={c} date={today} compact /></TD>
              <TD><DiaperBadge status={c.diaper!.status} notified={!!c.diaper!.notified} /></TD>
              <TD className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {c.diaper!.status !== 'good' && !c.diaper!.notified && <Button variant="primary" onClick={() => dialogs.notifyParent(c.id)}>Notify parent</Button>}
                  {c.diaper!.status !== 'good' && c.diaper!.notified && <Button onClick={() => act.setDiaper(c.id, 'good', today)}>Received</Button>}
                  {c.diaper!.status === 'good' && <Button variant="ghost" onClick={() => act.setDiaper(c.id, 'low', today)}>Mark running low</Button>}
                </div>
              </TD>
            </TR>
          ))}</tbody>
        </Table>
      </Card>
      <p className="mt-3 text-small"><Link to="/children" className="font-semibold text-primary-text underline-offset-2 hover:underline">Open a child’s profile</Link> for notification history.</p>
    </Section>
  )
}
