import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BellRing, CircleAlert, CircleCheck, Info, RefreshCw, Send, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react'
import { Drawer, Modal } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Form'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { useAssistant } from './AssistantContext'
import { answer, SUGGESTED_PROMPTS } from './engine'
import type { AiItem, AiProposal, AiResponse } from './types'
import { useActions, useData } from '@/state/store'
import { useSession } from '@/state/session'
import { useDialogs } from '@/state/dialogs'
import { useActor } from '@/hooks/useActor'
import { primaryGuardian } from '@/domain/people'
import { cn } from '@/utils/cn'

type Msg = { id: number; q: string; phase: 'thinking' | 'answered' | 'error'; res?: AiResponse }
const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * GOODHANDS ASSISTANT. Design rules it follows:
 *  1. Useful first — it answers from your real data, then offers the next step.
 *  2. Show its work — every answer lists the sources it used and how sure it is.
 *  3. Never act alone — actions are *proposals*; a person reviews and approves.
 *  4. Be honest — unclear questions get "I'm not sure", not a confident guess.
 */
export function AssistantDrawer() {
  const { open, closeAssistant, initialPrompt, consumePrompt } = useAssistant()
  const d = useData()
  const { now, demo } = useSession()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const seq = useRef(0)
  const scroller = useRef<HTMLDivElement>(null)
  const busy = msgs.some((m) => m.phase === 'thinking')

  const ask = (q: string) => {
    const question = q.trim()
    if (!question || busy) return
    const id = ++seq.current
    setMsgs((m) => [...m, { id, q: question, phase: 'thinking' }])
    setText('')
    setTimeout(() => {
      setMsgs((m) => m.map((x) => (x.id === id ? (demo.aiOutage ? { ...x, phase: 'error' } : { ...x, phase: 'answered', res: answer(question, d, now) }) : x)))
    }, prefersReduced() ? 150 : 1100)
  }
  useEffect(() => { if (open && initialPrompt) { ask(initialPrompt); consumePrompt() } }, [open, initialPrompt]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: prefersReduced() ? 'auto' : 'smooth' }) }, [msgs])

  return (
    <Drawer open={open} onClose={closeAssistant} width="lg" title="GoodHands Assistant" description="Ask about today. I read your daycare’s data and suggest next steps."
      footer={
        <form className="flex w-full gap-2" onSubmit={(e) => { e.preventDefault(); ask(text) }}>
          <label htmlFor="ai-input" className="sr-only">Ask the assistant a question</label>
          <input id="ai-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask a question…" autoComplete="off" className="min-h-control flex-1 rounded-md border border-line-strong bg-surface px-3 text-body placeholder:text-ink-tertiary" />
          <Button type="submit" variant="primary" icon={<Send className="h-4 w-4" />} disabled={!text.trim() || busy}>Ask</Button>
        </form>
      }
    >
      <div ref={scroller} className="space-y-6">
        {msgs.length === 0 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-primary-subtle/60 p-4">
              <p className="flex items-center gap-2 font-semibold text-primary-text"><Sparkles className="h-4 w-4" aria-hidden />How I can help</p>
              <p className="mt-1 text-small text-ink-secondary">I can tell you who’s here, who hasn’t paid, what’s running low and what to remember. I suggest actions, but <strong>I never send or change anything without your approval</strong>. I can be wrong — check the sources I list.</p>
            </div>
            <div><p className="mb-2 text-small font-semibold">Try asking</p><div className="flex flex-col gap-2">{SUGGESTED_PROMPTS.map((p) => <button key={p} type="button" onClick={() => ask(p)} className="flex min-h-control items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3.5 text-left text-small font-medium transition-colors duration-fast hover:border-primary/50 hover:bg-primary-subtle/40">{p}<ArrowRight className="h-4 w-4 shrink-0 text-ink-tertiary" aria-hidden /></button>)}</div></div>
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className="space-y-3">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-ink px-3.5 py-2 text-small font-medium text-ink-inverse">{m.q}</p>
            {m.phase === 'thinking' && <Thinking />}
            {m.phase === 'error' && <AiError onRetry={() => { setMsgs((x) => x.filter((y) => y.id !== m.id)); ask(m.q) }} />}
            {m.phase === 'answered' && m.res && <ResponseView res={m.res} onFollow={ask} onNavigate={closeAssistant} />}
          </div>
        ))}
      </div>
    </Drawer>
  )
}

function Thinking() {
  const steps = ['Reading today’s attendance', 'Checking supplies and payments', 'Putting it together']
  const [n, setN] = useState(0)
  useEffect(() => { const t = setInterval(() => setN((x) => Math.min(x + 1, steps.length - 1)), 380); return () => clearInterval(t) }, [steps.length])
  return (
    <div role="status" aria-live="polite" className="rounded-lg border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-small font-semibold"><span className="flex gap-1" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-[gh-pulse-dot_1s_ease-in-out_infinite]" style={{ animationDelay: `${i * 160}ms` }} />)}</span>Thinking…</p>
      <p className="mt-1 text-caption text-ink-secondary">{steps[n]}</p>
    </div>
  )
}

function AiError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-danger/30 bg-danger-bg/50 p-4">
      <p className="flex items-center gap-2 font-semibold"><CircleAlert className="h-4 w-4 text-danger" aria-hidden />I couldn’t answer that right now.</p>
      <p className="mt-1 text-small text-ink-secondary">The assistant is unavailable. Nothing was changed. Everything in GoodHands still works — you can find this on the Home screen.</p>
      <Button className="mt-3" icon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>Try again</Button>
    </div>
  )
}

const TONE_ICON = { danger: CircleAlert, warning: TriangleAlert, info: Info, neutral: Info, success: CircleCheck }
const TONE_CLASS = { danger: 'text-danger', warning: 'text-warning', info: 'text-info', neutral: 'text-ink-tertiary', success: 'text-success' }

function ResponseView({ res, onFollow, onNavigate }: { res: AiResponse; onFollow: (q: string) => void; onNavigate: () => void }) {
  const words = res.headline.split(' ')
  const [shown, setShown] = useState(prefersReduced() ? words.length : 0)
  useEffect(() => {
    if (shown >= words.length) return
    const t = setTimeout(() => setShown((s) => s + 1), 28)
    return () => clearTimeout(t)
  }, [shown, words.length])
  const done = shown >= words.length
  return (
    <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <p className="flex items-start gap-2"><Sparkles className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden /><span className="text-body font-semibold" aria-label={res.headline}><span aria-hidden>{words.slice(0, shown).join(' ')}</span></span></p>
      {done && (
        <div className="anim-fade-in space-y-3">
          {res.paragraphs?.map((p) => <p key={p} className="text-small text-ink-secondary">{p}</p>)}
          {res.items && res.items.length > 0 && <ol className="divide-y divide-line-subtle rounded-md border border-line-subtle">{res.items.map((it) => <ItemRow key={it.id} it={it} onNavigate={onNavigate} />)}</ol>}
          {res.items && res.items.length === 0 && <p className="text-small text-ink-secondary">Nothing to list.</p>}
          {res.proposal && <ProposalCard proposal={res.proposal} />}
          {res.caveat && <p className="flex items-start gap-2 rounded-md bg-warning-bg/60 px-3 py-2 text-caption text-warning-text"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{res.caveat}</p>}
          <Sources res={res} />
          {res.followUps && res.followUps.length > 0 && <div className="flex flex-wrap gap-2 pt-1">{res.followUps.filter((f) => !f.startsWith('Open')).map((f) => <button key={f} type="button" onClick={() => onFollow(f)} className="rounded-full border border-line px-3 py-1.5 text-caption font-semibold text-ink-secondary transition-colors duration-fast hover:bg-surface-sunken hover:text-ink">{f}</button>)}</div>}
        </div>
      )}
    </div>
  )
}

function Sources({ res }: { res: AiResponse }) {
  const [open, setOpen] = useState(false)
  const conf = { high: ['success', 'Confident'], medium: ['warning', 'Fairly sure'], low: ['neutral', 'Not sure'] } as const
  return (
    <div className="border-t border-line-subtle pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone={conf[res.confidence][0]} icon={<ShieldCheck />}>{conf[res.confidence][1]}</Badge>
        {res.sources.length > 0 && <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="rounded text-caption font-semibold text-primary-text underline-offset-2 hover:underline">{open ? 'Hide' : 'What I looked at'} ({res.sources.length})</button>}
      </div>
      {open && <ul className="mt-2 flex flex-wrap gap-1.5">{res.sources.map((s) => <li key={s} className="rounded-md bg-surface-sunken px-2 py-1 text-caption text-ink-secondary">{s}</li>)}</ul>}
    </div>
  )
}

function ItemRow({ it, onNavigate }: { it: AiItem; onNavigate: () => void }) {
  const nav = useNavigate()
  const dialogs = useDialogs()
  const Icon = TONE_ICON[it.tone]
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <Icon className={cn('h-4 w-4 shrink-0', TONE_CLASS[it.tone])} aria-hidden />
      <div className="min-w-0 flex-1"><p className="text-small font-semibold">{it.label}</p>{it.detail && <p className="text-caption text-ink-secondary">{it.detail}</p>}</div>
      {it.cta && <Button size="sm" onClick={() => { if (it.cta!.kind === 'notify') dialogs.notifyParent(it.cta!.childId); else { onNavigate(); nav(it.cta!.to) } }}>{it.cta.label}</Button>}
    </li>
  )
}

/** A proposed action. Three honest steps: proposed → you review → you approve. Cancel is always one tap away. */
function ProposalCard({ proposal }: { proposal: AiProposal }) {
  const d = useData()
  const act = useActions()
  const toast = useToast()
  const { now } = useSession()
  const { name } = useActor()
  const [state, setState] = useState<'proposed' | 'reviewing' | 'done' | 'cancelled'>('proposed')
  const [picked, setPicked] = useState<Record<string, boolean>>(() => Object.fromEntries(proposal.childIds.map((id) => [id, true])))
  const kids = proposal.childIds.map((id) => d.children.find((c) => c.id === id)!).filter(Boolean)
  const chosen = kids.filter((c) => picked[c.id])

  if (state === 'done') return <p className="flex items-center gap-2 rounded-md bg-success-bg px-3 py-2.5 text-small font-semibold text-success-text"><CircleCheck className="h-4 w-4" aria-hidden />Done — {chosen.length} {chosen.length === 1 ? 'family' : 'families'} notified and recorded.</p>
  if (state === 'cancelled') return <p className="rounded-md bg-neutral-bg px-3 py-2 text-small text-neutral-text">Cancelled. Nothing was sent.</p>

  const approve = () => {
    for (const c of chosen) act.notifyParent({ childId: c.id, kind: c.diaper?.status === 'out' ? 'diapers_out' : 'diapers_low', date: now.date, time: now.time, by: name, channel: 'simulated_text', message: msg(c.firstName, primaryGuardian(c).name, c.diaper?.status === 'out') })
    setState('done'); toast({ title: `${chosen.length} ${chosen.length === 1 ? 'family' : 'families'} notified`, description: 'Recorded (simulated — nothing was sent).' })
  }
  const msg = (kid: string, parent: string, out: boolean) => `Hi ${parent.split(' ')[0]} — ${kid} is ${out ? 'out of' : 'running low on'} diapers. Could you bring some ${out ? 'today' : 'tomorrow'}? Thank you!`
  return (
    <div className="rounded-lg border-2 border-primary/30 bg-primary-subtle/40 p-3.5">
      <p className="text-caption font-bold uppercase tracking-wide text-primary-text">Suggested action</p>
      <p className="mt-1 font-semibold">{proposal.title}</p>
      <p className="text-small text-ink-secondary">{proposal.description}</p>
      <div className="mt-3 flex gap-2"><Button variant="primary" icon={<BellRing className="h-4 w-4" />} onClick={() => setState('reviewing')}>Review</Button><Button variant="ghost" onClick={() => setState('cancelled')}>Cancel</Button></div>
      <Modal open={state === 'reviewing'} onClose={() => setState('proposed')} title="Review before sending" description="Choose who to notify. You’re approving each message." size="md"
        footer={<><Button onClick={() => setState('proposed')}>Back</Button><Button variant="primary" disabled={chosen.length === 0} onClick={approve}>Approve &amp; notify {chosen.length}</Button></>}>
        <ul className="space-y-3">{kids.map((c) => (
          <li key={c.id} className="rounded-lg border border-line p-3">
            <Checkbox checked={!!picked[c.id]} onChange={(e) => setPicked({ ...picked, [c.id]: e.target.checked })} label={<>{primaryGuardian(c).name} <span className="font-normal text-ink-secondary">· {c.firstName}’s parent</span></>} description={primaryGuardian(c).phone} />
            <p className="ml-8 mt-1 rounded-md bg-surface-muted px-3 py-2 text-small">“{msg(c.firstName, primaryGuardian(c).name, c.diaper?.status === 'out')}”</p>
          </li>
        ))}</ul>
        <p className="mt-3 text-caption text-ink-secondary">Prototype: messages aren’t actually sent — approving records that the families were notified.</p>
      </Modal>
    </div>
  )
}
