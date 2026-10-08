import type { AppData, ISODate, Payment, PaymentStatus } from '@/types'

export const paymentStatus = (p: Payment, today: ISODate): PaymentStatus => (p.paidOn ? 'paid' : p.dueDate < today ? 'overdue' : 'due')
export const PAYMENT_LABEL: Record<PaymentStatus, string> = { paid: 'Paid', due: 'Due', overdue: 'Overdue' }

export function paymentSummary(rows: Payment[], today: ISODate) {
  const by = (s: PaymentStatus) => rows.filter((p) => paymentStatus(p, today) === s)
  const sum = (ps: Payment[]) => ps.reduce((t, p) => t + p.amount, 0)
  return {
    enrolled: rows.length, paid: by('paid').length, due: by('due').length, overdue: by('overdue').length,
    collected: sum(by('paid')), outstanding: sum(by('due')) + sum(by('overdue')),
  }
}
export const paymentsForWeek = (d: AppData, weekStart: ISODate) => d.payments.filter((p) => p.weekStart === weekStart)
/** Everything unpaid, any week — the follow-up list. */
export const unpaid = (d: AppData) => d.payments.filter((p) => !p.paidOn)
