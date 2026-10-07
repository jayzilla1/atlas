import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface TabDef { id: string; label: string; count?: number; icon?: ReactNode }

/** Tabs — WAI-ARIA tabs pattern with roving tabindex; ←/→/Home/End move and activate. */
export function Tabs({ tabs, value, onChange, label, className }: { tabs: TabDef[]; value: string; onChange: (id: string) => void; label: string; className?: string }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const onKey = (e: KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === value)
    let n = -1
    if (e.key === 'ArrowRight') n = (i + 1) % tabs.length
    else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = tabs.length - 1
    if (n >= 0) { e.preventDefault(); onChange(tabs[n].id); refs.current[tabs[n].id]?.focus() }
  }
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKey} data-ds="Tabs"
      className={cn('scroll-thin flex gap-1 overflow-x-auto border-b border-line', className)}>
      {tabs.map((t) => {
        const selected = t.id === value
        return (
          <button key={t.id} ref={(el) => { refs.current[t.id] = el }} role="tab" type="button" aria-selected={selected}
            tabIndex={selected ? 0 : -1} onClick={() => onChange(t.id)}
            className={cn('relative -mb-px flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t-md border-b-2 px-3 py-2.5 text-body font-medium transition-colors duration-fast focus-visible:shadow-[inset_0_0_0_2px_var(--color-focus-ring)]',
              selected ? 'border-action text-ink' : 'border-transparent text-ink-secondary hover:text-ink')}>
            {t.icon}{t.label}
            {t.count !== undefined && <span className={cn('rounded-full px-1.5 text-caption tabular-nums', selected ? 'bg-action-subtle text-action-ink' : 'bg-sunken text-ink-secondary')}>{t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
/** Pair with <Tabs>. Use the same `base` convention: panel gets role="tabpanel". */
export function TabPanel({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return <div role="tabpanel" aria-label={label} tabIndex={0} className={cn('pt-5 outline-none focus-visible:shadow-focus', className)}>{children}</div>
}
