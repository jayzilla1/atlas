import { ListChecks } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { PageHeader } from '@/components/ui/PageHeader'
import { Progress } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/States'
import { StaffDay } from '@/components/domain/StaffDay'
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee'
import { useData } from '@/state/store'
import { useSession } from '@/state/session'
import { taskProgress, tasksFor } from '@/domain/tasks'
import { fmtLong } from '@/utils/dates'

export default function MyTasks() {
  const e = useCurrentEmployee()
  const d = useData()
  const { now } = useSession()
  const tasks = tasksFor(d, e.id, now.date)
  const p = taskProgress(tasks)
  return (
    <Page id="my-tasks">
      <div className="mx-auto max-w-2xl">
        <PageHeader title="My Day" description={fmtLong(now.date)} />
        {tasks.length === 0 ? <EmptyState icon={<ListChecks />} title="No tasks today" description="You’re not scheduled today, so there’s nothing on your list." /> : (
          <>
            <Progress value={p.done} max={p.total} label="Tasks completed today" tone={p.done === p.total ? 'success' : 'primary'} className="mb-6" />
            <StaffDay tasks={tasks} />
          </>
        )}
      </div>
    </Page>
  )
}
