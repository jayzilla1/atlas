import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Users } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/Form'
import { Segmented } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { NoResults, EmptyState } from '@/components/ui/States'
import { Table, THead, TR, TH, TD } from '@/components/ui/Table'
import { AttendanceBadge, DiaperBadge } from '@/components/domain/Status'
import { useData } from '@/state/store'
import { useSession } from '@/state/session'
import { attendanceView } from '@/domain/attendance'
import { childIssues } from '@/domain/documents'
import { childName, primaryGuardian } from '@/domain/people'
import { fmtAge } from '@/utils/dates'

type F = 'all' | 'attention' | 'infants' | 'allergies'
const PAGE = 8

export default function Children() { return <Page id="children"><Screen /></Page> }

function Screen() {
  const d = useData()
  const { now } = useSession()
  const [q, setQ] = useState('')
  const [f, setF] = useState<F>('all')
  const [page, setPage] = useState(1)

  const all = useMemo(() => d.children.map((c) => ({
    c, issues: childIssues(d, c, now.date), view: attendanceView(d, c, now.date, now), g: primaryGuardian(c),
    needs: childIssues(d, c, now.date).length > 0 || (!!c.diaper && c.diaper.status !== 'good'),
  })), [d, now])
  const rows = all.filter((r) => {
    const t = q.trim().toLowerCase()
    const hit = !t || `${childName(r.c)} ${r.g.name}`.toLowerCase().includes(t)
    const m = f === 'all' || (f === 'attention' && r.needs) || (f === 'infants' && r.c.dob > '2025-10-07') || (f === 'allergies' && r.c.allergies.length > 0)
    return hit && m
  })
  const shown = rows.slice((page - 1) * PAGE, page * PAGE)
  const reset = () => { setQ(''); setF('all'); setPage(1) }

  return (
    <>
      <PageHeader title="Children" description={`${d.children.length} enrolled. Find anyone’s records in a few seconds.`} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Search by child or parent" label="Search children" className="w-full sm:w-80" />
        <Segmented<F> label="Filter children" value={f} onChange={(v) => { setF(v); setPage(1) }} items={[
          { id: 'all', label: 'All', count: all.length }, { id: 'attention', label: 'Needs attention', count: all.filter((r) => r.needs).length },
          { id: 'infants', label: 'Under 1', count: all.filter((r) => r.c.dob > '2025-10-07').length }, { id: 'allergies', label: 'Allergies', count: all.filter((r) => r.c.allergies.length).length },
        ]} />
      </div>
      {d.children.length === 0 ? <EmptyState icon={<Users />} title="No children enrolled yet" /> : rows.length === 0 ? <NoResults query={q} onClear={reset} /> : (
        <>
          <Card padded={false} className="hidden lg:block">
            <Table caption="Children directory">
              <THead><TR><TH>Child</TH><TH>Parent / guardian</TH><TH>Today</TH><TH>Diapers</TH><TH>Records</TH><TH><span className="sr-only">Open</span></TH></TR></THead>
              <tbody>
                {shown.map(({ c, g, view, issues }) => (
                  <TR key={c.id} className="hover:bg-surface-muted">
                    <TD><Link to={`/children/${c.id}`} className="group flex items-center gap-3 rounded"><Avatar first={c.firstName} last={c.lastName} tint={c.tint} /><span><span className="block font-semibold group-hover:underline">{childName(c)}</span><span className="text-caption text-ink-secondary">{fmtAge(c.dob, now.date)}</span></span></Link></TD>
                    <TD><p>{g.name}</p><p className="text-caption text-ink-secondary">{g.phone}</p></TD>
                    <TD><AttendanceBadge view={view} size="sm" /></TD>
                    <TD>{c.diaper ? <DiaperBadge status={c.diaper.status} notified={!!c.diaper.notified} /> : <span className="text-ink-tertiary">—</span>}</TD>
                    <TD>{issues.length ? <Badge tone={issues.some((i) => i.tone === 'danger') ? 'danger' : 'warning'} icon={<AlertTriangle />}>{issues.length} to fix</Badge> : <span className="text-small text-ink-secondary">Complete</span>}</TD>
                    <TD className="w-px"><Link to={`/children/${c.id}`} aria-label={`Open ${childName(c)}`} className="flex h-9 w-9 items-center justify-center rounded-md text-ink-tertiary hover:bg-surface-sunken"><ChevronRight className="h-5 w-5" /></Link></TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
          <ul className="space-y-3 lg:hidden" aria-label="Children">
            {shown.map(({ c, g, view, issues }) => (
              <li key={c.id}>
                <Link to={`/children/${c.id}`} className="block rounded-lg border border-line bg-surface p-3.5 transition-colors duration-fast hover:bg-surface-muted">
                  <div className="flex items-center gap-3"><Avatar first={c.firstName} last={c.lastName} tint={c.tint} /><div className="min-w-0 flex-1"><p className="font-semibold">{childName(c)}</p><p className="text-caption text-ink-secondary">{fmtAge(c.dob, now.date)} · {g.name}</p></div><ChevronRight className="h-5 w-5 text-ink-tertiary" aria-hidden /></div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5"><AttendanceBadge view={view} size="sm" />{c.diaper && c.diaper.status !== 'good' && <DiaperBadge status={c.diaper.status} />}{issues.length > 0 && <Badge tone="warning" icon={<AlertTriangle />}>{issues.length} to fix</Badge>}</div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} pageSize={PAGE} total={rows.length} onPage={setPage} noun="children" />
        </>
      )}
    </>
  )
}
