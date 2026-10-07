import { useState, type ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { SearchInput, Select, Field, type Option } from './Form'
import { Button } from './Button'
import { Drawer } from './Overlay'

export interface FilterDef { id: string; label: string; options: Option[]; allLabel?: string }

/**
 * FilterBar — search + dropdown filters.
 *  ≥ md: inline row. < md: search stays visible, filters collapse into a bottom sheet
 *  with an “n active” count on the trigger.
 * Result count is announced politely so screen-reader users hear the effect of a filter.
 */
export function FilterBar({ search, onSearch, searchLabel, searchPlaceholder, filters, values, onChange, onClear, resultCount, noun, trailing }: {
  search: string; onSearch: (v: string) => void; searchLabel: string; searchPlaceholder: string
  filters: FilterDef[]; values: Record<string, string>; onChange: (id: string, v: string) => void; onClear: () => void
  resultCount: number; noun: string; trailing?: ReactNode
}) {
  const [sheet, setSheet] = useState(false)
  const active = filters.filter((f) => values[f.id] && values[f.id] !== 'all').length + (search ? 1 : 0)
  const controls = (stacked: boolean) => filters.map((f) => (
    stacked
      ? <Field key={f.id} label={f.label}>{({ id }) => <Select id={id} value={values[f.id] ?? 'all'} onChange={(e) => onChange(f.id, e.target.value)} options={[{ value: 'all', label: f.allLabel ?? `All ${f.label.toLowerCase()}` }, ...f.options]} />}</Field>
      : <div key={f.id} className="w-[9.25rem]"><label className="sr-only" htmlFor={`f-${f.id}`}>{f.label}</label><Select id={`f-${f.id}`} className="!rounded-full truncate pl-4 pr-8 font-medium" value={values[f.id] ?? 'all'} onChange={(e) => onChange(f.id, e.target.value)} options={[{ value: 'all', label: `${f.label}: ${f.allLabel ?? 'All'}` }, ...f.options.map((o) => ({ ...o, label: `${f.label}: ${o.label}` }))]} /></div>
  ))
  return (
    <div data-ds="FilterBar" className="flex flex-col gap-3 border-b border-line px-6 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput className="min-w-0 flex-1 md:w-60 md:flex-none" value={search} onChange={onSearch} label={searchLabel} placeholder={searchPlaceholder} />
        <div className="hidden md:contents">{controls(false)}</div>
        <Button className="md:hidden" iconLeft={<SlidersHorizontal className="h-4 w-4" aria-hidden />} onClick={() => setSheet(true)}>Filters{active > 0 && <span className="rounded-full bg-action px-1.5 text-caption text-action-on">{active}</span>}</Button>
        {trailing && <div className="ml-auto">{trailing}</div>}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-body-sm text-ink-secondary" role="status" aria-live="polite">{resultCount} {resultCount === 1 ? noun.replace(/s$/, '') : noun}</p>
        {active > 0 && <button type="button" onClick={onClear} className="rounded-sm text-body-sm font-medium text-ink-link hover:underline">Clear all</button>}
      </div>
      <Drawer open={sheet} onClose={() => setSheet(false)} title="Filters" footer={<><Button variant="secondary" className="flex-1" onClick={onClear}>Clear all</Button><Button variant="primary" className="flex-1" onClick={() => setSheet(false)}>Show {resultCount} {noun}</Button></>}>
        <div className="flex flex-col gap-4">{controls(true)}</div>
      </Drawer>
    </div>
  )
}
