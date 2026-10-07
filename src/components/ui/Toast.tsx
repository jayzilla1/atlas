import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Link } from 'react-router-dom'

type ToastTone = 'success' | 'error' | 'info' | 'warning'
export interface ToastInput { tone?: ToastTone; title: string; description?: ReactNode; action?: { label: string; onClick?: () => void; to?: string }; duration?: number }
interface ToastItem extends ToastInput { id: number }

const Ctx = createContext<(t: ToastInput) => void>(() => {})
export const useToast = () => useContext(Ctx)

const META = {
  success: { Icon: CheckCircle2, cls: 'text-success-fg' }, error: { Icon: CircleAlert, cls: 'text-critical-fg' },
  info: { Icon: Info, cls: 'text-info-fg' }, warning: { Icon: TriangleAlert, cls: 'text-warning-fg' },
}

/** Toast — transient confirmation. Announced via live region; pauses on hover; never the only record of an action (see Activity). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)
  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), [])
  const push = useCallback((t: ToastInput) => {
    const id = ++counter.current
    setItems((xs) => [...xs.slice(-3), { ...t, id }])
    window.setTimeout(() => dismiss(id), t.duration ?? (t.tone === 'error' ? 9000 : 6500))
  }, [dismiss])
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[95] flex flex-col items-center gap-2 p-4 sm:items-end" aria-live="polite" aria-atomic="false">
        {items.map((t) => {
          const m = META[t.tone ?? 'success']
          return (
            <div key={t.id} role={t.tone === 'error' ? 'alert' : 'status'} data-ds="Toast" data-ds-variant={t.tone ?? 'success'}
              className="pointer-events-auto flex w-full max-w-sm animate-rise items-start gap-3 rounded-lg border border-line bg-elevated p-3.5 shadow-lg">
              <m.Icon className={cn('mt-0.5 h-5 w-5 shrink-0', m.cls)} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold">{t.title}</p>
                {t.description && <p className="mt-0.5 text-body-sm text-ink-secondary">{t.description}</p>}
                {t.action && (t.action.to
                  ? <Link to={t.action.to} onClick={() => dismiss(t.id)} className="mt-1.5 inline-block text-body-sm font-semibold text-ink-link hover:underline">{t.action.label}</Link>
                  : <button type="button" onClick={() => { t.action?.onClick?.(); dismiss(t.id) }} className="mt-1.5 text-body-sm font-semibold text-ink-link hover:underline">{t.action.label}</button>)}
              </div>
              <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(t.id)} className="-m-1 flex h-7 w-7 items-center justify-center rounded-sm text-ink-tertiary hover:bg-sunken hover:text-ink"><X className="h-4 w-4" aria-hidden /></button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}
