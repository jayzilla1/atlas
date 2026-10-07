import type { ReactNode } from 'react'
import { Sparkles, User, Cog } from 'lucide-react'
import { cn } from '@/utils/cn'
import { timeAgoFromISO } from '@/utils/dates'

export interface TimelineItem { id: string; at: string; actor: string; text: ReactNode; kind?: 'ai' | 'human' | 'system' }
/** Timeline — activity history. Icon distinguishes who acted (AI / person / system) without relying on colour. */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn('relative space-y-4', className)} data-ds="Timeline">
      {items.map((it, i) => {
        const Icon = it.kind === 'ai' ? Sparkles : it.kind === 'system' ? Cog : User
        return (
          <li key={it.id} className="relative flex gap-3">
            {i < items.length - 1 && <span className="absolute left-[0.8125rem] top-7 h-[calc(100%-0.5rem)] w-px bg-line" aria-hidden />}
            <span className={cn('relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border', it.kind === 'ai' ? 'border-ai-border bg-ai-subtle text-ai' : 'border-line bg-sunken text-ink-secondary')}>
              <Icon className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">{it.kind === 'ai' ? 'Atlas AI' : it.kind === 'system' ? 'System' : 'Person'}</span>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-body"><span className="font-semibold">{it.actor}</span> <span className="text-ink-secondary">{it.text}</span></p>
              <p className="mt-0.5 text-caption text-ink-tertiary"><time dateTime={it.at}>{timeAgoFromISO(it.at)}</time></p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
