import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

/** A bordered surface. Used sparingly — most grouping on a page is done with spacing and headings, not boxes. */
export function Card({ as: Tag = 'div', padded = true, className, ...p }: { as?: ElementType; padded?: boolean } & HTMLAttributes<HTMLElement>) {
  return <Tag className={cn('rounded-lg border border-line bg-surface shadow-sm', padded ? 'p-4 sm:p-5' : 'overflow-hidden', className)} {...p} />
}

/** A titled region of a page: heading, optional helper text, optional actions on the right. */
export function Section({ title, description, actions, children, className, headingLevel = 2, id }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; headingLevel?: 2 | 3; id?: string }) {
  const H = `h${headingLevel}` as 'h2' | 'h3'
  return (
    <section aria-labelledby={id} className={cn('min-w-0', className)}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <H id={id} className={cn(headingLevel === 2 ? 'text-h3' : 'text-lead font-semibold')}>{title}</H>
          {description && <p className="text-small text-ink-secondary">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  )
}

/** Label + value pair for profile details. Uses a description list so screen readers announce the pairing. */
export function DetailList({ items, columns = 2 }: { items: Array<{ label: string; value: ReactNode; sensitive?: boolean }>; columns?: 1 | 2 }) {
  return (
    <dl className={cn('grid gap-x-8 gap-y-4', columns === 2 && 'sm:grid-cols-2')}>
      {items.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-caption font-semibold uppercase tracking-wide text-ink-tertiary">{i.label}</dt>
          <dd className="mt-0.5 break-words text-body text-ink">{i.value}</dd>
        </div>
      ))}
    </dl>
  )
}
