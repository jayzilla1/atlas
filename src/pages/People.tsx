import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { Tabs } from '@/components/ui/Tabs'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ErrorState, NoResults, TableSkeleton } from '@/components/ui/Feedback'
import { Term } from '@/components/ui/Tooltip'
import { useStore } from '@/state/store'
import { DEPARTMENT_NAMES } from '@/data/people'
import type { Person } from '@/data/types'
import { useQueryFilters } from '@/hooks/useQueryFilters'
import { usePageTitle, useSimulatedLoad } from '@/hooks/usePage'
import { AlertTriangle, KeyRound, ShieldOff, GraduationCap } from 'lucide-react'
import { daysFromToday } from '@/utils/dates'

export function PeoplePage() {
  usePageTitle('People')
  const s = useStore(); const load = useSimulatedLoad('people')
  const f = useQueryFilters(['department', 'training', 'access', 'type', 'view'] as const, { view: 'current' })
  const current = s.people.filter((p) => p.status !== 'former').length; const former = s.people.length - current

  const rows = useMemo(() => s.people.filter((p) => {
    const q = f.search.trim().toLowerCase()
    if (f.values.view === 'current' && p.status === 'former') return false
    if (f.values.view === 'former' && p.status !== 'former') return false
    if (q && !(p.name.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || p.email.includes(q) || p.department.toLowerCase().includes(q))) return false
    if (f.values.department !== 'all' && p.department !== f.values.department) return false
    if (f.values.training === 'missing' && (p.training.status === 'completed' || p.status === 'former')) return false
    if (f.values.training === 'overdue' && p.training.status !== 'overdue') return false
    if (f.values.training === 'completed' && p.training.status !== 'completed') return false
    if (f.values.access === 'attention' && p.accessReview !== 'needs_attention') return false
    if (f.values.access === 'ok' && p.accessReview !== 'up_to_date') return false
    if (f.values.type !== 'all' && p.employmentType !== f.values.type) return false
    return true
  }), [s.people, f.values, f.search])

  const columns: Column<Person>[] = [
    { id: 'name', header: 'Name', mobile: 'title', sortValue: (p) => p.name, cell: (p) => (
      <Link to={`/people/${p.id}`} className="flex min-w-0 items-center gap-3 hover:underline"><Avatar name={p.name} size="md" muted={p.status === 'former'} /><span className="min-w-0"><span className="block truncate font-medium">{p.name}</span><span className="block truncate text-caption text-ink-secondary">{p.title}</span></span></Link>) },
    { id: 'dept', header: 'Department', hideBelow: 'lg', sortValue: (p) => p.department, cell: (p) => <span className="text-body-sm">{p.department}</span> },
    { id: 'status', header: 'Status', hideBelow: 'lg', sortValue: (p) => p.status, cell: (p) => <div className="flex items-center gap-1.5"><StatusBadge status={p.status} />{p.employmentType === 'Contractor' && <Badge>Contractor</Badge>}</div> },
    { id: 'apps', header: 'Apps', align: 'right', sortValue: (p) => s.grantsForPerson(p.id).length, cell: (p) => <span className="tabular-nums">{s.grantsForPerson(p.id).length}</span> },
    { id: 'training', header: 'Training', sortValue: (p) => p.training.status, cell: (p) => p.status === 'former' ? <span className="text-ink-tertiary">—</span> : <StatusBadge status={p.training.status} label={p.training.status === 'overdue' ? `Overdue ${-daysFromToday(p.training.dueOn)}d` : p.training.status === 'completed' ? 'Completed' : undefined} /> },
    { id: 'access', header: 'Access review', sortValue: (p) => p.accessReview, cell: (p) => <StatusBadge status={p.accessReview} /> },
    { id: 'risk', header: 'Risk indicators', mobile: 'meta', cell: (p) => {
      const ind: React.ReactElement[] = []
      if (p.accessIssues.some((i) => i.kind === 'former_user_access')) ind.push(<Badge key="f" tone="critical" icon={<AlertTriangle />}>Active after leaving</Badge>)
      if (p.accessIssues.some((i) => i.kind === 'no_mfa')) ind.push(<Badge key="m" tone="high" icon={<ShieldOff />}>No MFA</Badge>)
      if (p.accessIssues.some((i) => i.kind === 'admin_unreviewed' || i.kind === 'unused_admin')) ind.push(<Badge key="a" tone="warning" icon={<KeyRound />}>Admin access</Badge>)
      if (p.training.status === 'overdue') ind.push(<Badge key="t" tone="warning" icon={<GraduationCap />}>Training overdue</Badge>)
      return ind.length ? <div className="flex flex-wrap gap-1">{ind}</div> : <span className="text-body-sm text-ink-tertiary">None</span> } },
  ]
  return (
    <>
      <PageHeader title="People" description={<>Everyone who works at Harborlight — employees and contractors — with the apps they can open and whether they’re up to date on <Term id="security-training">security training</Term>.</>} />
      <Card padded={false}>
        <div className="px-4 pt-1"><Tabs label="People view" value={f.values.view} onChange={(v) => f.set('view', v)} tabs={[{ id: 'current', label: 'Current', count: current }, { id: 'former', label: 'Former', count: former }, { id: 'all', label: 'Everyone', count: s.people.length }]} /></div>
        <FilterBar search={f.search} onSearch={f.setSearch} searchLabel="Search people" searchPlaceholder="Search by name, title or department" noun="people" resultCount={rows.length}
          values={f.values} onChange={(id, v) => f.set(id as never, v)} onClear={() => { const v = f.values.view; f.clear(); if (v !== 'current') f.set('view', v) }}
          filters={[
            { id: 'department', label: 'Department', options: DEPARTMENT_NAMES.map((d) => ({ value: d, label: d })) },
            { id: 'training', label: 'Training', options: [{ value: 'missing', label: 'Missing or incomplete' }, { value: 'overdue', label: 'Overdue' }, { value: 'completed', label: 'Completed' }] },
            { id: 'access', label: 'Access review', options: [{ value: 'attention', label: 'Needs attention' }, { value: 'ok', label: 'Up to date' }] },
            { id: 'type', label: 'Type', options: [{ value: 'Employee', label: 'Employee' }, { value: 'Contractor', label: 'Contractor' }] },
          ]} />
        {load.loading ? <TableSkeleton label="Loading people" /> : load.error ? <ErrorState title="We couldn’t load the directory" onRetry={load.retry} detail="Error 502 · directory sync unavailable (simulated)" />
          : rows.length === 0 ? <NoResults query={f.search} onClear={f.clear} />
          : <DataTable caption="People directory" columns={columns} rows={rows} getRowKey={(p) => p.id} defaultSort={{ id: 'name', dir: 'asc' }} noun="people" pageSize={12} resetPageKey={JSON.stringify(f.values) + f.search} />}
      </Card>
    </>
  )
}
