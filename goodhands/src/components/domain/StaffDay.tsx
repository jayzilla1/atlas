import type { ShiftTask } from '@/types'
import { Timeline, TimelineItem, type TimelineState } from '@/components/ui/Timeline'
import { TaskItem } from '@/components/ui/Checklist'
import { useActions } from '@/state/store'
import { useSession } from '@/state/session'
import { taskState } from '@/domain/tasks'
import { fmtTime } from '@/utils/dates'
import { useNavigate } from 'react-router-dom'

/** A chronological "My Day": time on the left, a line through the day, one clear Complete action per task. */
export function StaffDay({ tasks, readOnly }: { tasks: ShiftTask[]; readOnly?: boolean }) {
  const act = useActions()
  const nav = useNavigate()
  const { now } = useSession()
  const firstUpcoming = tasks.findIndex((t) => taskState(t, now) !== 'completed')
  return (
    <Timeline label="Tasks in time order">
      {tasks.map((t, i) => {
        const st = taskState(t, now)
        const tl: TimelineState = st === 'completed' ? 'done' : st === 'overdue' ? 'overdue' : i === firstUpcoming ? 'now' : 'upcoming'
        return (
          <TimelineItem key={t.id} state={tl} time={fmtTime(t.time)} last={i === tasks.length - 1}>
            <TaskItem
              title={t.title} time={t.time} notes={t.notes} state={st} completedAt={t.completedAt} readOnly={readOnly} kind={t.source === 'closeout' ? 'closeout' : undefined}
              onComplete={() => (t.source === 'closeout' ? nav('/closeout') : act.completeTask(t.id, now.time))}
              onUndo={() => act.uncompleteTask(t.id)}
            />
          </TimelineItem>
        )
      })}
    </Timeline>
  )
}
