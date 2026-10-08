import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import type { Tone } from './Badge'

/** Charcoal by default. Only warning/danger tones turn the number orange — colour is reserved for attention. */
const attention: Tone[] = ['warning', 'danger', 'primary']

/**
 * A glass tile with a big number: the one component behind every summary count in the product
 * (Home snapshot, Attendance filters, Payments summary). Optionally a button — e.g. a filter shortcut.
 */
export function Metric({ label, value, hint, tone = 'neutral', icon, onClick, pressed, className }: { label: string; value: ReactNode; hint?: string; tone?: Tone; icon?: ReactNode; onClick?: () => void; pressed?: boolean; className?: string }) {
  const body = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="text-caption font-semibold uppercase tracking-wide text-ink-secondary">{label}</span>
        {icon && <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink-secondary [&>svg]:h-[1.1rem] [&>svg]:w-[1.1rem]">{icon}</span>}
      </span>
      <span className={cn('mt-2 block font-display text-display tabular-nums', attention.includes(tone) ? 'text-primary-text' : 'text-ink')}>{value}</span>
      {hint && <span className="mt-1 block text-caption text-ink-secondary">{hint}</span>}
    </>
  )
  const base = 'glass block h-full w-full rounded-lg p-4 text-left'
  if (onClick) {
    return (
      <button type="button" aria-pressed={pressed} onClick={onClick} className={cn(base, 'transition-all duration-fast hover:bg-white/90 hover:shadow-md', pressed && 'ring-2 ring-ink', className)}>
        {body}
      </button>
    )
  }
  return <div className={cn(base, className)}>{body}</div>
}
