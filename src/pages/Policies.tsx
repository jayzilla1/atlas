import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { StatusBadge } from '@/components/ui/Badge'
import { ErrorState, NoResults, ProgressBar, TableSkeleton } from '@/components/ui/Feedback'
import { PersonLink } from '@/components/domain/entities'
import { policies, policyAckStats } from '@/data/policies'
import type { Policy } from '@/data/types'
import { daysFromToday, formatDate } from '@/utils/dates'
import { useStore } from '@/state/store'
import { useQueryFilters } from '@/hooks/useQueryFilters'
import { usePageTitle, useSimulatedLoad } from '@/hooks/usePage'
import { cn } from '@/utils/cn'

export function PoliciesPage() {
  usePageTitle('Policies')
  const s = useStore(); const load = useSimulatedLoad('policies')
  const f = useQueryFilters(['status', 'owner', 'applies'] as const)
  const owners = useMemo(() => Array.from(new Set(policies.map((p) => p.ownerId))).map((id) => ({ value: id, label: s.personById(id)?.name ?? id })), [s]) 
  const rows = useMemo(() => policies.filter((p) => {
    const q = f.search.trim().toLowerCase()
    if (q && !(p.name.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q))) return false
    if (f.values.status !== 'all' && p.status !== f.values.status) return false
    if (f.values.owner !== 'all' && p.ownerId !== f.values.owner) return false
    if (f.values.applies !== 'all' && p.appliesTo !== f.values.applies) return false
    return true
  }), [f.values, f.search])
  const columns: Column<Policy>[] = [
    { id: 'name', header: 'Policy', mobile: 'title', sortValue: (p) => p.name, cell: (p) => <Link to={`/policies/${p.id}`} className="min-w-0 hover:underline"><span className="block font-medium">{p.name}</span><span className="block max-w-md truncate text-caption text-ink-secondary">{p.summary}</span></Link> },
    { id: 'status', header: 'Status', sortValue: (p) => p.status, cell: (p) => <StatusBadge status={p.status} /> },
    { id: 'owner', header: 'Owner', hideBelow: 'lg', sortValue: (p) => s.personById(p.ownerId)?.name ?? '', cell: (p) => <PersonLink id={p.ownerId} /> },
    { id: 'updated', header: 'Last updated', hideBelow: 'xl', sortValue: (p) => p.lastUpdated, cell: (p) => <span className="whitespace-nowrap text-body-sm tabular-nums text-ink-secondary">{formatDate(p.lastUpdated)}</span> },
    { id: 'review', header: 'Review date', sortValue: (p) => p.nextReview, cell: (p) => { const od = daysFromToday(p.nextReview) < 0; return <span className={cn('whitespace-nowrap text-body-sm tabular-nums', od ? 'font-semibold text-critical-fg' : 'text-ink-secondary')}>{formatDate(p.nextReview)}{od && ' (overdue)'}</span> } },
    { id: 'ack', header: 'Acknowledged', sortValue: (p) => { const a = policyAckStats(p.id); return a.acknowledged / a.required }, cell: (p) => { const a = policyAckStats(p.id); return p.status === 'draft' ? <span className="text-body-sm text-ink-tertiary">Not yet published</span> : <div className="w-40"><div className="mb-1 flex justify-between text-caption tabular-nums text-ink-secondary"><span>{a.acknowledged} of {a.required}</span><span>{Math.round((a.acknowledged / a.required) * 100)}%</span></div><ProgressBar size="sm" value={a.acknowledged} max={a.required} label={`${p.name} acknowledgements`} tone={a.acknowledged / a.required >= 0.95 ? 'success' : 'warning'} /></div> } },
  ]
  return (
    <>
      <PageHeader title="Policies" description="The written rules your company follows. Atlas tracks who owns each one, when it’s due for review, and which employees have confirmed they’ve read it." />
      <Card padded={false}>
        <FilterBar search={f.search} onSearch={f.setSearch} searchLabel="Search policies" searchPlaceholder="Search policies" noun="policies" resultCount={rows.length}
          values={f.values} onChange={(id, v) => f.set(id as never, v)} onClear={f.clear}
          filters={[
            { id: 'status', label: 'Status', options: [{ value: 'published', label: 'Published' }, { value: 'in_review', label: 'In review' }, { value: 'draft', label: 'Draft' }, { value: 'needs_update', label: 'Needs update' }] },
            { id: 'owner', label: 'Owner', options: owners },
            { id: 'applies', label: 'Applies to', options: ['Everyone', 'Engineering', 'Managers'].map((x) => ({ value: x, label: x })) },
          ]} />
        {load.loading ? <TableSkeleton rows={7} label="Loading policies" /> : load.error ? <ErrorState title="We couldn’t load your policies" onRetry={load.retry} detail="Error 500 · policy-library unavailable (simulated)" />
          : rows.length === 0 ? <NoResults query={f.search} onClear={f.clear} />
          : <DataTable caption="Policies" columns={columns} rows={rows} getRowKey={(p) => p.id} defaultSort={{ id: 'name', dir: 'asc' }} noun="policies" pageSize={10} resetPageKey={JSON.stringify(f.values) + f.search} />}
      </Card>
    </>
  )
}
