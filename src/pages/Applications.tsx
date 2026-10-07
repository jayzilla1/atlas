import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { Badge, SeverityBadge, StatusBadge, SEVERITY_META } from '@/components/ui/Badge'
import { ErrorState, NoResults, TableSkeleton } from '@/components/ui/Feedback'
import { Term } from '@/components/ui/Tooltip'
import { PersonLink } from '@/components/domain/entities'
import { useRiskLevels } from '@/components/domain/riskLevels'
import { applications } from '@/data/applications'
import { daysSinceReview, isReviewOutdated, SEVERITY_ORDER, severityRank } from '@/data/selectors'
import type { Application } from '@/data/types'
import { formatDate } from '@/utils/dates'
import { useStore } from '@/state/store'
import { useQueryFilters } from '@/hooks/useQueryFilters'
import { usePageTitle, useSimulatedLoad } from '@/hooks/usePage'
import { cn } from '@/utils/cn'

export function ApplicationsPage() {
  usePageTitle('Applications')
  const s = useStore(); const load = useSimulatedLoad('apps'); const lv = useRiskLevels()
  const f = useQueryFilters(['category', 'risk', 'review', 'connection'] as const)
  const apps = s.apps
  const categories = useMemo(() => Array.from(new Set(applications.map((a) => a.category))).sort(), [])
  const rows = useMemo(() => apps.filter((a) => {
    const q = f.search.trim().toLowerCase()
    if (q && !(a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || (s.personById(a.ownerId)?.name ?? '').toLowerCase().includes(q))) return false
    if (f.values.category !== 'all' && a.category !== f.values.category) return false
    if (f.values.risk !== 'all' && lv.forApp(a.id) !== f.values.risk) return false
    if (f.values.review === 'outdated' && !isReviewOutdated(a)) return false
    if (f.values.review === 'current' && isReviewOutdated(a)) return false
    if (f.values.connection === 'attention' && (a.connection === 'connected' || a.connection === 'manual')) return false
    return true
  }), [apps, f.values, f.search, s.personById]) // eslint-disable-line react-hooks/exhaustive-deps

  const columns: Column<Application>[] = [
    { id: 'name', header: 'Application', mobile: 'title', sortValue: (a) => a.name, cell: (a) => <Link to={`/applications/${a.id}`} className="min-w-0 hover:underline"><span className="block truncate font-medium">{a.name}</span><span className="block truncate text-caption text-ink-secondary">{a.category}</span></Link> },
    { id: 'users', header: 'Users', align: 'right', sortValue: (a) => s.grantsForApp(a.id).length, cell: (a) => <span className="tabular-nums">{s.grantsForApp(a.id).length}</span> },
    { id: 'owner', header: 'Owner', hideBelow: 'lg', sortValue: (a) => s.personById(a.ownerId)?.name ?? '', cell: (a) => <PersonLink id={a.ownerId} /> },
    { id: 'risk', header: 'Risk level', sortValue: (a) => severityRank(lv.forApp(a.id)), cell: (a) => <SeverityBadge severity={lv.forApp(a.id)} /> },
    { id: 'review', header: 'Last access review', sortValue: (a) => a.lastReview, cell: (a) => { const o = isReviewOutdated(a); return <div className="whitespace-nowrap text-body-sm"><span className={cn('tabular-nums', o && 'font-semibold text-critical-fg')}>{formatDate(a.lastReview)}</span>{o ? <Badge tone="critical" size="sm" className="ml-1.5">{daysSinceReview(a)}d ago</Badge> : null}</div> } },
    { id: 'connection', header: 'Connection', hideBelow: 'md', sortValue: (a) => a.connection, cell: (a) => <StatusBadge status={a.connection} /> },
  ]
  return (
    <>
      <PageHeader title="Applications" description={<>Every tool your people sign in to. Atlas checks who has access and whether it was recently confirmed in an <Term id="access-review">access review</Term>.</>} />
      <Card padded={false}>
        <FilterBar search={f.search} onSearch={f.setSearch} searchLabel="Search applications" searchPlaceholder="Search apps, categories or owners" noun="applications" resultCount={rows.length}
          values={f.values} onChange={(id, v) => f.set(id as never, v)} onClear={f.clear}
          filters={[
            { id: 'category', label: 'Category', options: categories.map((c) => ({ value: c, label: c })) },
            { id: 'risk', label: 'Risk level', options: SEVERITY_ORDER.map((x) => ({ value: x, label: SEVERITY_META[x].label })) },
            { id: 'review', label: 'Access review', options: [{ value: 'outdated', label: 'Overdue (180+ days)' }, { value: 'current', label: 'Up to date' }] },
            { id: 'connection', label: 'Connection', options: [{ value: 'attention', label: 'Needs attention' }] },
          ]} />
        {load.loading ? <TableSkeleton label="Loading applications" /> : load.error ? <ErrorState title="We couldn’t load your applications" onRetry={load.retry} detail="Error 504 · integration gateway timed out (simulated)" />
          : rows.length === 0 ? <NoResults query={f.search} onClear={f.clear} />
          : <DataTable caption="Applications" columns={columns} rows={rows} getRowKey={(a) => a.id} defaultSort={{ id: 'name', dir: 'asc' }} noun="applications" pageSize={12} resetPageKey={JSON.stringify(f.values) + f.search} />}
      </Card>
    </>
  )
}
