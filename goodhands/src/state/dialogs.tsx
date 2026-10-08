import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { ISODate } from '@/types'
import { NotifyParentDialog } from '@/components/dialogs/NotifyParentDialog'
import { MarkAbsentDialog } from '@/components/dialogs/MarkAbsentDialog'
import { AttendanceEditDrawer } from '@/components/dialogs/AttendanceEditDrawer'
import { PaymentDrawer } from '@/components/dialogs/PaymentDrawer'
import { CareCardDrawer } from '@/components/domain/CareCard'

/**
 * DIALOG HOST. Several screens can start the same workflow ("Notify parent" appears on Home, in a
 * child's profile, in the Tasks area and in the assistant). Instead of copying the dialog into each
 * screen, they all ask this one host to open it — so the workflow is identical everywhere.
 */
type Open =
  | { kind: 'notify'; childId: string }
  | { kind: 'absent'; childId: string; date: ISODate }
  | { kind: 'attendance'; childId: string; date: ISODate }
  | { kind: 'payment'; paymentId: string }
  | { kind: 'care'; childId: string }
  | null

interface DialogApi {
  notifyParent: (childId: string) => void
  markAway: (childId: string, date: ISODate) => void
  editAttendance: (childId: string, date: ISODate) => void
  editPayment: (paymentId: string) => void
  careCard: (childId: string) => void
}
const Ctx = createContext<DialogApi | null>(null)
export const useDialogs = () => { const v = useContext(Ctx); if (!v) throw new Error('useDialogs must be used inside <DialogHost>'); return v }

export function DialogHost({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open>(null)
  const api = useMemo<DialogApi>(() => ({
    notifyParent: (childId) => setOpen({ kind: 'notify', childId }),
    markAway: (childId, date) => setOpen({ kind: 'absent', childId, date }),
    editAttendance: (childId, date) => setOpen({ kind: 'attendance', childId, date }),
    editPayment: (paymentId) => setOpen({ kind: 'payment', paymentId }),
    careCard: (childId) => setOpen({ kind: 'care', childId }),
  }), [])
  const close = () => setOpen(null)
  return (
    <Ctx.Provider value={api}>
      {children}
      {open?.kind === 'notify' && <NotifyParentDialog childId={open.childId} onClose={close} />}
      {open?.kind === 'absent' && <MarkAbsentDialog childId={open.childId} date={open.date} onClose={close} />}
      {open?.kind === 'attendance' && <AttendanceEditDrawer childId={open.childId} date={open.date} onClose={close} />}
      {open?.kind === 'care' && <CareCardDrawer childId={open.childId} onClose={close} />}
      {open?.kind === 'payment' && <PaymentDrawer paymentId={open.paymentId} onClose={close} />}
    </Ctx.Provider>
  )
}
