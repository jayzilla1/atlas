import { AlertTriangle, HeartPulse, Pill, ShieldCheck, Users } from 'lucide-react'
import { Drawer } from '@/components/ui/Dialog'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { DiaperBadge } from './Status'
import { useData } from '@/state/store'
import { useSession } from '@/state/session'
import { childName } from '@/domain/people'
import { fmtAge, fmtTime } from '@/utils/dates'

/**
 * The CARE CARD is the "minimum needed to look after this child safely": allergies, medications,
 * who may pick them up. Employees see this instead of the full record — no address, no payment or
 * contract information. Least-privilege by design: enough to care, nothing more.
 */
export function CareCardDrawer({ childId, onClose }: { childId: string; onClose: () => void }) {
  const d = useData()
  const { today } = useSession()
  const c = d.children.find((x) => x.id === childId)
  if (!c) return null
  const none = <span className="text-ink-secondary">None reported</span>
  return (
    <Drawer open onClose={onClose} title="Care card" description="What you need to care for this child safely.">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar first={c.firstName} last={c.lastName} tint={c.tint} size="lg" />
          <div>
            <p className="text-h3">{childName(c)}</p>
            <p className="text-small text-ink-secondary">{fmtAge(c.dob, today, 'long')} · expected {fmtTime(c.schedule.arrival)}–{fmtTime(c.schedule.departure)}</p>
          </div>
        </div>

        <section aria-labelledby="cc-allergy">
          <h3 id="cc-allergy" className="mb-2 flex items-center gap-2 text-small font-bold"><AlertTriangle className="h-4 w-4 text-danger" aria-hidden />Allergies</h3>
          {c.allergies.length ? <div className="flex flex-wrap gap-2">{c.allergies.map((a) => <Badge key={a} tone="danger" icon={<AlertTriangle />}>{a}</Badge>)}</div> : none}
        </section>
        <section aria-labelledby="cc-med">
          <h3 id="cc-med" className="mb-2 flex items-center gap-2 text-small font-bold"><Pill className="h-4 w-4 text-ink-secondary" aria-hidden />Medications</h3>
          {c.medications.length ? <ul className="list-disc pl-5 text-body">{c.medications.map((m) => <li key={m}>{m}</li>)}</ul> : none}
        </section>
        <section aria-labelledby="cc-health">
          <h3 id="cc-health" className="mb-2 flex items-center gap-2 text-small font-bold"><HeartPulse className="h-4 w-4 text-ink-secondary" aria-hidden />Health notes</h3>
          <p>{c.healthNotes ?? none}</p>
        </section>
        <section aria-labelledby="cc-pick">
          <h3 id="cc-pick" className="mb-2 flex items-center gap-2 text-small font-bold"><Users className="h-4 w-4 text-ink-secondary" aria-hidden />Authorized for pickup</h3>
          <ul className="list-disc pl-5">{c.authorizedPickup.map((p) => <li key={p}>{p}</li>)}</ul>
        </section>
        {c.diaper && (
          <section aria-labelledby="cc-diaper"><h3 id="cc-diaper" className="mb-2 text-small font-bold">Diapers</h3><DiaperBadge status={c.diaper.status} notified={!!c.diaper.notified} /></section>
        )}
        {c.notes && <section aria-labelledby="cc-notes"><h3 id="cc-notes" className="mb-2 text-small font-bold">Notes</h3><p>{c.notes}</p></section>}
        <p className="flex items-start gap-2 rounded-md bg-neutral-bg px-3 py-2.5 text-caption text-neutral-text"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Addresses, family contact details and documents are only visible to the owner.</p>
      </div>
    </Drawer>
  )
}
