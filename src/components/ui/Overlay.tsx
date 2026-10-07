import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button, IconButton } from './Button'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Shared behaviour for Modal / Drawer:
 *  - moves focus inside on open and restores it to the trigger on close
 *  - traps Tab / Shift+Tab
 *  - closes on Esc
 *  - locks page scroll
 */
function useDialogBehaviour(open: boolean, onClose: () => void, ref: React.RefObject<HTMLDivElement | null>, initialFocusSelector?: string) {
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const el = ref.current
    const first = (initialFocusSelector && el?.querySelector<HTMLElement>(initialFocusSelector)) || el?.querySelector<HTMLElement>('[data-autofocus]') || el?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? el)?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return }
      if (e.key !== 'Tab' || !el) return
      const nodes = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null || n === document.activeElement)
      if (!nodes.length) { e.preventDefault(); return }
      const a = nodes[0]; const z = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}

interface BaseProps { open: boolean; onClose: () => void; title: string; description?: ReactNode; children: ReactNode; footer?: ReactNode; hideTitle?: boolean }

export function Modal({ open, onClose, title, description, children, footer, size = 'md', dismissible = true, tone }: BaseProps & { size?: 'sm' | 'md' | 'lg'; dismissible?: boolean; tone?: 'danger' }) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId(); const descId = useId()
  useDialogBehaviour(open, () => dismissible && onClose(), ref)
  if (!open) return null
  const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[size]
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-[var(--color-bg-overlay)]" onClick={() => dismissible && onClose()} aria-hidden />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descId : undefined} tabIndex={-1} data-ds="Modal"
        className={cn('relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-elevated shadow-lg outline-none animate-slide-up sm:rounded-2xl sm:animate-pop', width)}>
        <div className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
          {tone === 'danger' && <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-critical-bg text-critical-fg"><AlertTriangle className="h-4 w-4" aria-hidden /></span>}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-title-3">{title}</h2>
            {description && <p id={descId} className="mt-1 text-body text-ink-secondary">{description}</p>}
          </div>
          {dismissible && <IconButton label="Close dialog" size="sm" onClick={onClose}><X className="h-4 w-4" /></IconButton>}
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-line bg-sunken/40 px-5 py-3 sm:flex-row sm:justify-end sm:px-6">{footer}</div>}
      </div>
    </div>, document.body)
}

/** ConfirmDialog — required for anything destructive or that changes data on someone’s behalf. */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger, loading, children }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; description?: ReactNode; confirmLabel?: string; cancelLabel?: string; danger?: boolean; loading?: boolean; children?: ReactNode }) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm" tone={danger ? 'danger' : undefined}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </>}>
      {children ?? <span className="sr-only">Confirm to continue</span>}
    </Modal>
  )
}

/** Drawer — right-hand panel on ≥ md, bottom sheet on mobile. */
export function Drawer({ open, onClose, title, description, children, footer, width = 'md' }: BaseProps & { width?: 'md' | 'lg' }) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useDialogBehaviour(open, onClose, ref)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 animate-fade-in bg-[var(--color-bg-overlay)]" onClick={onClose} aria-hidden />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} data-ds="Drawer"
        className={cn('absolute flex flex-col bg-elevated shadow-lg outline-none',
          'inset-x-0 bottom-0 max-h-[88vh] rounded-t-2xl animate-slide-up',
          'md:inset-y-3 md:left-auto md:right-3 md:max-h-none md:w-[var(--drawer-width)] md:max-w-full md:rounded-2xl md:animate-slide-in-right',
          width === 'lg' && 'md:w-[40rem]')}>
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-line-strong md:hidden" aria-hidden />
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-title-3">{title}</h2>
            {description && <p className="mt-1 text-body-sm text-ink-secondary">{description}</p>}
          </div>
          <IconButton label="Close panel" size="sm" onClick={onClose}><X className="h-4 w-4" /></IconButton>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>, document.body)
}
