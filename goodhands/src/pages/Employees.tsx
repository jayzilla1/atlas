import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, Section } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { Table, THead, TR, TH, TD } from '@/components/ui/Table'
import { CloseoutBadge, ShiftBadge } from '@/components/domain/Status'
import { useData } from '@/state/store'
import { useSession } from '@/state/session'
import { closeoutStatus, shiftOn, shiftRecord, shiftState, taskProgress, tasksFor } from '@/domain/tasks'
import { employeeName } from '@/domain/people'
import { addDays, fmtFull, fmtLong, fmtTime, WEEKDAYS_SHORT } from '@/utils/dates'

export default function Employees() { return <Page id="employees"><Screen /></Page> }

function Screen() {
  const d = useData()
  const { now } = useSession()
  const today = d.employees.filter((e) => shiftOn(d, e.id, now.date))
  return (
    <>
      <PageHeader title="Employees" description="Who’s working today, and your team’s records. Owner only." />
      <Section title="Today’s staff" description={fmtLong(now.date)} className="mb-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {today.map((e) => {
            const rec = shiftRecord(d, e.id, now.date)
            const prog = taskProgress(tasksFor(d, e.id, now.date))
            const st = shiftState(d, e.id, now.date)
            return (
              <Card key={e.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar first={e.firstName} last={e.lastName} tint={e.tint} />
                  <div className="min-w-0 flex-1"><Link to={`/employees/${e.id}`} className="font-semibold underline-offset-2 hover:underline">{employeeName(e)}</Link><p className="text-caption text-ink-secondary">{e.role} · {fmtTime(shiftOn(d, e.id, now.date)?.start)}–{fmtTime(shiftOn(d, e.id, now.date)?.end)}</p></div>
                  <ShiftBadge state={st} />
                </div>
                <Progress value={prog.done} max={prog.total} label={`${e.firstName}'s tasks`} tone={prog.total && prog.done === prog.total ? 'success' : 'primary'} />
                <dl className="grid grid-cols-2 gap-2 text-small">
                  <div><dt className="text-caption text-ink-tertiary">Checked in</dt><dd className="font-semibold tabular-nums">{fmtTime(rec?.checkIn)}</dd></div>
                  <div><dt className="text-caption text-ink-tertiary">Closeout</dt><dd>{st === 'off' ? '—' : <CloseoutBadge status={closeoutStatus(d, e.id, now)} />}</dd></div>
                </dl>
              </Card>
            )
          })}
        </div>
      </Section>
      <Section title="Team">
        <Card padded={false}>
          <Table caption="All employees">
            <THead><TR><TH>Name</TH><TH>Role</TH><TH>Usual days</TH><TH>Hired</TH><TH><span className="sr-only">Open</span></TH></TR></THead>
            <tbody>{d.employees.map((e) => (
              <TR key={e.id} className="hover:bg-surface-muted">
                <TD><Link to={`/employees/${e.id}`} className="group flex items-center gap-3 rounded"><Avatar first={e.firstName} last={e.lastName} tint={e.tint} size="sm" /><span className="font-semibold group-hover:underline">{employeeName(e)}</span></Link></TD>
                <TD>{e.role}</TD>
                <TD>{Object.keys(e.weekly).map((k) => WEEKDAYS_SHORT[+k]).join(', ')}</TD>
                <TD className="whitespace-nowrap">{fmtFull(e.hiredOn)}</TD>
                <TD className="w-px"><Link to={`/employees/${e.id}`} aria-label={`Open ${employeeName(e)}`} className="flex h-9 w-9 items-center justify-center rounded-md text-ink-tertiary hover:bg-surface-sunken"><ChevronRight className="h-5 w-5" /></Link></TD>
              </TR>
            ))}</tbody>
          </Table>
        </Card>
      </Section>
      <p className="mt-6 text-caption text-ink-secondary">Next scheduled day for each person is on the Schedule screen ({fmtFull(addDays(now.date, 0))}).</p>
    </>
  )
}
