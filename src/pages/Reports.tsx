import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import { PageHeader } from '@/components/ui/Page'
import { Card, CardHeader, MetricCard } from '@/components/ui/Card'
import { Tabs, TabPanel } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { StatusBadge, StatusIndicator } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { LineChart } from '@/components/charts/LineChart'
import { StackedColumns } from '@/components/charts/StackedColumns'
import { BarList } from '@/components/charts/BarList'
import { Gauge } from '@/components/charts/Gauge'
import { Term } from '@/components/ui/Tooltip'
import { ProgressBar } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toast'
import { useStore } from '@/state/store'
import { CONTROLS, HEALTH_AREAS, HEALTH_HISTORY, HEALTH_SCORE, MONTHS, RISK_TREND, TASKS_COMPLETED_WEEKLY, TASKS_CREATED_WEEKLY, TRAINING_TREND, WEEKS, type Control } from '@/data/insights'
import { DEPARTMENT_NAMES, currentPeople } from '@/data/people'
import { vendors } from '@/data/vendors'
import { applications } from '@/data/applications'
import { vendorReviewDueSoon, isReviewOutdated } from '@/data/selectors'
import { usePageTitle } from '@/hooks/usePage'
import { EntityChip } from '@/components/domain/entities'

export function ReportsPage() {
  usePageTitle('Reports')
  const [tab, setTab] = useState('overview'); const toast = useToast(); const s = useStore()
  const exp = s.permission('reports.export')

  const dept = DEPARTMENT_NAMES.map((d) => { const ppl = currentPeople.filter((p) => p.department === d); const done = ppl.filter((p) => p.training.status === 'completed').length; return { label: d, value: Math.round((done / ppl.length) * 100), display: `${Math.round((done / ppl.length) * 100)}% (${done}/${ppl.length})`, tone: done === ppl.length ? 'success' as const : done / ppl.length < 0.9 ? 'critical' as const : 'warning' as const } }).sort((a, b) => a.value - b.value)
  const vStat = { current: vendors.filter((v) => v.reviewStatus === 'current' && !vendorReviewDueSoon(v)).length, soon: vendors.filter(vendorReviewDueSoon).length, overdue: vendors.filter((v) => v.reviewStatus === 'overdue').length }
  const aStat = { fresh: applications.filter((a) => !isReviewOutdated(a)).length, over: applications.filter(isReviewOutdated).length }
  const controlCols: Column<Control>[] = [
    { id: 'name', header: 'Control', mobile: 'title', sortValue: (c) => c.name, cell: (c) => <div><p className="font-medium">{c.name}</p><p className="text-caption text-ink-secondary">{c.id} · {c.area}</p></div> },
    { id: 'state', header: 'Status', sortValue: (c) => ['failing', 'attention', 'passing'].indexOf(c.state), cell: (c) => <StatusBadge status={c.state} /> },
    { id: 'evidence', header: 'Evidence', hideBelow: 'md', cell: (c) => <span className="text-body-sm text-ink-secondary">{c.evidence}</span> },
    { id: 'risk', header: 'Related risk', cell: (c) => c.riskId ? <EntityChip entity={{ type: 'risk', id: c.riskId }} /> : <span className="text-ink-tertiary">—</span> },
  ]
  const sorted = [...CONTROLS].sort((a, b) => ['failing', 'attention', 'passing'].indexOf(a.state) - ['failing', 'attention', 'passing'].indexOf(b.state))
  const failing = CONTROLS.filter((c) => c.state === 'failing').length; const attn = CONTROLS.filter((c) => c.state === 'attention').length

  return (
    <>
      <PageHeader title="Reports" description="Trends and detail you can share with leadership or an auditor. Every chart has a “View as table” option for exact numbers."
        actions={<Button iconLeft={<Download className="h-4 w-4" />} disabledReason={exp.allowed ? undefined : exp.reason} onClick={() => toast({ title: 'Report exported', description: 'Atlas-report-Oct-2026.pdf is downloading.' })}>Export PDF</Button>} />
      <Tabs label="Report sections" value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Health & risk' }, { id: 'people', label: 'People & training' }, { id: 'vendors', label: 'Vendors & access' }, { id: 'controls', label: 'Compliance controls', count: CONTROLS.length }]} />
      {tab === 'overview' && (
        <TabPanel label="Health and risk" className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2"><LineChart title="Overall health has dipped for the first time in 10 months" description="Overall health score (0–100), last 12 months. It fell from 91 to 87 in October." labels={MONTHS} series={[{ id: 'h', label: 'Health score', color: 'var(--color-chart-1)', values: HEALTH_HISTORY }]} min={80} max={95} area /></Card>
            <Card><CardHeader title="What changed this month" description="Score by area, vs. last month" />
              <div className="mb-4 flex justify-center"><Gauge value={HEALTH_SCORE} label="Overall health" size={132} /></div>
              <ul className="space-y-2.5">{HEALTH_AREAS.map((a) => <li key={a.id} className="flex items-center justify-between gap-3 text-body-sm"><Link to={a.href} className="hover:underline">{a.label}</Link><span className="tabular-nums"><span className="text-ink-secondary">{a.lastMonth} →</span> <strong>{a.now}</strong> <span className={a.now < a.lastMonth ? 'font-semibold text-critical-fg' : 'text-ink-tertiary'}>{a.now < a.lastMonth ? `▼${a.lastMonth - a.now}` : '–'}</span></span></li>)}</ul></Card>
          </div>
          <Card><StackedColumns title="Open risks have held steady, but the serious ones are up" description="Open risks at the end of each month, by severity." labels={MONTHS} series={[
            { id: 'low', label: 'Low', color: 'var(--color-info-solid)', values: RISK_TREND.low }, { id: 'medium', label: 'Medium', color: 'var(--color-warning-solid)', values: RISK_TREND.medium },
            { id: 'high', label: 'High', color: 'var(--color-high-solid)', values: RISK_TREND.high }, { id: 'critical', label: 'Critical', color: 'var(--color-critical-solid)', values: RISK_TREND.critical }]} /></Card>
          <Card><LineChart title="Teams are closing about as much work as they open" description="Tasks created vs. completed per week." labels={WEEKS} yTicks={4} min={0} max={16} series={[{ id: 'c', label: 'Created', color: 'var(--color-chart-4)', values: TASKS_CREATED_WEEKLY, dashed: true }, { id: 'd', label: 'Completed', color: 'var(--color-chart-1)', values: TASKS_COMPLETED_WEEKLY }]} /></Card>
        </TabPanel>)}
      {tab === 'people' && (
        <TabPanel label="People and training" className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Training completion" term={<Term id="security-training">Training completion</Term>} value="94%" delta={{ text: '−1.2 pts', direction: 'down' }} deltaGood={false} hint="234 of 248 people" />
            <MetricCard label="Overdue" value="6" hint="Past due date" delta={{ text: '+2', direction: 'up' }} deltaGood={false} />
            <MetricCard label="Policy acknowledgement" value="93%" hint="Average across published policies" delta={{ text: '+1 pt', direction: 'up' }} deltaGood />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card><LineChart title="Training completion is slipping" description="Share of people with current security training." labels={MONTHS} series={[{ id: 't', label: 'Completed', color: 'var(--color-chart-1)', values: TRAINING_TREND }]} min={85} max={100} unit="%" area /></Card>
            <Card><BarList title="Where training is incomplete" description="Completion by department, lowest first." items={dept} max={100} valueLabel="Completed" /></Card>
          </div>
        </TabPanel>)}
      {tab === 'vendors' && (
        <TabPanel label="Vendors and access" className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card><BarList title="Vendor review status" description={`${vendors.length} vendors`} valueLabel="Vendors" items={[{ label: 'Current', value: vStat.current, tone: 'success' }, { label: 'Due in the next 30 days', value: vStat.soon, tone: 'warning', to: '/vendors?review=due_soon' }, { label: 'Overdue', value: vStat.overdue, tone: 'critical', to: '/vendors?review=overdue' }]} /></Card>
            <Card><BarList title="Application access reviews" description={`${applications.length} applications; policy is every 180 days`} valueLabel="Applications" items={[{ label: 'Reviewed within 180 days', value: aStat.fresh, tone: 'success' }, { label: 'Overdue', value: aStat.over, tone: 'critical', to: '/applications?review=outdated' }]} /></Card>
          </div>
          <Card padded={false}><div className="p-5 pb-0"><CardHeader title="Applications overdue for access review" description="Detail behind the chart above." /></div>
            <DataTable caption="Applications overdue for access review" pageSize={0} noun="applications" rows={applications.filter(isReviewOutdated)} getRowKey={(a) => a.id}
              columns={[{ id: 'a', header: 'Application', mobile: 'title', cell: (a) => <EntityChip entity={{ type: 'application', id: a.id }} /> }, { id: 'l', header: 'Last review', sortValue: (a) => a.lastReview, cell: (a) => a.lastReview }, { id: 'o', header: 'Owner', cell: (a) => s.personById(a.ownerId)?.name }]} /></Card>
        </TabPanel>)}
      {tab === 'controls' && (
        <TabPanel label="Compliance controls" className="space-y-5">
          <Card><div className="flex flex-wrap items-center gap-x-8 gap-y-3"><div><p className="text-body-sm text-ink-secondary"><Term id="compliance-control">Controls</Term> passing</p><p className="text-title-1 tabular-nums">{CONTROLS.length - failing - attn} <span className="text-body text-ink-tertiary">of {CONTROLS.length}</span></p></div>
            <div className="min-w-[14rem] flex-1"><ProgressBar value={CONTROLS.length - failing - attn} max={CONTROLS.length} tone="success" label="Controls passing" /><div className="mt-2 flex flex-wrap gap-4 text-body-sm"><StatusIndicator status="passing" label={`${CONTROLS.length - failing - attn} passing`} /><StatusIndicator status="attention" label={`${attn} need attention`} /><StatusIndicator status="failing" label={`${failing} failing`} /></div></div></div>
            <p className="mt-3 text-body-sm text-ink-secondary">A control is a safeguard the company has promised to have, like “laptops are encrypted”. Auditors check each one for evidence.</p></Card>
          <Card padded={false}><DataTable caption="Compliance controls" columns={controlCols} rows={sorted} getRowKey={(c) => c.id} pageSize={14} noun="controls" /></Card>
        </TabPanel>)}
    </>
  )
}
