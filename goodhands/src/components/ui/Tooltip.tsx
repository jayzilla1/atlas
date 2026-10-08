import { cloneElement, isValidElement, useEffect, useId, useState, type ReactElement } from 'react'

/**
 * A short hint on hover or keyboard focus. Press Esc to dismiss (a WCAG requirement), and it
 * stays visible while the pointer moves onto it. It never holds essential information —
 * anything important is also in visible text or the control's accessible name.
 */
export function Tooltip({ label, children }: { label: string; children: ReactElement<Record<string, unknown>> }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      {isValidElement(children) ? cloneElement(children, { 'aria-describedby': open ? id : undefined }) : children}
      {open && (
        <span id={id} role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-caption font-medium text-ink-inverse shadow-md anim-fade-in">
          {label}
        </span>
      )}
    </span>
  )
}
