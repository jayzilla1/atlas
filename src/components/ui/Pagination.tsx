import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

function pageList(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  const s = Math.max(2, page - 1); const e = Math.min(total - 1, page + 1)
  if (s > 2) out.push('…')
  for (let i = s; i <= e; i++) out.push(i)
  if (e < total - 1) out.push('…')
  out.push(total)
  return out
}

export function Pagination({ page, pageSize, total, onPage, noun = 'results', label = 'Pagination' }: { label?: string; page: number; pageSize: number; total: number; onPage: (p: number) => void; noun?: string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null
  const from = (page - 1) * pageSize + 1; const to = Math.min(total, page * pageSize)
  const btn = 'flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-body-sm font-medium tabular-nums transition-colors duration-fast focus-visible:shadow-focus'
  return (
    <nav aria-label={label} data-ds="Pagination" className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row">
      <p className="text-body-sm text-ink-secondary" aria-live="polite">Showing <span className="font-medium text-ink">{from}–{to}</span> of {total} {noun}</p>
      <ul className="flex items-center gap-1">
        <li><button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => onPage(page - 1)} className={cn(btn, 'text-ink-secondary hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-40')}><ChevronLeft className="h-4 w-4" aria-hidden /></button></li>
        {pageList(page, pages).map((p, i) => (
          <li key={i} className={cn(typeof p === 'number' && 'hidden sm:block')}>
            {p === '…' ? <span className="px-1 text-ink-tertiary" aria-hidden>…</span>
              : <button type="button" aria-label={`Page ${p}`} aria-current={p === page ? 'page' : undefined} onClick={() => onPage(p)} className={cn(btn, p === page ? 'bg-action text-action-on' : 'text-ink-secondary hover:bg-sunken')}>{p}</button>}
          </li>
        ))}
        <li className="px-2 text-body-sm text-ink-secondary sm:hidden">Page {page} of {pages}</li>
        <li><button type="button" aria-label="Next page" disabled={page === pages} onClick={() => onPage(page + 1)} className={cn(btn, 'text-ink-secondary hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-40')}><ChevronRight className="h-4 w-4" aria-hidden /></button></li>
      </ul>
    </nav>
  )
}
