import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { cn } from '@/utils/cn'

type ToastTone = 'success' | 'info' | 'danger'
interface ToastInput { title: string; description?: string; tone?: ToastTone; action?: { label: string; onClick: () => void } }
interface ToastItem extends ToastInput { id: number }
const Ctx = createContext<(t: ToastInput) => void>(() => {})
export const useToast = () => useContext(Ctx)

const ICON = { success: CircleCheck, info: Info, danger: CircleAlert }
const COLOR = { success: 'text-success', info: 'text-info', danger: 'text-danger' }

/** Short confirmations ("Amari checked in · Undo"). Announced politely to screen readers; pauses while hovered or focused. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), [])
  const push = useCallback((t: ToastInput) => { const id = ++seq.current; setItems((l) => [...l.slice(-1), { id, ...t }]) }, [])
  const value = useMemo(() => push, [push])
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+0.75rem)] z-[90] flex flex-col items-center gap-2 px-3 lg:bottom-6 lg:items-start lg:pl-[calc(var(--sidebar-width)+2.5rem)]" role="status" aria-live="polite" aria-atomic="false">
        {items.map((t) => <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />)}
      </div>
    </Ctx.Provider>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const t = setTimeout(onDismiss, item.action ? 8000 : 5000)
    return () => clearTimeout(t)
  }, [paused, onDismiss, item.action])
  const Icon = ICON[item.tone ?? 'success']
  return (
    <div
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg bg-ink px-4 py-3 text-ink-inverse shadow-lg anim-fade-in"
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', item.tone === 'danger' ? 'text-[#ff9b8f]' : item.tone === 'info' ? 'text-[#9cc8ee]' : 'text-[#8fd6ae]')} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-small font-semibold">{item.title}</p>
        {item.description && <p className="text-caption text-[#e8dfd2]">{item.description}</p>}
      </div>
      {item.action && (
        <button type="button" onClick={() => { item.action!.onClick(); onDismiss() }} className="min-h-8 rounded-md px-2 text-small font-bold text-[#ffc9a3] underline-offset-2 hover:underline">
          {item.action.label}
        </button>
      )}
      <button type="button" aria-label="Dismiss notification" onClick={onDismiss} className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#e8dfd2] hover:bg-white/10">
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}
export { COLOR as toastColor }
