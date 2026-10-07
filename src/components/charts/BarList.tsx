import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { ChartFrame } from './ChartFrame'

export interface BarItem { label: string; value: number; total?: number; display?: string; to?: string; tone?: 'default' | 'warning' | 'critical' | 'success' }
const FILL = { default: 'var(--color-chart-1)', warning: 'var(--color-warning-solid)', critical: 'var(--color-critical-solid)', success: 'var(--color-success-solid)' }

/** BarList — horizontal bars; labels on the left, values on the right, so every bar is directly readable. Sorted by caller. */
export function BarList({ title, description, items, max, valueLabel = 'Value', className, headingLevel }: { title: string; description?: string; items: BarItem[]; max?: number; valueLabel?: string; className?: string; headingLevel?: 2 | 3 }) {
  const top = max ?? Math.max(...items.map((i) => i.total ?? i.value), 1)
  return (
    <ChartFrame title={title} description={description} className={className} headingLevel={headingLevel} table={{ columns: ['Item', valueLabel], rows: items.map((i) => [i.label, i.display ?? String(i.value)]) }}>
      <ul className="space-y-2.5">
        {items.map((i) => {
          const body = (
            <>
              <div className="flex items-baseline justify-between gap-3 text-body-sm"><span className="truncate text-ink">{i.label}</span><span className="shrink-0 font-semibold tabular-nums">{i.display ?? i.value}</span></div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-sunken" aria-hidden><div className="h-full rounded-full" style={{ width: `${(i.value / top) * 100}%`, background: FILL[i.tone ?? 'default'] }} /></div>
            </>
          )
          return <li key={i.label}>{i.to ? <Link to={i.to} className={cn('block rounded-sm hover:opacity-80')}>{body}</Link> : body}</li>
        })}
      </ul>
    </ChartFrame>
  )
}
