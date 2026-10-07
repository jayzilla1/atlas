import { cn } from '@/utils/cn'
import { initials } from '@/utils/format'
import { hashString } from '@/utils/random'

// Avatar tints are chosen from a fixed, accessible set (all pass 4.5:1 for their initials).
const TINTS = [
  'bg-info-bg text-info-fg', 'bg-success-bg text-success-fg', 'bg-warning-bg text-warning-fg',
  'bg-high-bg text-high-fg', 'bg-ai-subtle text-ai-ink', 'bg-neutral-bg text-neutral-fg', 'bg-action-subtle text-action-ink',
]
const SIZES = { xs: 'h-5 w-5 text-[0.5625rem]', sm: 'h-7 w-7 text-[0.6875rem]', md: 'h-8 w-8 text-caption', lg: 'h-10 w-10 text-body-sm', xl: 'h-16 w-16 text-title-3' }

export function Avatar({ name, size = 'md', className, muted }: { name: string; size?: keyof typeof SIZES; className?: string; muted?: boolean }) {
  const tint = muted ? 'bg-sunken text-ink-secondary' : TINTS[hashString(name) % TINTS.length]
  return (
    <span role="img" aria-label={name} data-ds="Avatar" data-ds-variant={size}
      className={cn('inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ring-2 ring-surface', SIZES[size], tint, className)}>
      <span aria-hidden>{initials(name)}</span>
    </span>
  )
}
export function AvatarGroup({ names, max = 4, size = 'sm' }: { names: string[]; max?: number; size?: keyof typeof SIZES }) {
  const shown = names.slice(0, max); const extra = names.length - shown.length
  return (
    <span className="inline-flex items-center -space-x-1.5" data-ds="AvatarGroup">
      {shown.map((n) => <Avatar key={n} name={n} size={size} />)}
      {extra > 0 && <span className={cn('inline-flex items-center justify-center rounded-full bg-sunken font-semibold text-ink-secondary ring-2 ring-surface', SIZES[size])} aria-label={`${extra} more`}>+{extra}</span>}
    </span>
  )
}
