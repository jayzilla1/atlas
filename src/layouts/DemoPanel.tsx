import { Drawer } from '@/components/ui/Overlay'
import { Toggle, RadioGroup, Radio } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Callout } from '@/components/ui/Card'
import { useStore } from '@/state/store'
import { useUi } from './UiContext'
import { ROLE_DESCRIPTION, ROLE_LABEL, type Role } from '@/state/permissions'
import { useToast } from '@/components/ui/Toast'
import { useNavigate } from 'react-router-dom'

/** DemoPanel — reviewer controls for exploring states that are hard to reach in a happy path. */
export function DemoPanel() {
  const ui = useUi(); const s = useStore(); const toast = useToast(); const nav = useNavigate()
  return (
    <Drawer open={ui.demoOpen} onClose={() => ui.setDemoOpen(false)} title="Demo controls" description="Not part of the product — these help you review states that are hard to reach otherwise.">
      <div className="space-y-6">
        <RadioGroup legend="View as (permissions)" value={s.role} onChange={(v) => s.setRole(v as Role)}>
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <Radio key={r} value={r} label={ROLE_LABEL[r]} description={ROLE_DESCRIPTION[r]} />)}
        </RadioGroup>
        <RadioGroup legend="Theme" value={s.theme} onChange={(v) => s.setTheme(v as 'system' | 'light' | 'dark')} orientation="horizontal">
          <Radio value="system" label="System" /><Radio value="light" label="Light" /><Radio value="dark" label="Dark" />
        </RadioGroup>
        <fieldset className="space-y-4">
          <legend className="mb-2 text-body-sm font-medium">Simulate</legend>
          <Toggle checked={s.demo.failNextLoad} onChange={(v) => s.setDemo({ failNextLoad: v })} label="Fail the next page load" description="Open Risks, Tasks, People, Applications, Vendors or Policies to see the error state, then press “Try again”." />
          <Toggle checked={s.demo.slowLoads} onChange={(v) => s.setDemo({ slowLoads: v })} label="Slow loading" description="Holds skeleton screens for ~2.5 seconds." />
          <Toggle checked={s.demo.aiOutage} onChange={(v) => s.setDemo({ aiOutage: v })} label="Atlas AI outage" description="New questions fail with a recoverable error." />
        </fieldset>
        <Toggle checked={s.inspect} onChange={s.setInspect} label="Portfolio inspector" description="Hover any component to see its name, variant, tokens and computed styles." />
        <Callout tone="neutral" title="Start over">
          Resets tasks, risks, reviews and activity to the original sample data.
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => { s.reset(); toast({ title: 'Demo data reset' }) }}>Reset demo data</Button>
            <Button size="sm" onClick={() => { ui.setDemoOpen(false); nav('/design-system') }}>Open Design System</Button>
          </div>
        </Callout>
      </div>
    </Drawer>
  )
}
