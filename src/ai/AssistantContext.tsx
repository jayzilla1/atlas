import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useStore } from '@/state/store'
import { useToast } from '@/components/ui/Toast'
import { offsetFromToday } from '@/utils/dates'
import { respond, type EngineContext } from './engine'
import type { ChatMessage, Thread, TaskProposal } from './types'

/**
 * Conversation state + the “streaming” simulation.
 * A single 45 ms ticker advances every in-flight assistant message:
 *   thinking (status text cycles) → streaming (characters revealed) → done (structured blocks appear).
 * Users can Stop at any point; the partial answer is kept and labelled.
 */
interface Ctx {
  threads: Record<string, Thread>
  order: string[]
  activeId: string
  setActive: (id: string) => void
  ensureThread: (id: string, opts?: { riskId?: string; title?: string }) => void
  newThread: () => string
  send: (threadId: string, question: string) => void
  stop: (threadId: string, messageId: string) => void
  retry: (threadId: string, messageId: string) => void
  feedback: (threadId: string, messageId: string, v: 'up' | 'down') => void
  clear: (threadId: string) => void
  toggleItem: (threadId: string, messageId: string, key: string) => void
  cancelProposal: (threadId: string, messageId: string) => void
  reopenProposal: (threadId: string, messageId: string) => void
  approveProposal: (threadId: string, messageId: string) => void
  undoProposal: (threadId: string, messageId: string) => void
}
const AssistantCtx = createContext<Ctx | null>(null)
export const useAssistant = () => { const c = useContext(AssistantCtx); if (!c) throw new Error('AssistantProvider missing'); return c }

const reduce = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const textOf = (m: ChatMessage) => (m.response ? m.response.headline + (m.response.body ? `\n\n${m.response.body}` : '') : '')
const stamp = (n: number) => { const s = 5 + n; return `9:30:${String(s % 60).padStart(2, '0')}` }
let uid = 0
const mid = () => `m${++uid}`

export function AssistantProvider({ children }: { children: ReactNode }) {
  const store = useStore()
  const toast = useToast()
  const storeRef = useRef(store); storeRef.current = store
  const toastRef = useRef(toast); toastRef.current = toast

  const engineCtx = useCallback((riskId?: string): EngineContext => {
    const s = storeRef.current
    return { risks: s.risks, tasks: s.tasks, people: s.people, riskId, outage: s.demo.aiOutage, byId: s.personById }
  }, [])

  const [threads, setThreads] = useState<Record<string, Thread>>(() => {
    // One finished past conversation so the history list isn't empty.
    const q = 'Which vendors need attention?'
    const past: Thread = {
      id: 'past-vendors', title: q,
      messages: [{ id: mid(), role: 'user', text: q }, (() => { const r = respond(q, { risks: store.risks, tasks: store.tasks, people: store.people, byId: store.personById }); return { id: mid(), role: 'assistant' as const, question: q, status: 'done' as const, response: r, shown: 99999 } })()],
    }
    return { main: { id: 'main', title: 'New conversation', messages: [] }, [past.id]: past }
  })
  const [order, setOrder] = useState<string[]>(['main', 'past-vendors'])
  const [activeId, setActive] = useState('main')

  const patchMsg = useCallback((tid: string, id: string, fn: (m: ChatMessage) => ChatMessage) => {
    setThreads((t) => t[tid] ? { ...t, [tid]: { ...t[tid], messages: t[tid].messages.map((m) => (m.id === id ? fn(m) : m)) } } : t)
  }, [])
  const patchProposal = useCallback((tid: string, id: string, fn: (p: TaskProposal) => TaskProposal) => {
    patchMsg(tid, id, (m) => (m.response?.proposal ? { ...m, response: { ...m.response, proposal: fn(m.response.proposal) } } : m))
  }, [patchMsg])

  // ----- the ticker -----
  const hasLive = useMemo(() => Object.values(threads).some((t) => t.messages.some((m) => m.status === 'thinking' || m.status === 'streaming')), [threads])
  useEffect(() => {
    if (!hasLive) return
    const fast = reduce()
    const id = window.setInterval(() => {
      setThreads((all) => {
        let changed = false
        const next: Record<string, Thread> = {}
        for (const [k, t] of Object.entries(all)) {
          next[k] = { ...t, messages: t.messages.map((m) => {
            if (m.role !== 'assistant' || !m.response) return m
            if (m.status === 'thinking') {
              changed = true
              const ticks = (m.stepIndex ?? 0) + 1
              const thinkTicks = fast ? 6 : 30 + (m.id.length % 8)
              if (ticks >= thinkTicks) return { ...m, status: fast ? 'done' : 'streaming', stepIndex: ticks, shown: fast ? 99999 : 0 }
              return { ...m, stepIndex: ticks }
            }
            if (m.status === 'streaming') {
              changed = true
              const total = textOf(m).length
              const shown = (m.shown ?? 0) + 6
              return shown >= total ? { ...m, status: 'done', shown: total } : { ...m, shown }
            }
            return m
          }) }
        }
        return changed ? next : all
      })
    }, 45)
    return () => window.clearInterval(id)
  }, [hasLive])

  const ensureThread = useCallback((id: string, opts?: { riskId?: string; title?: string }) => {
    setThreads((t) => t[id] ? t : { ...t, [id]: { id, title: opts?.title ?? 'New conversation', messages: [], riskId: opts?.riskId } })
  }, [])
  const newThread = useCallback(() => {
    const id = `t${++uid}`
    setThreads((t) => ({ ...t, [id]: { id, title: 'New conversation', messages: [] } }))
    setOrder((o) => [id, ...o.filter((x) => x !== id)])
    setActive(id)
    return id
  }, [])

  const send = useCallback((threadId: string, question: string) => {
    const q = question.trim()
    if (!q) return
    const thread = threads[threadId]
    const response = respond(q, engineCtx(thread?.riskId))
    const user: ChatMessage = { id: mid(), role: 'user', text: q }
    const bot: ChatMessage = { id: mid(), role: 'assistant', question: q, status: 'thinking', response, stepIndex: 0 }
    setThreads((t) => {
      const cur = t[threadId] ?? { id: threadId, title: q, messages: [] }
      return { ...t, [threadId]: { ...cur, title: cur.messages.length ? cur.title : q.length > 48 ? q.slice(0, 46) + '…' : q, messages: [...cur.messages, user, bot] } }
    })
    setOrder((o) => (o.includes(threadId) ? o : [threadId, ...o]))
  }, [threads, engineCtx])

  const stop = useCallback((tid: string, id: string) => patchMsg(tid, id, (m) => ({ ...m, status: 'stopped', shown: m.status === 'thinking' ? 0 : m.shown })), [patchMsg])
  const retry = useCallback((tid: string, id: string) => {
    const t = threads[tid]; const m = t?.messages.find((x) => x.id === id)
    if (!m?.question) return
    patchMsg(tid, id, (x) => ({ ...x, response: respond(m.question!, engineCtx(t.riskId)), status: 'thinking', stepIndex: 0, shown: 0, feedback: undefined }))
  }, [threads, patchMsg, engineCtx])
  const feedback = useCallback((tid: string, id: string, v: 'up' | 'down') => patchMsg(tid, id, (m) => ({ ...m, feedback: m.feedback === v ? undefined : v })), [patchMsg])
  const clear = useCallback((tid: string) => setThreads((t) => ({ ...t, [tid]: { ...t[tid], messages: [] } })), [])

  // ----- Human-in-the-loop proposal actions -----
  const toggleItem = useCallback((tid: string, id: string, key: string) => patchProposal(tid, id, (p) => ({ ...p, items: p.items.map((i) => (i.key === key ? { ...i, included: !i.included } : i)) })), [patchProposal])
  const cancelProposal = useCallback((tid: string, id: string) => patchProposal(tid, id, (p) => ({ ...p, status: 'cancelled', log: [...p.log, { at: stamp(p.log.length + 8), text: 'Maya Okafor cancelled — no tasks were created' }] })), [patchProposal])
  const reopenProposal = useCallback((tid: string, id: string) => patchProposal(tid, id, (p) => ({ ...p, status: 'proposed' })), [patchProposal])

  const approveProposal = useCallback((tid: string, id: string) => {
    const m = threads[tid]?.messages.find((x) => x.id === id); const p = m?.response?.proposal
    if (!p) return
    const chosen = p.items.filter((i) => i.included)
    if (!chosen.length) return
    const user = storeRef.current.currentUser.name
    patchProposal(tid, id, (x) => ({ ...x, status: 'running', progress: 0, log: [...x.log, { at: stamp(x.log.length + 8), text: `${user} approved ${chosen.length} tasks` }] }))
    let n = 0
    const step = Math.max(1, Math.ceil(chosen.length / 7))
    const timer = window.setInterval(() => {
      n = Math.min(chosen.length, n + step)
      if (n < chosen.length) { patchProposal(tid, id, (x) => ({ ...x, progress: n })); return }
      window.clearInterval(timer)
      const batchId = `batch-${id}`
      storeRef.current.addTasks(chosen.map((i) => ({
        name: i.name, ownerId: i.managerId, priority: i.priority, status: 'not_started' as const, dueDate: i.dueDate, riskId: p.riskId,
        entity: { type: 'person' as const, id: i.personId }, createdAt: offsetFromToday(0), createdBy: 'ai' as const,
        description: `Created by Atlas AI after approval by ${user}.`,
      })), batchId)
      storeRef.current.log({ actor: 'Atlas AI', kind: 'ai', text: `created ${chosen.length} tasks for managers after approval by ${user}.`, entity: { type: 'risk', id: p.riskId ?? 'R-107' } })
      patchProposal(tid, id, (x) => ({ ...x, status: 'done', progress: chosen.length, batchId, log: [...x.log, { at: stamp(x.log.length + 9), text: `Created ${chosen.length} tasks and linked them to ${x.riskId}` }, { at: stamp(x.log.length + 10), text: 'Logged to the workspace activity feed' }] }))
      toastRef.current({ tone: 'success', title: `${chosen.length} tasks created`, description: 'Assigned to each person’s manager. You can undo this from the chat.', action: { label: 'View tasks', to: '/tasks' } })
    }, 260)
  }, [threads, patchProposal])

  const undoProposal = useCallback((tid: string, id: string) => {
    const p = threads[tid]?.messages.find((x) => x.id === id)?.response?.proposal
    if (!p?.batchId) return
    storeRef.current.undoBatch(p.batchId)
    storeRef.current.log({ actor: storeRef.current.currentUser.name, kind: 'human', text: `undid the creation of ${p.items.filter((i) => i.included).length} tasks made by Atlas AI.`, entity: { type: 'risk', id: p.riskId ?? 'R-107' } })
    patchProposal(tid, id, (x) => ({ ...x, status: 'undone', log: [...x.log, { at: stamp(x.log.length + 11), text: 'Maya Okafor undid the action — tasks removed' }] }))
    toastRef.current({ tone: 'info', title: 'Action undone', description: 'The tasks Atlas created have been removed.' })
  }, [threads, patchProposal])

  const value = useMemo<Ctx>(() => ({ threads, order, activeId, setActive, ensureThread, newThread, send, stop, retry, feedback, clear, toggleItem, cancelProposal, reopenProposal, approveProposal, undoProposal }),
    [threads, order, activeId, ensureThread, newThread, send, stop, retry, feedback, clear, toggleItem, cancelProposal, reopenProposal, approveProposal, undoProposal])
  return <AssistantCtx.Provider value={value}>{children}</AssistantCtx.Provider>
}
export { textOf }
