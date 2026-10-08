import { useMemo, useState } from 'react'
import { Page } from '@/components/ui/Page'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { Card, Section } from '@/components/ui/Card'
import { BarChart } from '@/components/ui/BarChart'
import { Table, THead, TR, TH, TD } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { useData } from '@/state/store'
import { useSession } from '@/state/session'
import { attendanceView } from '@/domain/attendance'
import { paymentStatus } from '@/domain/payments'
import { SUPPLY_LABEL } from '@/domain/supplies'
import { childName, employeeName } from '@/domain/people'
import { addDays, eachDay, fmtMonthDay, fmtTime, isWeekend, mondayOf, WEEKDAYS_SHORT, weekdayOf } from '@/utils/dates'
import { money, plural } from '@/utils/format'

type Tab = 'attendance' | 'payments' | 'staff' | 'supplies'
export default function Reports() { return <Page id="reports"><Screen /></Page> }

function Screen() {
  const [tab, setTab] = useState<Tab>('attendance')
  return (
    <>
      <PageHeader title="Reports" description="Short, plain summaries. Charts only where a trend matters." />
      <Tabs<Tab> label="Report type" idBase="rep" value={tab} onChange={setTab} items={[{ id: 'attendance', label: 'Attendance' }, { id: 'payments', label: 'Payments' }, { id: 'staff', label: 'Staff' }, { id: 'supplies', label: 'Supplies' }]} />
      <div role="tabpanel" id={`rep-panel-${tab}`} tabIndex={0} className="pt-6">
        {tab === 'attendance' && <AttendanceReport />}{tab === 'payments' && <PaymentsReport />}{tab === 'staff' && <StaffReport />}{tab === 'supplies' && <SuppliesReport />}
      </div>
    </>
  )
}

function AttendanceReport() {
  const d = useData()
  const { now } = useSession()
  const days = useMemo(() => eachDay(addDays(now.date, -13), addDays(now.date, -1)).filter((x) => !isWeekend(x)), [now.date])
  const perDay = days.map((day) => ({ label: WEEKDAYS_SHORT[weekdayOf(day)], hint: fmtMonthDay(day).replace(/^\w+ /, ''), value: d.children.filter((c) => attendanceView(d, c, day, now).record?.checkIn).length }))
  const rows = d.children.map((c) => {
    const v = days.map((day) => attendanceView(d, c, day, now))
    return { c, attended: v.filter((x) => x.record?.checkIn).length, late: v.filter((x) => (x.lateMinutes ?? 0) > 0).length, away: v.filter((x) => x.status === 'absent' || x.status === 'vacation').length }
  })
  return (
    <div className="space-y-8">
      <Section title="Children attending, by day" description="Last two weeks (weekdays)."><Card><BarChart data={perDay} summary={`Children attending each weekday over the last two weeks, between ${Math.min(...perDay.map((p) => p.value))} and ${Math.max(...perDay.map((p) => p.value))}.`} /></Card></Section>
      <Section title="By child" description="Days attended, late arrivals and days away in the same period.">
        <Card padded={false}><Table caption="Attendance by child, last two weeks"><THead><TR><TH>Child</TH><TH align="right">Attended</TH><TH align="right">Late</TH><TH align="right">Away</TH></TR></THead>
          <tbody>{rows.map((r) => <TR key={r.c.id}><TD className="font-semibold">{childName(r.c)}</TD><TD align="right">{r.attended}</TD><TD align="right">{r.late ? <Badge tone="warning">{r.late}</Badge> : 0}</TD><TD align="right">{r.away}</TD></TR>)}</tbody></Table></Card>
      </Section>
    </div>
  )
}

function PaymentsReport() {
  const d = useData()
  const { today } = useSession()
  const weeks = [...new Set(d.payments.map((p) => p.weekStart))].sort().slice(-8)
  const rows = weeks.map((w) => { const ps = d.payments.filter((p) => p.weekStart === w); const by = (s: string) => ps.filter((p) => paymentStatus(p, today) === s); return { w, paid: by('paid').length, due: by('due').length, overdue: by('overdue').length, collected: by('paid').reduce((t, p) => t + p.amount, 0), total: ps.reduce((t, p) => t + p.amount, 0) } })
  return (
    <div className="space-y-8">
      <Section title="Collected each week" description="Dollars received for each billed week."><Card><BarChart unit="" data={rows.map((r) => ({ label: fmtMonthDay(r.w).replace(/^\w+ /, ''), hint: 'wk', value: r.collected }))} summary={`Tuition collected for the last ${rows.length} weeks.`} height={170} /></Card></Section>
      <Section title="Paid, due and overdue"><Card padded={false}><Table caption="Payment status by week"><THead><TR><TH>Week of</TH><TH align="right">Paid</TH><TH align="right">Due</TH><TH align="right">Overdue</TH><TH align="right">Collected</TH></TR></THead>
        <tbody>{[...rows].reverse().map((r) => <TR key={r.w}><TD className="font-semibold">{fmtMonthDay(r.w)}</TD><TD align="right">{r.paid}</TD><TD align="right">{r.due || '—'}</TD><TD align="right">{r.overdue ? <Badge tone="danger">{r.overdue}</Badge> : '—'}</TD><TD align="right">{money(r.collected)} <span className="text-ink-tertiary">/ {money(r.total)}</span></TD></TR>)}</tbody></Table></Card></Section>
    </div>
  )
}

function StaffReport() {
  const d = useData()
  const { now } = useSession()
  const past = d.shifts.filter((s) => s.date < now.date)
  return (
    <div className="space-y-8">
      <Section title="Task completion" description="Share of daily tasks completed, by employee (since Sep 21)."><Card padded={false}><Table caption="Task completion by employee"><THead><TR><TH>Employee</TH><TH align="right">Shifts</TH><TH align="right">Tasks completed</TH></TR></THead>
        <tbody>{d.employees.map((e) => { const s = past.filter((x) => x.employeeId === e.id && x.tasks); const done = s.reduce((t, x) => t + x.tasks!.done, 0), total = s.reduce((t, x) => t + x.tasks!.total, 0); return <TR key={e.id}><TD className="font-semibold">{employeeName(e)}</TD><TD align="right">{s.length}</TD><TD align="right">{total ? `${Math.round((done / total) * 100)}%` : '—'} <span className="text-ink-tertiary">({done}/{total})</span></TD></TR> })}</tbody></Table></Card></Section>
      <Section title="Checkout history" description="Shifts that didn’t end with a normal checkout."><Card padded={false}><Table caption="Checkout exceptions"><THead><TR><TH>Date</TH><TH>Employee</TH><TH>What happened</TH></TR></THead>
        <tbody>{past.filter((s) => s.flag || (s.checkIn && !s.checkOut)).sort((a, b) => b.date.localeCompare(a.date)).map((s) => <TR key={s.employeeId + s.date}><TD className="whitespace-nowrap">{fmtMonthDay(s.date)}</TD><TD className="font-semibold">{d.employees.find((e) => e.id === s.employeeId)?.firstName}</TD><TD>{s.flag === 'left_early' ? `Left with ${plural(s.openItemsAtExit ?? 0, 'item')} open` : s.resolvedNote ? `Forgot to check out — ${s.resolvedNote} (${fmtTime(s.checkOut)})` : 'Forgot to check out — still unresolved'}</TD></TR>)}</tbody></Table></Card></Section>
    </div>
  )
}

function SuppliesReport() {
  const d = useData()
  return (
    <Section title="Restocking history" description="Every status change and restock, newest first."><Card padded={false}><Table caption="Supply history"><THead><TR><TH>Date</TH><TH>Item</TH><TH>Change</TH><TH>By</TH></TR></THead>
      <tbody>{[...d.supplyEvents].sort((a, b) => b.date.localeCompare(a.date)).map((e) => <TR key={e.id}><TD className="whitespace-nowrap">{fmtMonthDay(e.date)}</TD><TD className="font-semibold">{d.supplies.find((s) => s.id === e.supplyId)?.name}</TD><TD>{e.kind === 'restocked' ? 'Restocked' : SUPPLY_LABEL[e.to]}</TD><TD>{e.by}</TD></TR>)}</tbody></Table></Card></Section>
  )
}
export { mondayOf }
