import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useFloating, type Placement } from '@/hooks/useFloating'
import { cn } from '@/utils/cn'

export interface MenuItem {
  id: string
  label: ReactNode
  icon?: ReactNode
  onSelect?: () => void
  to?: string
  danger?: boolean
  disabled?: boolean
  disabledReason?: string
  checked?: boolean
  description?: string
  separatorBefore?: boolean
  heading?: string
}

/**
 * Dropdown — menu button pattern (WAI-ARIA APG): Enter/Space/↓ opens, ↑↓ moves,
 * Home/End jump, Esc closes and returns focus, typing a letter jumps.
 */
export function Dropdown({ trigger, items, placement = 'bottom-end', width = 'w-60', label }: { trigger: (p: { onClick: () => void; ref: React.RefObject<HTMLButtonElement | null>; 'aria-haspopup': 'menu'; 'aria-expanded': boolean; 'aria-controls': string }) => ReactNode; items: MenuItem[]; placement?: Placement; width?: string; label?: string }) {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement | null>(null)
  const pop = useRef<HTMLDivElement | null>(null)
  const id = useId()
  const pos = useFloating(anchor, pop, open, placement, 6)
  const enabled = items.filter((i) => !i.disabled)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!open) return
    setActive(Math.max(0, enabled.findIndex((i) => i.checked)))
    const onDown = (e: MouseEvent) => { if (!pop.current?.contains(e.target as Node) && !anchor.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  useEffect(() => { if (open && pos) pop.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.focus() }, [open, active, pos])

  const close = (refocus = true) => { setOpen(false); if (refocus) anchor.current?.focus() }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % enabled.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + enabled.length) % enabled.length) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(enabled.length - 1) }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() }
    else if (e.key === 'Tab') setOpen(false)
    else if (e.key.length === 1) {
      const idx = enabled.findIndex((i, n) => typeof i.label === 'string' && n !== active && i.label.toLowerCase().startsWith(e.key.toLowerCase()))
      if (idx >= 0) setActive(idx)
    }
  }
  let enabledIdx = -1
  return (
    <>
      {trigger({
        ref: anchor, onClick: () => setOpen((o) => !o), 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': id,
      })}
      {open && createPortal(
        <div ref={pop} id={id} role="menu" aria-label={label} onKeyDown={onKey} data-ds="Dropdown"
          style={{ position: 'fixed', top: pos?.top ?? -999, left: pos?.left ?? -999, opacity: pos ? 1 : 0 }}
          className={cn('z-[85] max-h-[70vh] overflow-y-auto rounded-lg border border-line bg-elevated p-1 shadow-lg animate-pop', width)}>
          {items.map((it) => {
            const isEnabled = !it.disabled
            if (isEnabled) enabledIdx++
            const idx = enabledIdx
            const content = (
              <>
                {it.icon && <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-ink-tertiary" aria-hidden>{it.icon}</span>}
                <span className="min-w-0 flex-1 text-left"><span className="block">{it.label}</span>{it.description && <span className="block text-caption font-normal text-ink-secondary">{it.description}</span>}{it.disabled && it.disabledReason && <span className="block text-caption font-normal text-ink-tertiary">{it.disabledReason}</span>}</span>
                {it.checked && <Check className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden />}
              </>
            )
            const cls = cn('flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-body font-medium outline-none transition-colors duration-fast', it.danger ? 'text-critical-fg' : 'text-ink', isEnabled ? 'cursor-pointer hover:bg-hover focus-visible:bg-hover focus-visible:shadow-[inset_0_0_0_2px_var(--color-focus-ring)]' : 'cursor-not-allowed opacity-50')
            return (
              <div key={it.id}>
                {it.separatorBefore && <div role="separator" className="my-1 h-px bg-line" />}
                {it.heading && <div className="px-2.5 pb-1 pt-2 text-overline uppercase text-ink-tertiary" role="presentation">{it.heading}</div>}
                {it.to && isEnabled
                  ? <Link role="menuitem" to={it.to} data-idx={idx} tabIndex={-1} className={cls} onClick={() => close(false)}>{content}</Link>
                  : <button role={it.checked !== undefined ? 'menuitemradio' : 'menuitem'} aria-checked={it.checked} type="button" data-idx={isEnabled ? idx : undefined} tabIndex={-1} aria-disabled={!isEnabled || undefined} className={cls}
                    onClick={() => { if (!isEnabled) return; it.onSelect?.(); close() }}>{content}</button>}
              </div>
            )
          })}
        </div>, document.body)}
    </>
  )
}
