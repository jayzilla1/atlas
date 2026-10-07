import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Copy, RefreshCw, ThumbsDown, ThumbsUp, TriangleAlert, SearchX, WifiOff, Square } from 'lucide-react'
import type { ChatMessage } from '@/ai/types'
import { textOf, useAssistant } from '@/ai/AssistantContext'
import { SeverityBadge } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { Callout } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { EntityChip, entityPath } from '@/components/domain/entities'
import { AiBadge, AiThinking, Caret, ConfidenceBadge, SourceList } from './AiParts'
import { AiActionCard } from './AiActionCard'
import { cn } from '@/utils/cn'

/** One Atlas AI answer, in every possible state. */
export function AiResponseView({ message, threadId, compact }: { message: ChatMessage; threadId: string; compact?: boolean }) {
  const a = useAssistant(); const toast = useToast(); const nav = useNavigate()
  const r = message.response
  if (!r) return null
  const full = textOf(message)
  const shown = message.status === 'done' || message.status === 'stopped' && message.shown === undefined ? full : full.slice(0, message.shown ?? 0)
  const [head, ...rest] = shown.split('\n\n')
  const complete = message.status === 'done'
  const streaming = message.status === 'streaming'
  const stopped = message.status === 'stopped'
  const error = r.error

  return (
    <article data-ds="AiResponse" data-ds-variant={message.status} aria-label="Atlas AI answer" className="rounded-lg border border-line bg-surface p-4 shadow-xs [border-left:var(--ai-rule-width)_solid_var(--color-ai-accent)]">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <AiBadge />
        {(complete || stopped) && !error?.kind.includes('outage') && <ConfidenceBadge level={r.confidence} />}
      </header>

      {message.status === 'thinking' && <AiThinking steps={r.thinking} index={message.stepIndex ?? 0} onStop={() => a.stop(threadId, message.id)} />}

      {message.status !== 'thinking' && (
        <div aria-live={streaming ? 'off' : 'polite'}>
          {error?.kind === 'outage' && complete ? (
            <Callout tone="critical" role="alert" title="Atlas AI is unavailable right now"
              actions={<Button size="sm" iconLeft={<RefreshCw className="h-4 w-4" />} onClick={() => a.retry(threadId, message.id)}>Try again</Button>}>
              <span className="flex items-start gap-1.5"><WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{error.message}</span>
            </Callout>
          ) : (
            <>
              <p className={cn('text-body-lg font-medium', error?.kind === 'no_data' && 'text-ink')}>{head}{streaming && !rest.length && <Caret />}</p>
              {rest.length > 0 && <p className="mt-2 text-body text-ink-secondary">{rest.join('\n\n')}{streaming && <Caret />}</p>}
              {stopped && <p className="mt-2 flex items-center gap-1.5 text-body-sm text-ink-secondary"><Square className="h-3 w-3" aria-hidden />You stopped this answer{shown.length < full.length ? ' — only part of it is shown' : ''}.</p>}
            </>
          )}
        </div>
      )}

      {complete && !(error?.kind === 'outage') && (
        <div className="animate-rise">
          {error?.kind === 'no_data' && (
            <Callout className="mt-3" tone="neutral" title="Why Atlas stopped here">
              <span className="flex items-start gap-1.5"><SearchX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{error.message}</span>
            </Callout>
          )}

          {r.findings && r.findings.length > 0 && (
            <ol className="mt-4 space-y-2" aria-label="Findings">
              {r.findings.map((f, i) => (
                <li key={i}>
                  <Link to={entityPath(f.entity)} className="group flex gap-3 rounded-lg border border-line p-3 transition-colors duration-fast hover:border-line-strong hover:bg-hover">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunken text-caption font-semibold text-ink-secondary" aria-hidden>{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-body font-semibold">{f.title}</span>{f.priority && <SeverityBadge severity={f.priority} size="sm" />}</span>
                      <span className="mt-0.5 block text-body-sm text-ink-secondary">{f.detail}</span>
                    </span>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ink-tertiary transition-transform duration-fast group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ol>
          )}

          {r.records && r.records.length > 0 && !compact && (
            <div className="mt-4"><p className="mb-1.5 text-caption font-semibold text-ink-secondary">Relevant records</p>
              <div className="flex flex-wrap gap-1.5">{r.records.map((e) => <EntityChip key={e.type + e.id} entity={e} />)}</div></div>
          )}

          {r.proposal && <div className="mt-4"><AiActionCard threadId={threadId} messageId={message.id} proposal={r.proposal} /></div>}

          {r.caveat && !error && (
            <div className="mt-4 flex gap-2 rounded-md bg-sunken p-3 text-body-sm text-ink-secondary">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning-fg" aria-hidden />
              <p><span className="font-semibold text-ink">What Atlas isn’t sure about. </span>{r.caveat}</p>
            </div>
          )}

          {r.nextActions.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-caption font-semibold text-ink-secondary">Suggested next steps</p>
              <div className="flex flex-wrap gap-2">
                {r.nextActions.map((n) => <Button key={n.label} size="sm" onClick={() => (n.to ? nav(n.to) : n.prompt ? a.send(threadId, n.prompt) : undefined)} iconRight={n.to ? <ArrowRight className="h-3.5 w-3.5" /> : undefined}>{n.label}</Button>)}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <SourceList sources={r.sources} />
            <div className="flex items-center gap-0.5">
              <IconButton size="sm" label="Helpful" pressed={message.feedback === 'up'} onClick={() => { a.feedback(threadId, message.id, 'up'); toast({ tone: 'info', title: 'Thanks — feedback noted', description: 'It helps Atlas improve its answers.', duration: 2500 }) }}><ThumbsUp className="h-4 w-4" /></IconButton>
              <IconButton size="sm" label="Not helpful" pressed={message.feedback === 'down'} onClick={() => a.feedback(threadId, message.id, 'down')}><ThumbsDown className="h-4 w-4" /></IconButton>
              <IconButton size="sm" label="Copy answer" onClick={() => { void navigator.clipboard?.writeText(full); toast({ tone: 'success', title: 'Copied to clipboard', duration: 2000 }) }}><Copy className="h-4 w-4" /></IconButton>
              <IconButton size="sm" label="Regenerate answer" onClick={() => a.retry(threadId, message.id)}><RefreshCw className="h-4 w-4" /></IconButton>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
