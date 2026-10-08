import type { ReactNode } from 'react'
import { LoaderCircle, Lock, RefreshCw, SearchX, TriangleAlert } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

/** Shimmering placeholder shape shown while content loads. Honours reduced-motion (static grey instead). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('rounded-md bg-surface-sunken bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent)] bg-[length:200%_100%] motion-safe:animate-[gh-shimmer_1.6s_linear_infinite]', className)} />
}
export function SkeletonRows({ rows = 5, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-line-subtle bg-surface p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-1/3" /><Skeleton className="h-3 w-1/2" /></div>
          <Skeleton className="hidden h-7 w-24 rounded-full sm:block" />
        </div>
      ))}
    </div>
  )
}
export function PageSkeleton({ label = 'Loading page' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-6">
      <span className="sr-only">{label}…</span>
      <div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-80 max-w-full" /></div>
      <div className="flex gap-6"><Skeleton className="h-14 w-24" /><Skeleton className="h-14 w-24" /><Skeleton className="h-14 w-24" /><Skeleton className="h-14 w-24" /></div>
      <SkeletonRows rows={4} label="" />
    </div>
  )
}
export function InlineLoading({ label }: { label: string }) {
  return <span role="status" className="inline-flex items-center gap-2 text-small text-ink-secondary"><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />{label}</span>
}

/** Nothing here yet — says why and what to do next. Never a blank box. */
export function EmptyState({ icon, title, description, action, className, compact }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center rounded-lg border border-dashed border-line-strong/50 bg-surface-muted text-center', compact ? 'px-4 py-6' : 'px-6 py-12', className)}>
      {icon && <span aria-hidden className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface-sunken text-ink-secondary [&>svg]:h-5 [&>svg]:w-5">{icon}</span>}
      <p className="text-lead font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-small text-ink-secondary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
export function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  return <EmptyState icon={<SearchX />} title={query ? `No results for “${query}”` : 'No matches'} description="Check the spelling, or try fewer filters." action={<Button onClick={onClear}>Clear search and filters</Button>} />
}

/** Something went wrong: plain-language explanation, reassurance, and a way to retry. */
export function ErrorState({ title = 'We couldn’t load this', description = 'Nothing has been lost. Check your connection and try again.', onRetry, className }: { title?: string; description?: string; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn('flex flex-col items-center rounded-lg border border-danger/30 bg-danger-bg/50 px-6 py-12 text-center', className)}>
      <span aria-hidden className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-danger-bg text-danger"><TriangleAlert className="h-5 w-5" /></span>
      <p className="text-lead font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-small text-ink-secondary">{description}</p>
      {onRetry && <Button className="mt-4" icon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>Try again</Button>}
    </div>
  )
}

/** Shown when a signed-in person's role doesn't allow a screen. Explains who can see it, offers a way back. */
export function RestrictedState({ area, action }: { area: string; action?: ReactNode }) {
  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-lg border border-line bg-surface px-6 py-12 text-center">
      <span aria-hidden className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-bg text-neutral-text"><Lock className="h-5 w-5" /></span>
      <h1 className="text-h3">{area} is for the owner</h1>
      <p className="mt-1 text-small text-ink-secondary">Your role doesn’t include access to this area. If you need something from here, ask the owner.</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
