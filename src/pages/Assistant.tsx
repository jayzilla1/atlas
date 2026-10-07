import { useState } from 'react'
import { History, MessageSquarePlus, ShieldCheck, Sparkles } from 'lucide-react'
import { AtlasChat } from '@/components/ai/AtlasChat'
import { useAssistant } from '@/ai/AssistantContext'
import { Button, IconButton } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Overlay'
import { Card } from '@/components/ui/Card'
import { Term } from '@/components/ui/Tooltip'
import { AiBadge } from '@/components/ai/AiParts'
import { usePageTitle } from '@/hooks/usePage'
import { cn } from '@/utils/cn'
import { useStore } from '@/state/store'

function History_({ onPick }: { onPick?: () => void }) {
  const a = useAssistant()
  const list = a.order.map((id) => a.threads[id]).filter((t) => t && !t.id.startsWith('risk-') && t.id !== 'quick' && (t.messages.length > 0 || t.id === a.activeId))
  return (
    <nav aria-label="Conversation history">
      <ul className="space-y-0.5">
        {list.map((t) => (
          <li key={t.id}><button type="button" aria-current={t.id === a.activeId ? 'true' : undefined} onClick={() => { a.setActive(t.id); onPick?.() }}
            className={cn('w-full truncate rounded-md px-3 py-2 text-left text-body-sm', t.id === a.activeId ? 'bg-selected font-medium text-ink' : 'text-ink-secondary hover:bg-hover hover:text-ink')}>{t.title}</button></li>
        ))}
      </ul>
    </nav>
  )
}

/** AssistantPage — workspace layout: history | conversation | “how Atlas stays trustworthy” rail. */
export function AssistantPage() {
  usePageTitle('AI Assistant')
  const a = useAssistant(); const [hist, setHist] = useState(false); const { role } = useStore()
  return (
    <div className="-my-2 flex h-[calc(100vh-9.5rem)] min-h-[34rem] gap-5">
      <aside className="hidden w-60 shrink-0 flex-col lg:flex" aria-label="History">
        <Button variant="secondary" iconLeft={<MessageSquarePlus className="h-4 w-4" />} className="mb-3 w-full" onClick={() => a.newThread()}>New conversation</Button>
        <p className="mb-1.5 px-3 text-overline uppercase text-ink-tertiary">Recent</p>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto"><History_ /></div>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col" aria-labelledby="ai-h1">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0"><h1 id="ai-h1" className="flex items-center gap-2 text-title-1"><Sparkles className="h-6 w-6 text-ai" aria-hidden />Atlas AI</h1>
            <p className="text-body text-ink-secondary">Ask about your risks, people, apps and vendors — in plain English.</p></div>
          <div className="flex gap-2 lg:hidden"><IconButton label="Conversation history" onClick={() => setHist(true)}><History className="h-5 w-5" /></IconButton><IconButton label="New conversation" onClick={() => a.newThread()}><MessageSquarePlus className="h-5 w-5" /></IconButton></div>
        </div>
        <AtlasChat key={a.activeId} threadId={a.activeId} className="flex-1" />
      </section>
      <aside className="hidden w-72 shrink-0 xl:block" aria-label="How Atlas AI works">
        <Card className="space-y-4">
          <AiBadge label="How Atlas AI stays trustworthy" />
          {[
            { t: 'Shows its sources', d: <>Every answer lists the records it used, so you can check them. <Term id="sources">What are sources?</Term></> },
            { t: 'Says how sure it is', d: <>A <Term id="confidence">confidence</Term> label — High, Medium or Needs review — sits on every answer.</> },
            { t: 'Admits what it doesn’t know', d: 'If the evidence is thin, Atlas says so instead of guessing.' },
            { t: 'Asks before it acts', d: <>Anything that changes data needs your <Term id="human-in-the-loop">approval</Term>, is logged, and can be undone.</> },
          ].map((x) => <div key={x.t}><p className="text-body font-semibold">{x.t}</p><p className="mt-0.5 text-body-sm text-ink-secondary">{x.d}</p></div>)}
          <div className="flex items-start gap-2 rounded-md bg-sunken p-3 text-body-sm"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink-secondary" aria-hidden /><p><span className="font-semibold">Your permissions: </span><span className="text-ink-secondary">{role === 'auditor' ? 'Read-only. Atlas can answer questions but can’t create anything for you.' : role === 'manager' ? 'Manager. Atlas can prepare tasks and reviews for your approval.' : 'Admin. Atlas can prepare tasks and reviews for your approval.'}</span></p></div>
        </Card>
      </aside>
      <Drawer open={hist} onClose={() => setHist(false)} title="Conversations"><History_ onPick={() => setHist(false)} /></Drawer>
    </div>
  )
}
