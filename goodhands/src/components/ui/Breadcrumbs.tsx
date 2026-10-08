import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function Breadcrumbs({ items }: { items: Array<{ label: string; to?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex flex-wrap items-center gap-1 text-small text-ink-secondary">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-ink-tertiary" aria-hidden />}
            {it.to ? <Link to={it.to} className="rounded px-1 font-medium underline-offset-2 hover:text-ink hover:underline">{it.label}</Link> : <span aria-current="page" className="px-1 font-semibold text-ink">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
