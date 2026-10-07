import { useId, useState, type ReactNode } from 'react'
import { BarChart3, Table2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface Series { id: string; label: string; color: string; values: number[]; dashed?: boolean }

/**
 * ChartFrame — every chart ships with: a title that states the takeaway,
 * a plain-language description, a legend (≥ 2 series), and a “Table” view so
 * the same data is available to screen readers and for exact reading.
 */
export function ChartFrame({ title, description, legend, table, children, className, headingLevel = 2 }: {
  title: string; description?: string
  legend?: { label: string; color: string; dashed?: boolean }[]
  table: { columns: string[]; rows: (string | number)[][] }
  children: ReactNode; className?: string; headingLevel?: 2 | 3
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const id = useId()
  const H = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <figure data-ds="Chart" className={cn('m-0 min-w-0', className)} aria-labelledby={id}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <figcaption className="min-w-0">
          <H id={id} className="text-title-3">{title}</H>
          {description && <p className="mt-0.5 text-body-sm text-ink-secondary">{description}</p>}
        </figcaption>
        <button type="button" onClick={() => setView(view === 'chart' ? 'table' : 'chart')} aria-pressed={view === 'table'}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-line px-2.5 text-body-sm font-medium text-ink-secondary hover:bg-hover hover:text-ink">
          {view === 'chart' ? <Table2 className="h-3.5 w-3.5" aria-hidden /> : <BarChart3 className="h-3.5 w-3.5" aria-hidden />}
          <span>{view === 'chart' ? 'View as table' : 'View as chart'}</span>
        </button>
      </div>
      {view === 'chart' ? (
        <>
          {legend && legend.length > 1 && (
            <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Legend">
              {legend.map((l) => (
                <li key={l.label} className="flex items-center gap-1.5 text-body-sm text-ink-secondary">
                  <svg width="14" height="8" aria-hidden><line x1="0" x2="14" y1="4" y2="4" stroke={l.color} strokeWidth="3" strokeLinecap="round" strokeDasharray={l.dashed ? '3 3' : undefined} /></svg>{l.label}
                </li>
              ))}
            </ul>
          )}
          {children}
        </>
      ) : (
        <div className="scroll-thin overflow-x-auto rounded-md border border-line">
          <table className="w-full text-left text-body-sm">
            <thead className="bg-sunken"><tr>{table.columns.map((c) => <th key={c} scope="col" className="px-3 py-2 font-semibold text-ink-secondary">{c}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">{table.rows.map((r, i) => <tr key={i}>{r.map((v, j) => j === 0 ? <th key={j} scope="row" className="px-3 py-2 font-medium">{v}</th> : <td key={j} className="px-3 py-2 tabular-nums">{v}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </figure>
  )
}
