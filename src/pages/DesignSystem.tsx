import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Bold, Inbox, Search, Settings, Sparkles, Trash2, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/Page'
import { Breadcrumbs } from '@/components/ui/Page'
import { Button, IconButton, ButtonLink, type ButtonVariant } from '@/components/ui/Button'
import { Checkbox, Field, Input, Radio, RadioGroup, SearchInput, Select, Textarea, Toggle } from '@/components/ui/Form'
import { Badge, SeverityBadge, StatusBadge, StatusIndicator, STATUS, type Tone } from '@/components/ui/Badge'
import { Avatar, AvatarGroup } from '@/components/ui/Avatar'
import { Tooltip, Term } from '@/components/ui/Tooltip'
import { Dropdown } from '@/components/ui/Dropdown'
import { ConfirmDialog, Drawer, Modal } from '@/components/ui/Overlay'
import { useToast } from '@/components/ui/Toast'
import { Tabs } from '@/components/ui/Tabs'
import { Card, CardHeader, Callout, MetricCard, Disclosure, DescriptionList } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState, ErrorState, LoadingState, ProgressBar, Skeleton, TableSkeleton, CardGridSkeleton } from '@/components/ui/Feedback'
import { Timeline } from '@/components/ui/Timeline'
import { AiBadge, AiThinking, ConfidenceBadge, SourceList, Caret } from '@/components/ai/AiParts'
import { AiInsight } from '@/components/ai/AiInsight'
import { LineChart } from '@/components/charts/LineChart'
import { SeverityBar } from '@/components/charts/SeverityBar'
import { Gauge, Sparkline } from '@/components/charts/Gauge'
import { BarList } from '@/components/charts/BarList'
import { Specimen, Swatch, contrast, useThemeTick } from '@/components/system/Spec'
import { COMPONENT_TOKENS, MOTION, PRIMITIVE_RAMPS, RADII, SEMANTIC_COLORS, SHADOWS, SPACING, TYPE_SCALE, tokenValue } from '@/tokens/manifest'
import { useStore } from '@/state/store'
import { usePageTitle } from '@/hooks/usePage'
import { cn } from '@/utils/cn'
import type { Severity } from '@/data/types'

const NAV = [
  ['principles', 'Principles'], ['tokens', 'Token architecture'], ['color', 'Color'], ['type', 'Typography'], ['space', 'Spacing, radius, elevation, motion'],
  ['buttons', 'Buttons'], ['forms', 'Form controls'], ['status', 'Badges & status'], ['nav', 'Navigation'], ['overlays', 'Overlays & feedback'], ['data', 'Cards, tables & data'],
  ['states', 'Empty, loading, error'], ['ai', 'AI components'], ['charts', 'Charts'], ['responsive', 'Responsive'], ['a11y', 'Accessibility'],
] as const

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'subtle', 'danger']
const FORCE: Record<string, { hover: string; pressed: string }> = {
  primary: { hover: '!bg-action-hover', pressed: '!bg-action-pressed' }, secondary: { hover: '!bg-hover', pressed: '!bg-sunken' },
  ghost: { hover: '!bg-sunken !text-ink', pressed: '!bg-line' }, subtle: { hover: '!brightness-95', pressed: '!brightness-90' }, danger: { hover: '!brightness-110', pressed: '!brightness-90' },
}

export function DesignSystemPage() {
  usePageTitle('Design System')
  const s = useStore(); const toast = useToast(); useThemeTick()
  const [modal, setModal] = useState(false); const [confirm, setConfirm] = useState(false); const [danger, setDanger] = useState(false); const [drawer, setDrawer] = useState(false)
  const [tab, setTab] = useState('a'); const [check, setCheck] = useState(true); const [radio, setRadio] = useState('b'); const [tog, setTog] = useState(true); const [q, setQ] = useState(''); const [page, setPage] = useState(2)
  const [active, setActive] = useState('principles')
  useEffect(() => {
    const io = new IntersectionObserver((es) => { const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]; if (v) setActive(v.target.id) }, { rootMargin: '-80px 0px -70% 0px' })
    NAV.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [])
  const pairs: [string, string, string][] = [
    ['--color-text-primary', '--color-bg-surface', 'Primary text on surface'], ['--color-text-secondary', '--color-bg-surface', 'Secondary text on surface'], ['--color-text-tertiary', '--color-bg-surface', 'Tertiary text on surface'],
    ['--color-action-primary-contrast', '--color-action-primary', 'Primary button label'], ['--color-text-link', '--color-bg-surface', 'Link on surface'], ['--color-border-strong', '--color-bg-surface', 'Input border (UI ≥ 3:1)'],
    ['--color-critical-fg', '--color-critical-bg', 'Critical badge'], ['--color-high-fg', '--color-high-bg', 'High badge'], ['--color-warning-fg', '--color-warning-bg', 'Medium / warning badge'],
    ['--color-success-fg', '--color-success-bg', 'Success badge'], ['--color-info-fg', '--color-info-bg', 'Info / low badge'], ['--color-ai-text', '--color-ai-subtle', 'AI text on AI surface'],
  ]

  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Help', to: '/help' }, { label: 'Design System' }]} title="Atlas Design System"
        description="Tokens, components and states behind the product, laid out so they can be rebuilt as Figma variables and components. Turn on the Portfolio inspector to read any component’s spec in context."
        actions={<><Button variant={s.inspect ? 'primary' : 'secondary'} iconLeft={<Search className="h-4 w-4" />} onClick={() => s.setInspect(!s.inspect)} aria-pressed={s.inspect}>{s.inspect ? 'Inspector on' : 'Portfolio inspector'}</Button>
          <Select aria-label="Theme" className="w-32" value={s.theme} onChange={(e) => s.setTheme(e.target.value as 'system' | 'light' | 'dark')} options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} /></>} />

      <div className="grid gap-8 lg:grid-cols-[13rem_1fr]">
        <nav aria-label="Design system sections" className="hidden lg:block"><ul className="sticky top-20 space-y-0.5">{NAV.map(([id, label]) => <li key={id}><a href={`#${id}`} aria-current={active === id ? 'true' : undefined} className={cn('block rounded-md px-3 py-1.5 text-body-sm', active === id ? 'bg-selected font-medium text-ink' : 'text-ink-secondary hover:bg-hover hover:text-ink')}>{label}</a></li>)}</ul></nav>

        <div className="min-w-0 space-y-12">
          {/* ------------------------------ Principles ------------------------------ */}
          <section id="principles" className="scroll-mt-20"><h2 className="mb-3 text-title-2">Principles</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {[['Make complex things understandable', 'Plain-language labels, glossary tooltips and “why this matters” blocks are components, not afterthoughts.'], ['Never colour alone', 'Status = colour + icon + text label. Always.'], ['AI is a collaborator with visible limits', 'Sources, confidence, caveats and human approval are built into every AI component.'], ['Calm density', 'Information-rich but quiet: borders over shadows, one accent colour, restrained radius.'], ['Semantic over literal', 'Components reference intent (“action-primary”), never raw colour (“blue-600”).'], ['Accessibility is a token', 'Focus ring, 24px targets and contrast pairs are defined once and inherited.']].map(([t, d]) => <Card key={t}><h3 className="text-title-3">{t}</h3><p className="mt-1 text-body text-ink-secondary">{d}</p></Card>)}
            </div></section>

          {/* ------------------------------ Token architecture ------------------------------ */}
          <section id="tokens" className="scroll-mt-20"><h2 className="mb-3 text-title-2">Token architecture</h2>
            <p className="mb-4 max-w-3xl text-body-lg text-ink-secondary">Three layers. Each layer may only reference the layer before it. Changing a primitive re-skins the brand; changing a semantic token re-maps meaning (that is how dark mode works); changing a component token fine-tunes one component.</p>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { l: '1 · Primitive', f: 'primitives.css', ex: '--blue-600: #1d4ed8', d: 'Raw values. No meaning. Never used by components.' },
                { l: '2 · Semantic', f: 'semantic.css', ex: '--color-action-primary: var(--blue-600)', d: 'Intent. Themes (light / dark) remap this layer only.' },
                { l: '3 · Component', f: 'component.css', ex: '--button-primary-bg: var(--color-action-primary)', d: 'Per-component decisions: the “knobs” you expose in Figma.' },
              ].map((x, i) => <Card key={x.l} className="relative"><Badge tone={i === 0 ? 'neutral' : i === 1 ? 'info' : 'ai'}>{x.l}</Badge><p className="mt-2 font-mono text-caption text-ink-secondary">{x.f}</p><code className="mt-2 block rounded bg-sunken p-2 text-caption">{x.ex}</code><p className="mt-2 text-body-sm text-ink-secondary">{x.d}</p></Card>)}
            </div>
            <Card className="mt-3"><p className="text-body-sm font-semibold">Live example — what a primary button resolves to</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-caption">{['--blue-600', '→', '--color-action-primary', '→', '--button-primary-bg'].map((t, i) => t === '→' ? <span key={i} aria-hidden>→</span> : <span key={i} className="inline-flex items-center gap-1.5 rounded border border-line px-2 py-1"><span className="h-3 w-3 rounded-sm border border-line" style={{ background: `var(${t})` }} />{t}</span>)}<span className="text-ink-secondary">= {tokenValue('--button-primary-bg')}</span></div></Card></section>

          {/* ------------------------------ Color ------------------------------ */}
          <section id="color" className="scroll-mt-20 space-y-5"><h2 className="text-title-2">Color</h2>
            <Specimen id="c-prim" name="Primitive ramps" description="Raw palette. Neutral is a cool slate; blue is the brand; teal is reserved for AI; the rest are status hues.">
              <div className="space-y-4">{PRIMITIVE_RAMPS.map((r) => <div key={r.name}><p className="mb-1.5 text-body-sm"><span className="font-semibold">{r.name}</span> <span className="text-ink-secondary">— {r.note}</span></p>
                <div className="grid grid-cols-5 gap-1 sm:grid-cols-9 lg:grid-cols-13" style={{ gridTemplateColumns: `repeat(${r.steps.length}, minmax(0, 1fr))` }}>{r.steps.map((st) => <div key={st} title={`--${r.name}-${st}`}><div className="h-9 rounded-sm border border-line" style={{ background: `var(--${r.name}-${st})` }} /><p className="mt-1 text-center font-mono text-[0.625rem] text-ink-secondary">{st}</p></div>)}</div></div>)}</div>
            </Specimen>
            {SEMANTIC_COLORS.map((g) => <Specimen key={g.id} id={`c-${g.id}`} name={`Semantic · ${g.title}`} description={g.description}><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{g.tokens.map((t) => <Swatch key={t.name} token={t.name} role={t.role} />)}</div></Specimen>)}
            <Specimen id="c-contrast" name="Contrast checks (live)" description="Computed from the tokens in the current theme. Text needs ≥ 4.5:1; UI boundaries ≥ 3:1 (WCAG 2.2 AA).">
              <div className="overflow-x-auto"><table className="w-full text-left text-body-sm"><caption className="sr-only">Contrast ratios</caption><thead><tr className="border-b border-line text-caption text-ink-secondary"><th scope="col" className="py-2 pr-4">Pair</th><th scope="col" className="py-2 pr-4">Preview</th><th scope="col" className="py-2 pr-4">Ratio</th><th scope="col" className="py-2">Result</th></tr></thead>
                <tbody className="divide-y divide-line">{pairs.map(([fg, bg, label]) => { const r = contrast(fg, bg); const need = label.includes('border') ? 3 : 4.5; return <tr key={label}><th scope="row" className="py-2 pr-4 font-medium">{label}</th><td className="py-2 pr-4"><span className="rounded px-2 py-1 font-semibold" style={label.includes('border') ? { background: `var(${bg})`, border: `2px solid var(${fg})` } : { color: `var(${fg})`, background: `var(${bg})`, border: '1px solid var(--color-border-default)' }}>{label.includes('border') ? 'Box' : 'Aa 12'}</span></td><td className="py-2 pr-4 tabular-nums">{r.toFixed(2)}:1</td><td className="py-2">{r >= need ? <StatusIndicator tone="success" status="passing" label={`Pass (≥ ${need}:1)`} /> : <StatusIndicator status="failing" label={`Fail (needs ${need}:1)`} />}</td></tr> })}</tbody></table></div>
            </Specimen>
          </section>

          {/* ------------------------------ Type ------------------------------ */}
          <section id="type" className="scroll-mt-20 space-y-5"><h2 className="text-title-2">Typography</h2>
            <Specimen id="type-scale" name="Type scale" description="Inter Variable. Nine steps; headings are semibold with tightened tracking; body never goes below 13px except captions." tokens={['--font-size-*', '--line-height-*', '--font-family-sans']}>
              <div className="divide-y divide-line">{TYPE_SCALE.map((t) => <div key={t.id} className="grid items-baseline gap-2 py-3 md:grid-cols-[10rem_1fr_16rem]"><div><p className="text-body-sm font-semibold">{t.name}</p><p className="font-mono text-caption text-ink-tertiary">text-{t.id}</p></div>
                <p className={`text-${t.id}`} style={t.id === 'overline' ? { textTransform: 'uppercase' } : undefined}>{t.id === 'display' ? '87 / 100' : 'Complex enterprise information, made understandable'}</p>
                <p className="font-mono text-caption text-ink-secondary">{tokenValue(`--font-size-${t.id}`)} / {tokenValue(`--line-height-${t.id}`)} · {t.weight} · {t.track}<br /><span className="font-sans">{t.use}</span></p></div>)}</div>
            </Specimen>
          </section>

          {/* ------------------------------ Space / radius / elevation / motion ------------------------------ */}
          <section id="space" className="scroll-mt-20 space-y-5"><h2 className="text-title-2">Spacing, radius, elevation, motion</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              <Specimen id="sp" name="Spacing" description="4px base grid." tokens={['--space-1 … --space-16']}><ul className="space-y-1.5">{SPACING.map((n) => <li key={n} className="flex items-center gap-3"><span className="w-24 font-mono text-caption text-ink-secondary">space-{n} · {tokenValue(`--space-${n}`)}</span><span className="h-3 rounded-sm bg-action" style={{ width: `var(--space-${n})` }} /></li>)}</ul></Specimen>
              <Specimen id="rad" name="Radius" description="Restrained. Cards 12px; controls 8px; badges 6px. Pills only for avatars & progress." tokens={['--radius-xs … --radius-full']}><div className="grid grid-cols-3 gap-3">{RADII.map((r) => <div key={r} className="text-center"><div className="mx-auto h-14 w-14 border border-line-strong bg-sunken" style={{ borderRadius: `var(--radius-${r})` }} /><p className="mt-1.5 font-mono text-caption">{r}</p><p className="font-mono text-caption text-ink-tertiary">{tokenValue(`--radius-${r}`)}</p></div>)}</div></Specimen>
              <Specimen id="elev" name="Elevation" description="Borders first, shadow for things that float." tokens={['--shadow-xs … --shadow-lg']}><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{SHADOWS.map((x) => <div key={x.n} className="rounded-lg bg-elevated p-4 text-center" style={{ boxShadow: `var(--shadow-${x.n})` }}><p className="font-mono text-caption font-semibold">shadow-{x.n}</p><p className="mt-1 text-caption text-ink-secondary">{x.use}</p></div>)}</div></Specimen>
              <Specimen id="mot" name="Motion" description="Short, purposeful, and removed under prefers-reduced-motion." tokens={MOTION.map((m) => m.n)}>
                <MotionDemo />
                <ul className="mt-3 space-y-1 text-body-sm text-ink-secondary">{MOTION.map((m) => <li key={m.n}><code className="text-ink">{m.n}</code> — {m.use}</li>)}</ul></Specimen>
            </div>
            <Specimen id="comp-tokens" name="Component tokens" description="Layer 3. Each is a semantic decision made for one component." tokens={[]}><div className="grid gap-x-8 gap-y-1 md:grid-cols-2">{COMPONENT_TOKENS.map((t) => <div key={t.name} className="flex items-center justify-between gap-3 border-b border-line py-1.5 text-body-sm"><code className="truncate text-caption">{t.name}</code><span className="shrink-0 text-caption text-ink-secondary">{t.role}</span></div>)}</div></Specimen>
          </section>

          {/* ------------------------------ Buttons ------------------------------ */}
          <section id="buttons" className="scroll-mt-20 space-y-5"><h2 className="text-title-2">Buttons</h2>
            <Specimen id="btn" name="Button" description="Five variants × three sizes. One primary per view. Loading keeps the label so layout never jumps. Disabled-by-permission uses aria-disabled + a tooltip that explains why." variants={VARIANTS} states={['default', 'hover', 'pressed', 'focus', 'disabled', 'loading']} tokens={['--button-primary-bg', '--button-primary-bg-hover', '--button-primary-bg-pressed', '--button-radius', '--button-height-md']}>
              <div className="overflow-x-auto"><table className="w-full min-w-[40rem] text-left"><caption className="sr-only">Button states by variant</caption><thead><tr className="text-caption text-ink-secondary">{['Variant', 'Default', 'Hover', 'Pressed', 'Focus', 'Disabled', 'Loading'].map((h) => <th key={h} scope="col" className="pb-3 pr-3 font-semibold">{h}</th>)}</tr></thead>
                <tbody>{VARIANTS.map((v) => <tr key={v}><th scope="row" className="py-2 pr-3 text-body-sm font-medium capitalize">{v}</th>
                  <td className="py-2 pr-3"><Button variant={v}>Label</Button></td><td className="py-2 pr-3"><Button variant={v} className={FORCE[v].hover}>Label</Button></td><td className="py-2 pr-3"><Button variant={v} className={FORCE[v].pressed}>Label</Button></td>
                  <td className="py-2 pr-3"><Button variant={v} className="!shadow-focus">Label</Button></td><td className="py-2 pr-3"><Button variant={v} disabled>Label</Button></td><td className="py-2 pr-3"><Button variant={v} loading>Label</Button></td></tr>)}</tbody></table></div>
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4"><Button size="sm">Small 32</Button><Button size="md">Medium 36</Button><Button size="lg">Large 44</Button><Button iconLeft={<Plus className="h-4 w-4" />}>With icon</Button><Button disabledReason="You need the Manager role to do this.">Disabled with reason</Button><ButtonLink to="/risks" variant="primary">Link as button</ButtonLink></div>
            </Specimen>
            <Specimen id="ibtn" name="Icon button" description="Always has an accessible name (required prop) which doubles as its tooltip. 36px square; 44px on touch." variants={['ghost', 'secondary', 'primary']} states={['default', 'hover', 'pressed (aria-pressed)', 'focus', 'disabled']}>
              <div className="flex flex-wrap items-center gap-3"><IconButton label="Settings"><Settings className="h-4 w-4" /></IconButton><IconButton label="Search" variant="secondary"><Search className="h-4 w-4" /></IconButton><IconButton label="Bold (toggled)" pressed><Bold className="h-4 w-4" /></IconButton><IconButton label="Add" variant="primary"><Plus className="h-4 w-4" /></IconButton><IconButton label="Delete (unavailable)" disabled><Trash2 className="h-4 w-4" /></IconButton></div>
            </Specimen>
          </section>

          {/* ------------------------------ Forms ------------------------------ */}
          <section id="forms" className="scroll-mt-20 space-y-5"><h2 className="text-title-2">Form controls</h2>
            <Specimen id="input" name="Input" description="Label always visible. Hint → error → success messages are wired with aria-describedby; errors use role=alert." states={['default', 'hover', 'focus', 'filled', 'error', 'success', 'disabled']} tokens={['--input-border', '--input-border-error', '--input-radius', '--input-height']}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Default" hint="Helper text explains what to enter.">{({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} placeholder="Placeholder" />}</Field>
                <Field label="Focus (tab into it)">{({ id }) => <Input id={id} defaultValue="Typing…" className="!shadow-focus !border-action" />}</Field>
                <Field label="Error" error="Enter a valid work email address.">{({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} defaultValue="maya@" />}</Field>
                <Field label="Success" success="Looks good">{({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} valid defaultValue="maya@harborlight.example" />}</Field>
                <Field label="Disabled">{({ id }) => <Input id={id} disabled defaultValue="Can’t edit" />}</Field>
                <Field label="Textarea">{({ id }) => <Textarea id={id} placeholder="Add a note…" />}</Field>
                <Field label="Select">{({ id }) => <Select id={id} defaultValue="b" options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]} />}</Field>
                <div><p className="mb-1.5 text-body-sm font-medium">Search</p><SearchInput value={q} onChange={setQ} placeholder="Search…" /></div>
              </div>
            </Specimen>
            <Specimen id="sel" name="Checkbox, Radio, Toggle" description="Native inputs restyled — keyboard and screen-reader behaviour comes for free. 16px control inside a 24px+ hit area via its label." states={['unchecked', 'checked', 'hover', 'focus', 'disabled']}>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-3"><Checkbox label="Checked" checked={check} onChange={(e) => setCheck(e.target.checked)} /><Checkbox label="Unchecked" /><Checkbox label="Disabled" disabled /><Checkbox label="With description" description="Supporting detail goes here." /></div>
                <RadioGroup legend="Radio group" value={radio} onChange={setRadio}><Radio value="a" label="Option A" /><Radio value="b" label="Option B" /><Radio value="c" label="Disabled" disabled /></RadioGroup>
                <div className="space-y-4"><Toggle checked={tog} onChange={setTog} label="Toggle on" description="role=switch, aria-checked" /><Toggle checked={false} onChange={() => {}} label="Toggle off" /><Toggle checked disabled onChange={() => {}} label="Disabled" /></div>
              </div>
            </Specimen>
          </section>

          {/* ------------------------------ Status ------------------------------ */}
          <section id="status" className="scroll-mt-20 space-y-5"><h2 className="text-title-2">Badges & status</h2>
            <Specimen id="sev" name="Severity badge" description="Colour + icon + label. Each severity has a distinct icon shape so it survives greyscale and colour-blindness." variants={['critical', 'high', 'medium', 'low']} tokens={['--color-critical-*', '--color-high-*', '--color-warning-*', '--color-info-*']}>
              <div className="flex flex-wrap gap-3">{(['critical', 'high', 'medium', 'low'] as Severity[]).map((x) => <SeverityBadge key={x} severity={x} />)}</div>
              <p className="mt-4 mb-2 text-body-sm font-medium">Greyscale test</p><div className="flex flex-wrap gap-3 grayscale">{(['critical', 'high', 'medium', 'low'] as Severity[]).map((x) => <SeverityBadge key={x} severity={x} />)}</div>
            </Specimen>
            <Specimen id="badge" name="Badge" description="Generic container; seven tones." variants={['neutral', 'info', 'success', 'warning', 'high', 'critical', 'ai']}><div className="flex flex-wrap gap-2">{(['neutral', 'info', 'success', 'warning', 'high', 'critical', 'ai'] as Tone[]).map((t) => <Badge key={t} tone={t}>{t}</Badge>)}</div></Specimen>
            <Specimen id="stat" name="Status badge & indicator" description="One shared vocabulary for risks, tasks, people, apps, vendors, policies and controls. Indicator is the quieter version for dense tables.">
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">{Object.keys(STATUS).map((k) => <div key={k} className="flex items-center justify-between gap-3 border-b border-line py-1.5"><code className="text-caption text-ink-tertiary">{k}</code><span className="flex items-center gap-3"><StatusBadge status={k} size="sm" /></span></div>)}</div>
              <div className="mt-4 flex flex-wrap gap-5"><StatusIndicator status="passing" /><StatusIndicator status="attention" /><StatusIndicator status="failing" /><StatusIndicator status="expiring" /></div>
            </Specimen>
            <Specimen id="av" name="Avatar" description="Initials on a deterministic tint (all ≥ 4.5:1). Former people render muted." variants={['xs', 'sm', 'md', 'lg', 'xl', 'group']}><div className="flex flex-wrap items-center gap-4"><Avatar name="Sarah Chen" size="xs" /><Avatar name="Jordan Williams" size="sm" /><Avatar name="Maya Okafor" size="md" /><Avatar name="Priya Raman" size="lg" /><Avatar name="Devon Park" size="xl" muted /><AvatarGroup names={['Sarah Chen', 'Jordan Williams', 'Maya Okafor', 'Priya Raman', 'Owen Brooks', 'Nina Petrov']} /></div></Specimen>
          </section>

          {/* ------------------------------ Navigation ------------------------------ */}
          <section id="nav" className="scroll-mt-20 space-y-5"><h2 className="text-title-2">Navigation</h2>
            <Specimen id="tabs" name="Tabs" description="Roving tabindex; ←/→/Home/End." states={['default', 'hover', 'selected', 'focus']}><Tabs label="Example" value={tab} onChange={setTab} tabs={[{ id: 'a', label: 'Open', count: 12 }, { id: 'b', label: 'Closed', count: 6 }, { id: 'c', label: 'All', count: 18 }]} /></Specimen>
            <Specimen id="bc" name="Breadcrumbs"><Breadcrumbs label="Example breadcrumb" items={[{ label: 'Risks', to: '/risks' }, { label: 'R-101' }]} /></Specimen>
            <Specimen id="sb" name="Sidebar & Header" description="Persistent sidebar ≥ 768px (collapsible to a 68px rail with tooltips); off-canvas drawer below. Header holds search (⌘K), demo controls and the primary “Ask Atlas” action." variants={['expanded', 'collapsed', 'mobile drawer']}><p className="text-body text-ink-secondary">Try it: collapse the sidebar with the control at its bottom, or resize the window below 768px. Open the command palette with <kbd className="rounded border border-line px-1.5">Ctrl/⌘ K</kbd>.</p></Specimen>
            <Specimen id="dd" name="Dropdown menu" description="Menu-button pattern with arrow-key navigation, type-ahead and Esc to close.">
              <Dropdown label="Example menu" items={[{ id: '1', label: 'Edit', description: 'Change details' }, { id: '2', label: 'Duplicate' }, { id: '3', label: 'Archive', disabled: true, disabledReason: 'Requires Admin' }, { id: '4', separatorBefore: true, label: 'Delete', danger: true }]} placement="bottom-start" trigger={(p) => <Button {...p}>Open menu</Button>} />
            </Specimen>
          </section>

          {/* ------------------------------ Overlays ------------------------------ */}
          <section id="overlays" className="scroll-mt-20 space-y-5"><h2 className="text-title-2">Overlays & feedback</h2>
            <Specimen id="ov" name="Modal, Confirmation dialog, Drawer, Toast" description="Dialogs trap focus, close on Esc, and return focus to their trigger. Drawer becomes a bottom sheet on mobile. Toasts are announced politely and never carry the only copy of important information." tokens={['--modal-radius', '--drawer-width', '--shadow-lg']}>
              <div className="flex flex-wrap gap-2"><Button onClick={() => setModal(true)}>Open modal</Button><Button onClick={() => setConfirm(true)}>Confirmation dialog</Button><Button onClick={() => setDanger(true)} variant="danger">Destructive confirmation</Button><Button onClick={() => setDrawer(true)}>Open drawer</Button>
                <Button onClick={() => toast({ tone: 'success', title: 'Task created', description: 'Assigned to Priya Raman.', action: { label: 'View tasks', to: '/tasks' } })}>Success toast</Button><Button onClick={() => toast({ tone: 'error', title: 'Couldn’t save changes', description: 'Check your connection and try again.' })}>Error toast</Button><Button onClick={() => toast({ tone: 'warning', title: 'Session expires soon' })}>Warning toast</Button><Button onClick={() => toast({ tone: 'info', title: 'Sync finished' })}>Info toast</Button></div>
              <div className="mt-5 grid gap-3 md:grid-cols-2"><Callout tone="info" title="Callout · info">Inline, persistent messages.</Callout><Callout tone="success" title="Callout · success" /><Callout tone="warning" title="Callout · warning">Something to double-check.</Callout><Callout tone="critical" title="Callout · critical">Needs action now.</Callout></div>
              <div className="mt-4 flex flex-wrap items-center gap-6"><Tooltip content="Tooltips appear on hover and keyboard focus."><Button>Hover or focus me</Button></Tooltip><p className="text-body">Plain-English term: <Term id="mfa">multi-factor authentication</Term></p></div>
            </Specimen>
            <Modal open={modal} onClose={() => setModal(false)} title="Modal title" description="Supporting description in plain language." footer={<><Button onClick={() => setModal(false)}>Cancel</Button><Button variant="primary" onClick={() => setModal(false)}>Save</Button></>}><Field label="Name">{({ id }) => <Input id={id} data-autofocus />}</Field></Modal>
            <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => setConfirm(false)} title="Mark as resolved?" description="This moves the risk to Closed and records the decision." confirmLabel="Mark resolved" />
            <ConfirmDialog open={danger} onClose={() => setDanger(false)} onConfirm={() => setDanger(false)} danger title="Remove all access?" description="This cannot be undone from Atlas." confirmLabel="Remove access" />
            <Drawer open={drawer} onClose={() => setDrawer(false)} title="Drawer title" description="Side panel; bottom sheet on mobile." footer={<Button variant="primary" onClick={() => setDrawer(false)}>Done</Button>}><p className="text-body text-ink-secondary">Drawer content scrolls independently of the page.</p></Drawer>
          </section>

          {/* ------------------------------ Data ------------------------------ */}
          <section id="data" className="scroll-mt-20 space-y-5"><h2 className="text-title-2">Cards, tables & data</h2>
            <Specimen id="card" name="Card & Metric card" description="12px radius, 1px border, xs shadow. Metric cards state change in words as well as colour." tokens={['--card-radius', '--card-bg', '--card-border', '--card-padding']}>
              <div className="grid gap-3 sm:grid-cols-3"><MetricCard label="Open risks" value="12" delta={{ text: '+1', direction: 'up' }} deltaGood={false} hint="vs. last month" /><MetricCard label="Controls passing" value="36/42" delta={{ text: '−3', direction: 'down' }} deltaGood={false} /><MetricCard label="Tasks completed" value="43" delta={{ text: '+5', direction: 'up' }} deltaGood hint="this month" /></div>
              <Card className="mt-3"><CardHeader title="Card header" description="Optional description" actions={<Button size="sm">Action</Button>} /><p className="text-body">Card body content.</p></Card>
              <DescriptionList columns={3} className="mt-4" items={[{ label: 'Owner', value: 'Priya Raman' }, { label: 'Due', value: 'Oct 10, 2026' }, { label: 'Category', value: 'Access' }]} />
              <Disclosure className="mt-2" summary="Disclosure (expand / collapse)">Hidden detail revealed on demand.</Disclosure>
            </Specimen>
            <Specimen id="table" name="Data table" description="Table ≥ 768px; stacked record cards below, with an equivalent Sort control. Sortable headers expose aria-sort; rows can expand." variants={['table', 'record cards (mobile)']} states={['default', 'hover', 'sorted', 'expanded', 'paginated']} tokens={['--table-header-bg', '--table-row-hover', '--table-border']}>
              <div className="overflow-hidden rounded-lg border border-line"><DataTable caption="Sample" pageSize={4} noun="rows" getRowKey={(r) => r.n} defaultSort={{ id: 'n', dir: 'asc' }} rows={[{ n: 'Alpha', s: 'critical' as Severity, o: 'Priya' }, { n: 'Bravo', s: 'high' as Severity, o: 'Marcus' }, { n: 'Charlie', s: 'medium' as Severity, o: 'Elena' }, { n: 'Delta', s: 'low' as Severity, o: 'Maya' }, { n: 'Echo', s: 'medium' as Severity, o: 'Owen' }, { n: 'Foxtrot', s: 'low' as Severity, o: 'Aisha' }]}
                renderExpanded={(r) => <p className="text-body-sm">Expanded detail for {r.n}.</p>}
                columns={[{ id: 'n', header: 'Name', mobile: 'title', sortValue: (r) => r.n, cell: (r) => <span className="font-medium">{r.n}</span> }, { id: 's', header: 'Severity', sortValue: (r) => r.s, cell: (r) => <SeverityBadge severity={r.s} /> }, { id: 'o', header: 'Owner', sortValue: (r) => r.o, cell: (r) => r.o }]} /></div>
              <div className="mt-4 overflow-hidden rounded-lg border border-line"><Pagination label="Example pagination" page={page} pageSize={10} total={57} onPage={setPage} noun="results" /></div>
            </Specimen>
            <Specimen id="tl" name="Timeline" description="Activity history; icon shape (spark / person / cog) tells who acted without colour."><Timeline items={[{ id: '1', at: '2026-10-07T09:12', actor: 'Atlas AI', kind: 'ai', text: 'identified a potential access risk.' }, { id: '2', at: '2026-10-07T08:40', actor: 'Sarah Chen', kind: 'human', text: 'completed security training.' }, { id: '3', at: '2026-10-06T11:30', actor: 'Atlas', kind: 'system', text: 'finished the Google Workspace sync.' }]} /></Specimen>
          </section>

          {/* ------------------------------ States ------------------------------ */}
          <section id="states" className="scroll-mt-20 space-y-5"><h2 className="text-title-2">Empty, loading, error</h2>
            <p className="max-w-3xl text-body text-ink-secondary">Every list implements: <strong>loading</strong> (skeleton shaped like the final layout), <strong>empty</strong> (explains why and what to do), <strong>no results</strong> (filters excluded everything), <strong>error</strong> (plain cause + retry), <strong>success</strong> (confirmation + next step), and <strong>permission-restricted</strong> (disabled with the reason).</p>
            <div className="grid gap-5 lg:grid-cols-2">
              <Specimen id="empty" name="Empty state"><EmptyState compact icon={<Inbox />} title="No open tasks" description="New tasks appear here when risks need work." action={<Button>Create a task</Button>} /></Specimen>
              <Specimen id="err" name="Error state"><ErrorState onRetry={() => toast({ title: 'Retrying…', tone: 'info' })} detail="Error 503 · service unavailable" className="py-6" /></Specimen>
              <Specimen id="load" name="Loading state & progress"><LoadingState className="py-4" label="Loading your data…" /><ProgressBar className="mt-2" value={64} label="Example progress" showValue tone="info" /></Specimen>
              <Specimen id="skel" name="Skeleton" description="Shimmer is disabled under reduced motion."><div className="space-y-3"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-24 w-full" /></div></Specimen>
            </div>
            <Specimen id="skel2" name="Table & card skeletons"><div className="overflow-hidden rounded-lg border border-line"><TableSkeleton rows={3} /></div><div className="mt-4"><CardGridSkeleton count={4} /></div></Specimen>
            <Specimen id="perm" name="Permission-restricted"><div className="flex flex-wrap items-center gap-3"><Button variant="primary" disabledReason="Only Admins can change workspace settings.">Save settings</Button><p className="text-body-sm text-ink-secondary">Hover or focus the button — the reason is announced to screen readers. Switch roles in Demo controls to see this throughout the product.</p></div></Specimen>
          </section>

          {/* ------------------------------ AI ------------------------------ */}
          <section id="ai" className="scroll-mt-20 space-y-5"><h2 className="text-title-2">AI components</h2>
            <p className="max-w-3xl text-body text-ink-secondary">AI is non-deterministic, so each AI component represents a <em>state of knowing</em>. Teal + a left rule marks AI-originated content; there are no gradients or glow.</p>
            <Specimen id="ai-conf" name="Confidence badge" description="Three levels; tooltip explains. Always paired with sources." variants={['high', 'medium', 'needs_review']} tokens={['--color-ai-*', '--color-success-*', '--color-info-*', '--color-warning-*']}><div className="flex flex-wrap items-center gap-4"><AiBadge /><ConfidenceBadge level="high" /><ConfidenceBadge level="medium" /><ConfidenceBadge level="needs_review" /></div></Specimen>
            <Specimen id="ai-think" name="Thinking & streaming" description="Thinking shows what Atlas is doing; streaming reveals text with a caret; Stop is always available." states={['thinking', 'streaming', 'done', 'stopped', 'error']}>
              <div className="rounded-lg border border-line p-4 [border-left:var(--ai-rule-width)_solid_var(--color-ai-accent)]"><AiThinking steps={['Searching 12 open risks…', 'Checking people and access records…']} index={4} onStop={() => {}} /></div>
              <div className="mt-3 rounded-lg border border-line p-4 [border-left:var(--ai-rule-width)_solid_var(--color-ai-accent)]"><p className="text-body-lg font-medium">I found 3 areas that deserve attention this week<Caret /></p></div>
              <div className="mt-3"><Callout tone="critical" title="Atlas AI is unavailable right now">We couldn’t reach the AI service. Nothing was changed.</Callout></div>
              <div className="mt-3"><Callout tone="neutral" title="I couldn’t find enough information to answer this confidently.">Try asking about a specific risk, person, vendor or application.</Callout></div>
            </Specimen>
            <Specimen id="ai-src" name="Source list" description="Collapsed by default; count always visible. Sources link to the record when one exists."><SourceList defaultOpen sources={[{ label: 'Training completions', system: 'Lumen Learning', syncedAgo: 'synced 3 hours ago' }, { label: 'R-101 evidence', system: 'Google Workspace', syncedAgo: 'live', entity: { type: 'risk', id: 'R-101' } }]} /></Specimen>
            <Specimen id="ai-ins" name="AI insight card" description="Proactive but quiet: states what, why it matters, confidence and source."><AiInsight /></Specimen>
            <Specimen id="ai-act" name="AI response & action card" description="Findings are links to records. Anything that changes data uses AiActionCard: propose → review → approve → result → undo, with an activity log." variants={['proposed', 'running', 'done', 'cancelled', 'undone']}>
              <p className="text-body text-ink-secondary">See it live: <Link className="font-medium text-ink-link underline" to="/assistant">AI Assistant</Link> → “Find employees who haven’t completed required security training and create tasks for their managers.”</p></Specimen>
          </section>

          {/* ------------------------------ Charts ------------------------------ */}
          <section id="charts" className="scroll-mt-20 space-y-5"><h2 className="text-title-2">Charts</h2>
            <p className="max-w-3xl text-body text-ink-secondary">Charts are used only where shape matters (trend, part-to-whole). Titles state the takeaway. Every chart has a legend for ≥ 2 series, hover tooltip, keyboard focus, and a “View as table” alternative. 2px lines, recessive grid, 2px gaps between stacked segments.</p>
            <div className="grid gap-5 lg:grid-cols-2">
              <Specimen id="ch-line" name="Line chart"><LineChart title="Example trend" labels={['Jul', 'Aug', 'Sep', 'Oct']} series={[{ id: 'a', label: 'Series A', color: 'var(--color-chart-1)', values: [84, 88, 91, 87] }, { id: 'b', label: 'Series B', color: 'var(--color-chart-4)', values: [80, 82, 85, 86], dashed: true }]} min={75} max={95} /></Specimen>
              <Specimen id="ch-bar" name="Bar list"><BarList title="Example comparison" items={[{ label: 'Support', value: 85, display: '85%', tone: 'warning' }, { label: 'Engineering', value: 96, display: '96%', tone: 'success' }, { label: 'Sales', value: 70, display: '70%', tone: 'critical' }]} max={100} /></Specimen>
              <Specimen id="ch-sev" name="Severity bar"><SeverityBar counts={{ critical: 2, high: 3, medium: 5, low: 2 }} /></Specimen>
              <Specimen id="ch-g" name="Gauge & sparkline"><div className="flex flex-wrap items-center gap-8"><Gauge value={87} label="Example score" size={140} /><div><p className="mb-1 text-body-sm text-ink-secondary">Sparkline</p><Sparkline label="Example trend" values={[3, 5, 4, 7, 6, 9]} /></div></div></Specimen>
            </div>
          </section>

          {/* ------------------------------ Responsive ------------------------------ */}
          <section id="responsive" className="scroll-mt-20 space-y-5"><h2 className="text-title-2">Responsive behaviour</h2>
            <Card padded={false}><div className="overflow-x-auto"><table className="w-full min-w-[40rem] text-left text-body-sm"><caption className="sr-only">Responsive adaptation by breakpoint</caption>
              <thead><tr className="border-b border-line bg-sunken text-caption text-ink-secondary"><th scope="col" className="px-4 py-2.5">Pattern</th><th scope="col" className="px-4 py-2.5">Desktop ≥ 1024</th><th scope="col" className="px-4 py-2.5">Tablet 768–1023</th><th scope="col" className="px-4 py-2.5">Mobile &lt; 768</th></tr></thead>
              <tbody className="divide-y divide-line">{[
                ['Navigation', 'Sidebar 272px, collapsible to 68px rail', 'Rail by default; expand on demand', 'Hamburger → off-canvas drawer'],
                ['Tables', 'Full table, all columns', 'Secondary columns hidden', 'Stacked record cards + Sort select'],
                ['Filters', 'Inline row of selects', 'Inline, wraps', '“Filters (n)” → bottom sheet'],
                ['Cards / metrics', '3–4 columns', '2 columns', '1–2 columns'],
                ['Charts', 'Direct labels, hover', 'Fewer axis labels', 'Sparser axis, legend wraps, table view'],
                ['AI conversation', 'History · chat · trust rail', 'History hidden behind button; rail hidden', 'Full-width chat; history in drawer'],
                ['Side panels', 'Right drawer 480px', 'Right drawer', 'Bottom sheet, drag handle'],
                ['Page layout', '2/3 + 1/3 grid for details', 'Single column', 'Single column; actions wrap'],
              ].map((r) => <tr key={r[0]}><th scope="row" className="px-4 py-2.5 font-medium">{r[0]}</th>{r.slice(1).map((c) => <td key={c} className="px-4 py-2.5 text-ink-secondary">{c}</td>)}</tr>)}</tbody></table></div></Card>
          </section>

          {/* ------------------------------ A11y ------------------------------ */}
          <section id="a11y" className="scroll-mt-20 space-y-5"><h2 className="text-title-2">Accessibility</h2>
            <div className="grid gap-3 md:grid-cols-2">{[
              ['Keyboard', 'Every control is reachable and operable by keyboard. Menus, tabs, dialogs and the command palette follow WAI-ARIA patterns.'],
              ['Focus', 'One focus style product-wide: 2px ring + 2px gap (≥ 3:1). Dialogs trap focus and restore it on close. Route changes move focus to main.'],
              ['Colour', 'Text pairs ≥ 4.5:1, UI boundaries ≥ 3:1 (verified live above). Severity & status always include an icon and a text label.'],
              ['Structure', 'Landmarks, one h1 per page, skip link, captions on tables, aria-sort on sortable columns, labelled fieldsets.'],
              ['Motion', 'Animations are short and optional; prefers-reduced-motion removes movement and shimmer and shows AI answers immediately.'],
              ['Assistive tech', 'Live regions announce result counts, toasts and AI status. Charts expose a data table. Icon-only buttons require a name.'],
              ['Targets', 'Minimum 32px targets on dense controls (24px WCAG 2.2 minimum); 44px for primary mobile actions.'],
              ['Language', 'Plain-English labels and glossary tooltips reduce cognitive load.'],
            ].map(([t, d]) => <Card key={t}><h3 className="text-title-3">{t}</h3><p className="mt-1 text-body text-ink-secondary">{d}</p></Card>)}</div>
            <Callout tone="ai" title="Where to look in the code"><code className="text-body-sm">src/styles/tokens</code> (tokens) · <code>src/components/ui</code> (primitives) · <code>src/components/ai</code> (AI patterns) · <code>src/ai/engine.ts</code> (simulated reasoning) · <code>docs/ARCHITECTURE.md</code>.</Callout>
          </section>
        </div>
      </div>
      <span className="hidden"><AlertCircle /><Sparkles /></span>
    </>
  )
}

function MotionDemo() {
  const [on, setOn] = useState(false)
  return (
    <div>
      <Button size="sm" onClick={() => setOn(!on)}>Toggle</Button>
      <div className="mt-3 space-y-2">{(['fast', 'base', 'slow'] as const).map((d) => <div key={d} className="h-3 rounded-full bg-sunken"><div className="h-3 w-10 rounded-full bg-action" style={{ transform: on ? 'translateX(calc(100% * 5))' : 'none', transition: `transform var(--motion-duration-${d}) var(--motion-ease-standard)` }} /></div>)}</div>
    </div>
  )
}
