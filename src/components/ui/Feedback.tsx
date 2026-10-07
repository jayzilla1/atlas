import type { ReactNode } from 'react'
import { AlertCircle, SearchX } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'
import { Spinner } from './Spinner'

/** EmptyState — "nothing here yet". Always says why and what to do next. */
export function EmptyState({ icon, title, description, action, className, compact }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string; compact?: boolean }) {
  return (
    <div data-ds="EmptyState" className={cn('flex flex-col items-center justify-center text-center', compact ? 'px-4 py-8' : 'px-6 py-14', className)}>
      {icon && <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-sunken text-ink-tertiary [&>svg]:h-5 [&>svg]:w-5" aria-hidden>{icon}</div>}
      <h3 className="text-title-3">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-body text-ink-secondary">{description}</p>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
/** NoResults — filters/search matched nothing. Distinct from EmptyState: the data exists. */
export function NoResults({ query, onClear }: { query?: string; onClear: () => void }) {
  return <EmptyState icon={<SearchX />} title="No matching results" description={query ? `Nothing matches “${query}” with the current filters.` : 'Nothing matches the current filters.'} action={<Button onClick={onClear}>Clear search and filters</Button>} />
}

/** ErrorState — something failed to load. Offers retry and a human-readable cause. */
export function ErrorState({ title = 'We couldn’t load this', description = 'Something went wrong on our side. Your data is safe. Try again in a moment.', onRetry, detail, className }: { title?: string; description?: ReactNode; onRetry?: () => void; detail?: string; className?: string }) {
  return (
    <div role="alert" data-ds="ErrorState" className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-critical-bg text-critical-fg" aria-hidden><AlertCircle className="h-5 w-5" /></div>
      <h3 className="text-title-3">{title}</h3>
      <p className="mt-1 max-w-sm text-body text-ink-secondary">{description}</p>
      {detail && <p className="mt-2 font-mono text-caption text-ink-tertiary">{detail}</p>}
      {onRetry && <Button className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  )
}

export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div role="status" data-ds="LoadingState" className={cn('flex items-center justify-center gap-2.5 py-14 text-body text-ink-secondary', className)}>
      <Spinner className="h-5 w-5 text-action" />{label}
    </div>
  )
}

/** Skeletons mimic final layout to prevent jumpy loading. Decorative → aria-hidden; pair with a live “Loading” status. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden data-ds="Skeleton" className={cn('animate-shimmer rounded-md motion-reduce:animate-none motion-reduce:bg-sunken', className)} />
}
export function TableSkeleton({ rows = 8, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="divide-y divide-line">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 flex-1" /><Skeleton className="hidden h-4 w-24 sm:block" /><Skeleton className="hidden h-6 w-20 md:block" /><Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }).map((_, i) => <div key={i} className="rounded-lg border border-line bg-surface p-4"><Skeleton className="h-4 w-24" /><Skeleton className="mt-3 h-8 w-16" /><Skeleton className="mt-3 h-3 w-32" /></div>)}
    </div>
  )
}

export function ProgressBar({ value, max = 100, tone = 'info', label, showValue, size = 'md', className }: { value: number; max?: number; tone?: 'info' | 'success' | 'warning' | 'critical' | 'ai'; label: string; showValue?: boolean; size?: 'sm' | 'md'; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const color = { info: 'bg-action', success: 'bg-success-solid', warning: 'bg-warning-solid', critical: 'bg-critical-solid', ai: 'bg-ai' }[tone]
  return (
    <div className={cn('flex items-center gap-3', className)} data-ds="ProgressBar">
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} className={cn('w-full overflow-hidden rounded-full bg-sunken', size === 'md' ? 'h-2' : 'h-1.5')}>
        <div className={cn('h-full rounded-full transition-[width] duration-slow ease-standard', color)} style={{ width: `${pct}%` }} />
      </div>
      {showValue && <span className="w-10 shrink-0 text-right text-caption tabular-nums text-ink-secondary">{Math.round(pct)}%</span>}
    </div>
  )
}
