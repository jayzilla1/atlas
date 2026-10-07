import { useState } from 'react'
import { Lock } from 'lucide-react'
import { PageHeader } from '@/components/ui/Page'
import { Card, CardHeader, Callout } from '@/components/ui/Card'
import { Tabs, TabPanel } from '@/components/ui/Tabs'
import { Field, Input, Select, Toggle } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { StatusBadge, Badge } from '@/components/ui/Badge'
import { Term } from '@/components/ui/Tooltip'
import { useToast } from '@/components/ui/Toast'
import { useStore } from '@/state/store'
import { applications } from '@/data/applications'
import { ROLE_DESCRIPTION, ROLE_LABEL, type Role } from '@/state/permissions'
import { usePageTitle } from '@/hooks/usePage'
import { WORKSPACE } from '@/data/insights'

export function SettingsPage() {
  usePageTitle('Settings')
  const s = useStore(); const toast = useToast(); const [tab, setTab] = useState('workspace')
  const perm = s.permission('settings.manage')
  const [name, setName] = useState(WORKSPACE.name); const [cad, setCad] = useState('180')
  const [ai, setAi] = useState({ suggest: true, proactive: true, create: true, sources: true })
  const [notif, setNotif] = useState({ critical: true, digest: true, reminders: false })
  const [err, setErr] = useState('')
  const save = () => { if (name.trim().length < 2) { setErr('Workspace name must be at least 2 characters.'); return } setErr(''); toast({ tone: 'success', title: 'Settings saved' }) }
  const dis = !perm.allowed
  return (
    <>
      <PageHeader title="Settings" description="Workspace, connected apps, notifications and how Atlas AI is allowed to behave." />
      {dis && <Callout className="mb-5" tone="neutral" title="Settings are read-only for your role">{perm.reason} Switch to Admin in Demo controls to edit.</Callout>}
      <Tabs label="Settings sections" value={tab} onChange={setTab} tabs={[{ id: 'workspace', label: 'Workspace' }, { id: 'integrations', label: 'Connected apps', count: applications.filter((a) => a.connection !== 'manual').length }, { id: 'ai', label: 'Atlas AI controls' }, { id: 'notifications', label: 'Notifications' }, { id: 'roles', label: 'Roles & access' }]} />
      {tab === 'workspace' && <TabPanel className="max-w-2xl"><Card><CardHeader title="Workspace" />
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save() }} noValidate>
          <Field label="Workspace name" error={err} success={!err && name !== WORKSPACE.name ? 'Looks good' : undefined} required>{({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} valid={!err && name !== WORKSPACE.name} disabled={dis} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
          <Field label="Industry" hint="Used to suggest relevant policies.">{({ id }) => <Input id={id} disabled value={WORKSPACE.industry} readOnly />}</Field>
          <Field label="Access review frequency" hint="How often each app’s access should be reviewed.">{({ id }) => <Select id={id} disabled={dis} value={cad} onChange={(e) => setCad(e.target.value)} options={[{ value: '90', label: 'Every 90 days' }, { value: '180', label: 'Every 180 days (recommended)' }, { value: '365', label: 'Yearly' }]} />}</Field>
          <div className="flex justify-end"><Button variant="primary" type="submit" disabledReason={dis ? perm.reason : undefined}>Save changes</Button></div>
        </form></Card></TabPanel>}
      {tab === 'integrations' && <TabPanel><Card padded={false}><div className="p-5 pb-3"><CardHeader title="Connected apps" description="Atlas reads user lists and settings from these apps. It never writes without approval." /></div>
        <ul className="divide-y divide-line border-t border-line">{applications.slice(0, 12).map((a) => <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3"><div><p className="text-body font-medium">{a.name}</p><p className="text-caption text-ink-secondary">{a.category} · read-only access</p></div><StatusBadge status={a.connection} /></li>)}</ul>
        <p className="border-t border-line p-4 text-body-sm text-ink-secondary">Showing 12 of {applications.length} connected apps.</p></Card></TabPanel>}
      {tab === 'ai' && <TabPanel className="max-w-2xl space-y-5"><Card><CardHeader title="What Atlas AI may do" description="You stay in control. Turn capabilities off at any time." />
        <div className="space-y-5">
          <Toggle checked={ai.suggest} disabled={dis} onChange={(v) => setAi({ ...ai, suggest: v })} label="Answer questions about my data" description="Atlas reads risks, people, apps, vendors and policies to answer." />
          <Toggle checked={ai.proactive} disabled={dis} onChange={(v) => setAi({ ...ai, proactive: v })} label="Surface insights proactively" description="Show AI insights on the Overview page." />
          <Toggle checked={ai.create} disabled={dis} onChange={(v) => setAi({ ...ai, create: v })} label="Prepare tasks and reviews for approval" description={<>Atlas can draft work, but a person must always <Term id="human-in-the-loop">approve</Term> it.</>} />
          <Toggle checked={ai.sources} disabled onChange={() => {}} label="Always show sources and confidence" description="Required — this can’t be turned off." />
        </div>
        <p className="mt-5 flex items-center gap-1.5 text-body-sm text-ink-secondary"><Lock className="h-4 w-4" aria-hidden />Atlas AI never changes data without approval, regardless of these settings.</p></Card></TabPanel>}
      {tab === 'notifications' && <TabPanel className="max-w-2xl"><Card><CardHeader title="Notifications" />
        <div className="space-y-5"><Toggle checked={notif.critical} onChange={(v) => setNotif({ ...notif, critical: v })} label="Critical risks" description="Email me immediately when a critical risk is found." />
          <Toggle checked={notif.digest} onChange={(v) => setNotif({ ...notif, digest: v })} label="Weekly summary" description="Mondays at 8:00 AM." /><Toggle checked={notif.reminders} onChange={(v) => setNotif({ ...notif, reminders: v })} label="Task reminders" description="Remind me the day before a task is due." /></div></Card></TabPanel>}
      {tab === 'roles' && <TabPanel className="max-w-2xl"><Card><CardHeader title="Roles" description="What each role can do in this workspace." />
        <dl className="divide-y divide-line">{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <div key={r} className="py-3"><dt className="flex items-center gap-2 text-body font-semibold">{ROLE_LABEL[r]}{s.role === r && <Badge tone="info">You</Badge>}</dt><dd className="mt-0.5 text-body text-ink-secondary">{ROLE_DESCRIPTION[r]}</dd></div>)}</dl></Card></TabPanel>}
    </>
  )
}
