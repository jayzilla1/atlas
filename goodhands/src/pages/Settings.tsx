import { Check, X } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, Section } from '@/components/ui/Card'
import { Field, Input, Select, Toggle } from '@/components/ui/Form'
import { Badge } from '@/components/ui/Badge'
import { Table, THead, TR, TH, TD } from '@/components/ui/Table'
import { RestrictedState } from '@/components/ui/States'
import { useActions, useData } from '@/state/store'
import { useSession } from '@/state/session'
import { can, PERMISSION_ROWS, roleHas } from '@/state/permissions'
import { employeeName } from '@/domain/people'

export default function Settings() {
  const { role } = useSession()
  if (!can(role, 'settings')) return <RestrictedState area="Settings" />
  return <Page id="settings"><Screen /></Page>
}

function Screen() {
  const d = useData()
  const act = useActions()
  const s = d.settings
  return (
    <>
      <PageHeader title="Settings" description="Only settings that change how GoodHands behaves are here." />
      <div className="max-w-3xl space-y-10">
        <Section title="Daycare" headingLevel={2}>
          <Card className="grid gap-4 sm:grid-cols-2">
            <Field label="Daycare name">{(p) => <Input {...p} value={s.daycareName} onChange={(e) => act.updateSettings({ daycareName: e.target.value })} />}</Field>
            <Field label="Owner name">{(p) => <Input {...p} value={s.ownerName} onChange={(e) => act.updateSettings({ ownerName: e.target.value })} />}</Field>
          </Card>
        </Section>
        <Section title="Attendance & routines" description="These change what the product does today.">
          <Card className="divide-y divide-line-subtle !py-2">
            <div className="py-3"><Field label="Late arrival grace period" hint="A child is marked Late when they arrive this many minutes after their expected time.">{(p) => <Select {...p} className="max-w-xs" value={s.graceMinutes} onChange={(e) => act.updateSettings({ graceMinutes: +e.target.value })}>{[5, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n} minutes</option>)}</Select>}</Field></div>
            <div className="py-3"><Field label="Blanket Day reminder" hint="How early the reminder appears on Home.">{(p) => <Select {...p} className="max-w-xs" value={s.blanketLeadDays} onChange={(e) => act.updateSettings({ blanketLeadDays: +e.target.value })}>{[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n === 0 ? 'On the day' : `${n} day${n > 1 ? 's' : ''} before`}</option>)}</Select>}</Field></div>
            <div className="py-3"><Field label="Closeout prompt for staff" hint="Staff see a gentle “ready to wrap up?” banner this long before their shift ends.">{(p) => <Select {...p} className="max-w-xs" value={s.closeoutNudgeMinutes} onChange={(e) => act.updateSettings({ closeoutNudgeMinutes: +e.target.value })}>{[15, 30, 45, 60].map((n) => <option key={n} value={n}>{n} minutes before</option>)}</Select>}</Field></div>
            <Toggle checked={s.showStaffOnHome} onChange={(v) => act.updateSettings({ showStaffOnHome: v })} label="Show staff progress on Home" description="An optional glance at who’s on shift and how tasks are going." />
          </Card>
        </Section>
        <Section title="Roles & permissions" description="What each role can see. Employees get a simplified experience.">
          <Card padded={false}>
            <Table caption="Permissions by role">
              <THead><TR><TH>Can…</TH><TH className="text-center">Owner</TH><TH className="text-center">Employee</TH><TH className="text-center">Parent <Badge tone="neutral" size="sm">Planned</Badge></TH></TR></THead>
              <tbody>{PERMISSION_ROWS.map((r) => (
                <TR key={r.label}>
                  <TD><p className="font-semibold">{r.label}</p><p className="text-caption text-ink-secondary">{r.detail}</p></TD>
                  <Cell yes={roleHas('owner', r.cap)} /><Cell yes={roleHas('staff', r.cap)} /><td className="px-3 py-3 text-center text-ink-tertiary"><span aria-label="Not yet available">—</span></td>
                </TR>
              ))}</tbody>
            </Table>
          </Card>
          <p className="mt-3 text-small text-ink-secondary">Parents will get their own limited view in a future version — the permission system is built to add them without changing existing screens.</p>
        </Section>
        <Section title="People with access">
          <Card padded={false} className="divide-y divide-line-subtle">
            <div className="flex items-center justify-between px-4 py-3"><span className="font-semibold">{s.ownerName}</span><Badge tone="primary">Owner</Badge></div>
            {d.employees.map((e) => <div key={e.id} className="flex items-center justify-between px-4 py-3"><span>{employeeName(e)}</span><Badge tone="neutral">Employee</Badge></div>)}
          </Card>
        </Section>
      </div>
    </>
  )
}
function Cell({ yes }: { yes: boolean }) {
  return <td className="px-3 py-3 text-center">{yes ? <span className="inline-flex items-center gap-1 text-success-text"><Check className="h-4 w-4" aria-hidden /><span className="sr-only">Yes</span></span> : <span className="inline-flex items-center gap-1 text-ink-tertiary"><X className="h-4 w-4" aria-hidden /><span className="sr-only">No</span></span>}</td>
}
