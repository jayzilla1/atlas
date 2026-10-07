import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, FileSearch, FilePlus2, XCircle, MinusCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/Page'
import { Card, CardHeader, Callout, DescriptionList, PlainEnglish } from '@/components/ui/Card'
import { SeverityBadge, StatusBadge, StatusIndicator } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/Feedback'
import { Term } from '@/components/ui/Tooltip'
import { useToast } from '@/components/ui/Toast'
import { EntityChip, PersonLink } from '@/components/domain/entities'
import { TaskModal } from '@/components/domain/TaskModal'
import { useRiskLevels } from '@/components/domain/riskLevels'
import { useStore } from '@/state/store'
import { getVendor } from '@/data/vendors'
import { isOpenRisk } from '@/data/risks'
import { daysFromToday, formatDate, relativeDay, dueLabel } from '@/utils/dates'
import { money } from '@/utils/format'
import { usePageTitle } from '@/hooks/usePage'
import { NotFoundPage } from './NotFound'
import { docTerm } from './Vendors'
import { PriorityBadge } from '@/components/domain/Badges'
import { Link } from 'react-router-dom'

const DOC_EXPLAINER: Record<string, string> = {
  'SOC 2 Type II': 'A security report showing whether a service provider has controls in place to protect customer information. “Type II” means an independent auditor tested those controls over several months.',
  'SOC 2 Type I': 'Like a SOC 2 Type II report, but the auditor only checked controls on a single day, so it gives less assurance.',
  'ISO 27001': 'An international certificate showing the vendor runs a formal, audited information-security programme.',
  'PCI attestation': 'A statement that the vendor meets the card-industry rules for safely handling payment details.',
  'Pen test summary': 'A summary from a “penetration test” — authorised experts try to break in, to find weaknesses before criminals do.',
  'Security questionnaire': 'The vendor’s own written answers about its security practices. Useful, but not independently verified.',
  'None required': 'This vendor doesn’t touch company data, so no security report is needed.',
}

export function VendorDetailPage() {
  const { id } = useParams(); const s = useStore(); const toast = useToast(); const lv = useRiskLevels()
  const v = getVendor(id)
  usePageTitle(v?.name ?? 'Vendor not found')
  const [task, setTask] = useState(false)
  if (!v) return <NotFoundPage what="vendor" />
  const perm = s.permission('tasks.write')
  const risks = s.risks.filter((r) => r.related.some((x) => x.type === 'vendor' && x.id === v.id))
  const tasks = s.tasks.filter((t) => t.entity?.type === 'vendor' && t.entity.id === v.id && t.status !== 'completed')
  const doc = v.securityDoc; const needsDoc = doc.type !== 'None required'
  const needsDpa = v.dataAccess === 'Employee data' || v.dataAccess === 'Customer data'
  const checklist = [
    { label: 'Security documentation is current', ok: !needsDoc || doc.status === 'valid', na: !needsDoc, detail: needsDoc ? `${doc.type} — ${doc.status}${doc.expiresOn ? `, ${daysFromToday(doc.expiresOn) < 0 ? 'expired' : 'expires'} ${relativeDay(doc.expiresOn)}` : ''}` : 'Not required for this vendor' },
    { label: 'Data processing agreement signed', ok: !needsDpa || v.dpa, na: !needsDpa, detail: needsDpa ? (v.dpa ? 'Signed agreement on file' : 'No signed agreement found') : 'Vendor doesn’t handle personal data' },
    { label: 'Contract is active', ok: v.contract.status === 'active', detail: `${v.contract.status.replace('_', ' ')} · ends ${formatDate(v.contract.end)}` },
    { label: 'Review is up to date', ok: v.reviewStatus === 'current' || v.reviewStatus === 'due_soon', detail: `Next review ${formatDate(v.nextReview)} (${relativeDay(v.nextReview)})` },
  ]
  const passed = checklist.filter((c) => c.ok).length

  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Vendors', to: '/vendors' }, { label: v.name }]}
        eyebrow={<div className="flex flex-wrap items-center gap-2"><SeverityBadge severity={lv.forVendor(v.id)} /><StatusBadge status={v.reviewStatus} label={`Review ${v.reviewStatus.replace('_', ' ')}`} /></div>}
        title={v.name} description={v.description}
        actions={<><Button iconLeft={<FilePlus2 className="h-4 w-4" />} disabledReason={perm.allowed ? undefined : perm.reason} onClick={() => setTask(true)}>Request updated report</Button>
          <Button variant="primary" iconLeft={<FileSearch className="h-4 w-4" />} disabledReason={s.permission('risks.write').allowed ? undefined : s.permission('risks.write').reason} onClick={() => toast({ tone: 'success', title: 'Vendor review started', description: `${v.name}’s checklist is open for ${s.personById(v.ownerId)?.name}.` })}>Start review</Button></>} />
      {(doc.status === 'expired' || doc.status === 'expiring') && <Callout className="mb-5" tone={doc.status === 'expired' ? 'critical' : 'warning'} title={doc.status === 'expired' ? 'The security report has expired' : 'The security report expires soon'}>
        {docTerm(doc.type)} {doc.status === 'expired' ? 'ran out' : 'runs out'} {doc.expiresOn && relativeDay(doc.expiresOn)}. Ask {v.name} for a current one. {risks.filter(isOpenRisk).map((r) => <Link key={r.id} to={`/risks/${r.id}`} className="font-medium text-ink-link underline">See {r.id}.</Link>)}</Callout>}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card aria-labelledby="chk-h">
            <CardHeader id="chk-h" title="Review checklist" description="What a vendor review checks, and how this vendor measures up." />
            <ProgressBar value={passed} max={checklist.length} tone={passed === checklist.length ? 'success' : 'warning'} label="Checklist passed" />
            <p className="mb-3 mt-1.5 text-body-sm text-ink-secondary">{passed} of {checklist.length} checks passed</p>
            <ul className="divide-y divide-line rounded-lg border border-line">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-start gap-3 p-3.5">
                  {c.na ? <MinusCircle className="mt-0.5 h-5 w-5 shrink-0 text-ink-tertiary" aria-hidden /> : c.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-fg" aria-hidden /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-critical-fg" aria-hidden />}
                  <div><p className="text-body font-medium">{c.label} <span className="sr-only">— {c.na ? 'not applicable' : c.ok ? 'passed' : 'failed'}</span></p><p className="text-body-sm text-ink-secondary">{c.detail}</p></div>
                  <span className="ml-auto shrink-0 text-caption font-semibold text-ink-secondary" aria-hidden>{c.na ? 'N/A' : c.ok ? 'Pass' : 'Fail'}</span>
                </li>))}
            </ul>
          </Card>
          <PlainEnglish title={`What is a “${doc.type}”?`}>{DOC_EXPLAINER[doc.type] ?? 'A document the vendor provides to show it protects information.'}</PlainEnglish>
          <Card aria-labelledby="vr-h"><CardHeader id="vr-h" title="Related risks" />
            {risks.length === 0 ? <p className="text-body text-ink-secondary">No risks reference {v.name}.</p> : <ul className="space-y-2">{risks.map((r) => <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3"><SeverityBadge severity={r.severity} /><EntityChip entity={{ type: 'risk', id: r.id }} className="min-w-0 flex-1" /><StatusBadge status={r.status} /></li>)}</ul>}</Card>
        </div>
        <aside className="space-y-5">
          <Card aria-labelledby="vd-h"><CardHeader id="vd-h" title="Details" />
            <DescriptionList items={[
              { label: 'Relationship owner', value: <PersonLink id={v.ownerId} subtitle="" /> }, { label: 'Category', value: v.category }, { label: 'Data they can access', value: v.dataAccess },
              { label: 'Security documentation', value: <div><StatusIndicator status={doc.status} /><p className="text-caption text-ink-secondary">{docTerm(doc.type)}</p></div> },
              { label: <Term id="dpa">Data processing agreement</Term>, value: needsDpa ? (v.dpa ? <StatusIndicator tone="success" label="Signed" status="valid" /> : <StatusIndicator status="missing" label="Not found" />) : 'Not needed' },
              { label: 'Contract', value: `${formatDate(v.contract.start)} → ${formatDate(v.contract.end)}` }, { label: 'Annual value', value: money(v.contract.annualValue) },
              { label: 'Last reviewed', value: formatDate(v.lastReview) }, { label: 'Next review', value: `${formatDate(v.nextReview)} (${relativeDay(v.nextReview)})` },
            ]} /></Card>
          {v.appId && <Card><p className="mb-2 text-body-sm font-medium">Connected application</p><EntityChip entity={{ type: 'application', id: v.appId }} /></Card>}
          {tasks.length > 0 && <Card aria-labelledby="vt-h"><CardHeader id="vt-h" title="Open tasks" /><ul className="space-y-3">{tasks.map((t) => <li key={t.id} className="text-body-sm"><Link to="/tasks" className="font-medium hover:underline">{t.name}</Link><div className="mt-1 flex items-center gap-2"><PriorityBadge priority={t.priority} /><span className="text-ink-secondary">{dueLabel(t.dueDate).text}</span></div></li>)}</ul></Card>}
        </aside>
      </div>
      <TaskModal open={task} onClose={() => setTask(false)} draft={{ name: `Request updated ${doc.type} report from ${v.name}`, entity: { type: 'vendor', id: v.id }, ownerId: v.ownerId, riskId: risks.find(isOpenRisk)?.id, priority: 'high' }} />
    </>
  )
}
