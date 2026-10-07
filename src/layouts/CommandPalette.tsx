import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { CornerDownLeft, LayoutDashboard, LifeBuoy, Paintbrush, Search, Settings, Sparkles } from 'lucide-react'
import { useStore } from '@/state/store'
import { useUi } from './UiContext'
import { applications } from '@/data/applications'
import { vendors } from '@/data/vendors'
import { policies } from '@/data/policies'
import { ENTITY_META } from '@/components/domain/entities'
import { cn } from '@/utils/cn'

interface Item { id: string; label: string; hint: string; to: string; Icon: typeof Search; group: string }
const PAGES: Item[] = [
  { id: 'p-over', label: 'Overview', hint: 'Dashboard', to: '/', Icon: LayoutDashboard, group: 'Go to' },
  { id: 'p-ai', label: 'AI Assistant', hint: 'Ask Atlas AI', to: '/assistant', Icon: Sparkles, group: 'Go to' },
  { id: 'p-rep', label: 'Reports', hint: 'Trends and tables', to: '/reports', Icon: LayoutDashboard, group: 'Go to' },
  { id: 'p-help', label: 'Help & glossary', hint: 'Plain-English definitions', to: '/help', Icon: LifeBuoy, group: 'Go to' },
  { id: 'p-set', label: 'Settings', hint: 'Workspace and AI controls', to: '/settings', Icon: Settings, group: 'Go to' },
  { id: 'p-ds', label: 'Design System', hint: 'Tokens, components, states', to: '/design-system', Icon: Paintbrush, group: 'Go to' },
]

/** CommandPalette — ⌘K / Ctrl+K. Searches every record type: the fastest way through the connected data. */
export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useUi(); const s = useStore(); const nav = useNavigate()
  const [q, setQ] = useState(''); const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const prev = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(!paletteOpen) } }
    document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey)
  }, [paletteOpen, setPaletteOpen])
  useEffect(() => { if (paletteOpen) { prev.current = document.activeElement as HTMLElement; setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 0) } else prev.current?.focus?.() }, [paletteOpen])

  const items = useMemo<Item[]>(() => {
    const t = q.trim().toLowerCase()
    if (!t) return PAGES
    const m = (x: string) => x.toLowerCase().includes(t)
    return [
      ...PAGES.filter((p) => m(p.label) || m(p.hint)),
      ...s.risks.filter((r) => m(r.name) || m(r.id)).slice(0, 5).map((r) => ({ id: r.id, label: r.name, hint: `${r.id} · ${r.severity}`, to: `/risks/${r.id}`, Icon: ENTITY_META.risk.Icon, group: 'Risks' })),
      ...s.people.filter((p) => m(p.name) || m(p.title)).slice(0, 5).map((p) => ({ id: p.id, label: p.name, hint: `${p.title} · ${p.department}`, to: `/people/${p.id}`, Icon: ENTITY_META.person.Icon, group: 'People' })),
      ...applications.filter((a) => m(a.name)).slice(0, 4).map((a) => ({ id: a.id, label: a.name, hint: a.category, to: `/applications/${a.id}`, Icon: ENTITY_META.application.Icon, group: 'Applications' })),
      ...vendors.filter((v) => m(v.name)).slice(0, 4).map((v) => ({ id: v.id, label: v.name, hint: v.category, to: `/vendors/${v.id}`, Icon: ENTITY_META.vendor.Icon, group: 'Vendors' })),
      ...policies.filter((p) => m(p.name)).slice(0, 3).map((p) => ({ id: p.id, label: p.name, hint: `v${p.version}`, to: `/policies/${p.id}`, Icon: ENTITY_META.policy.Icon, group: 'Policies' })),
      ...s.tasks.filter((x) => m(x.name)).slice(0, 4).map((x) => ({ id: x.id, label: x.name, hint: x.id, to: '/tasks', Icon: ENTITY_META.task.Icon, group: 'Tasks' })),
    ]
  }, [q, s.risks, s.people, s.tasks])
  useEffect(() => setActive(0), [q])
  if (!paletteOpen) return null
  const go = (it: Item) => { setPaletteOpen(false); nav(it.to) }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); setPaletteOpen(false) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Enter' && items[active]) { e.preventDefault(); go(items[active]) }
    else if (e.key === 'Tab') e.preventDefault()
  }
  let lastGroup = ''
  return createPortal(
    <div className="fixed inset-0 z-[88] flex items-start justify-center p-4 pt-[12vh]" onKeyDown={onKey}>
      <div className="absolute inset-0 animate-fade-in bg-[var(--color-bg-overlay)]" onClick={() => setPaletteOpen(false)} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Search Atlas" data-ds="CommandPalette" className="relative w-full max-w-xl animate-pop overflow-hidden rounded-xl border border-line bg-elevated shadow-lg">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 text-ink-tertiary" aria-hidden />
          <input ref={inputRef} role="combobox" aria-expanded aria-controls="palette-list" aria-activedescendant={items[active] ? `pal-${items[active].id}` : undefined} aria-label="Search risks, people, applications, vendors and policies"
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search risks, people, apps, vendors, policies…" className="h-12 flex-1 bg-transparent text-body-lg outline-none placeholder:text-ink-tertiary" />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-caption text-ink-tertiary">Esc</kbd>
        </div>
        <ul id="palette-list" role="listbox" className="scroll-thin max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 && <li className="px-3 py-8 text-center text-body text-ink-secondary" role="presentation">No results for “{q}”. Try a person’s name, an app, or a risk keyword like “contractor”.</li>}
          {items.map((it, i) => {
            const showGroup = it.group !== lastGroup; lastGroup = it.group
            return (
              <li key={it.group + it.id} role="presentation">
                {showGroup && <p className="px-3 pb-1 pt-2 text-overline uppercase text-ink-tertiary" role="presentation">{it.group}</p>}
                <div id={`pal-${it.id}`} role="option" aria-selected={i === active} onMouseMove={() => setActive(i)} onClick={() => go(it)}
                  className={cn('flex cursor-pointer items-center gap-3 rounded-md px-3 py-2', i === active && 'bg-selected')}>
                  <it.Icon className="h-4 w-4 shrink-0 text-ink-tertiary" aria-hidden />
                  <span className="min-w-0 flex-1"><span className="block truncate text-body font-medium">{it.label}</span><span className="block truncate text-caption text-ink-secondary">{it.hint}</span></span>
                  {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-ink-tertiary" aria-hidden />}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>, document.body)
}
