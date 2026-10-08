import { useId, useRef, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface TabItem<T extends string> { id: T; label: string; count?: number; icon?: ReactNode }

/**
 * Tabs: ←/→ move between tabs, Home/End jump. The active tab is in the tab order; the others
 * are reached with arrows (the standard pattern). Panels are linked with aria-controls.
 */
export function Tabs<T extends string>({ items, value, onChange, label, className, idBase }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; label: string; className?: string; idBase?: string }) {
  const auto = useId()
  const base = idBase ?? auto
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const move = (e: React.KeyboardEvent, i: number) => {
    let n = i
    if (e.key === 'ArrowRight') n = (i + 1) % items.length
    else if (e.key === 'ArrowLeft') n = (i - 1 + items.length) % items.length
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = items.length - 1
    else return
    e.preventDefault(); onChange(items[n].id); refs.current[items[n].id]?.focus()
  }
  return (
    <div role="tablist" aria-label={label} className={cn('-mx-1 flex gap-1 overflow-x-auto border-b border-line px-1', className)}>
      {items.map((t, i) => {
        const active = t.id === value
        return (
          <button
            key={t.id} ref={(el) => { refs.current[t.id] = el }} role="tab" id={`${base}-tab-${t.id}`} aria-selected={active} aria-controls={`${base}-panel-${t.id}`} tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)} onKeyDown={(e) => move(e, i)}
            className={cn('-mb-px flex min-h-control shrink-0 items-center gap-2 border-b-2 px-3 text-small font-semibold transition-colors duration-fast', active ? 'border-primary text-ink' : 'border-transparent text-ink-secondary hover:text-ink')}
          >
            {t.icon}{t.label}
            {t.count !== undefined && <span className={cn('rounded-full px-1.5 text-caption', active ? 'bg-primary-subtle text-primary-text' : 'bg-neutral-bg text-neutral-text')}>{t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
/** Wrap tab content in this so the tab and panel are linked for assistive tech. */
export function TabPanel({ children, id, tabsId }: { children: ReactNode; id: string; tabsId?: string }) {
  return <div role="tabpanel" id={tabsId ? `${tabsId}-panel-${id}` : undefined} tabIndex={0} className="pt-5 focus-visible:outline-offset-4">{children}</div>
}

/** Filter chips: a row of mutually-exclusive options with counts. Buttons with aria-pressed, not colour alone. */
export function Segmented<T extends string>({ items, value, onChange, label }: { items: Array<{ id: T; label: string; count?: number }>; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <button
          key={i.id} type="button" aria-pressed={value === i.id} onClick={() => onChange(i.id)}
          className={cn('inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-small font-semibold transition-colors duration-fast', value === i.id ? 'border-ink bg-ink text-ink-inverse' : 'border-line bg-surface text-ink-secondary hover:bg-surface-sunken hover:text-ink')}
        >
          {i.label}
          {i.count !== undefined && <span className={cn('tabular-nums', value === i.id ? 'text-ink-inverse/80' : 'text-ink-tertiary')}>{i.count}</span>}
        </button>
      ))}
    </div>
  )
}
