import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { SeverityBadge, StatusBadge, StatusIndicator, SEVERITY_META } from '@/components/ui/Badge'
import { ErrorState, NoResults, TableSkeleton } from '@/components/ui/Feedback'
import { Term } from '@/components/ui/Tooltip'
import { useRiskLevels } from '@/components/domain/riskLevels'
import { vendors } from '@/data/vendors'
import { SEVERITY_ORDER, severityRank, vendorReviewDueSoon } from '@/data/selectors'
import type { Vendor } from '@/data/types'
import { daysFromToday, formatDate, relativeDay } from '@/utils/dates'
import { useQueryFilters } from '@/hooks/useQueryFilters'
import { usePageTitle, useSimulatedLoad } from '@/hooks/usePage'
import { cn } from '@/utils/cn'

export function docTerm(type: string) {
  return /SOC 2/.test(type) ? <Term id="soc2">{type}</Term> : /ISO/.test(type) ? <Term id="iso27001">{type}</Term> : <>{type}</>
}

export function VendorsPage() {
  usePageTitle('Vendors')
  const load = useSimulatedLoad('vendors'); const lv = useRiskLevels()
  const f = useQueryFilters(['risk', 'review', 'contract', 'doc'] as const)
  const rows = useMemo(() => vendors.filter((v) => {
    const q = f.search.trim().toLowerCase()
    if (q && !(v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q))) return false
    if (f.values.risk !== 'all' && lv.forVendor(v.id) !== f.values.risk) return false
    if (f.values.review === 'due_soon' && !vendorReviewDueSoon(v)) return false
    if (f.values.review === 'overdue' && v.reviewStatus !== 'overdue') return false
    if (f.values.review === 'current' && v.reviewStatus !== 'current') return false
    if (f.values.contract !== 'all' && v.contract.status !== f.values.contract) return false
    if (f.values.doc === 'attention' && !['expired', 'expiring', 'missing'].includes(v.securityDoc.status)) return false
    return true
  }), [f.values, f.search]) // eslint-disable-line react-hooks/exhaustive-deps

  const columns: Column<Vendor>[] = [
    { id: 'name', header: 'Vendor', mobile: 'title', sortValue: (v) => v.name, cell: (v) => <Link to={`/vendors/${v.id}`} className="min-w-0 hover:underline"><span className="block truncate font-medium">{v.name}</span><span className="block truncate text-caption text-ink-secondary">{v.category}</span></Link> },
    { id: 'risk', header: 'Risk level', sortValue: (v) => severityRank(lv.forVendor(v.id)), cell: (v) => <SeverityBadge severity={lv.forVendor(v.id)} /> },
    { id: 'review', header: 'Review status', sortValue: (v) => v.nextReview, cell: (v) => <div><StatusBadge status={v.reviewStatus} /><p className={cn('mt-0.5 text-caption tabular-nums', v.reviewStatus === 'overdue' ? 'font-medium text-critical-fg' : 'text-ink-secondary')}>{v.reviewStatus === 'overdue' ? `Was due ${formatDate(v.nextReview)}` : `Due ${formatDate(v.nextReview)}`}</p></div> },
    { id: 'contract', header: 'Contract', hideBelow: 'lg', sortValue: (v) => v.contract.end, cell: (v) => <div><StatusBadge status={v.contract.status === 'expiring' ? 'expiring_contract' : v.contract.status === 'active' ? 'active' : v.contract.status} /><p className="mt-0.5 text-caption text-ink-secondary">Ends {formatDate(v.contract.end)}</p></div> },
    { id: 'doc', header: 'Security documentation', sortValue: (v) => v.securityDoc.status, cell: (v) => <div><StatusIndicator status={v.securityDoc.status} /><p className="mt-0.5 text-caption text-ink-secondary">{docTerm(v.securityDoc.type)}{v.securityDoc.expiresOn && <> · {daysFromToday(v.securityDoc.expiresOn) < 0 ? 'expired' : 'expires'} {relativeDay(v.securityDoc.expiresOn)}</>}</p></div> },
    { id: 'reviewed', header: 'Last reviewed', hideBelow: 'xl', sortValue: (v) => v.lastReview, cell: (v) => <span className="text-body-sm tabular-nums text-ink-secondary">{formatDate(v.lastReview)}</span> },
  ]
  return (
    <>
      <PageHeader title="Vendors" description={<>Companies you pay and share information with. A <Term id="third-party-risk">vendor review</Term> checks that each one still protects that information properly.</>} />
      <Card padded={false}>
        <FilterBar search={f.search} onSearch={f.setSearch} searchLabel="Search vendors" searchPlaceholder="Search vendors or categories" noun="vendors" resultCount={rows.length}
          values={f.values} onChange={(id, v) => f.set(id as never, v)} onClear={f.clear}
          filters={[
            { id: 'risk', label: 'Risk level', options: SEVERITY_ORDER.map((x) => ({ value: x, label: SEVERITY_META[x].label })) },
            { id: 'review', label: 'Review', options: [{ value: 'due_soon', label: 'Due in 30 days' }, { value: 'overdue', label: 'Overdue' }, { value: 'current', label: 'Current' }] },
            { id: 'contract', label: 'Contract', options: [{ value: 'active', label: 'Active' }, { value: 'expiring', label: 'Expiring soon' }, { value: 'in_negotiation', label: 'In negotiation' }] },
            { id: 'doc', label: 'Documents', options: [{ value: 'attention', label: 'Expired or expiring' }] },
          ]} />
        {load.loading ? <TableSkeleton label="Loading vendors" /> : load.error ? <ErrorState title="We couldn’t load your vendors" onRetry={load.retry} detail="Error 500 · vendor-register unavailable (simulated)" />
          : rows.length === 0 ? <NoResults query={f.search} onClear={f.clear} />
          : <DataTable caption="Vendors" columns={columns} rows={rows} getRowKey={(v) => v.id} defaultSort={{ id: 'review', dir: 'asc' }} noun="vendors" pageSize={12} resetPageKey={JSON.stringify(f.values) + f.search} />}
      </Card>
    </>
  )
}
