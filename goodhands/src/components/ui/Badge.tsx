import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
const tones: Record<Tone, string> = {
  neutral: 'bg-neutral-bg text-neutral-text',
  success: 'bg-success-bg text-success-text',
  warning: 'bg-warning-bg text-warning-text',
  danger: 'bg-primary text-primary-on',
  info: 'bg-surface text-info-text ring-1 ring-inset ring-line-strong/40',
  primary: 'bg-primary-subtle text-primary-text',
}
export const toneIconColor: Record<Tone, string> = {
  neutral: 'text-neutral', success: 'text-success', warning: 'text-warning', danger: 'text-danger', info: 'text-info', primary: 'text-primary',
}

/**
 * A small label. Always carries TEXT, and usually an icon — colour alone never carries meaning.
 */
export function Badge({ tone = 'neutral', icon, children, className, size = 'md' }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string; size?: 'sm' | 'md' }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold', size === 'md' ? 'px-2.5 py-0.5 text-caption' : 'px-2 py-px text-caption', tones[tone], className)}>
      {icon && <span className="inline-flex shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5" aria-hidden>{icon}</span>}
      {children}
    </span>
  )
}
