import { Link } from 'react-router-dom'
import { AlertTriangle, AppWindow, Building2, ChevronRight, GraduationCap, ShieldAlert, ListChecks, Users, FileText, ShieldCheck, ClipboardCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/Page'
import { Card, CardHeader, MetricCard, SectionLink } from '@/components/ui/Card'
import { Gauge } from '@/components/charts/Gauge'
import { SeverityBar } from '@/components/charts/SeverityBar'
import { AiInsight } from '@/components/ai/AiInsight'
import { Term } from '@/components/ui/Tooltip'
import { Avatar } from '@/components/ui/Avatar'
import { Timeline } from '@/components/ui/Timeline'
import { EntityChip } from '@/components/domain/entities'
import { PriorityBadge } from '@/components/domain/Badges'
import { Badge, type Tone } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/Feedback'
import { useStore } from '@/state/store'
import { companyFacts, outstandingTasks } from '@/data/selectors'
import { HEALTH_AREAS, HEALTH_LAST_MONTH, HEALTH_SCORE } from '@/data/insights'
import { dueLabel } from '@/utils/dates'
import { usePageTitle } from '@/hooks/usePage'
import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

interface Attn { Icon: typeof ShieldAlert; tone: Tone; count: number; title: ReactNode; why: string; to: string; label: string }

export function OverviewPage() {
  usePageTitle('Overview')
  const s = useStore()
  const f = companyFacts(s.risks, s.tasks)
  const upcoming = outstandingTasks(s.tasks).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6)
  const hour = 9
  const attention: Attn[] = [
    { Icon: ShieldAlert, tone: 'critical', count: f.bySeverity.critical, title: <>critical {f.bySeverity.critical === 1 ? 'risk' : 'risks'}</>, why: 'A former contractor still has access, and the payroll provider’s security report has expired.', to: '/risks?severity=critical', label: 'Critical' },
    { Icon: Building2, tone: 'warning', count: f.vendorsDueSoon, title: <>vendor reviews due soon</>, why: 'Reviews check a vendor’s security documents and contract. Due within 30 days.', to: '/vendors?review=due_soon', label: 'Due soon' },
    { Icon: GraduationCap, tone: 'warning', count: f.missingTraining, title: <>employees missing required <Term id="security-training">training</Term></>, why: 'Six are already overdue. Auditors check this completion rate.', to: '/people?training=missing', label: 'Action needed' },
    { Icon: AppWindow, tone: 'warning', count: f.outdatedReviews, title: <>applications with outdated <Term id="access-review">access reviews</Term></>, why: 'GitHub, AWS, Zoom and BrightDesk haven’t been checked in over 180 days.', to: '/applications?review=outdated', label: 'Overdue' },
  ]
  const delta = HEALTH_SCORE - HEALTH_LAST_MONTH
  return (
    <>
      <PageHeader title={`Good ${hour < 12 ? 'morning' : 'afternoon'}, ${s.currentUser.name.split(' ')[0]}`}
        description="Here’s what you need to know today — Wednesday, October 7." />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Overall health */}
        <Card aria-labelledby="health-h" className="lg:col-span-1">
          <CardHeader id="health-h" title="Overall health" description="A summary of five areas, out of 100." />
          <div className="flex flex-col items-center gap-3">
            <Gauge value={HEALTH_SCORE} label="Overall health score" previous={HEALTH_LAST_MONTH} />
            <div className="min-w-0 text-center">
              <p className="text-body-lg font-semibold">Your organization is in good shape.</p>
              <p className="mt-1 text-body text-ink-secondary">But a few areas need attention.</p>
              <p className="mt-2 inline-flex items-center gap-1 rounded-sm bg-warning-bg px-2 py-0.5 text-caption font-semibold text-warning-fg"><AlertTriangle className="h-3.5 w-3.5" aria-hidden />{delta} vs. last month ({HEALTH_LAST_MONTH})</p>
            </div>
          </div>
          <ul className="mt-5 space-y-3 border-t border-line pt-4">
            {HEALTH_AREAS.map((a) => (
              <li key={a.id}>
                <Link to={a.href} className="block rounded-sm">
                  <div className="mb-1 flex items-center justify-between text-body-sm"><span className="font-medium">{a.label}</span><span className="tabular-nums text-ink-secondary">{a.now} <span className={cn('text-caption', a.now < a.lastMonth ? 'text-critical-fg' : 'text-ink-tertiary')}>{a.now === a.lastMonth ? '±0' : `${a.now - a.lastMonth > 0 ? '+' : '−'}${Math.abs(a.now - a.lastMonth)}`}</span></span></div>
                  <ProgressBar value={a.now} label={`${a.label} score`} tone={a.now >= 85 ? 'success' : a.now >= 75 ? 'warning' : 'critical'} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* Attention required */}
        <Card aria-labelledby="attn-h" className="lg:col-span-2">
          <CardHeader id="attn-h" title="Attention required" description="The few things most worth your time today, in priority order." actions={<SectionLink to="/risks">All {f.openRisks} risks</SectionLink>} />
          <ul className="divide-y divide-line">
            {attention.map((a) => (
              <li key={a.to}>
                <Link to={a.to} className="group -mx-2 flex items-start gap-3.5 rounded-md px-2 py-3.5 transition-colors duration-fast hover:bg-hover">
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', a.tone === 'critical' ? 'bg-critical-bg text-critical-fg' : 'bg-warning-bg text-warning-fg')}><a.Icon className="h-5 w-5" aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2"><span className="text-title-2 tabular-nums">{a.count}</span><span className="text-body font-semibold">{a.title}</span></span>
                    <span className="mt-0.5 block text-body-sm text-ink-secondary">{a.why}</span>
                  </span>
                  <Badge tone={a.tone} className="mt-1 hidden sm:inline-flex" icon={a.tone === 'critical' ? <ShieldAlert /> : <AlertTriangle />}>{a.label}</Badge>
                  <ChevronRight className="mt-2.5 h-4 w-4 shrink-0 text-ink-tertiary transition-transform duration-fast group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-5"><AiInsight /></div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card aria-labelledby="risk-h">
          <CardHeader id="risk-h" title="Risk overview" description={`${f.openRisks} open ${f.openRisks === 1 ? 'risk' : 'risks'}, grouped by how serious they are.`} actions={<SectionLink to="/risks">View all</SectionLink>} />
          <SeverityBar counts={f.bySeverity} />
          <p className="mt-4 text-body-sm text-ink-secondary"><Term id="severity">Severity</Term> reflects how much damage a risk could do and how soon. Select a group to see its risks.</p>
        </Card>

        <Card aria-labelledby="up-h">
          <CardHeader id="up-h" title="Upcoming tasks" description={`${f.outstandingTasks} outstanding · ${f.overdueTasks} overdue`} actions={<SectionLink to="/tasks">All tasks</SectionLink>} />
          <ul className="-mx-2 divide-y divide-line">
            {upcoming.map((t) => {
              const d = dueLabel(t.dueDate)
              return (
                <li key={t.id} className="flex items-center gap-3 px-2 py-2.5">
                  <Avatar name={s.personById(t.ownerId)?.name ?? '?'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link to="/tasks" className="block truncate text-body font-medium hover:underline">{t.name}</Link>
                    <p className="truncate text-caption text-ink-secondary">{s.personById(t.ownerId)?.name}{t.riskId && <> · <span className="font-medium">{t.riskId}</span></>}</p>
                  </div>
                  <span className={cn('hidden shrink-0 sm:block')}><PriorityBadge priority={t.priority} /></span>
                  <span className={cn('w-24 shrink-0 text-right text-body-sm tabular-nums', d.overdue ? 'font-semibold text-critical-fg' : d.soon ? 'font-medium text-warning-fg' : 'text-ink-secondary')}>{d.overdue && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" aria-hidden />}{d.text}</span>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card aria-labelledby="act-h" className="lg:col-span-2">
          <CardHeader id="act-h" title="Recent activity" description="What changed across the workspace." />
          <Timeline items={s.activity.slice(0, 7).map((a) => ({ id: a.id, at: a.at, actor: a.actor, kind: a.kind, text: <>{a.text} {a.entity && <EntityChip entity={a.entity} className="ml-1 align-middle" />}</> }))} />
        </Card>
        <Card aria-labelledby="glance-h">
          <CardHeader id="glance-h" title="Your company at a glance" />
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="People" value={f.employees} href="/people" icon={<Users className="h-4 w-4" />} />
            <MetricCard label="Applications" value={f.applications} href="/applications" icon={<AppWindow className="h-4 w-4" />} />
            <MetricCard label="Vendors" value={f.vendors} href="/vendors" icon={<Building2 className="h-4 w-4" />} />
            <MetricCard label="Policies" value={f.policies} href="/policies" icon={<FileText className="h-4 w-4" />} />
            <MetricCard label="Controls passing" term={<Term id="compliance-control">Controls passing</Term>} value={<>{f.controlsPassing}<span className="text-body text-ink-tertiary">/{f.controls}</span></>} href="/reports" icon={<ShieldCheck className="h-4 w-4" />} />
            <MetricCard label="Open tasks" value={f.outstandingTasks} href="/tasks" icon={<ListChecks className="h-4 w-4" />} />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-caption text-ink-secondary"><ClipboardCheck className="h-3.5 w-3.5" aria-hidden />Last synced today at 8:40 AM from 69 connected apps.</p>
        </Card>
      </div>
    </>
  )
}
