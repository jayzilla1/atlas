import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { tokenValue } from '@/tokens/manifest'

/** Re-render when the theme attribute flips so resolved token values stay accurate. */
export function useThemeTick() {
  const [n, setN] = useState(0)
  useEffect(() => {
    const mo = new MutationObserver(() => setN((x) => x + 1))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [])
  return n
}

/** A labelled specimen: component name, short note, token chips — the unit the Figma library should mirror. */
export function Specimen({ name, description, variants, states, tokens, children, id }: {
  name: string; description?: string; variants?: string[]; states?: string[]; tokens?: string[]; children: ReactNode; id?: string
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20 rounded-lg border border-line bg-surface">
      <header className="border-b border-line px-5 py-3.5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 id={`${id}-h`} className="text-title-3">{name}</h3>
          <code className="rounded bg-sunken px-1.5 py-0.5 text-caption text-ink-secondary">&lt;{name.replace(/\s+/g, '')} /&gt;</code>
        </div>
        {description && <p className="mt-1 text-body-sm text-ink-secondary">{description}</p>}
        {(variants || states) && (
          <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-caption">
            {variants && <div className="flex gap-1.5"><dt className="font-semibold text-ink-secondary">Variants</dt><dd>{variants.join(' · ')}</dd></div>}
            {states && <div className="flex gap-1.5"><dt className="font-semibold text-ink-secondary">States</dt><dd>{states.join(' · ')}</dd></div>}
          </dl>
        )}
      </header>
      <div className="p-5">{children}</div>
      {tokens && <footer className="flex flex-wrap items-center gap-1.5 border-t border-line bg-sunken/50 px-5 py-2.5"><span className="mr-1 text-caption font-semibold text-ink-secondary">Tokens</span>{tokens.map((t) => <code key={t} className="rounded border border-line bg-surface px-1.5 py-0.5 text-caption">{t}</code>)}</footer>}
    </section>
  )
}

export function Swatch({ token, role, large }: { token: string; role?: string; large?: boolean }) {
  useThemeTick()
  const v = tokenValue(token)
  return (
    <div className="min-w-0">
      <div className={cn('rounded-md border border-line', large ? 'h-16' : 'h-10')} style={{ background: `var(${token})` }} aria-hidden />
      <p className="mt-1.5 truncate font-mono text-caption font-medium" title={token}>{token.replace('--', '')}</p>
      <p className="truncate font-mono text-caption text-ink-tertiary">{v}</p>
      {role && <p className="truncate text-caption text-ink-secondary">{role}</p>}
    </div>
  )
}

/** WCAG contrast helpers (computed live from the resolved tokens). */
const canonCache = new Map<string, [number, number, number]>()
function rgbOf(value: string): [number, number, number] {
  const k = value
  if (canonCache.has(k + document.documentElement.dataset.theme)) return canonCache.get(k + document.documentElement.dataset.theme)!
  const el = document.createElement('span'); el.style.color = value; document.body.appendChild(el)
  const m = getComputedStyle(el).color.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0]; el.remove()
  const out: [number, number, number] = [m[0], m[1], m[2]]
  canonCache.set(k + document.documentElement.dataset.theme, out); return out
}
const lum = ([r, g, b]: [number, number, number]) => { const f = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
export function contrast(fgToken: string, bgToken: string) {
  const a = lum(rgbOf(tokenValue(fgToken))); const b = lum(rgbOf(tokenValue(bgToken)))
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}
