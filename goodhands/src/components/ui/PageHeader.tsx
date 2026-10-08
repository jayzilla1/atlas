import type { ReactNode } from 'react'

/** Top of every screen: the one h1, a one-line description, and the screen's primary actions. */
export function PageHeader({ title, description, actions, eyebrow, breadcrumbs }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; breadcrumbs?: ReactNode }) {
  return (
    <header className="mb-6">
      {breadcrumbs}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          {eyebrow && <p className="mb-1 text-small font-semibold text-ink-secondary">{eyebrow}</p>}
          <h1 className="text-h2 sm:text-h1">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-body text-ink-secondary">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
