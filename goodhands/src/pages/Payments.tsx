import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CircleCheck, MoreHorizontal, Wallet } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button, IconButton } from '@/components/ui/Button'
import { Menu } from '@/components/ui/Menu'
import { Segmented } from '@/components/ui/Tabs'
import { Card, Section } from '@/components/ui/Card'
import { Metric } from '@/components/ui/Metric'
import { EmptyState } from '@/components/ui/States'
import { Table, THead, TR, TH, TD } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { PaymentBadge } from '@/components/domain/Status'
import { ChildCell } from '@/components/domain/AttendanceParts'
import { useActions, useData } from '@/state/store'
import { useSession } from '@/state/session'
import { useDialogs } from '@/state/dialogs'
import { paymentStatus, paymentSummary, paymentsForWeek } from '@/domain/payments'
import { addDays, fmtFull, fmtMonthDay, mondayOf } from '@/utils/dates'
import { money } from '@/utils/format'
import type { Payment, PaymentStatus } from '@/types'

type F = 'all' | PaymentStatus
const METHOD = { cash: 'Cash', check: 'Check', zelle: 'Zelle', card: 'Card' }

export default function Payments() { return <Page id="payments"><Screen /></Page> }

function Screen() {
  const d = useData()
  const act = useActions()
  const toast = useToast()
  const dialogs = useDialogs()
  const { today, now } = useSession()
  const [params, setParams] = useSearchParams()
  const thisWeek = mondayOf(today)
  const week = params.get('week') ?? thisWeek
  const [f, setF] = useState<F>('all')
  const rows = useMemo(() => paymentsForWeek(d, week).map((p) => ({ p, child: d.children.find((c) => c.id === p.childId)!, status: paymentStatus(p, today) })).sort((a, b) => ['overdue', 'due', 'paid'].indexOf(a.status) - ['overdue', 'due', 'paid'].indexOf(b.status) || a.child.firstName.localeCompare(b.child.firstName)), [d, week, today])
  const sum = paymentSummary(rows.map((r) => r.p), today)
  const shown = rows.filter((r) => f === 'all' || r.status === f)
  const earlier = d.payments.filter((p) => !p.paidOn && p.weekStart < week).length
  const earliestWeek = d.payments.reduce((m, p) => (p.weekStart < m ? p.weekStart : m), thisWeek)
  const go = (w: string) => setParams(w === thisWeek ? {} : { week: w }, { replace: true })

  const markPaid = (p: Payment, name: string) => {
    act.markPaid(p.id, today)
    toast({ title: `${name}’s payment marked as paid`, description: `${money(p.amount)} · ${fmtMonthDay(today)}`, action: { label: 'Undo', onClick: () => act.markUnpaid(p.id) } })
  }
  void now

  return (
    <>
      <PageHeader title="Payments" description="Who has paid, who hasn’t. GoodHands tracks payments — it never moves money."
        actions={
          <div className="flex items-center gap-1.5" role="group" aria-label="Choose week">
            <IconButton label="Previous week" variant="secondary" disabled={week <= earliestWeek} onClick={() => go(addDays(week, -7))}><ChevronLeft className="h-4 w-4" /></IconButton>
            <span className="min-w-[10rem] text-center text-small font-semibold">Week of {fmtMonthDay(week)}{week === thisWeek && ' · This week'}</span>
            <IconButton label="Next week" variant="secondary" disabled={week >= thisWeek} onClick={() => go(addDays(week, 7))}><ChevronRight className="h-4 w-4" /></IconButton>
          </div>
        } />

      <div role="group" aria-label="Payment summary" className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="Enrolled" value={sum.enrolled} />
        <Metric label="Paid" value={sum.paid} />
        <Metric label="Due" value={sum.due} tone={sum.due ? 'warning' : 'neutral'} />
        <Metric label="Overdue" value={sum.overdue} tone={sum.overdue ? 'danger' : 'neutral'} />
        <Metric label="Still to collect" value={money(sum.outstanding)} hint={`${money(sum.collected)} collected`} />
      </div>

      {earlier > 0 && week === thisWeek && <p role="note" className="mb-4 rounded-md bg-danger-bg px-3 py-2.5 text-small font-semibold text-danger-text">{earlier} unpaid payment{earlier > 1 ? 's' : ''} from earlier weeks — use ← to review.</p>}

      <div className="mb-4"><Segmented<F> label="Filter payments" value={f} onChange={setF} items={[{ id: 'all', label: 'All', count: rows.length }, { id: 'paid', label: 'Paid', count: sum.paid }, { id: 'due', label: 'Due', count: sum.due }, { id: 'overdue', label: 'Overdue', count: sum.overdue }]} /></div>

      {rows.length === 0 ? <EmptyState icon={<Wallet />} title="No payments for this week" /> : shown.length === 0 ? (
        <EmptyState icon={<CircleCheck />} title={f === 'overdue' ? 'Nothing overdue' : `No ${f} payments`} description="Nice — nothing to follow up on here." action={<Button onClick={() => setF('all')}>Show everyone</Button>} />
      ) : (
        <>
          <Card padded={false} className="hidden lg:block">
            <Table caption={`Payments for the week of ${fmtFull(week)}`}>
              <THead><TR><TH>Child</TH><TH align="right">Amount</TH><TH>Status</TH><TH>Paid on</TH><TH>Method</TH><TH>Note</TH><TH className="text-right"><span className="sr-only">Actions</span></TH></TR></THead>
              <tbody>
                {shown.map(({ p, child, status }) => (
                  <TR key={p.id}>
                    <TD><ChildCell child={child} date={today} compact /></TD>
                    <TD align="right" className="font-semibold">{money(p.amount)}</TD>
                    <TD><span key={status} className="inline-block anim-pop"><PaymentBadge status={status} /></span><p className="mt-1 text-caption text-ink-secondary">Due {fmtMonthDay(p.dueDate)}</p></TD>
                    <TD className="whitespace-nowrap">{p.paidOn ? fmtMonthDay(p.paidOn) : '—'}</TD>
                    <TD>{p.method ? METHOD[p.method] : '—'}</TD>
                    <TD className="max-w-[16rem] text-ink-secondary">{p.note ?? ''}</TD>
                    <TD className="w-px whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {!p.paidOn && <Button variant={status === 'overdue' ? 'primary' : 'secondary'} onClick={() => markPaid(p, child.firstName)} aria-label={`Mark ${child.firstName}'s payment as paid`}>Mark as Paid</Button>}
                        <Menu label={`More for ${child.firstName}`} trigger={(t) => <IconButton {...t} label={`More actions for ${child.firstName}`} tooltip={false}><MoreHorizontal className="h-5 w-5" /></IconButton>} items={[{ label: 'Payment details…', onSelect: () => dialogs.editPayment(p.id) }]} />
                      </div>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
          <ul className="space-y-3 lg:hidden" aria-label="Payments">
            {shown.map(({ p, child, status }) => (
              <li key={p.id} className="rounded-lg border border-line bg-surface p-3.5">
                <div className="flex items-start justify-between gap-3"><ChildCell child={child} date={today} compact /><PaymentBadge status={status} /></div>
                <p className="mt-2 flex justify-between text-small"><span className="font-semibold tabular-nums">{money(p.amount)}</span><span className="text-ink-secondary">{p.paidOn ? `Paid ${fmtMonthDay(p.paidOn)}${p.method ? ` · ${METHOD[p.method]}` : ''}` : `Due ${fmtMonthDay(p.dueDate)}`}</span></p>
                {p.note && <p className="mt-1 text-small text-ink-secondary">{p.note}</p>}
                <div className="mt-3 flex gap-2">{!p.paidOn && <Button size="lg" variant={status === 'overdue' ? 'primary' : 'secondary'} className="flex-1" onClick={() => markPaid(p, child.firstName)}>Mark as Paid</Button>}<Button size="lg" onClick={() => dialogs.editPayment(p.id)}>Details</Button></div>
              </li>
            ))}
          </ul>
        </>
      )}
      <Section title="Monthly totals" description="Collected vs. still outstanding, by month." className="mt-10"><MonthlyTotals /></Section>
    </>
  )
}

function MonthlyTotals() {
  const d = useData()
  const { today } = useSession()
  const months = useMemo(() => {
    const m = new Map<string, { collected: number; outstanding: number }>()
    for (const p of d.payments) {
      const key = p.weekStart.slice(0, 7)
      const e = m.get(key) ?? { collected: 0, outstanding: 0 }
      if (p.paidOn) e.collected += p.amount; else e.outstanding += p.amount
      m.set(key, e)
    }
    return [...m.entries()].sort()
  }, [d.payments])
  void today
  const names: Record<string, string> = { '08': 'August', '09': 'September', '10': 'October' }
  return (
    <Card padded={false}>
      <Table caption="Monthly payment totals">
        <THead><TR><TH>Month</TH><TH align="right">Collected</TH><TH align="right">Outstanding</TH></TR></THead>
        <tbody>{months.map(([k, v]) => <TR key={k}><TD className="font-semibold">{names[k.slice(5)]} {k.slice(0, 4)}</TD><TD align="right">{money(v.collected)}</TD><TD align="right" className={v.outstanding ? 'font-semibold text-danger-text' : 'text-ink-secondary'}>{v.outstanding ? money(v.outstanding) : '—'}</TD></TR>)}</tbody>
      </Table>
    </Card>
  )
}
