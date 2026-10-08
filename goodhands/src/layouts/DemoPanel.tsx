import { RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Drawer } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { RadioGroup, Toggle } from '@/components/ui/Form'
import { useToast } from '@/components/ui/Toast'
import { useSession } from '@/state/session'
import { useActions, useData } from '@/state/store'
import { addDays } from '@/utils/dates'
import { DEMO_TODAY } from '@/data/clock'

/**
 * Not part of the product — a control panel for the portfolio demo. It lets a reviewer see states that
 * would otherwise take a real day to reach: 7:30 AM, end of day, tomorrow morning, errors, other roles.
 */
export function DemoPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session, setSession, jumpTo, demo, setDemo, now } = useSession()
  const d = useData()
  const act = useActions()
  const nav = useNavigate()
  const toast = useToast()
  const persona = session.role === 'owner' ? 'owner' : session.employeeId ?? 'maria'

  const times: Array<{ label: string; date: string; time: string; hint: string }> = [
    { label: '7:30 AM', date: DEMO_TODAY, time: '07:30', hint: 'Opening — who’s expected?' },
    { label: '10:12 AM', date: DEMO_TODAY, time: '10:12', hint: 'The default mid-morning view' },
    { label: '4:45 PM', date: DEMO_TODAY, time: '16:45', hint: 'End of day — closeout time' },
    { label: 'Tomorrow, 7:30 AM', date: addDays(DEMO_TODAY, 1), time: '07:30', hint: 'A fresh attendance day; Blanket Day is next' },
  ]
  return (
    <Drawer open={open} onClose={onClose} title="Demo controls" description="For reviewing the prototype. These aren’t part of the product.">
      <div className="space-y-7">
        <RadioGroup
          legend="Viewing as" value={persona}
          onChange={(v) => { if (v === 'owner') { setSession({ role: 'owner' }); nav('/') } else { setSession({ role: 'staff', employeeId: v }); nav('/today') } onClose() }}
          options={[{ value: 'owner', label: `${d.settings.ownerName} — Owner`, description: 'Full access' }, ...d.employees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName} — ${e.role}`, description: 'Employee view: simplified, limited permissions' }))]}
        />
        <div>
          <h3 className="mb-1 text-small font-semibold">Time travel</h3>
          <p className="mb-3 text-caption text-ink-secondary">Now: {now.date} · {now.time}. The clock keeps running after a jump.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {times.map((t) => (
              <Button key={t.label} onClick={() => { jumpTo(t.date, t.time); toast({ title: `Jumped to ${t.label}`, tone: 'info' }) }} className="h-auto flex-col items-start py-2.5 text-left" variant="secondary">
                <span>{t.label}</span><span className="text-caption font-normal text-ink-secondary">{t.hint}</span>
              </Button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-1 text-small font-semibold">Simulate states</h3>
          <Toggle checked={demo.forceLoadError} onChange={(v) => setDemo({ forceLoadError: v })} label="Screens fail to load" description="Shows the error state with “Try again” on the next screen you open." />
          <Toggle checked={demo.aiOutage} onChange={(v) => setDemo({ aiOutage: v })} label="Assistant is unavailable" description="Shows how the assistant behaves when it can’t answer." />
        </div>
        <div>
          <h3 className="mb-2 text-small font-semibold">Reset</h3>
          <Button icon={<RotateCcw className="h-4 w-4" />} onClick={() => { act.resetDemo(); toast({ title: 'Demo data reset', tone: 'info' }) }}>Reset all demo data</Button>
        </div>
      </div>
    </Drawer>
  )
}
