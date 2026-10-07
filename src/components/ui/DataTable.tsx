import { Fragment, useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Pagination } from './Pagination'
import { Select } from './Form'

export interface Column<T> {
  id: string
  header: string
  cell: (row: T) => ReactNode
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right'
  /** Hide this column below a breakpoint (tablet pattern). */
  hideBelow?: 'md' | 'lg' | 'xl'
  /** Mobile card role: 'title' is the card heading; 'meta' rows appear as label/value pairs; 'hide' omits it. */
  mobile?: 'title' | 'meta' | 'hide'
  width?: string
}
export interface Sort { id: string; dir: 'asc' | 'desc' }

const hideCls = { md: 'max-md:hidden', lg: 'max-lg:hidden', xl: 'max-xl:hidden' }

/**
 * DataTable — one component, two layouts.
 *  ≥ md: a semantic <table> with sortable headers (aria-sort), sticky header, optional expanding rows.
 *  < md: the same rows as stacked “record cards” (title + label/value pairs) with a Sort select —
 *        because a 7-column table at 375px is unreadable.
 */
export function DataTable<T>({ columns, rows, getRowKey, caption, defaultSort, pageSize = 10, onSortChange, renderExpanded, noun = 'results', rowClassName, resetPageKey, density = 'comfortable' }: {
  columns: Column<T>[]; rows: T[]; getRowKey: (r: T) => string; caption: string; defaultSort?: Sort; pageSize?: number
  onSortChange?: (s: Sort) => void; renderExpanded?: (r: T) => ReactNode; noun?: string; rowClassName?: (r: T) => string | undefined; resetPageKey?: string; density?: 'comfortable' | 'compact'
}) {
  const [sort, setSort] = useState<Sort | undefined>(defaultSort)
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const base = useId()
  useEffect(() => setPage(1), [rows.length, resetPageKey, sort?.id, sort?.dir])

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.id === sort?.id)
    if (!col?.sortValue || !sort) return rows
    const f = col.sortValue
    return [...rows].sort((a, b) => {
      const x = f(a); const y = f(b)
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true })
      return sort.dir === 'asc' ? r : -r
    })
  }, [rows, sort, columns])
  const paged = pageSize ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted

  const toggleSort = (c: Column<T>) => {
    const next: Sort = sort?.id === c.id ? { id: c.id, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { id: c.id, dir: 'asc' }
    setSort(next); onSortChange?.(next)
  }
  const toggleRow = (k: string) => setExpanded((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n })
  const sortable = columns.filter((c) => c.sortValue)
  const titleCol = columns.find((c) => c.mobile === 'title') ?? columns[0]
  const metaCols = columns.filter((c) => c !== titleCol && c.mobile !== 'hide' && c.mobile !== 'title')
  const pad = density === 'compact' ? 'py-2' : 'py-3'

  return (
    <div data-ds="DataTable">
      {/* ---------- Mobile: record cards ---------- */}
      <div className="md:hidden">
        {sortable.length > 0 && (
          <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
            <label htmlFor={`${base}-sort`} className="shrink-0 text-body-sm text-ink-secondary">Sort by</label>
            <Select id={`${base}-sort`} value={`${sort?.id ?? ''}:${sort?.dir ?? 'asc'}`} onChange={(e) => { const [id, dir] = e.target.value.split(':'); const s = { id, dir: dir as 'asc' | 'desc' }; setSort(s); onSortChange?.(s) }}
              options={sortable.flatMap((c) => [{ value: `${c.id}:asc`, label: `${c.header} (A→Z / low→high)` }, { value: `${c.id}:desc`, label: `${c.header} (Z→A / high→low)` }])} />
          </div>
        )}
        <ul className="divide-y divide-line">
          {paged.map((r) => {
            const k = getRowKey(r); const open = expanded.has(k)
            return (
              <li key={k} className={cn('px-4 py-3.5', rowClassName?.(r))}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 text-body font-medium">{titleCol.cell(r)}</div>
                  {renderExpanded && <button type="button" aria-expanded={open} aria-label={open ? 'Hide details' : 'Show details'} onClick={() => toggleRow(k)} className="-m-1 flex h-8 w-8 items-center justify-center rounded-md text-ink-tertiary hover:bg-sunken"><ChevronRight className={cn('h-4 w-4 transition-transform duration-base', open && 'rotate-90')} aria-hidden /></button>}
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                  {metaCols.map((c) => (
                    <div key={c.id} className="min-w-0">
                      <dt className="text-caption text-ink-secondary">{c.header}</dt>
                      <dd className="mt-0.5 text-body-sm">{c.cell(r)}</dd>
                    </div>
                  ))}
                </dl>
                {open && renderExpanded && <div className="mt-3 animate-fade-in rounded-md bg-sunken p-3">{renderExpanded(r)}</div>}
              </li>
            )
          })}
        </ul>
      </div>

      {/* ---------- ≥ md: table ---------- */}
      <div className="scroll-thin hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-body">
          <caption className="sr-only">{caption}. {sort ? `Sorted by ${columns.find((c) => c.id === sort.id)?.header}, ${sort.dir === 'asc' ? 'ascending' : 'descending'}.` : ''}</caption>
          <thead>
            <tr className="border-b border-line">
              {renderExpanded && <th scope="col" className="w-10 px-2"><span className="sr-only">Expand</span></th>}
              {columns.map((c) => {
                const active = sort?.id === c.id
                return (
                  <th key={c.id} scope="col" aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : c.sortValue ? 'none' : undefined}
                    style={c.width ? { width: c.width } : undefined}
                    className={cn('whitespace-nowrap px-4 py-3 text-overline uppercase text-ink-secondary', c.align === 'right' && 'text-right', c.hideBelow && hideCls[c.hideBelow])}>
                    {c.sortValue ? (
                      <button type="button" onClick={() => toggleSort(c)} className={cn('-mx-1.5 inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 hover:bg-line hover:text-ink', active && 'text-ink')}>
                        {c.header}
                        {active ? (sort!.dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" aria-hidden /> : <ArrowDown className="h-3.5 w-3.5" aria-hidden />) : <ChevronsUpDown className="h-3.5 w-3.5 text-ink-tertiary" aria-hidden />}
                      </button>
                    ) : c.header}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paged.map((r) => {
              const k = getRowKey(r); const open = expanded.has(k)
              return (
                <Fragment key={k}>
                  <tr className={cn('transition-colors duration-fast hover:bg-[var(--table-row-hover)]', rowClassName?.(r))}>
                    {renderExpanded && (
                      <td className="px-2 align-middle">
                        <button type="button" aria-expanded={open} aria-label={open ? 'Hide details' : 'Show details'} onClick={() => toggleRow(k)} className="flex h-8 w-8 items-center justify-center rounded-md text-ink-tertiary hover:bg-sunken hover:text-ink">
                          <ChevronRight className={cn('h-4 w-4 transition-transform duration-base', open && 'rotate-90')} aria-hidden />
                        </button>
                      </td>
                    )}
                    {columns.map((c) => <td key={c.id} className={cn('px-4 align-middle', pad, c.align === 'right' && 'text-right', c.hideBelow && hideCls[c.hideBelow])}>{c.cell(r)}</td>)}
                  </tr>
                  {open && renderExpanded && (
                    <tr className="bg-sunken/60"><td colSpan={columns.length + 1} className="animate-fade-in px-6 py-4">{renderExpanded(r)}</td></tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {pageSize > 0 && <Pagination page={page} pageSize={pageSize} total={sorted.length} onPage={setPage} noun={noun} />}
    </div>
  )
}
