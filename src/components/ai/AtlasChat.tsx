import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Sparkles } from 'lucide-react'
import { useAssistant } from '@/ai/AssistantContext'
import { RISK_QUESTIONS, SUGGESTED_QUESTIONS } from '@/ai/engine'
import { AiResponseView } from './AiResponseView'
import { AiBadge } from './AiParts'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { useStore } from '@/state/store'
import { Callout } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'

/**
 * AtlasChat — message list + composer. Used full-page, in the global “Ask Atlas” drawer and
 * embedded on a Risk page (scoped: Atlas answers about that risk).
 */
export function AtlasChat({ threadId, suggestions, riskId, className, emptyTitle = 'What would you like to know?', emptyBody, compact, autoFocus }: {
  threadId: string; suggestions?: string[]; riskId?: string; className?: string; emptyTitle?: string; emptyBody?: string; compact?: boolean; autoFocus?: boolean
}) {
  const a = useAssistant(); const { currentUser, demo } = useStore()
  const thread = a.threads[threadId]
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => { a.ensureThread(threadId, { riskId }) }, [threadId, riskId]) // eslint-disable-line react-hooks/exhaustive-deps
  const msgs = thread?.messages ?? []
  const busy = msgs.some((m) => m.status === 'thinking' || m.status === 'streaming')
  const last = msgs[msgs.length - 1]
  useEffect(() => {
    if (!msgs.length) return
    const el = listRef.current
    if (el && el.scrollHeight > el.clientHeight) el.scrollTo({ top: el.scrollHeight, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [msgs.length, last?.status, last?.response?.proposal?.status])

  const submit = (q: string) => { if (!q.trim() || busy) return; a.send(threadId, q); setText('') }
  const sugg = suggestions ?? (riskId ? RISK_QUESTIONS : SUGGESTED_QUESTIONS)

  return (
    <div className={cn('flex min-h-0 flex-col', className)} data-ds="AtlasChat">
      <div ref={listRef} className="scroll-thin min-h-0 flex-1 overflow-y-auto" role="log" aria-label="Conversation with Atlas AI" aria-relevant="additions">
        {msgs.length === 0 ? (
          <div className={cn('mx-auto flex max-w-2xl flex-col px-1', compact ? 'py-4' : 'py-8 sm:py-12')}>
            <AiBadge className="mb-3" />
            <h2 className={cn(compact ? 'text-title-3' : 'text-title-1')}>{emptyTitle}</h2>
            <p className="mt-1.5 text-body text-ink-secondary">{emptyBody ?? 'Ask in plain English. Atlas answers from your own records, shows where each answer came from, and asks before it changes anything.'}</p>
            <div className="mt-5 grid gap-2">
              {sugg.map((s) => (
                <button key={s} type="button" onClick={() => submit(s)} className="group flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3.5 py-2.5 text-left text-body transition-colors duration-fast hover:border-ai-border hover:bg-ai-subtle">
                  <span>{s}</span><Sparkles className="h-4 w-4 shrink-0 text-ink-tertiary group-hover:text-ai" aria-hidden />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-5 px-1 py-4">
            {msgs.map((m) => m.role === 'user' ? (
              <div key={m.id} className="flex justify-end gap-2.5">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-action px-3.5 py-2.5 text-body text-action-on">{m.text}</p>
                <Avatar name={currentUser.name} size="sm" className="mt-auto" />
              </div>
            ) : <AiResponseView key={m.id} message={m} threadId={threadId} compact={compact} />)}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form className="mx-auto w-full max-w-3xl shrink-0 pt-3" onSubmit={(e) => { e.preventDefault(); submit(text) }}>
        {demo.aiOutage && <Callout tone="warning" className="mb-2" title="Demo: AI outage is switched on">Answers will fail so you can see the error state. Turn it off in Demo controls.</Callout>}
        <div className="flex items-end gap-2 rounded-xl border border-line-strong bg-surface p-2 shadow-xs focus-within:border-action focus-within:shadow-focus">
          <label htmlFor={`composer-${threadId}`} className="sr-only">Ask Atlas AI a question</label>
          <textarea id={`composer-${threadId}`} rows={1} value={text} autoFocus={autoFocus} placeholder={riskId ? 'Ask about this risk…' : 'Ask about your risks, people, vendors…'}
            onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(text) } }}
            className="max-h-32 min-h-[2.25rem] flex-1 resize-none bg-transparent px-2 py-1.5 text-body outline-none placeholder:text-ink-tertiary" />
          <Button type="submit" variant="primary" size="md" aria-label="Send question" disabled={!text.trim() || busy} className="h-9 w-9 px-0"><ArrowUp className="h-4 w-4" aria-hidden /></Button>
        </div>
        <p className="mt-2 text-center text-caption text-ink-tertiary">Atlas AI can make mistakes. Check the sources before acting. It never changes anything without your approval.</p>
      </form>
    </div>
  )
}
