import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Eye, ListChecks, ShieldAlert, Sparkles, Wand2 } from 'lucide-react'
import { Modal } from '@/components/ui/Overlay'
import { Button } from '@/components/ui/Button'
import { useUi } from './UiContext'
import { LogoMark } from './Sidebar'
import { cn } from '@/utils/cn'

const QUESTIONS = ['What is going well?', 'What needs attention?', 'What risks exist?', 'Why does it matter?', 'What should we do next?', 'Can Atlas help do it?']

/** Three-step welcome. Skippable; replayable from the account menu. Ends in concrete things to try. */
export function Onboarding() {
  const ui = useUi(); const nav = useNavigate(); const [step, setStep] = useState(0)
  const close = () => { ui.setTourOpen(false); setStep(0) }
  const go = (to: string, ask?: string) => { close(); nav(to); if (ask) setTimeout(() => ui.openAsk(ask), 250) }
  const steps = [
    { title: 'Welcome to Atlas', body: (
      <div>
        <div className="mb-4 flex items-center gap-3"><LogoMark size={44} /><p className="text-body text-ink-secondary">You’re exploring a <strong className="text-ink">sample workspace</strong> for Harborlight Software, a fictional 248-person company. Everything is made up — click anything.</p></div>
        <p className="mb-2 text-body font-medium">Companies keep information in many places: HR, apps, vendors, policies. Atlas connects it and answers six questions:</p>
        <ul className="grid gap-2 sm:grid-cols-2">{QUESTIONS.map((q, i) => <li key={q} className="flex items-center gap-2.5 rounded-md border border-line px-3 py-2 text-body"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-action-subtle text-caption font-semibold text-action-ink">{i + 1}</span>{q}</li>)}</ul>
      </div>) },
    { title: 'You don’t need to be a security expert', body: (
      <ul className="space-y-3">
        {[
          { Icon: Eye, t: 'Plain English everywhere', d: 'Terms with a dotted underline (like multi-factor authentication) explain themselves on hover. The Help page has a full glossary.' },
          { Icon: ShieldAlert, t: 'Every risk answers three questions', d: 'What is happening? Why does it matter? What should I do? — with the evidence shown.' },
          { Icon: Sparkles, t: 'Atlas AI shows its work', d: 'Answers include sources and a confidence level, and say so when Atlas isn’t sure. It never changes anything without your approval.' },
        ].map(({ Icon, t, d }) => <li key={t} className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sunken text-ink-secondary"><Icon className="h-4 w-4" aria-hidden /></span><span><span className="block text-body font-semibold">{t}</span><span className="block text-body text-ink-secondary">{d}</span></span></li>)}
      </ul>) },
    { title: 'Try these first', body: (
      <ul className="space-y-2">
        {[
          { Icon: ShieldAlert, t: 'Open the most serious risk', d: 'A former contractor who still has access.', run: () => go('/risks/R-101') },
          { Icon: Wand2, t: 'Let Atlas AI do some work', d: 'It finds 14 people missing training and drafts tasks for your approval.', run: () => go('/assistant', 'Find employees who haven’t completed required security training and create tasks for their managers.') },
          { Icon: ListChecks, t: 'Run an access review', d: 'Decide what Jordan Williams should keep.', run: () => go('/people/jordan-williams') },
          { Icon: CheckCircle2, t: 'Just look around', d: 'Start at the Overview dashboard.', run: () => go('/') },
        ].map(({ Icon, t, d, run }) => (
          <li key={t}><button type="button" onClick={run} className="flex w-full items-center gap-3 rounded-lg border border-line p-3 text-left transition-colors duration-fast hover:border-line-strong hover:bg-hover">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-action-subtle text-action-ink"><Icon className="h-4 w-4" aria-hidden /></span>
            <span className="min-w-0 flex-1"><span className="block text-body font-semibold">{t}</span><span className="block text-body-sm text-ink-secondary">{d}</span></span><ArrowRight className="h-4 w-4 text-ink-tertiary" aria-hidden /></button></li>))}
      </ul>) },
  ]
  const cur = steps[step]
  return (
    <Modal open={ui.tourOpen} onClose={close} title={cur.title} size="md"
      footer={<>
        <div className="mr-auto hidden items-center gap-1.5 sm:flex" aria-label={`Step ${step + 1} of ${steps.length}`}>{steps.map((_, i) => <span key={i} className={cn('h-1.5 rounded-full transition-all duration-base', i === step ? 'w-5 bg-action' : 'w-1.5 bg-line-strong')} />)}</div>
        <Button variant="ghost" onClick={close}>Skip tour</Button>
        {step > 0 && <Button onClick={() => setStep(step - 1)}>Back</Button>}
        {step < steps.length - 1 ? <Button variant="primary" onClick={() => setStep(step + 1)} iconRight={<ArrowRight className="h-4 w-4" />}>Next</Button> : <Button variant="primary" onClick={close}>Start exploring</Button>}
      </>}>
      {cur.body}
    </Modal>
  )
}
