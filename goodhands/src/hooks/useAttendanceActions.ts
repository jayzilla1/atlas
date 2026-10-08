import { useToast } from '@/components/ui/Toast'
import { useActions } from '@/state/store'
import { useSession } from '@/state/session'
import { useDialogs } from '@/state/dialogs'
import type { Child, ISODate } from '@/types'
import { fmtTime } from '@/utils/dates'

/**
 * Everything you can do to a child's attendance, each with a confirmation toast and an Undo.
 * Undo-instead-of-"Are you sure?" keeps check-in fast (one tap) while still being forgiving.
 */
export function useAttendanceActions() {
  const act = useActions()
  const toast = useToast()
  const dialogs = useDialogs()
  const { now } = useSession()
  return {
    checkIn(child: Child, date: ISODate, wasAway?: boolean) {
      act.checkIn(child.id, date, now.time)
      toast({ title: `${child.firstName} checked in`, description: fmtTime(now.time), action: { label: 'Undo', onClick: () => act.undoCheckIn(child.id, date) } })
      void wasAway
    },
    checkOut(child: Child, date: ISODate) {
      act.checkOut(child.id, date, now.time)
      const needsDiapers = child.diaper && child.diaper.status !== 'good' && !child.diaper.notified
      if (needsDiapers) {
        toast({ title: `${child.firstName} checked out · ${fmtTime(now.time)}`, description: `Diapers are ${child.diaper!.status === 'out' ? 'out' : 'running low'}. Pickup is a good moment to mention it.`, action: { label: 'Notify parent', onClick: () => dialogs.notifyParent(child.id) } })
      } else {
        toast({ title: `${child.firstName} checked out`, description: fmtTime(now.time), action: { label: 'Undo', onClick: () => act.undoCheckOut(child.id, date) } })
      }
    },
    undoCheckIn(child: Child, date: ISODate) { act.undoCheckIn(child.id, date); toast({ title: `${child.firstName}’s check-in removed`, tone: 'info' }) },
    undoCheckOut(child: Child, date: ISODate) { act.undoCheckOut(child.id, date); toast({ title: `${child.firstName} is back to Present`, tone: 'info' }) },
    clearAway(child: Child, date: ISODate, restore: () => void) {
      act.removeAbsenceDay(child.id, date)
      toast({ title: `${child.firstName} is expected again`, tone: 'info', action: { label: 'Undo', onClick: restore } })
    },
  }
}
