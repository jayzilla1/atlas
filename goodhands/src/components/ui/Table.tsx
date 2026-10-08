import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

/**
 * Accessible table primitives. A visually-hidden <caption> names the table for screen readers,
 * headers use scope="col", and numbers are right-aligned with tabular figures so they line up.
 */
export function Table({ caption, children, className }: { caption: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-left text-small">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  )
}
export const THead = ({ children }: { children: ReactNode }) => <thead className="border-b border-line bg-surface-muted">{children}</thead>
export const TR = ({ className, ...p }: HTMLAttributes<HTMLTableRowElement>) => <tr className={cn('border-b border-line-subtle last:border-0', className)} {...p} />
export const TH = ({ className, align, ...p }: ThHTMLAttributes<HTMLTableCellElement> & { align?: 'right' }) => (
  <th scope="col" className={cn('whitespace-nowrap px-3 py-2.5 text-caption font-semibold uppercase tracking-wide text-ink-secondary first:pl-4 last:pr-4', align === 'right' && 'text-right', className)} {...p} />
)
export const TD = ({ className, align, ...p }: TdHTMLAttributes<HTMLTableCellElement> & { align?: 'right' }) => (
  <td className={cn('px-3 py-3 align-middle first:pl-4 last:pr-4', align === 'right' && 'text-right tabular-nums', className)} {...p} />
)
