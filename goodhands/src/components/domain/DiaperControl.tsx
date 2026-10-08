import { BellRing, PackageCheck } from 'lucide-react'
import type { Child } from '@/types'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Toast'
import { DiaperBadge } from './Status'
import { useActions } from '@/state/store'
import { useSession } from '@/state/session'
import { useDialogs } from '@/state/dialogs'
import { fmtTime } from '@/utils/dates'
import type { DiaperLevel } from '@/types'

/**
 * Diaper supply for one child. Marking "Running low" instantly creates the next action
 * (Notify parent) — so low diapers can't live only in someone's head.
 */
export function DiaperControl({ child }: { child: Child }) {
  const act = useActions()
  const dialogs = useDialogs()
  const toast = useToast()
  const { now } = useSession()
  const dp = child.diaper
  if (!dp) return <p className="text-small text-ink-secondary">{child.firstName} isn’t in diapers, so supply tracking doesn’t apply.</p>
  const set = (s: DiaperLevel) => { if (s !== dp.status) { act.setDiaper(child.id, s, now.date); if (s !== 'good') toast({ title: `${child.firstName}’s diapers marked ${s === 'low' ? 'running low' : 'out'}`, description: 'Next step: notify the parent.', tone: 'info' }) } }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3"><DiaperBadge status={dp.status} notified={!!dp.notified} /></div>
      <Segmented<DiaperLevel> label={`${child.firstName}’s diaper supply`} value={dp.status} onChange={set} items={[{ id: 'good', label: 'Good' }, { id: 'low', label: 'Running low' }, { id: 'out', label: 'Out' }]} />
      {dp.status !== 'good' && (
        <div className="rounded-lg border border-line bg-surface-muted p-4">
          <p className="font-semibold">{child.firstName}’s diapers {dp.status === 'out' ? 'are out' : 'are running low'}.</p>
          {dp.notified ? (
            <>
              <p className="mt-1 flex items-center gap-2 text-small text-info-text"><BellRing className="h-4 w-4" aria-hidden />Parent notified · {dp.notified.date === now.date ? 'Today' : dp.notified.date}, {fmtTime(dp.notified.time)} (by {dp.notified.by})</p>
              <Button className="mt-3" icon={<PackageCheck className="h-4 w-4" />} onClick={() => { act.setDiaper(child.id, 'good', now.date); toast({ title: `${child.firstName}’s diapers restocked`, description: 'Marked as good.' }) }}>Diapers received — mark as good</Button>
            </>
          ) : (
            <><p className="mt-1 text-small text-ink-secondary">The family hasn’t been told yet.</p><Button className="mt-3" variant="primary" icon={<BellRing className="h-4 w-4" />} onClick={() => dialogs.notifyParent(child.id)}>Notify parent</Button></>
          )}
        </div>
      )}
    </div>
  )
}
