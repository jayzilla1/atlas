import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import type { Tone } from './Badge'

const toneText: Record<Tone, string> = { neutral: 'text-ink', success: 'text-success-text', warning: 'text-warning-text', danger: 'text-danger-text', info: 'text-info-text', primary: 'text-primary-text' }

/** A big number with a label. Numbers use tabular figures so columns of them align. Optionally a button (filter shortcut). */
export function Metric({ label, value, hint, tone = 'neutral', icon, onClick, pressed, className }: { label: string; value: ReactNode; hint?: string; tone?: Tone; icon?: ReactNode; onClick?: () => void; pressed?: boolean; className?: string }) {
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-ink-secondary">
        {icon && <span aria-hidden className={cn('[&>svg]:h-3.5 [&>svg]:w-3.5', toneText[tone])}>{icon}</span>}{label}
      </span>
      <span className={cn('mt-1 block text-display tabular-nums', toneText[tone])}>{value}</span>
      {hint && <span className="mt-1 block text-caption text-ink-secondary">{hint}</span>}
    </>
  )
  if (onClick) {
    return (
      <button type="button" aria-pressed={pressed} onClick={onClick} className={cn('rounded-lg px-3 py-2 text-left transition-colors duration-fast hover:bg-surface-sunken', pressed && 'bg-surface-sunken ring-1 ring-line-strong/60', className)}>
        {body}
      </button>
    )
  }
  return <div className={cn('px-3 py-2', className)}>{body}</div>
}
