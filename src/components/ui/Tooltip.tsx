import { cloneElement, useCallback, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { HelpCircle } from 'lucide-react'
import { useFloating } from '@/hooks/useFloating'
import { glossaryById } from '@/data/glossary'
import { cn } from '@/utils/cn'

/**
 * Tooltip — WCAG 1.4.13 compliant: appears on hover AND keyboard focus, stays
 * visible while hovered, dismissible with Esc. Content is linked to the trigger
 * with aria-describedby. Don't put essential information only in a tooltip.
 */
export function Tooltip({ content, children, placement = 'top', delay = 250 }: { content: ReactNode; children: ReactElement<Record<string, unknown>>; placement?: 'top' | 'bottom'; delay?: number }) {
  const id = useId()
  const anchorRef = useRef<HTMLElement | null>(null)
  const popRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const timer = useRef<number>(0)
  const show = useCallback(() => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setOpen(true), delay) }, [delay])
  const hide = useCallback(() => { window.clearTimeout(timer.current); setOpen(false) }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') hide() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, hide])
  const pos = useFloating(anchorRef, popRef, open, placement === 'top' ? 'top' : 'bottom', 6)
  const child = children
  const merged = cloneElement(child, {
    ref: (el: HTMLElement | null) => { anchorRef.current = el; const r = (child as unknown as { ref?: unknown }).ref; if (typeof r === 'function') r(el) },
    'aria-describedby': id,
    onMouseEnter: (e: unknown) => { show(); (child.props.onMouseEnter as ((e: unknown) => void) | undefined)?.(e) },
    onMouseLeave: (e: unknown) => { hide(); (child.props.onMouseLeave as ((e: unknown) => void) | undefined)?.(e) },
    onFocus: (e: unknown) => { show(); (child.props.onFocus as ((e: unknown) => void) | undefined)?.(e) },
    onBlur: (e: unknown) => { hide(); (child.props.onBlur as ((e: unknown) => void) | undefined)?.(e) },
  })
  return (
    <>
      {merged}
      {open && createPortal(
        <div ref={popRef} id={id} role="tooltip" data-ds="Tooltip"
          style={{ position: 'fixed', top: pos?.top ?? -999, left: pos?.left ?? -999, opacity: pos ? 1 : 0 }}
          onMouseEnter={show} onMouseLeave={hide}
          className="pointer-events-auto z-[90] max-w-[18rem] rounded-md bg-ink px-2.5 py-1.5 text-caption font-medium text-ink-inverse shadow-lg animate-fade-in">
          {content}
        </div>, document.body)}
      {/* Keep an always-present description for screen readers when hidden */}
      {!open && <span id={id} className="sr-only">{typeof content === 'string' ? content : ''}</span>}
    </>
  )
}

/**
 * Term — wraps jargon with a plain-English definition from the glossary.
 * <Term id="mfa">MFA</Term> renders dotted-underlined text; hover/focus shows the meaning.
 */
export function Term({ id, children, icon = false }: { id: string; children?: ReactNode; icon?: boolean }) {
  const entry = glossaryById[id]
  if (!entry) return <>{children}</>
  return (
    <Tooltip content={<span><strong className="font-semibold">{entry.term}.</strong> {entry.short}</span>} placement="top">
      <span tabIndex={0} data-ds="Term" data-ds-variant={id}
        className={cn('cursor-help rounded-xs underline decoration-ink-tertiary decoration-dotted underline-offset-[3px] hover:decoration-ink', icon && 'inline-flex items-center gap-1')}>
        {children ?? entry.term}
        {icon && <HelpCircle className="h-3.5 w-3.5 text-ink-tertiary" aria-hidden />}
      </span>
    </Tooltip>
  )
}
