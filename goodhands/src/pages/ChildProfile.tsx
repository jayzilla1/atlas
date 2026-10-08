import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Mail, MapPin, Phone, Plane } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { PageHeader } from '@/components/ui/PageHeader'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, DetailList, Section } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/States'
import { Table, THead, TR, TH, TD } from '@/components/ui/Table'
import { AttendanceBadge, PaymentBadge } from '@/components/domain/Status'
import { DiaperControl } from '@/components/domain/DiaperControl'
import { DocumentCard } from '@/components/domain/DocumentCard'
import { useData } from '@/state/store'
import { useSession } from '@/state/session'
import { useDialogs } from '@/state/dialogs'
import { attendanceView, ABSENCE_LABEL } from '@/domain/attendance'
import { childIssues } from '@/domain/documents'
import { childName } from '@/domain/people'
import { paymentStatus } from '@/domain/payments'
import { eachDay, fmtAge, fmtFull, fmtLong, fmtMonthDay, fmtRange, fmtTime, isWeekend, addDays, WEEKDAYS_SHORT } from '@/utils/dates'
import { money } from '@/utils/format'

type Tab = 'overview' | 'health' | 'attendance' | 'supplies' | 'documents'

export default function ChildProfile() { return <Page id="child-profile"><Screen /></Page> }

function Screen() {
  const { id } = useParams()
  const d = useData()
  const { now } = useSession()
  const dialogs = useDialogs()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) ?? 'overview'
  const c = d.children.find((x) => x.id === id)
  const history = useMemo(() => {
    if (!c) return []
    return eachDay(addDays(now.date, -27), now.date).filter((x) => !isWeekend(x)).reverse().map((date) => ({ date, view: attendanceView(d, c, date, now) })).filter((r) => r.view.status !== 'not_scheduled')
  }, [d, c, now])
  if (!c) return <EmptyState title="Child not found" description="This record may have been removed." />

  const view = attendanceView(d, c, now.date, now)
  const issues = childIssues(d, c, now.date)
  const docs = d.documents.filter((x) => x.ownerType === 'child' && x.ownerId === c.id)
  const pays = d.payments.filter((p) => p.childId === c.id).sort((a, b) => b.weekStart.localeCompare(a.weekStart)).slice(0, 6)
  const away = d.absences.filter((a) => a.childId === c.id).sort((a, b) => b.start.localeCompare(a.start))
  const notices = d.notices.filter((n) => n.childId === c.id)
  const attended = history.filter((h) => ['present', 'late', 'checked_out'].includes(h.view.status)).length
  const lates = history.filter((h) => (h.view.lateMinutes ?? 0) > 0).length
  const guardians = c.guardians

  return (
    <>
      <PageHeader
        breadcrumbs={<Breadcrumbs items={[{ label: 'Children', to: '/children' }, { label: childName(c) }]} />}
        title={<span className="flex items-center gap-4"><Avatar first={c.firstName} last={c.lastName} tint={c.tint} size="lg" />{childName(c)}</span>}
        description={`${fmtAge(c.dob, now.date, 'long')} · born ${fmtFull(c.dob)}`}
        actions={<><AttendanceBadge view={view} /><Button icon={<Plane className="h-4 w-4" />} onClick={() => dialogs.markAway(c.id, now.date)}>Mark away</Button></>}
      />
      {issues.length > 0 && (
        <div role="note" className="mb-5 rounded-lg border border-warning/40 bg-warning-bg/60 p-4">
          <p className="flex items-center gap-2 font-semibold text-warning-text"><AlertTriangle className="h-4 w-4" aria-hidden />This record needs {issues.length === 1 ? 'one thing' : `${issues.length} things`}</p>
          <ul className="mt-1 list-disc pl-9 text-small text-warning-text">{issues.map((i) => <li key={i.text}>{i.text}</li>)}</ul>
        </div>
      )}
      <Tabs<Tab> label="Child record" idBase="child" value={tab} onChange={(v) => setParams({ tab: v }, { replace: true })} items={[
        { id: 'overview', label: 'Overview' }, { id: 'health', label: 'Health', count: c.allergies.length + c.medications.length || undefined }, { id: 'attendance', label: 'Attendance' },
        { id: 'supplies', label: 'Supplies' }, { id: 'documents', label: 'Documents', count: docs.filter((x) => x.missing).length || undefined },
      ]} />
      <div role="tabpanel" id={`child-panel-${tab}`} tabIndex={0} className="pt-6 focus-visible:outline-offset-4">
        {tab === 'overview' && (
          <div className="grid gap-8 lg:grid-cols-2">
            <Section title="Parents & guardians" headingLevel={3}>
              <div className="space-y-3">
                {guardians.map((g) => (
                  <Card key={g.email}>
                    <p className="font-semibold">{g.name} <span className="font-normal text-ink-secondary">· {g.relationship}</span>{g.primary && <Badge tone="primary" className="ml-2" size="sm">Primary</Badge>}</p>
                    <p className="mt-1 flex items-center gap-2 text-small"><Phone className="h-3.5 w-3.5 text-ink-tertiary" aria-hidden /><a className="underline-offset-2 hover:underline" href={`tel:${g.phone.replace(/[^\d]/g, '')}`}>{g.phone}</a></p>
                    <p className="flex items-center gap-2 text-small"><Mail className="h-3.5 w-3.5 text-ink-tertiary" aria-hidden /><a className="underline-offset-2 hover:underline" href={`mailto:${g.email}`}>{g.email}</a></p>
                  </Card>
                ))}
              </div>
            </Section>
            <div className="space-y-8">
              <Section title="Contact & emergency" headingLevel={3}>
                <Card className="space-y-4">
                  <DetailList columns={1} items={[
                    { label: 'Address', value: <span className="flex items-start gap-2"><MapPin className="mt-1 h-4 w-4 shrink-0 text-ink-tertiary" aria-hidden />{c.address}</span> },
                    { label: 'Emergency contact', value: c.emergencyContact ? <>{c.emergencyContact.name} <span className="text-ink-secondary">({c.emergencyContact.relationship})</span><br />{c.emergencyContact.phone}</> : <Badge tone="danger" icon={<AlertTriangle />}>Missing — ask the family</Badge> },
                    { label: 'Authorized pickup', value: c.authorizedPickup.join(', ') },
                  ]} />
                </Card>
              </Section>
              <Section title="Enrollment" headingLevel={3}>
                <Card><DetailList items={[
                  { label: 'Enrolled', value: fmtFull(c.enrolledOn) },
                  { label: 'Days', value: c.schedule.days.map((x) => WEEKDAYS_SHORT[x]).join(', ') },
                  { label: 'Expected hours', value: `${fmtTime(c.schedule.arrival)} – ${fmtTime(c.schedule.departure)}` },
                  { label: 'Weekly tuition', value: `${money(c.billing.weeklyRate)} · due ${WEEKDAYS_SHORT[c.billing.dueWeekday]}` },
                ]} /></Card>
              </Section>
              {c.notes && <Section title="Notes" headingLevel={3}><Card><p>{c.notes}</p></Card></Section>}
            </div>
          </div>
        )}
        {tab === 'health' && (
          <div className="grid max-w-3xl gap-6">
            <Card><DetailList columns={1} items={[
              { label: 'Allergies', value: c.allergies.length ? <span className="flex flex-wrap gap-2">{c.allergies.map((a) => <Badge key={a} tone="danger" icon={<AlertTriangle />}>{a}</Badge>)}</span> : 'None reported' },
              { label: 'Medications', value: c.medications.length ? <ul className="list-disc pl-5">{c.medications.map((m) => <li key={m}>{m}</li>)}</ul> : 'None' },
              { label: 'Health notes', value: c.healthNotes ?? 'None reported' },
            ]} /></Card>
            <p className="text-small text-ink-secondary">Employees see allergies and medications on a limited “care card” — they never see this full record.</p>
          </div>
        )}
        {tab === 'attendance' && (
          <div className="space-y-8">
            <p className="text-small text-ink-secondary">Last 4 weeks: <strong className="text-ink">{attended}</strong> days attended · <strong className="text-ink">{lates}</strong> late arrivals</p>
            <Section title="Daily history" headingLevel={3}>
              <Card padded={false}>
                <Table caption={`${c.firstName}'s attendance, last four weeks`}>
                  <THead><TR><TH>Date</TH><TH>Status</TH><TH>In</TH><TH>Out</TH></TR></THead>
                  <tbody>{history.map((h) => <TR key={h.date}><TD>{fmtLong(h.date)}</TD><TD><AttendanceBadge view={h.view} size="sm" /></TD><TD className="whitespace-nowrap tabular-nums">{fmtTime(h.view.record?.checkIn)}</TD><TD className="whitespace-nowrap tabular-nums">{fmtTime(h.view.record?.checkOut)}</TD></TR>)}</tbody>
                </Table>
              </Card>
            </Section>
            <Section title="Absences & vacations" headingLevel={3}>
              {away.length === 0 ? <p className="text-small text-ink-secondary">No absences recorded.</p> : (
                <ul className="divide-y divide-line-subtle rounded-lg border border-line bg-surface">{away.map((a) => <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3"><Badge tone="neutral">{ABSENCE_LABEL[a.kind]}</Badge><span className="font-semibold">{fmtRange(a.start, a.end)}</span>{a.note && <span className="text-small text-ink-secondary">{a.note}</span>}</li>)}</ul>
              )}
            </Section>
            <Section title="Recent payments" headingLevel={3}>
              <ul className="divide-y divide-line-subtle rounded-lg border border-line bg-surface">{pays.map((p) => <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3"><span>Week of {fmtMonthDay(p.weekStart)} · <span className="tabular-nums">{money(p.amount)}</span></span><PaymentBadge status={paymentStatus(p, now.date)} /></li>)}</ul>
            </Section>
          </div>
        )}
        {tab === 'supplies' && (
          <div className="max-w-2xl space-y-8">
            <Section title="Diapers" headingLevel={3}><Card><DiaperControl child={c} /></Card></Section>
            {c.diaper && (
              <Section title="Notification history" headingLevel={3}>
                {notices.length === 0 ? <p className="text-small text-ink-secondary">The family hasn’t been notified about supplies yet.</p> : (
                  <ul className="divide-y divide-line-subtle rounded-lg border border-line bg-surface">{notices.map((n) => <li key={n.id} className="px-4 py-3"><p className="font-semibold">{n.kind === 'diapers_out' ? 'Diapers out' : 'Diapers running low'} · {fmtMonthDay(n.date)}, {fmtTime(n.time)}</p><p className="text-small text-ink-secondary">By {n.by} · {n.channel === 'in_person' ? 'Told in person' : n.channel === 'simulated_email' ? 'Email (simulated)' : 'Text (simulated)'}</p><p className="mt-1 text-small">“{n.message}”</p></li>)}</ul>
                )}
              </Section>
            )}
          </div>
        )}
        {tab === 'documents' && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{docs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}</div>
        )}
      </div>
    </>
  )
}
