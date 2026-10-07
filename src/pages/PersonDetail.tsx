import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, BellRing, CheckCircle2, GraduationCap, KeyRound, Mail, MapPin, Sparkles, UserMinus, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/Page'
import { Card, CardHeader, Callout, DescriptionList, Disclosure } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { RadioGroup, Radio } from '@/components/ui/Form'
import { ConfirmDialog } from '@/components/ui/Overlay'
import { ProgressBar, EmptyState } from '@/components/ui/Feedback'
import { Term } from '@/components/ui/Tooltip'
import { useToast } from '@/components/ui/Toast'
import { PersonLink, EntityChip } from '@/components/domain/entities'
import { PriorityBadge } from '@/components/domain/Badges'
import { useStore, type AccessDecision } from '@/state/store'
import { policies, hasAcknowledged } from '@/data/policies'
import { isOpenRisk } from '@/data/risks'
import { daysFromToday, formatDate, relativeDay, dueLabel } from '@/utils/dates'
import { usePageTitle } from '@/hooks/usePage'
import { NotFoundPage } from './NotFound'
import { cn } from '@/utils/cn'

const ELEVATED = ['Admin', 'Owner']

export function PersonDetailPage() {
  const { id } = useParams(); const s = useStore(); const toast = useToast()
  const person = s.personById(id)
  usePageTitle(person?.name ?? 'Person not found')
  const [reviewing, setReviewing] = useState(false)
  const [decisions, setDecisions] = useState<Record<string, AccessDecision>>({})
  const [confirm, setConfirm] = useState(false); const [revoke, setRevoke] = useState(false); const [busy, setBusy] = useState(false)
  const grants = useMemo(() => (person ? s.grantsForPerson(person.id) : []), [s, person])
  if (!person) return <NotFoundPage what="person" />
  const perm = s.permission('access.review'); const manager = s.personById(person.managerId)
  const reports = s.people.filter((p) => p.managerId === person.id && p.status !== 'former')
  const risks = s.risks.filter((r) => r.related.some((x) => x.type === 'person' && x.id === person.id))
  const tasks = s.tasks.filter((t) => t.entity?.type === 'person' && t.entity.id === person.id && t.status !== 'completed')
  const former = person.status === 'former'
  const stillHasAccess = former && grants.length > 0
  const first = person.name.split(' ')[0]

  // Atlas suggestions: only where it has a reason; every one can be overridden.
  const suggestion = (role: string, lastUsed: number): { action: AccessDecision; why: string } | null => {
    if (ELEVATED.includes(role) && lastUsed >= 90) return { action: 'reduce', why: `Admin rights, but unused for ${lastUsed} days. Reduce to Member.` }
    if (lastUsed >= 90) return { action: 'remove', why: `Hasn’t signed in for ${lastUsed} days.` }
    return null
  }
  const rows = grants.map((g) => ({ g, app: s.appById(g.appId)!, sug: suggestion(g.role, g.lastUsedDaysAgo) })).filter((r) => r.app)
  const decided = rows.filter((r) => decisions[r.g.appId]).length
  const summary = (['keep', 'reduce', 'remove'] as const).map((k) => ({ k, n: rows.filter((r) => decisions[r.g.appId] === k).length }))
  const submit = () => {
    setBusy(true)
    window.setTimeout(() => {
      s.submitAccessReview(person.id, decisions)
      s.log({ actor: s.currentUser.name, actorId: s.currentUser.id, kind: 'human', text: `completed an access review for ${person.name}: ${summary.map((x) => `${x.n} ${x.k}`).join(', ')}.`, entity: { type: 'person', id: person.id } })
      toast({ tone: 'success', title: 'Access review submitted', description: `${person.name}’s access has been updated. Changes reach connected apps within a few minutes.` })
      setBusy(false); setConfirm(false); setReviewing(false); setDecisions({})
    }, 700)
  }
  const doRevoke = () => {
    setBusy(true)
    window.setTimeout(() => {
      s.revokeAll(person.id)
      s.log({ actor: s.currentUser.name, actorId: s.currentUser.id, kind: 'human', text: `removed all app access for ${person.name}.`, entity: { type: 'person', id: person.id } })
      s.noteOnRisk('R-101', `removed all app access for ${person.name}. Awaiting verification before resolving.`)
      toast({ tone: 'success', title: 'Access removed', description: `${person.name} can no longer sign in to ${grants.length} apps. Risk R-101 can now be marked resolved.`, action: { label: 'Open risk', to: '/risks/R-101' } })
      setBusy(false); setRevoke(false)
    }, 800)
  }
  const applySuggestions = () => setDecisions(Object.fromEntries(rows.map((r) => [r.g.appId, r.sug?.action ?? 'keep'])))
  const hasMfaIssue = person.accessIssues.some((i) => i.kind === 'no_mfa')
  const ackDone = policies.filter((p) => hasAcknowledged(person.id, p.id)).length
  const t = person.training

  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'People', to: '/people' }, { label: person.name }]}
        title={<span className="flex items-center gap-4"><Avatar name={person.name} size="xl" muted={former} />{person.name}</span>}
        description={`${person.title} · ${person.department}`}
        meta={<>
          <StatusBadge status={person.status} />{person.employmentType === 'Contractor' && <Badge>Contractor</Badge>}
          {manager && <span className="flex items-center gap-2 text-body-sm text-ink-secondary">Reports to <PersonLink id={manager.id} /></span>}
          <span className="flex items-center gap-1.5 text-body-sm text-ink-secondary"><Mail className="h-4 w-4" aria-hidden />{person.email}</span>
          <span className="flex items-center gap-1.5 text-body-sm text-ink-secondary"><MapPin className="h-4 w-4" aria-hidden />{person.location}</span>
        </>} />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card><p className="text-body-sm font-medium text-ink-secondary">Applications</p><p className="mt-1 text-title-1 tabular-nums">{grants.length}</p><p className="text-caption text-ink-secondary">{grants.filter((g) => ELEVATED.includes(g.role)).length} with admin rights</p></Card>
        <Card><p className="text-body-sm font-medium text-ink-secondary"><Term id="security-training">Security training</Term></p><div className="mt-2"><StatusBadge status={t.status} label={t.status === 'overdue' ? `Overdue ${-daysFromToday(t.dueOn)} days` : undefined} /></div><p className="mt-1.5 text-caption text-ink-secondary">{t.status === 'completed' ? `Completed ${formatDate(t.completedOn)}` : `Due ${formatDate(t.dueOn)}`}</p></Card>
        <Card><p className="text-body-sm font-medium text-ink-secondary"><Term id="access-review">Access review</Term></p><div className="mt-2"><StatusBadge status={person.accessReview} /></div><p className="mt-1.5 text-caption text-ink-secondary">{person.accessIssues.length ? `${person.accessIssues.length} issue${person.accessIssues.length > 1 ? 's' : ''} found by Atlas` : 'No issues found'}</p></Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* ---------- Offboarding gap ---------- */}
          {former && (
            <Callout tone={stillHasAccess ? 'critical' : 'success'} role="status" title={stillHasAccess ? `${first} left on ${formatDate(person.endDate)} but can still sign in to ${grants.length} apps` : `${first} was fully offboarded`}
              actions={stillHasAccess ? <Button variant="danger" iconLeft={<UserMinus className="h-4 w-4" />} disabledReason={perm.allowed ? undefined : perm.reason} onClick={() => setRevoke(true)}>Remove all access</Button> : undefined}>
              {stillHasAccess ? <>This is a risk because the account belongs to someone who no longer works here (<Term id="offboarding">offboarding</Term> gap). <Link className="font-medium text-ink-link underline" to="/risks/R-101">See risk R-101</Link>.</> : `${first}’s last day was ${formatDate(person.endDate)} and no active accounts remain.`}
            </Callout>
          )}
          {hasMfaIssue && !former && (
            <Callout tone="warning" title="Multi-factor authentication is switched off"
              actions={<Button size="sm" iconLeft={<BellRing className="h-4 w-4" />} disabledReason={perm.allowed ? undefined : perm.reason} onClick={() => toast({ tone: 'success', title: 'Reminder sent', description: `${first} received setup steps for multi-factor authentication.` })}>Send setup reminder</Button>}>
              {first} signs in to Salesforce with a password only. <Term id="mfa">MFA</Term> adds a second check, such as a code on their phone, so a stolen password isn’t enough.
            </Callout>
          )}

          {/* ---------- Access review workflow ---------- */}
          <Card aria-labelledby="acc-h">
            <CardHeader id="acc-h" icon={<KeyRound className="h-5 w-5" />} title="Applications & access review"
              description={reviewing ? 'Decide what to do with each app. Nothing changes until you submit.' : `${grants.length} apps ${person.name.split(' ')[0]} can open. An access review confirms each is still needed.`}
              actions={!reviewing && !former && grants.length > 0 ? <Button variant={person.accessReview === 'needs_attention' ? 'primary' : 'secondary'} onClick={() => { setReviewing(true); setDecisions({}) }} disabledReason={perm.allowed ? undefined : perm.reason}>Start access review</Button> : undefined} />
            {person.accessIssues.length > 0 && !reviewing && !former && (
              <ul className="mb-4 space-y-2">{person.accessIssues.map((i, k) => <li key={k} className="flex gap-2 rounded-md bg-high-bg p-3 text-body-sm text-high-fg"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span className="text-ink">{i.text} {i.riskId && <Link to={`/risks/${i.riskId}`} className="font-medium text-ink-link underline">{i.riskId}</Link>}</span></li>)}</ul>
            )}
            {reviewing && (
              <div className="mb-4 rounded-lg border border-ai-border bg-ai-subtle p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-body-sm font-medium text-ai-ink"><Sparkles className="h-4 w-4" aria-hidden />Atlas suggests {rows.filter((r) => r.sug).length} change{rows.filter((r) => r.sug).length === 1 ? '' : 's'} based on sign-in history</p>
                  <Button size="sm" onClick={applySuggestions}>Apply suggestions</Button>
                </div>
                <p className="mt-1 text-caption text-ink-secondary">Suggestions are a starting point. Atlas can’t know about upcoming projects, so check with {first}’s manager if unsure.</p>
              </div>
            )}
            {rows.length === 0 ? <EmptyState compact title={former ? 'No active access' : 'No applications'} description={former ? 'All accounts have been removed.' : 'This person has no app access yet.'} /> : (
              <ul className="divide-y divide-line rounded-lg border border-line">
                {rows.map(({ g, app, sug }) => {
                  const stale = g.lastUsedDaysAgo >= 90
                  return (
                    <li key={g.appId} className="p-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0"><EntityChip entity={{ type: 'application', id: app.id }} />
                          <p className="mt-1.5 text-body-sm text-ink-secondary">Role: <span className={cn('font-medium', ELEVATED.includes(g.role) ? 'text-high-fg' : 'text-ink')}>{g.role}</span>{ELEVATED.includes(g.role) && <> (<Term id="admin-privileges">what’s this?</Term>)</>} · Last used {g.lastUsedDaysAgo === 0 ? 'today' : `${g.lastUsedDaysAgo} ${g.lastUsedDaysAgo === 1 ? 'day' : 'days'} ago`}{stale && <Badge tone="warning" size="sm" className="ml-1.5">Unused</Badge>}</p></div>
                        {reviewing && (
                          <RadioGroup legend={`Decision for ${app.name}`} hideLegend orientation="horizontal" value={decisions[g.appId] ?? ''} onChange={(v) => setDecisions((d) => ({ ...d, [g.appId]: v as AccessDecision }))}>
                            <Radio value="keep" label="Keep" />{ELEVATED.includes(g.role) && <Radio value="reduce" label="Reduce to Member" />}<Radio value="remove" label="Remove" />
                          </RadioGroup>)}
                      </div>
                      {reviewing && sug && <p className="mt-2 flex items-start gap-1.5 text-caption text-ai-ink"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /><span><strong>Atlas suggests {sug.action}.</strong> {sug.why} <span className="text-ink-secondary">(Medium confidence)</span></span></p>}
                    </li>)
                })}
              </ul>
            )}
            {reviewing && (
              <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 sm:w-64"><ProgressBar value={decided} max={rows.length} tone="info" label="Apps decided" /><p className="mt-1 text-caption text-ink-secondary" role="status">{decided} of {rows.length} decided</p></div>
                <div className="flex gap-2"><Button onClick={() => { setReviewing(false); setDecisions({}) }}>Cancel</Button><Button variant="primary" disabled={decided < rows.length} onClick={() => setConfirm(true)}>Review & submit</Button></div>
              </div>)}
            {!reviewing && person.accessReview === 'up_to_date' && !former && grants.length > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-body-sm text-success-fg"><CheckCircle2 className="h-4 w-4" aria-hidden />Access is up to date.</p>)}
          </Card>

          <Card aria-labelledby="trn-h">
            <CardHeader id="trn-h" icon={<GraduationCap className="h-5 w-5" />} title="Training & policies" />
            <DescriptionList columns={2} items={[
              { label: 'Security awareness training', value: <StatusBadge status={t.status} /> },
              { label: t.status === 'completed' ? 'Completed' : 'Due', value: t.status === 'completed' ? formatDate(t.completedOn) : `${formatDate(t.dueOn)} (${relativeDay(t.dueOn)})` },
            ]} />
            {t.status !== 'completed' && !former && <Button className="mt-4" size="sm" iconLeft={<BellRing className="h-4 w-4" />} disabledReason={s.permission('tasks.write').allowed ? undefined : s.permission('tasks.write').reason} onClick={() => toast({ tone: 'success', title: 'Reminder sent', description: `${first} and ${manager?.name ?? 'their manager'} were notified.` })}>Send training reminder</Button>}
            <div className="mt-4 border-t border-line pt-3">
              <Disclosure summary={`Policies acknowledged: ${ackDone} of ${policies.length}`}>
                <ul className="mt-1 grid gap-1.5 sm:grid-cols-2">{policies.map((p) => <li key={p.id} className="flex items-center justify-between gap-2 text-body-sm"><Link to={`/policies/${p.id}`} className="truncate hover:underline">{p.name}</Link>{hasAcknowledged(person.id, p.id) ? <StatusBadge status="completed" label="Acknowledged" size="sm" /> : <Badge tone="warning" size="sm">Pending</Badge>}</li>)}</ul>
              </Disclosure>
            </div>
          </Card>
        </div>

        <aside className="space-y-5" aria-label="Related records">
          <Card aria-labelledby="pr-h"><CardHeader id="pr-h" title="Related risks" />
            {risks.length === 0 ? <p className="text-body text-ink-secondary">No risks involve {first}.</p> : <ul className="space-y-2">{risks.map((r) => <li key={r.id}><EntityChip entity={{ type: 'risk', id: r.id }} className="w-full" /><p className="mt-0.5 pl-1 text-caption text-ink-secondary">{isOpenRisk(r) ? `${r.severity} · due ${relativeDay(r.dueDate)}` : r.status}</p></li>)}</ul>}</Card>
          <Card aria-labelledby="pt-h"><CardHeader id="pt-h" title="Open tasks about this person" />
            {tasks.length === 0 ? <p className="text-body text-ink-secondary">No open tasks.</p> : <ul className="space-y-2.5">{tasks.map((x) => <li key={x.id} className="text-body-sm"><Link to="/tasks" className="font-medium hover:underline">{x.name}</Link><div className="mt-1 flex items-center gap-2"><PriorityBadge priority={x.priority} /><span className="text-ink-secondary">{dueLabel(x.dueDate).text}</span></div></li>)}</ul>}</Card>
          {reports.length > 0 && <Card aria-labelledby="dr-h"><CardHeader id="dr-h" title="Direct reports" icon={<Users className="h-5 w-5" />} description={`${reports.length} people`} />
            <ul className="space-y-2">{reports.slice(0, 6).map((p) => <li key={p.id}><PersonLink id={p.id} subtitle="" /></li>)}</ul>{reports.length > 6 && <p className="mt-2 text-caption text-ink-secondary">+ {reports.length - 6} more</p>}</Card>}
          <Card><DescriptionList items={[{ label: 'Started', value: formatDate(person.startDate) }, ...(person.endDate ? [{ label: 'Left', value: formatDate(person.endDate) }] : []), { label: 'Department', value: person.department }]} /></Card>
        </aside>
      </div>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={submit} loading={busy} title="Submit access review?" confirmLabel="Submit review"
        description={`This updates ${person.name}’s access in the connected apps and records the review for your next audit.`}>
        <ul className="space-y-1.5 text-body">{summary.map((x) => <li key={x.k} className="flex justify-between rounded-md bg-sunken px-3 py-2"><span className="capitalize">{x.k === 'reduce' ? 'Reduce to Member' : x.k}</span><span className="font-semibold tabular-nums">{x.n}</span></li>)}</ul>
        <p className="mt-3 text-body-sm text-ink-secondary">You can undo a removal by re-requesting access from the app owner.</p>
      </ConfirmDialog>
      <ConfirmDialog open={revoke} onClose={() => setRevoke(false)} onConfirm={doRevoke} loading={busy} danger title={`Remove all of ${first}’s access?`} confirmLabel="Remove all access"
        description={`${person.name} will be signed out and lose access to ${grants.length} apps. Files and email are kept, so this is reversible by an admin for 30 days.`}>
        <ul className="flex flex-wrap gap-1.5">{grants.map((g) => <li key={g.appId}><Badge>{s.appById(g.appId)?.name}</Badge></li>)}</ul>
      </ConfirmDialog>
    </>
  )
}
