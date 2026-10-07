import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronDown, Info, CheckCircle2, TriangleAlert, OctagonAlert, Sparkles, Minus } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Tooltip } from './Tooltip'

export function Card({ children, className, padded = true, as: Tag = 'section', ...rest }: { children: ReactNode; className?: string; padded?: boolean; as?: 'section' | 'div' | 'article' | 'li' } & React.HTMLAttributes<HTMLElement>) {
  return <Tag data-ds="Card" className={cn('rounded-lg border border-line bg-surface shadow-xs', padded && 'p-5', className)} {...(rest as object)}>{children}</Tag>
}

export function CardHeader({ title, description, actions, id, level = 2, icon }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; id?: string; level?: 2 | 3; icon?: ReactNode }) {
  const H = level === 2 ? 'h2' : 'h3'
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && <span className="mt-0.5 text-ink-tertiary" aria-hidden>{icon}</span>}
        <div className="min-w-0">
          <H id={id} className="text-title-3">{title}</H>
          {description && <p className="mt-0.5 text-body-sm text-ink-secondary">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ---------- Metric card ---------- */
export function MetricCard({ label, value, hint, delta, deltaGood, href, icon, children, term }: {
  label: string; value: ReactNode; hint?: ReactNode
  /** Change vs. a previous period, e.g. { value: '+3', direction: 'up' } */
  delta?: { text: string; direction: 'up' | 'down' | 'flat' }
  /** Whether the change is good news (drives colour + wording, never colour alone) */
  deltaGood?: boolean
  href?: string; icon?: ReactNode; children?: ReactNode; term?: ReactNode
}) {
  const D = delta?.direction === 'up' ? ArrowUpRight : delta?.direction === 'down' ? ArrowDownRight : Minus
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-body-sm font-medium text-ink-secondary">{term ?? label}</p>
        {icon && <span className="text-ink-tertiary" aria-hidden>{icon}</span>}
      </div>
      <p className="mt-2 text-title-1 tabular-nums">{value}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        {delta && (
          <span className={cn('inline-flex items-center gap-0.5 text-caption font-semibold', deltaGood === undefined ? 'text-ink-secondary' : deltaGood ? 'text-success-fg' : 'text-critical-fg')}>
            <D className="h-3.5 w-3.5" aria-hidden />{delta.text}
            <span className="sr-only">{deltaGood === undefined ? '' : deltaGood ? ' (improving)' : ' (getting worse)'}</span>
          </span>
        )}
        {hint && <span className="text-caption text-ink-secondary">{hint}</span>}
      </div>
      {children}
    </>
  )
  const cls = 'block rounded-lg border border-line bg-surface p-4 shadow-xs'
  return href
    ? <Link to={href} data-ds="MetricCard" className={cn(cls, 'transition-[border-color,box-shadow] duration-fast hover:border-line-strong hover:shadow-sm')}>{body}</Link>
    : <div data-ds="MetricCard" className={cls}>{body}</div>
}

/* ---------- Callout (inline message) ---------- */
type CalloutTone = 'info' | 'success' | 'warning' | 'critical' | 'ai' | 'neutral'
const CALLOUT: Record<CalloutTone, { cls: string; Icon: typeof Info }> = {
  info: { cls: 'border-info-border bg-info-bg', Icon: Info }, success: { cls: 'border-success-border bg-success-bg', Icon: CheckCircle2 },
  warning: { cls: 'border-warning-border bg-warning-bg', Icon: TriangleAlert }, critical: { cls: 'border-critical-border bg-critical-bg', Icon: OctagonAlert },
  ai: { cls: 'border-ai-border bg-ai-subtle', Icon: Sparkles }, neutral: { cls: 'border-line bg-sunken', Icon: Info },
}
const CALLOUT_ICON: Record<CalloutTone, string> = { info: 'text-info-fg', success: 'text-success-fg', warning: 'text-warning-fg', critical: 'text-critical-fg', ai: 'text-ai', neutral: 'text-ink-tertiary' }
export function Callout({ tone = 'info', title, children, actions, className, role }: { tone?: CalloutTone; title?: ReactNode; children?: ReactNode; actions?: ReactNode; className?: string; role?: 'status' | 'alert' }) {
  const { cls, Icon } = CALLOUT[tone]
  return (
    <div role={role} data-ds="Callout" data-ds-variant={tone} className={cn('flex gap-3 rounded-lg border p-3.5', cls, className)}>
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', CALLOUT_ICON[tone])} aria-hidden />
      <div className="min-w-0 flex-1 text-body">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn('text-ink-secondary', title ? 'mt-0.5' : '')}>{children}</div>}
        {actions && <div className="mt-2.5 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/* ---------- Disclosure (expand/collapse) ---------- */
export function Disclosure({ summary, children, defaultOpen = false, className }: { summary: ReactNode; children: ReactNode; defaultOpen?: boolean; className?: string }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div className={className} data-ds="Disclosure">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 rounded-md py-1.5 text-left text-body font-medium text-ink-secondary hover:text-ink">
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-base', open && 'rotate-180')} aria-hidden />{summary}
      </button>
      <div id={id} hidden={!open} className="pb-1 pl-6 animate-fade-in">{children}</div>
    </div>
  )
}

/* ---------- Description list (key/value) ---------- */
export function DescriptionList({ items, columns = 1, className }: { items: { label: ReactNode; value: ReactNode }[]; columns?: 1 | 2 | 3; className?: string }) {
  return (
    <dl className={cn('grid gap-x-8 gap-y-3.5', columns === 2 && 'sm:grid-cols-2', columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3', className)} data-ds="DescriptionList">
      {items.map((it, i) => (
        <div key={i} className="min-w-0">
          <dt className="text-caption font-medium text-ink-secondary">{it.label}</dt>
          <dd className="mt-0.5 text-body text-ink">{it.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function SectionLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className="inline-flex items-center gap-1 rounded-sm text-body-sm font-semibold text-ink-link hover:underline">{children}<ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
}

/* ---------- Plain-language "why this matters" explainer ---------- */
export function PlainEnglish({ title = 'In plain English', children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-info-border bg-info-bg p-4', className)} data-ds="PlainEnglish">
      <p className="mb-1 flex items-center gap-1.5 text-overline uppercase text-info-fg"><Info className="h-3.5 w-3.5" aria-hidden />{title}</p>
      <div className="text-body text-ink">{children}</div>
    </div>
  )
}

export { Tooltip }
