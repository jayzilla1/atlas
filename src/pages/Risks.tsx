import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { Tabs } from '@/components/ui/Tabs'
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { NoResults, TableSkeleton, ErrorState } from '@/components/ui/Feedback'
import { PersonLink } from '@/components/domain/entities'
import { Term } from '@/components/ui/Tooltip'
import { useStore } from '@/state/store'
import { isOpenRisk } from '@/data/risks'
import { SEVERITY_ORDER, severityRank } from '@/data/selectors'
import type { Risk, RiskCategory } from '@/data/types'
import { daysFromToday, dueLabel, formatDate } from '@/utils/dates'
import { useQueryFilters } from '@/hooks/useQueryFilters'
import { usePageTitle, useSimulatedLoad } from '@/hooks/usePage'
import { useUi } from '@/layouts/UiContext'
import { cn } from '@/utils/cn'
import { SEVERITY_META } from '@/components/ui/Badge'

const CATEGORIES: RiskCategory[] = ['Access', 'Vendors', 'People & training', 'Policies', 'Data protection', 'Devices']

export function RisksPage() {
  usePageTitle('Risks')
  const s = useStore(); const ui = useUi()
  const load = useSimulatedLoad('risks')
  const f = useQueryFilters(['severity', 'status', 'owner', 'category', 'date', 'view'] as const, { view: 'open' })

  const counts = useMemo(() => ({ open: s.risks.filter(isOpenRisk).length, closed: s.risks.filter((r) => !isOpenRisk(r)).length, all: s.risks.length }), [s.risks])
  const owners = useMemo(() => Array.from(new Set(s.risks.map((r) => r.ownerId))).map((id) => ({ value: id, label: s.personById(id)?.name ?? id })).sort((a, b) => a.label.localeCompare(b.label)), [s.risks, s.personById])

  const rows = useMemo(() => s.risks.filter((r) => {
    const q = f.search.trim().toLowerCase()
    if (f.values.view === 'open' && !isOpenRisk(r)) return false
    if (f.values.view === 'closed' && isOpenRisk(r)) return false
    if (q && !(r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || (s.personById(r.ownerId)?.name ?? '').toLowerCase().includes(q))) return false
    if (f.values.severity !== 'all' && r.severity !== f.values.severity) return false
    if (f.values.status !== 'all' && r.status !== f.values.status) return false
    if (f.values.owner !== 'all' && r.ownerId !== f.values.owner) return false
    if (f.values.category !== 'all' && r.category !== f.values.category) return false
    const d = f.values.date
    if (d === 'new7' && -daysFromToday(r.identifiedOn) > 7) return false
    if (d === 'new30' && -daysFromToday(r.identifiedOn) > 30) return false
    if (d === 'due7' && daysFromToday(r.dueDate) > 7) return false
    if (d === 'overdue' && daysFromToday(r.dueDate) >= 0) return false
    return true
  }), [s.risks, f.values, f.search, s.personById])

  const columns: Column<Risk>[] = [
    { id: 'name', header: 'Risk', mobile: 'title', sortValue: (r) => r.name, cell: (r) => (
      <div className="min-w-0"><Link to={`/risks/${r.id}`} className="font-medium text-ink hover:text-ink-link hover:underline">{r.name}</Link>
        <p className="mt-0.5 text-caption text-ink-secondary">{r.id} · {r.related.length} related {r.related.length === 1 ? 'record' : 'records'}</p></div>) },
    { id: 'severity', header: 'Severity', sortValue: (r) => severityRank(r.severity), cell: (r) => <SeverityBadge severity={r.severity} /> },
    { id: 'status', header: 'Status', sortValue: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
    { id: 'owner', header: 'Owner', hideBelow: 'lg', sortValue: (r) => s.personById(r.ownerId)?.name ?? '', cell: (r) => <PersonLink id={r.ownerId} /> },
    { id: 'category', header: 'Category', hideBelow: 'xl', sortValue: (r) => r.category, cell: (r) => <span className="text-body-sm text-ink-secondary">{r.category}</span> },
    { id: 'identified', header: 'Identified', hideBelow: 'xl', sortValue: (r) => r.identifiedOn, cell: (r) => <span className="whitespace-nowrap text-body-sm tabular-nums text-ink-secondary">{formatDate(r.identifiedOn)}</span> },
    { id: 'due', header: 'Due', sortValue: (r) => r.dueDate, cell: (r) => { const d = dueLabel(r.dueDate); return <span className={cn('whitespace-nowrap text-body-sm tabular-nums', d.overdue ? 'font-semibold text-critical-fg' : 'text-ink-secondary')}>{isOpenRisk(r) ? d.text : '—'}</span> } },
  ]

  return (
    <>
      <PageHeader title="Risks" description={<>A <Term id="risk">risk</Term> is something that could cause harm if nobody deals with it. Each one has an owner, a due date and a recommended fix.</>}
        actions={<Button iconLeft={<Sparkles className="h-4 w-4" />} onClick={() => ui.openAsk('What are the biggest risks I should address this week?')}>Ask Atlas what to tackle first</Button>} />
      <Card padded={false}>
        <div className="px-4 pt-1">
          <Tabs label="Risk status" value={f.values.view} onChange={(v) => f.set('view', v)} tabs={[{ id: 'open', label: 'Open', count: counts.open }, { id: 'closed', label: 'Closed', count: counts.closed }, { id: 'all', label: 'All', count: counts.all }]} />
        </div>
        <FilterBar search={f.search} onSearch={f.setSearch} searchLabel="Search risks" searchPlaceholder="Search risks" noun="risks" resultCount={rows.length}
          values={f.values} onChange={(id, v) => f.set(id as never, v)} onClear={() => { const v = f.values.view; f.clear(); if (v !== 'open') f.set('view', v) }}
          filters={[
            { id: 'severity', label: 'Severity', options: SEVERITY_ORDER.map((x) => ({ value: x, label: SEVERITY_META[x].label })) },
            { id: 'status', label: 'Status', options: [{ value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In progress' }, { value: 'accepted', label: 'Accepted' }, { value: 'resolved', label: 'Resolved' }] },
            { id: 'owner', label: 'Owner', options: owners },
            { id: 'category', label: 'Category', options: CATEGORIES.map((c) => ({ value: c, label: c })) },
            { id: 'date', label: 'Date', options: [{ value: 'new7', label: 'Identified in last 7 days' }, { value: 'new30', label: 'Identified in last 30 days' }, { value: 'due7', label: 'Due within 7 days' }, { value: 'overdue', label: 'Overdue' }] },
          ]} />
        {load.loading ? <TableSkeleton label="Loading risks" /> : load.error ? <ErrorState title="We couldn’t load your risks" onRetry={load.retry} detail="Error 503 · risk-service timed out (simulated)" />
          : rows.length === 0 ? <NoResults query={f.search} onClear={f.clear} />
          : <DataTable caption="Risks" columns={columns} rows={rows} getRowKey={(r) => r.id} defaultSort={{ id: 'severity', dir: 'asc' }} noun="risks" resetPageKey={JSON.stringify(f.values) + f.search} />}
      </Card>
    </>
  )
}
