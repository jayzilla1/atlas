import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, ClipboardCheck, PlugZap, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/components/ui/Page'
import { Card, Callout, DescriptionList, MetricCard } from '@/components/ui/Card'
import { Badge, SeverityBadge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Select } from '@/components/ui/Form'
import { ConfirmDialog } from '@/components/ui/Overlay'
import { EmptyState } from '@/components/ui/Feedback'
import { Term } from '@/components/ui/Tooltip'
import { useToast } from '@/components/ui/Toast'
import { EntityChip, PersonLink } from '@/components/domain/entities'
import { useRiskLevels } from '@/components/domain/riskLevels'
import { useStore } from '@/state/store'
import { daysSinceReview, isReviewOutdated } from '@/data/selectors'
import { isOpenRisk } from '@/data/risks'
import { getVendor } from '@/data/vendors'
import type { AccessGrant } from '@/data/types'
import { formatDate } from '@/utils/dates'
import { usePageTitle } from '@/hooks/usePage'
import { NotFoundPage } from './NotFound'
import { cn } from '@/utils/cn'

export function ApplicationDetailPage() {
  const { id } = useParams(); const s = useStore(); const toast = useToast(); const lv = useRiskLevels()
  const app = s.appById(id)
  usePageTitle(app?.name ?? 'Application not found')
  const [tab, setTab] = useState('users'); const [filter, setFilter] = useState('all'); const [confirm, setConfirm] = useState(false)
  if (!app) return <NotFoundPage what="application" />
  const perm = s.permission('access.review')
  const grants = s.grantsForApp(app.id)
  const risks = s.risks.filter((r) => r.related.some((x) => x.type === 'application' && x.id === app.id))
  const openRisks = risks.filter(isOpenRisk)
  const outdated = isReviewOutdated(app); const vendor = getVendor(app.vendorId)
  const shown = grants.filter((g) => filter === 'all' || (filter === 'admin' && ['Admin', 'Owner'].includes(g.role)) || (filter === 'inactive' && g.lastUsedDaysAgo >= 60) || (filter === 'former' && s.personById(g.personId)?.status === 'former'))
  const cols: Column<AccessGrant>[] = [
    { id: 'person', header: 'Person', mobile: 'title', sortValue: (g) => s.personById(g.personId)?.name ?? '', cell: (g) => <PersonLink id={g.personId} subtitle="" /> },
    { id: 'dept', header: 'Department', hideBelow: 'lg', sortValue: (g) => s.personById(g.personId)?.department ?? '', cell: (g) => <span className="text-body-sm">{s.personById(g.personId)?.department}</span> },
    { id: 'role', header: 'Role', sortValue: (g) => g.role, cell: (g) => <Badge tone={['Admin', 'Owner'].includes(g.role) ? 'high' : 'neutral'}>{g.role}</Badge> },
    { id: 'used', header: 'Last used', sortValue: (g) => g.lastUsedDaysAgo, cell: (g) => <span className={cn('text-body-sm tabular-nums', g.lastUsedDaysAgo >= 90 ? 'font-medium text-warning-fg' : 'text-ink-secondary')}>{g.lastUsedDaysAgo === 0 ? 'Today' : `${g.lastUsedDaysAgo} ${g.lastUsedDaysAgo === 1 ? 'day' : 'days'} ago`}</span> },
    { id: 'status', header: 'Employment', hideBelow: 'md', cell: (g) => { const p = s.personById(g.personId); return p ? <StatusBadge status={p.status} /> : null } },
  ]
  const doReview = () => {
    s.completeAppReview(app.id)
    s.log({ actor: s.currentUser.name, actorId: s.currentUser.id, kind: 'human', text: `completed the ${app.name} access review.`, entity: { type: 'application', id: app.id } })
    toast({ tone: 'success', title: 'Access review recorded', description: `${app.name} is now up to date. Next review due in 180 days.` }); setConfirm(false)
  }
  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Applications', to: '/applications' }, { label: app.name }]}
        eyebrow={<div className="flex flex-wrap items-center gap-2"><SeverityBadge severity={lv.forApp(app.id)} /><StatusBadge status={app.connection} />{app.status !== 'active' && <StatusBadge status={app.status} />}</div>}
        title={app.name} description={app.description}
        actions={<Button variant={outdated ? 'primary' : 'secondary'} iconLeft={<ClipboardCheck className="h-4 w-4" />} disabledReason={perm.allowed ? undefined : perm.reason} onClick={() => setConfirm(true)}>Complete access review</Button>} />
      {outdated && <Callout className="mb-5" tone="warning" title={`The last access review was ${daysSinceReview(app)} days ago`}>Policy requires one at least every 180 days. <Link to="/risks/R-109" className="font-medium text-ink-link underline">See risk R-109</Link>.</Callout>}
      {(app.connection === 'needs_reauth' || app.connection === 'sync_error') && <Callout className="mb-5" tone="critical" title={app.connection === 'sync_error' ? 'Atlas can’t sync data from this app' : 'The connection to this app expired'} actions={<Button size="sm" iconLeft={<PlugZap className="h-4 w-4" />} onClick={() => toast({ tone: 'info', title: 'Reconnecting…', description: 'In a real workspace you’d approve access in the app’s own window.' })}>Reconnect</Button>}>Until it’s reconnected, user and access information for {app.name} may be out of date.</Callout>}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Users" value={grants.length} hint={`${grants.filter((g) => ['Admin', 'Owner'].includes(g.role)).length} admins`} />
        <MetricCard label="Open risks" value={openRisks.length} hint={openRisks.length ? 'See Risks tab' : 'None'} />
        <MetricCard label="Last access review" value={<span className="text-title-2">{formatDate(app.lastReview)}</span>} hint={outdated ? 'Overdue' : 'Within policy'} />
        <MetricCard label="Data sensitivity" value={<span className="text-title-2">{app.dataSensitivity}</span>} hint="How sensitive the data inside is" />
      </div>
      <Card padded={false}>
        <div className="px-4 pt-1"><Tabs label="Application sections" value={tab} onChange={setTab} tabs={[{ id: 'users', label: 'Users', count: grants.length }, { id: 'risks', label: 'Risks', count: openRisks.length }, { id: 'details', label: 'Details' }]} /></div>
        {tab === 'users' && (<>
          <div className="flex flex-wrap items-center gap-3 border-b border-line p-4"><label htmlFor="ug" className="text-body-sm text-ink-secondary">Show</label>
            <div className="w-56"><Select id="ug" value={filter} onChange={(e) => setFilter(e.target.value)} options={[{ value: 'all', label: 'Everyone' }, { value: 'admin', label: 'Admins only' }, { value: 'inactive', label: 'Inactive 60+ days' }, { value: 'former', label: 'Former employees' }]} /></div>
            <p className="text-body-sm text-ink-secondary" role="status">{shown.length} users</p></div>
          {shown.length === 0 ? <EmptyState title="No users match" description={filter === 'former' ? 'Good news: no former employees have access to this app.' : 'Try a different filter.'} icon={<CheckCircle2 />} /> : <DataTable caption={`Users of ${app.name}`} columns={cols} rows={shown} getRowKey={(g) => g.personId} defaultSort={{ id: 'person', dir: 'asc' }} noun="users" pageSize={10} resetPageKey={filter} />}
        </>)}
        {tab === 'risks' && <div className="p-5">{openRisks.length === 0 ? <EmptyState icon={<ShieldAlert />} title="No open risks" description={`Atlas hasn’t found any open risks for ${app.name}.`} /> : <ul className="space-y-2">{openRisks.map((r) => <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3"><SeverityBadge severity={r.severity} /><EntityChip entity={{ type: 'risk', id: r.id }} className="min-w-0 flex-1" /></li>)}</ul>}</div>}
        {tab === 'details' && <div className="grid gap-6 p-5 md:grid-cols-2">
          <DescriptionList items={[{ label: 'Owner', value: <PersonLink id={app.ownerId} subtitle="" /> }, { label: 'Category', value: app.category }, { label: 'Status', value: <StatusBadge status={app.status} /> }, { label: 'Connection', value: <StatusBadge status={app.connection} /> }, ...(vendor ? [{ label: 'Vendor', value: <EntityChip entity={{ type: 'vendor', id: vendor.id }} /> }] : [])]} />
          <DescriptionList items={[{ label: <Term id="sso">Single sign-on</Term>, value: app.ssoEnforced ? <StatusBadge status="active" label="Enforced" /> : <Badge tone="warning">Not enforced</Badge> }, { label: <Term id="mfa">Multi-factor authentication</Term>, value: app.mfaEnforced ? <StatusBadge status="active" label="Enforced" /> : <Badge tone="warning">Not enforced</Badge> }, { label: 'Review cadence', value: `Every ${app.reviewCadenceDays} days` }, { label: 'Next review due', value: formatDate(new Date(new Date(app.lastReview).getTime() + app.reviewCadenceDays * 864e5).toISOString()) }]} />
        </div>}
      </Card>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={doReview} title={`Mark ${app.name} as reviewed?`} confirmLabel="Record review"
        description={`You’re confirming that ${grants.length} users were checked and each still needs access. The review date becomes today and is recorded for auditors.`} />
    </>
  )
}
