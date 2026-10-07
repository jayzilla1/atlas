import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { AppWindow, Building2, ChevronsUpDown, FileText, LayoutDashboard, LifeBuoy, ListChecks, Lock, PanelLeftClose, PanelLeftOpen, Settings, ShieldAlert, Sparkles, Users, BarChart3, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useStore } from '@/state/store'
import { openRisks, outstandingTasks } from '@/data/selectors'
import { useUi } from './UiContext'
import { Tooltip } from '@/components/ui/Tooltip'
import { Dropdown } from '@/components/ui/Dropdown'
import { Avatar } from '@/components/ui/Avatar'
import { IconButton } from '@/components/ui/Button'
import { ROLE_LABEL } from '@/state/permissions'
import { WORKSPACE } from '@/data/insights'

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="8" fill="var(--color-action-primary)" /><path d="M16 6 L25 24 H20.6 L16 14.4 L11.4 24 H7 Z" fill="#fff" /><rect x="11" y="20" width="10" height="2.4" rx="1.2" fill="#BCD0FF" />
    </svg>
  )
}

const MAIN = [
  { to: '/', label: 'Overview', Icon: LayoutDashboard, end: true },
  { to: '/risks', label: 'Risks', Icon: ShieldAlert, count: 'risks' },
  { to: '/tasks', label: 'Tasks', Icon: ListChecks, count: 'tasks' },
  { to: '/people', label: 'People', Icon: Users },
  { to: '/applications', label: 'Applications', Icon: AppWindow },
  { to: '/vendors', label: 'Vendors', Icon: Building2 },
  { to: '/policies', label: 'Policies', Icon: FileText },
  { to: '/reports', label: 'Reports', Icon: BarChart3 },
  { to: '/assistant', label: 'AI Assistant', Icon: Sparkles, ai: true },
] as const

function NavItem({ to, label, Icon, end, count, ai, collapsed, onNavigate }: { to: string; label: string; Icon: typeof Users; end?: boolean; count?: number; ai?: boolean; collapsed: boolean; onNavigate?: () => void }) {
  const link = (
    <NavLink to={to} end={end} onClick={onNavigate} aria-label={collapsed ? (count ? `${label}, ${count}` : label) : undefined}
      className={({ isActive }) => cn('group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-body font-medium transition-colors duration-fast focus-visible:shadow-[inset_0_0_0_2px_var(--color-focus-ring)]',
        isActive ? 'bg-selected text-ink' : 'text-ink-secondary hover:bg-hover hover:text-ink', collapsed && 'justify-center px-0')}>
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute -left-2 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-action" aria-hidden />}
          <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-action' : ai ? 'text-ai' : 'text-ink-tertiary group-hover:text-ink-secondary')} aria-hidden />
          {!collapsed && <span className="flex-1 truncate">{label}</span>}
          {!collapsed && count !== undefined && <span className="rounded-full bg-sunken px-1.5 text-caption font-semibold tabular-nums text-ink-secondary">{count}</span>}
          {collapsed && count !== undefined && <span className="absolute right-1.5 top-1 h-2 w-2 rounded-full bg-action ring-2 ring-surface" aria-hidden />}
        </>
      )}
    </NavLink>
  )
  return collapsed ? <Tooltip content={label} placement="top">{link}</Tooltip> : link
}

export function SidebarContent({ collapsed, onNavigate, mobile }: { collapsed: boolean; onNavigate?: () => void; mobile?: boolean }) {
  const s = useStore(); const ui = useUi()
  const counts = { risks: openRisks(s.risks).length, tasks: outstandingTasks(s.tasks).length }
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Workspace switcher */}
      <div className={cn('flex items-center gap-2 p-3', collapsed && 'justify-center')}>
        <Dropdown label="Switch workspace" placement="bottom-start" width="w-72"
          items={[
            { id: 'h', heading: 'Workspaces', label: WORKSPACE.name, description: '248 people · Atlas Business', icon: <LogoMark size={16} />, checked: true },
            { id: 'sb', label: 'Harborlight Labs (sandbox)', description: 'Sample data · 12 people', icon: <LogoMark size={16} />, checked: false },
            { id: 'new', separatorBefore: true, label: 'Add a workspace', disabled: true, disabledReason: 'Not available in this demo' },
          ]}
          trigger={(p) => collapsed ? (
            <Tooltip content={`${WORKSPACE.name} — switch workspace`} placement="bottom"><button {...p} aria-label="Switch workspace" className="rounded-md p-1 hover:bg-hover"><LogoMark size={32} /></button></Tooltip>
          ) : (
            <button {...p} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md p-1.5 text-left hover:bg-hover" data-ds="WorkspaceSwitcher">
              <LogoMark size={32} />
              <span className="min-w-0 flex-1"><span className="block truncate text-body font-semibold">{WORKSPACE.name}</span><span className="block truncate text-caption text-ink-secondary">Atlas · Sample workspace</span></span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink-tertiary" aria-hidden />
            </button>
          )} />
        {mobile && <IconButton label="Close navigation" onClick={onNavigate}><X className="h-4 w-4" /></IconButton>}
      </div>

      <nav aria-label="Primary" className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <ul className="space-y-0.5">
          {MAIN.map((m) => (
            <li key={m.to}><NavItem {...m} count={'count' in m ? counts[m.count] : undefined} collapsed={collapsed} onNavigate={onNavigate} /></li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-line p-3">
        <ul className="space-y-0.5">
          <li><NavItem to="/help" label="Help" Icon={LifeBuoy} collapsed={collapsed} onNavigate={onNavigate} /></li>
          <li><NavItem to="/settings" label="Settings" Icon={Settings} collapsed={collapsed} onNavigate={onNavigate} /></li>
        </ul>
        <UserMenu collapsed={collapsed} onNavigate={onNavigate} />
        {!mobile && (
          <button type="button" onClick={ui.toggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-pressed={collapsed}
            className={cn('mt-1 flex h-8 w-full items-center gap-3 rounded-md px-2.5 text-body-sm text-ink-tertiary hover:bg-hover hover:text-ink', collapsed && 'justify-center px-0')}>
            {collapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden /> : <PanelLeftClose className="h-4 w-4" aria-hidden />}{!collapsed && 'Collapse'}
          </button>
        )}
      </div>
    </div>
  )
}

export function UserMenu({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const s = useStore(); const ui = useUi()
  const me = s.currentUser
  return (
    <Dropdown label="Account menu" placement="top-start" width="w-72"
      items={[
        { id: 'who', heading: `Signed in as ${me.name}`, label: ROLE_LABEL[s.role], description: me.email, icon: <Lock className="h-4 w-4" />, disabled: true },
        { id: 'demo', separatorBefore: true, label: 'Demo controls', description: 'Role, theme, simulated errors', onSelect: () => ui.setDemoOpen(true) },
        { id: 'tour', label: 'Replay welcome tour', onSelect: () => ui.setTourOpen(true) },
        { id: 'ds', label: 'Design System', description: 'Tokens, components, states', to: '/design-system' },
        { id: 'settings', separatorBefore: true, label: 'Settings', to: '/settings', onSelect: onNavigate },
      ]}
      trigger={(p) => (
        <button {...p} className={cn('mt-1 flex w-full items-center gap-2.5 rounded-md p-1.5 text-left hover:bg-hover', collapsed && 'justify-center')} aria-label={collapsed ? `Account menu for ${me.name}` : undefined}>
          <Avatar name={me.name} size="md" />
          {!collapsed && <span className="min-w-0 flex-1"><span className="block truncate text-body font-semibold">{me.name}</span><span className="block truncate text-caption text-ink-secondary">{ROLE_LABEL[s.role]}</span></span>}
          {!collapsed && <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink-tertiary" aria-hidden />}
        </button>
      )} />
  )
}

/** Desktop/tablet persistent sidebar + mobile off-canvas navigation. */
export function Sidebar() {
  const ui = useUi()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ui.mobileNav) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') ui.setMobileNav(false) }
    document.addEventListener('keydown', onKey)
    ref.current?.querySelector<HTMLElement>('a,button')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [ui.mobileNav]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <aside data-ds="Sidebar" data-ds-variant={ui.collapsed ? 'collapsed' : 'expanded'} aria-label="Sidebar"
        className={cn('sticky top-0 z-30 hidden h-screen shrink-0 border-r border-line bg-surface transition-[width] duration-slow ease-standard md:block', ui.collapsed ? 'w-[var(--layout-sidebar-rail)]' : 'w-[var(--layout-sidebar-width)]')}>
        <SidebarContent collapsed={ui.collapsed} />
      </aside>
      {ui.mobileNav && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <div className="absolute inset-0 animate-fade-in bg-[var(--color-bg-overlay)]" onClick={() => ui.setMobileNav(false)} aria-hidden />
          <div ref={ref} role="dialog" aria-modal="true" aria-label="Navigation" className="absolute inset-y-0 left-0 w-[18rem] max-w-[85vw] animate-slide-in-right bg-surface shadow-lg [animation-direction:normal]">
            <SidebarContent collapsed={false} mobile onNavigate={() => ui.setMobileNav(false)} />
          </div>
        </div>
      )}
    </>
  )
}
