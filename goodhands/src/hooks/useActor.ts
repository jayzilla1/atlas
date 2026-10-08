import { useSession } from '@/state/session'
import { useData } from '@/state/store'

/** Who is doing things right now — recorded as "by Pamela" on notifications, supply updates, etc. */
export function useActor() {
  const { session, role } = useSession()
  const d = useData()
  const employee = role === 'staff' ? d.employees.find((e) => e.id === session.employeeId) : undefined
  return { role, employee, name: role === 'owner' ? d.settings.ownerName.split(' ')[0] : employee?.firstName ?? 'Staff' }
}
