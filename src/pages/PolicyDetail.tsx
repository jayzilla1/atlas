import { useParams, Link } from 'react-router-dom'
import { BellRing, Download, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/ui/Page'
import { Card, CardHeader, DescriptionList, PlainEnglish, Callout } from '@/components/ui/Card'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toast'
import { PersonLink, EntityChip } from '@/components/domain/entities'
import { useStore } from '@/state/store'
import { getPolicy, hasAcknowledged, policyAckStats, policyRequiredPeople } from '@/data/policies'
import { daysFromToday, formatDate, relativeDay } from '@/utils/dates'
import { usePageTitle } from '@/hooks/usePage'
import { NotFoundPage } from './NotFound'
import { isOpenRisk } from '@/data/risks'

export function PolicyDetailPage() {
  const { id } = useParams(); const s = useStore(); const toast = useToast()
  const p = getPolicy(id)
  usePageTitle(p?.name ?? 'Policy not found')
  if (!p) return <NotFoundPage what="policy" />
  const edit = s.permission('settings.manage'); const remind = s.permission('tasks.write')
  const stats = policyAckStats(p.id)
  const pending = policyRequiredPeople(p.id).filter((x) => !hasAcknowledged(x.id, p.id))
  const overdue = daysFromToday(p.nextReview) < 0
  const risks = s.risks.filter((r) => isOpenRisk(r) && r.related.some((x) => x.type === 'policy' && x.id === p.id))
  const pct = Math.round((stats.acknowledged / stats.required) * 100)
  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Policies', to: '/policies' }, { label: p.name }]}
        eyebrow={<div className="flex gap-2"><StatusBadge status={p.status} /><Badge>Version {p.version}</Badge><Badge>Applies to {p.appliesTo.toLowerCase()}</Badge></div>}
        title={p.name} description={p.summary}
        actions={<><Button iconLeft={<Download className="h-4 w-4" />} onClick={() => toast({ title: 'Download started', description: `${p.name} v${p.version}.pdf` })}>Download PDF</Button>
          <Button variant="primary" iconLeft={<Pencil className="h-4 w-4" />} disabledReason={edit.allowed ? undefined : edit.reason} onClick={() => toast({ tone: 'info', title: 'Editing is disabled in this demo', description: 'In a real workspace this opens the policy editor.' })}>Edit policy</Button></>} />
      {overdue && <Callout tone="warning" className="mb-5" title={`This policy was due for review ${relativeDay(p.nextReview)}`}>Out-of-date policies are a common audit finding. {risks.map((r) => <Link key={r.id} to={`/risks/${r.id}`} className="font-medium text-ink-link underline">See {r.id}.</Link>)}</Callout>}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <PlainEnglish title="What this policy says, in plain English"><ul className="list-disc space-y-1 pl-5">{p.keyPoints.map((k) => <li key={k}>{k}</li>)}</ul></PlainEnglish>
          <Card aria-labelledby="doc-h"><CardHeader id="doc-h" title="Policy document" description={`Version ${p.version} · updated ${formatDate(p.lastUpdated)}`} />
            <article className="max-w-prose space-y-4 text-body-lg text-ink">
              <section><h3 className="text-title-3">1. Purpose</h3><p className="mt-1 text-ink-secondary">{p.summary} This policy exists so that everyone at Harborlight Software understands what is expected and so the company can show customers and auditors that it follows its own rules.</p></section>
              <section><h3 className="text-title-3">2. Scope</h3><p className="mt-1 text-ink-secondary">This policy applies to {p.appliesTo === 'Everyone' ? 'all employees and contractors' : p.appliesTo.toLowerCase()} and to any system or data they use for Harborlight work.</p></section>
              <section><h3 className="text-title-3">3. Requirements</h3><ol className="mt-1 list-decimal space-y-1.5 pl-5 text-ink-secondary">{p.keyPoints.map((k) => <li key={k}>{k}</li>)}</ol></section>
              <section><h3 className="text-title-3">4. Exceptions</h3><p className="mt-1 text-ink-secondary">Exceptions must be requested in writing, approved by the policy owner, and recorded in Atlas with an end date.</p></section>
              <section><h3 className="text-title-3">5. Enforcement</h3><p className="mt-1 text-ink-secondary">Concerns are raised with the policy owner. Repeated or deliberate violations are handled by People Operations.</p></section>
            </article></Card>
        </div>
        <aside className="space-y-5">
          <Card aria-labelledby="ack-h"><CardHeader id="ack-h" title="Acknowledgements" description="Employees who confirmed they have read this policy." />
            {p.status === 'draft' ? <p className="text-body text-ink-secondary">Acknowledgements start once the policy is published.</p> : <>
              <p className="text-title-1 tabular-nums">{pct}%</p><p className="mb-2 text-body-sm text-ink-secondary">{stats.acknowledged} of {stats.required} people</p>
              <ProgressBar value={stats.acknowledged} max={stats.required} label="Acknowledged" tone={pct >= 95 ? 'success' : 'warning'} />
              {pending.length > 0 && <div className="mt-4"><p className="mb-2 text-body-sm font-medium">Still to acknowledge ({pending.length})</p>
                <ul className="space-y-1.5">{pending.slice(0, 5).map((x) => <li key={x.id}><PersonLink id={x.id} subtitle="" size="xs" /></li>)}</ul>{pending.length > 5 && <p className="mt-1 text-caption text-ink-secondary">+ {pending.length - 5} more</p>}
                <Button className="mt-3 w-full" iconLeft={<BellRing className="h-4 w-4" />} disabledReason={remind.allowed ? undefined : remind.reason} onClick={() => toast({ tone: 'success', title: 'Reminders sent', description: `${pending.length} people were asked to acknowledge ${p.name}.` })}>Send reminder to {pending.length}</Button></div>}</>}
          </Card>
          <Card aria-labelledby="pd-h"><CardHeader id="pd-h" title="Details" />
            <DescriptionList items={[{ label: 'Owner', value: <PersonLink id={p.ownerId} subtitle="" /> }, { label: 'Last updated', value: formatDate(p.lastUpdated) }, { label: 'Next review', value: `${formatDate(p.nextReview)} (${relativeDay(p.nextReview)})` }, { label: 'Applies to', value: p.appliesTo }]} /></Card>
          {risks.length > 0 && <Card><p className="mb-2 text-body-sm font-medium">Open risks</p><div className="flex flex-wrap gap-2">{risks.map((r) => <EntityChip key={r.id} entity={{ type: 'risk', id: r.id }} />)}</div></Card>}
        </aside>
      </div>
    </>
  )
}
