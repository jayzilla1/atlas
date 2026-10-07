import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface Crumb { label: string; to?: string }
export function Breadcrumbs({ items, label = 'Breadcrumb' }: { items: Crumb[]; label?: string }) {
  return (
    <nav aria-label={label} data-ds="Breadcrumbs">
      <ol className="flex flex-wrap items-center gap-1 text-body-sm text-ink-secondary">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            {c.to && i < items.length - 1 ? <Link to={c.to} className="rounded-sm hover:text-ink hover:underline">{c.label}</Link> : <span aria-current={i === items.length - 1 ? 'page' : undefined} className={cn(i === items.length - 1 && 'font-medium text-ink')}>{c.label}</span>}
            {i < items.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-ink-tertiary" aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** PageHeader — every page starts the same way: breadcrumb → h1 → plain-English purpose → actions. */
export function PageHeader({ title, description, actions, breadcrumbs, meta, eyebrow }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; breadcrumbs?: Crumb[]; meta?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <header data-ds="PageHeader" className="mb-6">
      {breadcrumbs && <div className="mb-3"><Breadcrumbs items={breadcrumbs} /></div>}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 max-w-3xl">
          {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
          <h1 className="text-title-1">{title}</h1>
          {description && <p className="mt-1.5 text-body-lg text-ink-secondary">{description}</p>}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
