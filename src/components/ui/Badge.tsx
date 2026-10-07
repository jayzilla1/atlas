import type { ReactNode } from 'react'
import { AlertTriangle, ArrowDown, CheckCircle2, CircleAlert, CircleDashed, CircleDot, Clock, Info, Lock, OctagonAlert, PauseCircle, XCircle, TriangleAlert, Ban } from 'lucide-react'
import type { Severity } from '@/data/types'
import { cn } from '@/utils/cn'

/**
 * Tones map 1:1 to semantic colour families (bg / fg / border).
 * RULE: meaning is never colour-only — status components below always pair
 * the colour with an icon *and* a text label.
 */
export type Tone = 'critical' | 'high' | 'warning' | 'success' | 'info' | 'neutral' | 'ai'
const toneClass: Record<Tone, string> = {
  critical: 'bg-critical-bg text-critical-fg border-critical-border',
  high: 'bg-high-bg text-high-fg border-high-border',
  warning: 'bg-warning-bg text-warning-fg border-warning-border',
  success: 'bg-success-bg text-success-fg border-success-border',
  info: 'bg-info-bg text-info-fg border-info-border',
  neutral: 'bg-neutral-bg text-neutral-fg border-neutral-border',
  ai: 'bg-ai-subtle text-ai-ink border-ai-border',
}
export const toneSolid: Record<Tone, string> = {
  critical: 'bg-critical-solid', high: 'bg-high-solid', warning: 'bg-warning-solid', success: 'bg-success-solid', info: 'bg-info-solid', neutral: 'bg-neutral-solid', ai: 'bg-ai',
}
export const toneText: Record<Tone, string> = {
  critical: 'text-critical-fg', high: 'text-high-fg', warning: 'text-warning-fg', success: 'text-success-fg', info: 'text-info-fg', neutral: 'text-ink-secondary', ai: 'text-ai-ink',
}
export { toneClass }

export function Badge({ tone = 'neutral', icon, children, className, size = 'md' }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string; size?: 'sm' | 'md' }) {
  return (
    <span data-ds="Badge" data-ds-variant={tone}
      className={cn('inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-sm border font-medium', size === 'md' ? 'h-6 px-2 text-caption' : 'h-5 px-1.5 text-[0.6875rem]', toneClass[tone], className)}>
      {icon && <span className="flex shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5" aria-hidden>{icon}</span>}
      {children}
    </span>
  )
}

/* ---------- Severity: Critical / High / Medium / Low ---------- */
export const SEVERITY_META: Record<Severity, { label: string; tone: Tone; Icon: typeof Info; meaning: string }> = {
  critical: { label: 'Critical', tone: 'critical', Icon: OctagonAlert, meaning: 'Could cause serious harm soon. Handle this week.' },
  high: { label: 'High', tone: 'high', Icon: TriangleAlert, meaning: 'Significant exposure. Plan to fix within weeks.' },
  medium: { label: 'Medium', tone: 'warning', Icon: CircleAlert, meaning: 'Worth fixing, not urgent.' },
  low: { label: 'Low', tone: 'info', Icon: ArrowDown, meaning: 'Minor. Handle in routine clean-up.' },
}
export function SeverityBadge({ severity, size = 'md', showLabel = true }: { severity: Severity; size?: 'sm' | 'md'; showLabel?: boolean }) {
  const m = SEVERITY_META[severity]
  return <Badge tone={m.tone} size={size} icon={<m.Icon />}><span className={cn(!showLabel && 'sr-only')}>{m.label}</span></Badge>
}

/* ---------- Generic status vocab shared across entities ---------- */
export interface StatusMeta { label: string; tone: Tone; Icon: typeof Info }
const S = (label: string, tone: Tone, Icon: typeof Info): StatusMeta => ({ label, tone, Icon })
export const STATUS: Record<string, StatusMeta> = {
  // risks
  open: S('Open', 'warning', CircleDot), in_progress: S('In progress', 'info', Clock), accepted: S('Accepted', 'neutral', Lock), resolved: S('Resolved', 'success', CheckCircle2),
  // tasks
  not_started: S('Not started', 'neutral', CircleDashed), waiting: S('Waiting', 'warning', PauseCircle), completed: S('Completed', 'success', CheckCircle2),
  // training
  overdue: S('Overdue', 'critical', AlertTriangle),
  // access review
  up_to_date: S('Up to date', 'success', CheckCircle2), needs_attention: S('Needs attention', 'high', TriangleAlert), in_review: S('In review', 'info', Clock),
  // people
  active: S('Active', 'success', CheckCircle2), on_leave: S('On leave', 'neutral', PauseCircle), former: S('Former', 'neutral', Ban),
  // apps
  connected: S('Connected', 'success', CheckCircle2), needs_reauth: S('Reconnect needed', 'warning', AlertTriangle), sync_error: S('Sync error', 'critical', XCircle), manual: S('Manual upload', 'neutral', Info),
  trial: S('Trial', 'info', Info), being_retired: S('Being retired', 'neutral', Ban),
  // vendors
  current: S('Current', 'success', CheckCircle2), due_soon: S('Due soon', 'warning', Clock),
  valid: S('Valid', 'success', CheckCircle2), expiring: S('Expiring soon', 'warning', Clock), expired: S('Expired', 'critical', XCircle), missing: S('Missing', 'critical', XCircle),
  expiring_contract: S('Expiring soon', 'warning', Clock), in_negotiation: S('In negotiation', 'info', Clock),
  // policies
  published: S('Published', 'success', CheckCircle2), draft: S('Draft', 'neutral', CircleDashed), needs_update: S('Needs update', 'high', TriangleAlert),
  // controls
  passing: S('Passing', 'success', CheckCircle2), attention: S('Needs attention', 'warning', CircleAlert), failing: S('Failing', 'critical', XCircle),
}
export function StatusBadge({ status, label, size = 'md' }: { status: string; label?: string; size?: 'sm' | 'md' }) {
  const m = STATUS[status] ?? S(status, 'neutral', Info)
  return <Badge tone={m.tone} size={size} icon={<m.Icon />}>{label ?? m.label}</Badge>
}

/** StatusIndicator — lighter-weight than a badge: icon + text, no container. For dense tables. */
export function StatusIndicator({ status, label, tone, className }: { status?: string; label?: string; tone?: Tone; className?: string }) {
  const m = status ? STATUS[status] ?? S(status, 'neutral', Info) : S(label ?? '', tone ?? 'neutral', Info)
  return (
    <span data-ds="StatusIndicator" data-ds-variant={m.tone} className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-body-sm font-medium', toneText[tone ?? m.tone], className)}>
      <m.Icon className="h-4 w-4 shrink-0" aria-hidden />{label ?? m.label}
    </span>
  )
}
