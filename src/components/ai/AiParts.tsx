import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, ChevronDown, CircleCheck, CircleHelp, Database, Fingerprint, Sparkles, TriangleAlert, FileText, Building2, GraduationCap, ShieldAlert } from 'lucide-react'
import type { Confidence } from '@/data/types'
import type { AiSource } from '@/ai/types'
import { Badge } from '@/components/ui/Badge'
import { Tooltip } from '@/components/ui/Tooltip'
import { entityPath } from '@/components/domain/entities'
import { cn } from '@/utils/cn'

/** AiBadge — the one consistent mark for “this came from Atlas AI”. Teal family + spark; no gradient. */
export function AiBadge({ label = 'Atlas AI', className }: { label?: string; className?: string }) {
  return (
    <span data-ds="AiBadge" className={cn('inline-flex items-center gap-1.5 text-caption font-semibold text-ai-ink', className)}>
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-ai text-white"><Sparkles className="h-3 w-3" aria-hidden /></span>{label}
    </span>
  )
}

export const CONFIDENCE_META: Record<Confidence, { label: string; tone: 'success' | 'info' | 'warning'; Icon: typeof CircleCheck; help: string }> = {
  high: { label: 'High confidence', tone: 'success', Icon: CircleCheck, help: 'Several consistent records support this answer.' },
  medium: { label: 'Medium confidence', tone: 'info', Icon: CircleHelp, help: 'The data is consistent, but Atlas can’t verify one part. Read the note.' },
  needs_review: { label: 'Needs review', tone: 'warning', Icon: TriangleAlert, help: 'Evidence is thin or might be incomplete. Check the sources before acting.' },
}
/** ConfidenceBadge — icon + words + colour; tooltip says what it means. */
export function ConfidenceBadge({ level }: { level: Confidence }) {
  const m = CONFIDENCE_META[level]
  return (
    <Tooltip content={m.help}>
      <span tabIndex={0} className="rounded-sm"><Badge tone={m.tone} icon={<m.Icon />}>{m.label}</Badge></span>
    </Tooltip>
  )
}

const SYSTEM_ICON = (s: string) => /okta|google|sign-in/i.test(s) ? Fingerprint : /lumen|training/i.test(s) ? GraduationCap : /vendor/i.test(s) ? Building2 : /polic/i.test(s) ? FileText : /risk/i.test(s) ? ShieldAlert : /northstar|hr/i.test(s) ? Database : Boxes

/** SourceList — where the answer came from. Collapsed by default; always visible as a count. */
export function SourceList({ sources, defaultOpen = false }: { sources: AiSource[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  if (!sources.length) return null
  return (
    <div data-ds="SourceList">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex items-center gap-1.5 rounded-sm text-body-sm font-medium text-ink-secondary hover:text-ink">
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-base', open && 'rotate-180')} aria-hidden />
        Sources ({sources.length})
      </button>
      {open && (
        <ul className="mt-2 grid gap-2 sm:grid-cols-2 animate-fade-in">
          {sources.map((s, i) => {
            const Icon = SYSTEM_ICON(s.system + s.label)
            const inner = (
              <>
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-tertiary" aria-hidden />
                <span className="min-w-0"><span className="block truncate text-body-sm font-medium">{s.label}</span><span className="block truncate text-caption text-ink-secondary">{s.system} · {s.syncedAgo}</span></span>
              </>
            )
            return <li key={i}>{s.entity ? <Link to={entityPath(s.entity)} className="flex gap-2 rounded-md border border-line bg-surface p-2.5 hover:bg-hover">{inner}</Link> : <div className="flex gap-2 rounded-md border border-line bg-surface p-2.5">{inner}</div>}</li>
          })}
        </ul>
      )}
    </div>
  )
}

/** AiThinking — shown before any text exists. Cycles through what Atlas is actually doing. */
export function AiThinking({ steps, index, onStop }: { steps: string[]; index: number; onStop?: () => void }) {
  const step = steps[Math.min(steps.length - 1, Math.floor(index / 10))] ?? steps[0]
  return (
    <div role="status" aria-live="polite" data-ds="AiThinking" className="flex items-center gap-3">
      <span className="flex gap-1" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-ai motion-reduce:animate-none" style={{ animationDelay: `${i * 160}ms` }} />)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium">Analyzing your organization…</p>
        <p className="truncate text-caption text-ink-secondary">{step}</p>
      </div>
      {onStop && <button type="button" onClick={onStop} className="rounded-md border border-line px-2.5 py-1 text-body-sm font-medium text-ink-secondary hover:bg-hover hover:text-ink">Stop</button>}
    </div>
  )
}

export function Caret() { return <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-blink bg-ai motion-reduce:hidden" aria-hidden /> }

export function Section({ children, className }: { children: ReactNode; className?: string }) { return <div className={cn('mt-4', className)}>{children}</div> }
