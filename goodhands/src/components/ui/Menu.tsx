import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'

export interface MenuItem { label: string; icon?: ReactNode; onSelect: () => void; danger?: boolean; disabled?: boolean; separatorBefore?: boolean }

/**
 * Dropdown menu. Keyboard: Enter/Space/↓ opens, ↑↓ moves, Home/End jump, Esc closes and returns focus
 * to the button, Tab closes. The list is drawn in a "portal" (attached to the page body) and
 * positioned from the button's location — otherwise a menu inside a scrolling table would be clipped.
 */
export function Menu({ trigger, items, align = 'end', label }: { trigger: (p: { onClick: () => void; 'aria-haspopup': 'menu'; 'aria-expanded': boolean; 'aria-controls': string; ref: React.RefObject<HTMLButtonElement | null> }) => ReactNode; items: MenuItem[]; align?: 'start' | 'end'; label?: string }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left?: number; right?: number } | null>(null)
  const id = useId()
  const btnRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !listRef.current || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const h = listRef.current.offsetHeight
    const up = r.bottom + h + 12 > window.innerHeight && r.top > h
    setPos({
      ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
      ...(align === 'end' ? { right: Math.max(8, window.innerWidth - r.right) } : { left: Math.max(8, r.left) }),
    })
  }, [open, align])
  // Focus the first item only once the menu is positioned and visible (hidden elements can't take focus).
  useEffect(() => {
    if (open && pos) listRef.current?.querySelector<HTMLButtonElement>('[role=menuitem]:not([disabled])')?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pos !== null])
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!listRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) setOpen(false) }
    const onScroll = () => setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('resize', onScroll)
    window.addEventListener('scroll', onScroll, true)
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('resize', onScroll); window.removeEventListener('scroll', onScroll, true) }
  }, [open])

  const close = (refocus = true) => { setOpen(false); setPos(null); if (refocus) btnRef.current?.focus() }
  const onKey = (e: React.KeyboardEvent) => {
    const nodes = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]:not([disabled])') ?? [])
    const i = nodes.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'ArrowDown') { e.preventDefault(); nodes[(i + 1) % nodes.length]?.focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); nodes[(i - 1 + nodes.length) % nodes.length]?.focus() }
    else if (e.key === 'Home') { e.preventDefault(); nodes[0]?.focus() }
    else if (e.key === 'End') { e.preventDefault(); nodes[nodes.length - 1]?.focus() }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() }
    else if (e.key === 'Tab') close(false)
  }
  return (
    <>
      {trigger({ onClick: () => (open ? close() : setOpen(true)), 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': id, ref: btnRef })}
      {open && createPortal(
        <div
          ref={listRef} id={id} role="menu" aria-label={label} onKeyDown={onKey}
          style={{ position: 'fixed', ...(pos ?? { top: 0, left: 0, visibility: 'hidden' as const }) }}
          className="z-[80] min-w-[13rem] max-w-[calc(100vw-1rem)] rounded-lg border border-line bg-surface p-1 shadow-lg"
        >
          {items.map((it) => (
            <div key={it.label}>
              {it.separatorBefore && <div role="separator" className="my-1 h-px bg-line" />}
              <button
                role="menuitem" type="button" disabled={it.disabled} tabIndex={-1}
                onClick={() => { close(); it.onSelect() }}
                className={cn('flex min-h-control w-full items-center gap-2.5 rounded-md px-3 text-left text-small font-medium transition-colors duration-fast hover:bg-surface-sunken focus-visible:bg-surface-sunken disabled:opacity-45', it.danger ? 'text-danger-text' : 'text-ink')}
              >
                {it.icon && <span aria-hidden className="text-ink-tertiary [&>svg]:h-4 [&>svg]:w-4">{it.icon}</span>}
                {it.label}
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
