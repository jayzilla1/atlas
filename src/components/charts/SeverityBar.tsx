import { Link } from 'react-router-dom'
import type { Severity } from '@/data/types'
import { SEVERITY_META } from '@/components/ui/Badge'
import { SEVERITY_ORDER } from '@/data/selectors'
import { cn } from '@/utils/cn'

const FILL: Record<Severity, string> = { critical: 'bg-critical-solid', high: 'bg-high-solid', medium: 'bg-warning-solid', low: 'bg-info-solid' }

/**
 * SeverityBar — part-to-whole of open risks by severity.
 * Each segment is a link to the filtered Risks list; a legend row repeats every
 * count with icon + label, so colour is never the only signal.
 */
export function SeverityBar({ counts, linkPrefix = '/risks?severity=' }: { counts: Record<Severity, number>; linkPrefix?: string }) {
  const total = SEVERITY_ORDER.reduce((a, s) => a + counts[s], 0)
  return (
    <div data-ds="Chart" data-ds-variant="severity-bar">
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={`${total} open risks: ${SEVERITY_ORDER.map((s) => `${counts[s]} ${s}`).join(', ')}`}>
        {SEVERITY_ORDER.map((s) => counts[s] > 0 && <div key={s} className={cn('h-full first:rounded-l-full last:rounded-r-full', FILL[s])} style={{ flexGrow: counts[s] }} />)}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SEVERITY_ORDER.map((s) => {
          const m = SEVERITY_META[s]
          return (
            <li key={s}>
              <Link to={`${linkPrefix}${s}`} className="block rounded-md border border-line p-2.5 transition-colors duration-fast hover:bg-hover">
                <span className="flex items-center gap-1.5 text-body-sm font-medium text-ink-secondary"><span className={cn('h-2.5 w-2.5 rounded-sm', FILL[s])} aria-hidden /><m.Icon className="h-3.5 w-3.5" aria-hidden />{m.label}</span>
                <span className="mt-1 block text-title-2 tabular-nums">{counts[s]}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
