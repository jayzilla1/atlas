import { useEffect, useState } from 'react'
import { AlertTriangle, Bell, CircleAlert, CircleCheck, Clock, Info, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Checkbox, Field, Input, RadioGroup, SearchInput, Select, Textarea, Toggle } from '@/components/ui/Form'
import { Tabs, Segmented } from '@/components/ui/Tabs'
import { Modal, Drawer, ConfirmDialog } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toast'
import { Menu } from '@/components/ui/Menu'
import { Tooltip } from '@/components/ui/Tooltip'
import { Calendar } from '@/components/ui/Calendar'
import { Table, THead, TR, TH, TD } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Metric } from '@/components/ui/Metric'
import { Progress } from '@/components/ui/Progress'
import { EmptyState, ErrorState, RestrictedState, Skeleton, SkeletonRows } from '@/components/ui/States'
import { Timeline, TimelineItem } from '@/components/ui/Timeline'
import { TaskItem } from '@/components/ui/Checklist'
import { AttendanceBadge, CloseoutBadge, DiaperBadge, DocBadge, PaymentBadge, SensitiveBadge, SupplyBadge } from '@/components/domain/Status'
import { AttentionRow } from '@/components/domain/Attention'
import { Wordmark, LogoMark } from '@/layouts/Logo'
import { contrast, cssVarHex } from '@/utils/contrast'
import { useSession } from '@/state/session'

const COLORS: Array<[string, string, string]> = [
  ['primary', '--primary', 'The brand. Buttons, active nav, focus of attention'], ['primary-hover', '--primary-hover', 'Hover and pressed'], ['primary-subtle', '--primary-subtle', 'Soft orange: needs attention soon'], ['primary-text', '--primary-text', 'Orange used as text'],
  ['backdrop', '--backdrop', 'Soft grey behind the glass frame'], ['canvas', '--canvas', 'Page background where there is no frame'], ['surface', '--surface', 'Opaque white: dialogs, inputs, menus'], ['surface-sunken', '--surface-sunken', 'Wells, quiet chips'],
  ['text-primary', '--text-primary', 'Charcoal body text'], ['text-secondary', '--text-secondary', 'Supporting text'], ['text-tertiary', '--text-tertiary', 'Hints and meta'], ['border-strong', '--border-strong', 'Input and control edges'],
]
const PAIRS: Array<[string, string, string, number]> = [
  ['Body text on canvas', '--text-primary', '--canvas', 4.5], ['Secondary text on surface', '--text-secondary', '--surface', 4.5], ['Tertiary text on surface', '--text-tertiary', '--surface', 4.5],
  ['White on primary (buttons)', '--on-primary', '--primary', 4.5], ['Primary text on soft orange', '--primary-text', '--primary-subtle', 4.5],
  ['Quiet chip (success / neutral)', '--success-text', '--success-bg', 4.5], ['Soft-orange chip (warning)', '--warning-text', '--warning-bg', 4.5], ['Orange text on danger tint', '--danger-text', '--danger-bg', 4.5], ['Outline chip (info)', '--info-text', '--surface', 4.5],
  ['Input border on surface (UI)', '--border-strong', '--surface', 3], ['Focus ring on canvas (UI)', '--focus-ring', '--canvas', 3],
]
const TYPE = [['Display', 'text-display', '40 / 700', 'Big numbers: 8'], ['H1', 'text-h1', '30 / 700', 'Page title'], ['H2', 'text-h2', '24 / 700', 'Section title'], ['H3', 'text-h3', '20 / 650', 'Card heading'], ['Lead', 'text-lead', '18 / 400', 'Intro paragraph'], ['Body', 'text-body', '16 / 400', 'Default reading text'], ['Small', 'text-small', '14 / 400', 'Tables and secondary'], ['Caption', 'text-caption', '12 / 400', 'Labels and meta']]
const SECTIONS = ['Foundations', 'Components', 'States', 'Patterns']

export default function DesignSystem() {
  const { today } = useSession()
  const toast = useToast()
  const [colors, setColors] = useState<Record<string, string>>({})
  const [modal, setModal] = useState(false), [drawer, setDrawer] = useState(false), [confirm, setConfirm] = useState(false)
  const [tab, setTab] = useState('a'), [seg, setSeg] = useState('x'), [radio, setRadio] = useState('a'), [tog, setTog] = useState(true), [chk, setChk] = useState(true), [page, setPage] = useState(1)
  const [date, setDate] = useState(today)
  useEffect(() => { setColors(Object.fromEntries([...COLORS.map((c) => c[1]), ...PAIRS.flatMap((p) => [p[1], p[2]])].map((v) => [v, cssVarHex(v)]))) }, [])

  return (
    <>
      <PageHeader title="GoodHands design system" description="The tokens, components and patterns behind every screen. Everything here is live code — the same components the product uses." />
      <nav aria-label="On this page" className="mb-8 flex flex-wrap gap-2">{SECTIONS.map((s) => <a key={s} href={`#${s.toLowerCase()}`} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-small font-semibold hover:bg-surface-sunken">{s}</a>)}</nav>

      <Block id="foundations" title="Foundations">
        <Sub title="Brand">
          <Card className="flex flex-wrap items-center gap-8"><Wordmark size="lg" /><LogoMark size={56} /><p className="max-w-md text-small text-ink-secondary">A child held by two cupped hands. Warm, steady and professional — no cartoon characters or primary-colour overload. Orange is the only brand colour; everything else is white, glass and grey, so orange always means ‘look here’.</p></Card>
        </Sub>
        <Sub title="Colour principle: one hue" note="GoodHands uses a single brand colour (orange) plus neutral greys. Status is shown by intensity, not by a rainbow — quiet grey means fine, soft orange means look at this, solid orange means act now. Every status also has an icon and a word.">
          <Card className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="flex items-center gap-2"><Badge tone="success" icon={<CircleCheck />}>Present · Paid · Good</Badge><span className="text-caption text-ink-secondary">quiet grey = all fine</span></span>
            <span className="flex items-center gap-2"><Badge tone="warning" icon={<Clock />}>Late · Due · Running low</Badge><span className="text-caption text-ink-secondary">soft orange = soon</span></span>
            <span className="flex items-center gap-2"><Badge tone="danger" icon={<CircleAlert />}>Overdue · Out · Missing</Badge><span className="text-caption text-ink-secondary">solid orange = now</span></span>
          </Card>
        </Sub>
        <Sub title="Colour — semantic tokens" note="Components never use raw colours; they use names for what a colour means. Change a token and the whole product follows.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COLORS.map(([name, v, use]) => <div key={v} className="overflow-hidden rounded-lg border border-line bg-surface"><div className="h-14 border-b border-line" style={{ background: `var(${v})` }} /><div className="p-2.5"><p className="text-small font-semibold">{name}</p><p className="font-mono text-caption text-ink-secondary">{colors[v] ?? ''}</p><p className="text-caption text-ink-secondary">{use}</p></div></div>)}
          </div>
        </Sub>
        <Sub title="Contrast checks (WCAG 2.2 AA)" note="Computed live from the real token values. Text needs 4.5:1; UI boundaries need 3:1.">
          <Card padded={false}><Table caption="Colour contrast checks"><THead><TR><TH>Pair</TH><TH>Sample</TH><TH align="right">Ratio</TH><TH>Result</TH></TR></THead>
            <tbody>{PAIRS.map(([label, fg, bg, min]) => { const r = colors[fg] && colors[bg] ? contrast(colors[fg], colors[bg]) : 0; return <TR key={label}><TD>{label}</TD><TD><span className="rounded px-2 py-0.5 text-small font-semibold" style={{ color: `var(${fg})`, background: `var(${bg})` }}>Aa</span></TD><TD align="right">{r.toFixed(2)}:1</TD><TD>{r >= min ? <Badge tone="success">Passes {min}:1</Badge> : <Badge tone="danger">Below {min}:1</Badge>}</TD></TR> })}</tbody></Table></Card>
        </Sub>
        <Sub title="Typography" note="Poppins — a modern, geometric sans-serif — throughout: regular and medium for reading, semibold and bold for titles and big numbers.">
          <Card className="divide-y divide-line-subtle !p-0">{TYPE.map(([n, cls, spec, sample]) => <div key={n} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 px-5 py-3"><span className="w-20 text-caption font-semibold text-ink-secondary">{n}</span><span className={cls}>{sample}</span><span className="ml-auto font-mono text-caption text-ink-tertiary">{spec}</span></div>)}</Card>
        </Sub>
        <div className="grid gap-8 lg:grid-cols-3">
          <Sub title="Spacing (4px base)"><Card className="space-y-1.5">{[1, 2, 3, 4, 6, 8, 12].map((n) => <div key={n} className="flex items-center gap-3 text-caption"><span className="w-14 font-mono text-ink-secondary">space-{n}</span><span className="h-3 rounded-sm bg-primary" style={{ width: `calc(var(--space-${n}))` }} /><span className="text-ink-tertiary">{n * 4}px</span></div>)}</Card></Sub>
          <Sub title="Radius"><Card className="flex flex-wrap gap-3">{[['sm', '6'], ['md', '8'], ['lg', '12'], ['full', '999']].map(([n, px]) => <div key={n} className="text-center text-caption"><div className="mb-1 h-14 w-14 border-2 border-primary bg-primary-subtle" style={{ borderRadius: `var(--radius-${n})` }} />{n}<br /><span className="text-ink-tertiary">{px}px</span></div>)}</Card></Sub>
          <Sub title="Elevation & glass"><Card className="flex flex-wrap gap-4">{['sm', 'md', 'lg'].map((n) => <div key={n} className="flex h-14 w-16 items-center justify-center rounded-lg bg-surface text-caption" style={{ boxShadow: `var(--shadow-${n})` }}>{n}</div>)}</Card></Sub>
        </div>
        <Sub title="Motion" note="Short and purposeful. All durations read tokens, so ‘reduce motion’ in the operating system turns them to zero."><Card className="flex flex-wrap gap-6 text-small">{[['fast', '120ms', 'hover, press'], ['base', '200ms', 'status change, fade'], ['slow', '320ms', 'progress, drawers']].map(([n, ms, use]) => <div key={n}><p className="font-semibold">motion-{n} <span className="font-normal text-ink-secondary">{ms}</span></p><p className="text-caption text-ink-secondary">{use}</p></div>)}</Card></Sub>
      </Block>

      <Block id="components" title="Components">
        <Sub title="Buttons"><Card className="space-y-4"><div className="flex flex-wrap items-center gap-3"><Button variant="primary">Primary</Button><Button>Secondary</Button><Button variant="subtle">Subtle</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Danger</Button><Button variant="primary" disabled>Disabled</Button><Button variant="primary" loading>Loading</Button></div><div className="flex flex-wrap items-center gap-3"><Button variant="primary" size="sm">Small</Button><Button variant="primary">Medium</Button><Button variant="primary" size="lg">Large (check-in)</Button><IconButton label="Notifications" variant="secondary"><Bell className="h-5 w-5" /></IconButton><IconButton label="More"><MoreHorizontal className="h-5 w-5" /></IconButton></div><p className="text-caption text-ink-secondary">Buttons are at least 40px tall (44px on touch devices). Icon-only buttons always have a text label for screen readers and a tooltip.</p></Card></Sub>
        <Sub title="Form controls"><Card className="grid gap-5 md:grid-cols-2">
          <Field label="Text input" hint="Hint text appears under the field.">{(p) => <Input {...p} placeholder="Placeholder" />}</Field>
          <Field label="With an error" error="This is what an error looks like — plain words, next to the field.">{(p) => <Input {...p} defaultValue="Oops" />}</Field>
          <Field label="Select">{(p) => <Select {...p}><option>Option one</option><option>Option two</option></Select>}</Field>
          <Field label="Disabled">{(p) => <Input {...p} disabled value="Can’t edit" readOnly />}</Field>
          <Field label="Textarea" className="md:col-span-2">{(p) => <Textarea {...p} />}</Field>
          <SearchInput value="" onChange={() => {}} placeholder="Search" />
          <div className="space-y-1"><Checkbox checked={chk} onChange={(e) => setChk(e.target.checked)} label="Checkbox" description="With helper text" /><Checkbox checked={false} onChange={() => {}} disabled label="Disabled checkbox" /></div>
          <RadioGroup legend="Radio group" value={radio} onChange={setRadio} options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]} />
          <Toggle checked={tog} onChange={setTog} label="Toggle switch" description="On/off, announced as a switch." />
        </Card></Sub>
        <Sub title="Badges & status indicators" note="Every status = colour + icon + text. Never colour alone."><Card className="space-y-3">
          <div className="flex flex-wrap gap-2"><Badge tone="neutral">Neutral</Badge><Badge tone="success">Success</Badge><Badge tone="warning">Warning</Badge><Badge tone="danger">Danger</Badge><Badge tone="info">Info</Badge><Badge tone="primary">Primary</Badge><SensitiveBadge /></div>
          <div className="flex flex-wrap gap-2">{(['expected', 'present', 'late', 'absent', 'vacation', 'checked_out'] as const).map((s) => <AttendanceBadge key={s} view={{ status: s, lateMinutes: 27 }} />)}</div>
          <div className="flex flex-wrap gap-2"><PaymentBadge status="paid" /><PaymentBadge status="due" /><PaymentBadge status="overdue" /><SupplyBadge status="good" /><SupplyBadge status="low" /><SupplyBadge status="restock" /></div>
          <div className="flex flex-wrap gap-2"><DiaperBadge status="good" /><DiaperBadge status="low" notified /><DiaperBadge status="out" /><DocBadge status="current" /><DocBadge status="expiring" /><DocBadge status="missing" /></div>
          <div className="flex flex-wrap gap-2"><CloseoutBadge status="not_started" /><CloseoutBadge status="in_progress" /><CloseoutBadge status="ready" /><CloseoutBadge status="completed" /></div>
        </Card></Sub>
        <Sub title="Avatars, tooltip, menu, tabs"><Card className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">{[0, 1, 2, 3, 4].map((i) => <Avatar key={i} first={['Amari', 'Jordan', 'Maya', 'Noah', 'Priya'][i]} last="X" tint={i} />)}<Avatar first="Maya" last="J" size="lg" /><Tooltip label="Tooltips appear on hover and focus"><Button>Hover or focus me</Button></Tooltip>
            <Menu label="Example menu" trigger={(p) => <Button {...p} iconAfter={<MoreHorizontal className="h-4 w-4" />}>Menu</Button>} items={[{ label: 'Edit', onSelect: () => {} }, { label: 'Duplicate', onSelect: () => {} }, { label: 'Delete', icon: <Trash2 />, danger: true, separatorBefore: true, onSelect: () => {} }]} /></div>
          <Tabs label="Example tabs" value={tab} onChange={setTab} items={[{ id: 'a', label: 'Overview' }, { id: 'b', label: 'Health', count: 2 }, { id: 'c', label: 'Documents' }]} />
          <Segmented label="Example filter" value={seg} onChange={setSeg} items={[{ id: 'x', label: 'All', count: 9 }, { id: 'y', label: 'Present', count: 6 }, { id: 'z', label: 'Absent', count: 1 }]} />
          <Breadcrumbs items={[{ label: 'Children', to: '/children' }, { label: 'Maya Johnson' }]} />
        </Card></Sub>
        <Sub title="Overlays & feedback"><Card className="flex flex-wrap gap-3"><Button onClick={() => setModal(true)}>Open modal</Button><Button onClick={() => setDrawer(true)}>Open drawer</Button><Button variant="danger" onClick={() => setConfirm(true)}>Confirmation dialog</Button><Button onClick={() => toast({ title: 'Maya checked in', description: '10:14 AM', action: { label: 'Undo', onClick: () => {} } })}>Show toast</Button><Button onClick={() => toast({ title: 'Couldn’t save', description: 'Try again.', tone: 'danger' })}>Error toast</Button></Card>
          <Modal open={modal} onClose={() => setModal(false)} title="Modal" description="Focus is trapped here; Esc closes it." footer={<><Button onClick={() => setModal(false)}>Cancel</Button><Button variant="primary" onClick={() => setModal(false)}>Save</Button></>}><p>Built on the native dialog element, so keyboard and screen-reader behaviour is correct by default.</p></Modal>
          <Drawer open={drawer} onClose={() => setDrawer(false)} title="Drawer" description="A side panel on desktop, a bottom sheet on phones."><p>Used for editing a record without leaving the page.</p></Drawer>
          <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => setConfirm(false)} tone="danger" title="Mark this payment as unpaid?" description="Destructive confirmations focus Cancel first." confirmLabel="Mark as unpaid" /></Sub>
        <Sub title="Table, pagination, metric, progress, calendar"><div className="grid gap-6 lg:grid-cols-[1fr_20rem]"><div className="space-y-5">
          <Card padded={false}><Table caption="Example table"><THead><TR><TH>Child</TH><TH>Status</TH><TH align="right">Amount</TH></TR></THead><tbody><TR><TD>Amari</TD><TD><PaymentBadge status="paid" /></TD><TD align="right">$250</TD></TR><TR><TD>Maya</TD><TD><PaymentBadge status="due" /></TD><TD align="right">$250</TD></TR></tbody></Table></Card>
          <Pagination page={page} pageSize={8} total={23} onPage={setPage} noun="children" />
          <div className="flex gap-6"><Metric label="Present" value={6} /><Metric label="Not arrived" value={1} tone="warning" /></div>
          <Progress value={4} max={9} label="Tasks" /></div><Card><Calendar value={date} onChange={setDate} today={today} /></Card></div></Sub>
      </Block>

      <Block id="states" title="States">
        <div className="grid gap-5 md:grid-cols-2">
          <EmptyState icon={<Plus />} title="Empty" description="Says why it’s empty and what to do." action={<Button variant="primary">Add something</Button>} compact />
          <ErrorState title="Error" onRetry={() => {}} className="!py-8" />
          <Card><p className="mb-3 text-small font-semibold">Loading (skeleton)</p><SkeletonRows rows={2} /></Card>
          <Card className="space-y-2"><p className="text-small font-semibold">Other skeletons</p><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-10 w-full" /></Card>
          <div className="md:col-span-2"><RestrictedState area="Payments" /></div>
        </div>
      </Block>

      <Block id="patterns" title="Patterns">
        <Sub title="Attention item"><Card padded={false} className="px-4"><ul><AttentionRow item={{ id: 'x', tone: 'warning', icon: 'diaper', title: 'Maya’s diapers are running low', detail: 'Let the family know.', action: { kind: 'navigate', to: '/children/maya?tab=supplies', label: 'Notify parent' } }} /></ul></Card></Sub>
        <Sub title="Task timeline (employee)"><Card><Timeline label="Example tasks"><TimelineItem state="done" time="9:00 AM"><TaskItem title="Prepare morning snack" time="09:00" state="completed" completedAt="09:05" readOnly /></TimelineItem><TimelineItem state="overdue" time="10:00 AM"><TaskItem title="Set up craft activity" time="10:00" state="overdue" notes="Glue sticks in blue bin" onComplete={() => {}} /></TimelineItem><TimelineItem state="upcoming" time="11:30 AM" last><TaskItem title="Prepare lunch area" time="11:30" state="upcoming" onComplete={() => {}} /></TimelineItem></Timeline></Card></Sub>
        <Sub title="AI response — principles"><Card className="space-y-2 text-small"><p className="flex items-center gap-2"><Info className="h-4 w-4 text-info" aria-hidden /><strong>Sources shown</strong> · every answer lists what data it used.</p><p className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" aria-hidden /><strong>Honest about uncertainty</strong> · “Fairly sure” / “Not sure” plus a caveat.</p><p className="flex items-center gap-2"><Bell className="h-4 w-4 text-primary" aria-hidden /><strong>Proposes, never acts</strong> · Review → Approve; nothing is sent without a person.</p></Card></Sub>
      </Block>
    </>
  )
}
function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) { return <section id={id} className="mb-14 scroll-mt-20"><h2 className="mb-5 border-b border-line pb-2 text-h2">{title}</h2><div className="space-y-8">{children}</div></section> }
function Sub({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) { return <div><h3 className="text-lead font-semibold">{title}</h3>{note && <p className="mb-3 text-small text-ink-secondary">{note}</p>}{!note && <div className="mb-3" />}<div className="min-w-0 overflow-x-auto">{children}</div></div> }
