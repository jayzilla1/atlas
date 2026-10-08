import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'
import { IconButton } from './Button'

/**
 * Modal + Drawer are built on the browser's native <dialog> element.
 * Plain English: the browser itself traps keyboard focus inside the window, dims the page,
 * makes everything behind it unreachable for screen readers, and closes on Esc. Using the
 * built-in element means those accessibility behaviours are correct by default rather than
 * something we have to re-invent and risk getting wrong.
 */
interface BaseProps { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; footer?: ReactNode }

function useNativeDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const cancel = (e: Event) => { e.preventDefault(); onClose() }
    el.addEventListener('cancel', cancel)
    return () => el.removeEventListener('cancel', cancel)
  }, [onClose])
  return ref
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md', tone }: BaseProps & { size?: 'sm' | 'md' | 'lg'; tone?: 'danger' }) {
  const ref = useNativeDialog(open, onClose)
  const titleId = useId(), descId = useId()
  if (!open) return null
  const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[size]
  return (
    <dialog
      ref={ref} aria-labelledby={titleId} aria-describedby={description ? descId : undefined}
      onMouseDown={(e) => { if (e.target === ref.current) onClose() }}
      className="m-auto w-[calc(100%-1.5rem)] bg-transparent p-0 open:animate-[gh-fade-in_var(--motion-base)_var(--ease-out)]"
    >
      <div className={cn('mx-auto flex max-h-[min(90dvh,48rem)] w-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-lg', width)}>
        <header className="flex items-start justify-between gap-4 border-b border-line-subtle px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className={cn('text-h3', tone === 'danger' && 'text-danger-text')}>{title}</h2>
            {description && <p id={descId} className="mt-1 text-small text-ink-secondary">{description}</p>}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose}><X className="h-4 w-4" /></IconButton>
        </header>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <footer className="flex flex-col-reverse gap-2 border-t border-line-subtle bg-surface-muted px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{footer}</footer>}
      </div>
    </dialog>
  )
}

/** Side panel on desktop, bottom sheet on phones. For "look at / edit this thing without leaving the page". */
export function Drawer({ open, onClose, title, description, children, footer, width = 'md' }: BaseProps & { width?: 'md' | 'lg' }) {
  const ref = useNativeDialog(open, onClose)
  const titleId = useId(), descId = useId()
  if (!open) return null
  return (
    <dialog
      ref={ref} aria-labelledby={titleId} aria-describedby={description ? descId : undefined}
      onMouseDown={(e) => { if (e.target === ref.current) onClose() }}
      className={cn('m-0 mt-auto h-auto max-h-[92dvh] w-full sm:ml-auto sm:h-full sm:max-h-full', width === 'lg' ? 'sm:w-[34rem]' : 'sm:w-[28rem]', 'animate-[gh-slide-up_var(--motion-base)_var(--ease-out)] sm:animate-[gh-slide-in-right_var(--motion-base)_var(--ease-out)]')}
    >
      <div className="flex max-h-[92dvh] w-full flex-col rounded-t-lg border border-line bg-surface shadow-lg sm:h-full sm:max-h-full sm:rounded-none sm:border-y-0 sm:border-r-0">
        <header className="flex items-start justify-between gap-4 border-b border-line-subtle px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-h3">{title}</h2>
            {description && <p id={descId} className="mt-1 text-small text-ink-secondary">{description}</p>}
          </div>
          <IconButton label="Close panel" size="sm" onClick={onClose}><X className="h-4 w-4" /></IconButton>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <footer className="flex flex-col-reverse gap-2 border-t border-line-subtle bg-surface-muted px-5 py-4 pb-safe sm:flex-row sm:justify-end">{footer}</footer>}
      </div>
    </dialog>
  )
}

/** A yes/no question before something that matters. Cancel is the default-focused choice for destructive actions. */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone, children, loading }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; description?: string; confirmLabel?: string; cancelLabel?: string; tone?: 'danger'; children?: ReactNode; loading?: boolean }) {
  return (
    <Modal
      open={open} onClose={onClose} title={title} description={description} size="sm" tone={tone}
      footer={<>
        <Button variant="secondary" onClick={onClose} autoFocus={tone === 'danger'}>{cancelLabel}</Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} autoFocus={tone !== 'danger'}>{confirmLabel}</Button>
      </>}
    >
      {children ?? <span className="sr-only">{description}</span>}
    </Modal>
  )
}
