import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '@/state/store'
import { SEMANTIC_COLORS, tokenValue } from '@/tokens/manifest'

interface Info {
  name: string; variant?: string; size?: string; tag: string; w: number; h: number
  styles: { label: string; value: string; token?: string }[]
}

const canon = new Map<string, string>()
function toRgb(v: string): string {
  if (canon.has(v)) return canon.get(v)!
  const el = document.createElement('span'); el.style.color = v; document.body.appendChild(el)
  const out = getComputedStyle(el).color; el.remove(); canon.set(v, out); return out
}
/** Reverse lookup: which semantic colour token resolves to this computed colour? */
function colorToken(computed: string): string | undefined {
  if (!computed || computed === 'rgba(0, 0, 0, 0)' || computed === 'transparent') return undefined
  for (const g of SEMANTIC_COLORS) for (const tk of g.tokens) {
    const val = tokenValue(tk.name); if (!val) continue
    if (toRgb(val) === computed) return tk.name
  }
  return undefined
}
const RADIUS: Record<string, string> = { '4px': '--radius-xs', '6px': '--radius-sm', '8px': '--radius-md', '12px': '--radius-lg', '16px': '--radius-xl' }

function inspect(el: HTMLElement): Info {
  const root = el.closest<HTMLElement>('[data-ds]')!
  const cs = getComputedStyle(root); const r = root.getBoundingClientRect()
  const styles: Info['styles'] = []
  const bg = cs.backgroundColor; if (bg !== 'rgba(0, 0, 0, 0)') styles.push({ label: 'Background', value: bg, token: colorToken(bg) })
  styles.push({ label: 'Text colour', value: cs.color, token: colorToken(cs.color) })
  if (parseFloat(cs.borderTopWidth) > 0) styles.push({ label: 'Border', value: `${cs.borderTopWidth} ${cs.borderTopColor}`, token: colorToken(cs.borderTopColor) })
  styles.push({ label: 'Font', value: `${cs.fontSize} / ${cs.lineHeight} · ${cs.fontWeight}` })
  styles.push({ label: 'Padding', value: cs.padding })
  styles.push({ label: 'Radius', value: cs.borderTopLeftRadius, token: RADIUS[cs.borderTopLeftRadius] })
  if (cs.boxShadow !== 'none') styles.push({ label: 'Shadow', value: cs.boxShadow.length > 40 ? cs.boxShadow.slice(0, 40) + '…' : cs.boxShadow })
  return { name: root.dataset.ds!, variant: root.dataset.dsVariant, size: root.dataset.dsSize, tag: root.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height), styles }
}

/** Portfolio Inspector — hover or focus any component to read its design spec. Turned on in Demo controls. */
export function InspectorOverlay() {
  const { inspect: on, setInspect } = useStore()
  const [info, setInfo] = useState<Info | null>(null)
  const last = useRef<Element | null>(null)
  useEffect(() => {
    if (!on) { setInfo(null); return }
    const handle = (e: Event) => {
      const t = (e.target as HTMLElement)?.closest?.('[data-ds]') as HTMLElement | null
      if (!t || t === last.current || t.closest('[data-inspector]')) return
      last.current = t; setInfo(inspect(t))
    }
    document.addEventListener('mouseover', handle); document.addEventListener('focusin', handle)
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setInspect(false) }
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mouseover', handle); document.removeEventListener('focusin', handle); document.removeEventListener('keydown', esc) }
  }, [on, setInspect])
  if (!on) return null
  return (
    <aside data-inspector aria-label="Portfolio inspector" className="fixed bottom-4 left-4 z-[96] w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-line bg-elevated p-3.5 shadow-lg">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div><p className="text-overline uppercase text-ink-tertiary">Portfolio inspector</p>
          <p className="text-title-3">{info ? info.name : 'Hover a component'}</p></div>
        <button type="button" aria-label="Close inspector" onClick={() => setInspect(false)} className="flex h-7 w-7 items-center justify-center rounded-md text-ink-tertiary hover:bg-sunken"><X className="h-4 w-4" aria-hidden /></button>
      </div>
      {info ? (
        <>
          <p className="mb-2 text-body-sm text-ink-secondary">{info.variant && <>variant <code className="rounded bg-sunken px-1">{info.variant}</code> </>}{info.size && <>size <code className="rounded bg-sunken px-1">{info.size}</code> </>}· &lt;{info.tag}&gt; · {info.w}×{info.h}px</p>
          <dl className="space-y-1.5 text-caption">
            {info.styles.map((s) => (
              <div key={s.label} className="grid grid-cols-[5rem_1fr] gap-2"><dt className="text-ink-secondary">{s.label}</dt>
                <dd className="min-w-0 break-words font-mono text-ink">{s.value}{s.token && <span className="mt-0.5 block text-ai-ink">{s.token}</span>}</dd></div>
            ))}
          </dl>
        </>
      ) : <p className="text-body-sm text-ink-secondary">Move the pointer (or Tab) over buttons, badges, cards and tables to inspect them. Press Esc to exit.</p>}
    </aside>
  )
}
