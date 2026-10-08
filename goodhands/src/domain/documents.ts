import type { AppData, Child, DocCategory, DocStatus, DocumentRecord, ISODate } from '@/types'
import { daysBetween } from '@/utils/dates'

export function docStatus(doc: DocumentRecord, today: ISODate): DocStatus {
  if (doc.missing) return 'missing'
  if (doc.expiresOn) {
    const left = daysBetween(today, doc.expiresOn)
    if (left < 0) return 'expired'
    if (left <= 30) return 'expiring'
  }
  return 'current'
}
export const DOC_STATUS_LABEL: Record<DocStatus, string> = { current: 'Current', expiring: 'Expiring soon', expired: 'Expired', missing: 'Missing' }
export const CATEGORY_LABEL: Record<DocCategory, string> = {
  health: 'Health form', contract: 'Contract', emergency: 'Emergency form', immunization: 'Immunization record', child_other: 'Other',
  w2: 'W-2', license: 'Driver’s license', employment: 'Employment', employee_other: 'Other',
}
export const CHILD_CATEGORIES: DocCategory[] = ['health', 'contract', 'emergency', 'immunization', 'child_other']
export const EMPLOYEE_CATEGORIES: DocCategory[] = ['w2', 'license', 'employment', 'employee_other']

export interface RecordIssue { text: string; tone: 'danger' | 'warning' }
/** Missing/expired/expiring paperwork for a child — shown as a quiet indicator, not a Home alert. */
export function childIssues(d: AppData, child: Child, today: ISODate): RecordIssue[] {
  const out: RecordIssue[] = []
  if (!child.emergencyContact) out.push({ text: 'No emergency contact on file', tone: 'danger' })
  if (!child.guardians.length) out.push({ text: 'No parent/guardian on file', tone: 'danger' })
  for (const doc of d.documents.filter((x) => x.ownerType === 'child' && x.ownerId === child.id)) {
    const s = docStatus(doc, today)
    const kind = CATEGORY_LABEL[doc.category].toLowerCase()
    if (s === 'missing') out.push({ text: `${CATEGORY_LABEL[doc.category]} missing`, tone: 'danger' })
    else if (s === 'expired') out.push({ text: `${CATEGORY_LABEL[doc.category]} expired`, tone: 'danger' })
    else if (s === 'expiring') out.push({ text: `${kind[0].toUpperCase()}${kind.slice(1)} expiring soon`, tone: 'warning' })
  }
  return out
}
