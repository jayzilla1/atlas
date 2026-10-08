import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

export function Pagination({ page, pageSize, total, onPage, noun = 'items' }: { page: number; pageSize: number; total: number; onPage: (p: number) => void; noun?: string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  if (total <= pageSize) return null
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-4">
      <p className="text-small text-ink-secondary" aria-live="polite">Showing {from}–{to} of {total} {noun}</p>
      <div className="flex items-center gap-2">
        <Button size="sm" icon={<ChevronLeft className="h-4 w-4" />} disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <span className="text-small tabular-nums text-ink-secondary" aria-current="page">Page {page} of {pages}</span>
        <Button size="sm" iconAfter={<ChevronRight className="h-4 w-4" />} disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </nav>
  )
}
