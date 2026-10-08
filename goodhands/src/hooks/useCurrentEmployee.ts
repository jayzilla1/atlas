import { useData } from '@/state/store'
import { useSession } from '@/state/session'

/** The signed-in employee (staff view only). Falls back to the first employee so the demo never breaks. */
export function useCurrentEmployee() {
  const d = useData()
  const { session } = useSession()
  return d.employees.find((e) => e.id === session.employeeId) ?? d.employees[0]
}
