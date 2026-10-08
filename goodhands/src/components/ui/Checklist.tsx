import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'
import { Badge } from './Badge'
import { fmtTime } from '@/utils/dates'

/** The shape of a single task row for staff: time · title · notes · status · one clear action. */
export function TaskItem({ title, time, notes, state, completedAt, onComplete, onUndo, readOnly, kind }: {
  title: string; time: string; notes?: string; state: 'completed' | 'overdue' | 'upcoming'; completedAt?: string
  onComplete?: () => void; onUndo?: () => void; readOnly?: boolean; kind?: 'closeout'
}) {
  const done = state === 'completed'
  return (
    <div className={cn('rounded-lg border bg-surface p-3.5 transition-colors duration-base sm:p-4', done ? 'border-line-subtle bg-surface-muted' : state === 'overdue' ? 'border-warning/50' : 'border-line')}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className={cn('text-body font-semibold transition-colors duration-base', done && 'text-ink-secondary')}>{title}</h3>
            {state === 'overdue' && <Badge tone="warning" size="sm">Overdue</Badge>}
            {kind === 'closeout' && !done && <Badge tone="info" size="sm">End of day</Badge>}
          </div>
          <p className="text-small text-ink-secondary"><span className="tabular-nums">{fmtTime(time)}</span>{notes && <> · {notes}</>}</p>
          {done && (
            <p className="mt-1 flex items-center gap-1.5 text-small font-semibold text-success-text anim-fade-in">
              <Check className="h-4 w-4" aria-hidden strokeWidth={3} /> Completed at {fmtTime(completedAt)}
            </p>
          )}
        </div>
        {!readOnly && (done
          ? <Button variant="ghost" size="sm" onClick={onUndo} aria-label={`Undo: ${title}`}>Undo</Button>
          : <Button variant={state === 'overdue' ? 'primary' : 'secondary'} onClick={onComplete} aria-label={`Complete: ${title}`}>Complete</Button>)}
      </div>
    </div>
  )
}

/** A titled list of checkable items — used for closeout, the weekly supply check and blanket day. */
export function Checklist({ children, label }: { children: ReactNode; label: string }) {
  return <ul aria-label={label} className="divide-y divide-line-subtle rounded-lg border border-line bg-surface px-4">{children}</ul>
}
