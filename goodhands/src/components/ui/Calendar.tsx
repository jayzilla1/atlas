import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ISODate } from '@/types'
import { addDays, monthName, toDate, toISO, WEEKDAYS_SHORT } from '@/utils/dates'
import { cn } from '@/utils/cn'
import { IconButton } from './Button'

/**
 * Month calendar. Keyboard: arrows move by day/week, Home/End jump to the start/end of the week,
 * PageUp/PageDown change month. `marked` dates get a dot (e.g. "has events") with a text alternative.
 */
export function Calendar({ value, onChange, today, min, max, marked, markedLabel = 'has activity' }: { value: ISODate; onChange: (d: ISODate) => void; today: ISODate; min?: ISODate; max?: ISODate; marked?: Set<ISODate>; markedLabel?: string }) {
  const [focus, setFocus] = useState(value)
  const [view, setView] = useState(() => { const d = toDate(value); return { y: d.getFullYear(), m: d.getMonth() } })
  const grid = useRef<HTMLDivElement>(null)
  const shouldFocus = useRef(false)

  useEffect(() => {
    if (!shouldFocus.current) return
    shouldFocus.current = false
    grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focus}"]`)?.focus()
  }, [focus, view])

  const move = (d: ISODate) => {
    shouldFocus.current = true
    setFocus(d)
    const t = toDate(d)
    setView({ y: t.getFullYear(), m: t.getMonth() })
  }
  const shiftMonth = (n: number) => { const t = new Date(view.y, view.m + n, 1, 12); setView({ y: t.getFullYear(), m: t.getMonth() }); setFocus(toISO(t)) }

  const first = new Date(view.y, view.m, 1, 12)
  const startOffset = first.getDay()
  const days = Array.from({ length: 42 }, (_, i) => toISO(new Date(view.y, view.m, 1 - startOffset + i, 12)))
  const onKey = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (e.key in map) { e.preventDefault(); move(addDays(focus, map[e.key])) }
    else if (e.key === 'Home') { e.preventDefault(); move(addDays(focus, -toDate(focus).getDay())) }
    else if (e.key === 'End') { e.preventDefault(); move(addDays(focus, 6 - toDate(focus).getDay())) }
    else if (e.key === 'PageUp') { e.preventDefault(); shiftMonth(-1) }
    else if (e.key === 'PageDown') { e.preventDefault(); shiftMonth(1) }
  }
  const disabled = (d: ISODate) => (min && d < min) || (max && d > max)

  return (
    <div className="w-[19rem] max-w-full">
      <div className="mb-2 flex items-center justify-between">
        <IconButton label="Previous month" size="sm" onClick={() => shiftMonth(-1)}><ChevronLeft className="h-4 w-4" /></IconButton>
        <p className="text-small font-bold" aria-live="polite">{monthName(view.m)} {view.y}</p>
        <IconButton label="Next month" size="sm" onClick={() => shiftMonth(1)}><ChevronRight className="h-4 w-4" /></IconButton>
      </div>
      <div ref={grid} role="grid" aria-label={`${monthName(view.m)} ${view.y}`} onKeyDown={onKey}>
        <div role="row" className="grid grid-cols-7 text-center">
          {WEEKDAYS_SHORT.map((w) => <span key={w} role="columnheader" className="py-1 text-caption font-semibold text-ink-tertiary">{w.slice(0, 2)}</span>)}
        </div>
        {Array.from({ length: 6 }, (_, r) => (
          <div role="row" key={r} className="grid grid-cols-7">
            {days.slice(r * 7, r * 7 + 7).map((d) => {
              const inMonth = toDate(d).getMonth() === view.m
              const selected = d === value
              const dis = disabled(d)
              return (
                <div role="gridcell" key={d} aria-selected={selected} className="flex justify-center p-px">
                  <button
                    type="button" data-date={d} disabled={!!dis} tabIndex={d === focus ? 0 : -1}
                    aria-label={`${toDate(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${d === today ? ', today' : ''}${marked?.has(d) ? `, ${markedLabel}` : ''}`}
                    onClick={() => onChange(d)}
                    className={cn('relative flex h-9 w-9 items-center justify-center rounded-md text-small tabular-nums transition-colors duration-fast', selected ? 'bg-primary font-bold text-primary-on' : inMonth ? 'text-ink hover:bg-surface-sunken' : 'text-ink-tertiary/70 hover:bg-surface-sunken', d === today && !selected && 'font-bold ring-1 ring-inset ring-primary', dis && 'pointer-events-none opacity-30')}
                  >
                    {toDate(d).getDate()}
                    {marked?.has(d) && <span aria-hidden className={cn('absolute bottom-1 h-1 w-1 rounded-full', selected ? 'bg-primary-on' : 'bg-primary')} />}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/** A button that opens a Calendar in a popover. Esc closes it and returns focus to the button. */
export function DatePickerButton({ value, onChange, today, min, max, marked, markedLabel, children }: { value: ISODate; onChange: (d: ISODate) => void; today: ISODate; min?: ISODate; max?: ISODate; marked?: Set<ISODate>; markedLabel?: string; children: (p: { onClick: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'dialog'; ref: React.RefObject<HTMLButtonElement | null> }) => ReactNode }) {
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)
  const pop = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const down = (e: MouseEvent) => { if (!pop.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus() } }
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key)
    pop.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus()
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [open])
  return (
    <span className="relative inline-flex">
      {children({ onClick: () => setOpen((o) => !o), 'aria-expanded': open, 'aria-haspopup': 'dialog', ref: btn })}
      {open && (
        <div ref={pop} role="dialog" aria-label="Choose a date" className="absolute left-0 top-full z-40 mt-1 rounded-lg border border-line bg-surface p-3 shadow-lg anim-fade-in">
          <Calendar value={value} today={today} min={min} max={max} marked={marked} markedLabel={markedLabel} onChange={(d) => { onChange(d); setOpen(false); btn.current?.focus() }} />
        </div>
      )}
    </span>
  )
}
