import { cn } from '@/utils/cn'
/** Progress bar with a text value next to it — the number carries the meaning, the bar is a glance aid. */
export function Progress({ value, max, label, tone = 'primary', className }: { value: number; max: number; label: string; tone?: 'primary' | 'success'; className?: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
        <div className={cn('h-full rounded-full transition-[width] duration-slow ease-out', tone === 'success' ? 'bg-success' : 'bg-primary')} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-small font-semibold tabular-nums text-ink-secondary">{value}/{max}</span>
    </div>
  )
}
