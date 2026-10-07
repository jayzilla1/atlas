import { Menu, Search, Sparkles, FlaskConical } from 'lucide-react'
import { useUi } from './UiContext'
import { Button, IconButton } from '@/components/ui/Button'
import { useStore } from '@/state/store'
import { ROLE_LABEL } from '@/state/permissions'
import { Badge } from '@/components/ui/Badge'
import { LogoMark } from './Sidebar'

export function Header() {
  const ui = useUi(); const { role } = useStore()
  const mac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)
  return (
    <header data-ds="Header" className="sticky top-0 z-20 flex h-[4.5rem] items-center gap-3 bg-canvas px-4 sm:px-6 lg:px-8">
      <IconButton label="Open navigation" className="md:hidden" onClick={() => ui.setMobileNav(true)}><Menu className="h-5 w-5" /></IconButton>
      <span className="md:hidden"><LogoMark size={26} /></span>
      <button type="button" onClick={() => ui.setPaletteOpen(true)} aria-label="Search (opens command palette)" aria-keyshortcuts="Control+K Meta+K"
        className="ml-1 hidden h-11 min-w-0 max-w-lg flex-1 items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-left text-body text-ink-tertiary shadow-xs transition-colors duration-fast hover:border-line-strong sm:flex">
        <Search className="h-4 w-4 shrink-0" aria-hidden /><span className="flex-1 truncate">Search risks, people, apps…</span>
        <kbd className="rounded-md bg-sunken px-1.5 py-0.5 text-caption font-medium text-ink-secondary">{mac ? '⌘' : 'Ctrl'} K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-2">
        {role !== 'admin' && <Badge tone="warning" className="hidden lg:inline-flex">Viewing as {ROLE_LABEL[role]}</Badge>}
        <IconButton label="Search" variant="secondary" className="sm:hidden" onClick={() => ui.setPaletteOpen(true)}><Search className="h-5 w-5" /></IconButton>
        <IconButton label="Demo controls" variant="secondary" onClick={() => ui.setDemoOpen(true)}><FlaskConical className="h-[18px] w-[18px]" /></IconButton>
        <Button variant="primary" iconLeft={<Sparkles className="h-4 w-4" />} onClick={() => ui.openAsk()}>Ask Atlas</Button>
      </div>
    </header>
  )
}
