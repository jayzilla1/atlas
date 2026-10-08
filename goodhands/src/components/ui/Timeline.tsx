import type { ReactNode } from 'react'
import { Check, TriangleAlert } from 'lucide-react'
import { cn } from '@/utils/cn'

export type TimelineState = 'done' | 'overdue' | 'upcoming' | 'now'
/**
 * A vertical line of moments in the day. Each node is an icon + position — state is also in the text
 * beside it ("Completed 10:07 AM", "Overdue"), so colour is never the only signal.
 */
export function Timeline({ children, label }: { children: ReactNode; label: string }) {
  return <ol aria-label={label} className="relative">{children}</ol>
}
export function TimelineItem({ state, time, children, last }: { state: TimelineState; time: string; children: ReactNode; last?: boolean }) {
  return (
    <li className="relative flex gap-3 sm:gap-4">
      <div className="flex w-14 shrink-0 flex-col items-end pt-3 sm:w-[4.5rem]">
        <time className={cn('text-small font-semibold tabular-nums', state === 'done' ? 'text-ink-tertiary' : 'text-ink')}>{time}</time>
      </div>
      <div className="relative flex flex-col items-center">
        <span aria-hidden className={cn('z-10 mt-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-surface transition-colors duration-base',
          state === 'done' && 'border-success bg-success text-white', state === 'overdue' && 'border-warning bg-warning-bg text-warning-text',
          state === 'upcoming' && 'border-line-strong', state === 'now' && 'border-primary')}>
          {state === 'done' && <Check className="h-3.5 w-3.5 anim-pop" strokeWidth={3.5} />}
          {state === 'overdue' && <TriangleAlert className="h-3.5 w-3.5" />}
          {state === 'now' && <span className="h-2 w-2 rounded-full bg-primary" />}
        </span>
        {!last && <span aria-hidden className="w-0.5 flex-1 bg-line" />}
      </div>
      <div className="min-w-0 flex-1 pb-3">{children}</div>
    </li>
  )
}
