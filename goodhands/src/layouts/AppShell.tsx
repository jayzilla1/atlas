import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Check, FlaskConical, MoreHorizontal, Palette, Sparkles, UserRound } from 'lucide-react'
import { Wordmark } from './Logo'
import { NavIcon } from './NavIcon'
import { DemoPanel } from './DemoPanel'
import { Menu } from '@/components/ui/Menu'
import { Avatar } from '@/components/ui/Avatar'
import { Button, IconButton } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Dialog'
import { AttentionList } from '@/components/domain/Attention'
import { AssistantDrawer } from '@/ai/AssistantDrawer'
import { useAssistant } from '@/ai/AssistantContext'
import { useSession } from '@/state/session'
import { useData } from '@/state/store'
import { OWNER_NAV, STAFF_NAV } from '@/state/permissions'
import { attentionItems } from '@/domain/attention'
import { fmtLong, fmtTime } from '@/utils/dates'
import { cn } from '@/utils/cn'
import { OWNER } from '@/data/clock'

const linkBase = 'group flex min-h-control items-center gap-3 rounded-md px-3 text-small font-semibold transition-colors duration-fast'

export function AppShell() {
  const { role, now } = useSession()
  const nav = role === 'owner' ? OWNER_NAV : STAFF_NAV
  const loc = useLocation()
  const first = useRef(true)
  const [demoOpen, setDemoOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  // After navigating, move keyboard/screen-reader focus to the new page and update the tab title.
  useEffect(() => {
    const current = [...nav].reverse().find((n) => (n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to)))
    document.title = `${current?.label ?? (loc.pathname.startsWith('/design-system') ? 'Design system' : 'GoodHands')} · GoodHands`
    if (first.current) { first.current = false; return }
    window.scrollTo(0, 0)
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [loc.pathname, nav])

  return (
    <div className="min-h-dvh lg:pl-sidebar">
      <a href="#main" className="skip-link">Skip to main content</a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar flex-col border-r border-line bg-surface lg:flex" aria-label="Primary">
        <div className="px-5 pb-4 pt-5"><Link to={role === 'owner' ? '/' : '/today'} aria-label="GoodHands home" className="rounded-md"><Wordmark /></Link></div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-0.5">
            {nav.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end} className={({ isActive }) => cn(linkBase, isActive ? 'bg-primary-subtle text-primary-text' : 'text-ink-secondary hover:bg-surface-sunken hover:text-ink')}>
                  <NavIcon name={n.icon} />{n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-line-subtle p-3">
          <Link to="/design-system" className={cn(linkBase, 'text-ink-secondary hover:bg-surface-sunken hover:text-ink')}><Palette className="h-5 w-5" aria-hidden />Design system</Link>
          <button type="button" onClick={() => setDemoOpen(true)} className={cn(linkBase, 'w-full text-ink-secondary hover:bg-surface-sunken hover:text-ink')}><FlaskConical className="h-5 w-5" aria-hidden />Demo controls</button>
        </div>
      </aside>

      <TopBar onDemo={() => setDemoOpen(true)} />

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-content px-4 pb-[calc(var(--bottom-nav-height)+2.5rem)] pt-5 outline-none sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
        <Outlet />
      </main>

      {/* Phones and tablets: bottom navigation, reachable with one thumb. */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-safe lg:hidden">
        <ul className={cn('mx-auto grid max-w-xl', role === 'owner' ? 'grid-cols-5' : 'grid-cols-5')}>
          {(role === 'owner' ? OWNER_NAV.slice(0, 4) : STAFF_NAV).map((n) => (
            <li key={n.to}>
              <NavLink to={n.to} end={n.end} className={({ isActive }) => cn('flex h-[var(--bottom-nav-height)] flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold leading-none transition-colors duration-fast', isActive ? 'text-primary-text' : 'text-ink-secondary')}>
                {({ isActive }) => (<>
                  <span className={cn('flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-fast', isActive && 'bg-primary-subtle')}><NavIcon name={n.icon} className="h-[1.375rem] w-[1.375rem]" /></span>
                  {n.label.replace('Tasks & Reminders', 'Tasks').replace('My ', '')}
                </>)}
              </NavLink>
            </li>
          ))}
          {role === 'owner' && (
            <li>
              <button type="button" onClick={() => setMoreOpen(true)} className="flex h-[var(--bottom-nav-height)] w-full flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold leading-none text-ink-secondary">
                <span className="flex h-7 w-12 items-center justify-center"><MoreHorizontal className="h-[1.375rem] w-[1.375rem]" aria-hidden /></span>More
              </button>
            </li>
          )}
        </ul>
      </nav>
      <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <ul className="space-y-1">
          {OWNER_NAV.slice(4).map((n) => (
            <li key={n.to}><NavLink to={n.to} onClick={() => setMoreOpen(false)} className={({ isActive }) => cn(linkBase, 'min-h-12', isActive ? 'bg-primary-subtle text-primary-text' : 'text-ink hover:bg-surface-sunken')}><NavIcon name={n.icon} />{n.label}</NavLink></li>
          ))}
          <li><Link to="/design-system" onClick={() => setMoreOpen(false)} className={cn(linkBase, 'min-h-12 text-ink hover:bg-surface-sunken')}><Palette className="h-5 w-5" aria-hidden />Design system</Link></li>
          <li><button type="button" onClick={() => { setMoreOpen(false); setDemoOpen(true) }} className={cn(linkBase, 'min-h-12 w-full text-ink hover:bg-surface-sunken')}><FlaskConical className="h-5 w-5" aria-hidden />Demo controls</button></li>
        </ul>
      </Drawer>

      <DemoPanel open={demoOpen} onClose={() => setDemoOpen(false)} />
      {role === 'owner' && <AssistantDrawer />}
      <p className="sr-only" aria-live="polite">{fmtLong(now.date)}</p>
    </div>
  )
}

function TopBar({ onDemo }: { onDemo: () => void }) {
  const { role, now, session, setSession } = useSession()
  const d = useData()
  const nav = useNavigate()
  const { openAssistant } = useAssistant()
  const emp = d.employees.find((e) => e.id === session.employeeId)
  const name = role === 'owner' ? OWNER.name : emp ? `${emp.firstName} ${emp.lastName}` : 'Staff'
  const [bell, setBell] = useState(false)
  const items = role === 'owner' ? attentionItems(d, now) : []

  const personas = [
    { id: 'owner', label: `${OWNER.name} · Owner`, run: () => { setSession({ role: 'owner' }); nav('/') } },
    ...d.employees.map((e) => ({ id: e.id, label: `${e.firstName} ${e.lastName} · Employee`, run: () => { setSession({ role: 'staff', employeeId: e.id }); nav('/today') } })),
  ]
  const currentId = role === 'owner' ? 'owner' : session.employeeId
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <Link to={role === 'owner' ? '/' : '/today'} className="mr-auto rounded-md lg:hidden" aria-label="GoodHands home"><Wordmark /></Link>
      <p className="mr-auto hidden text-small text-ink-secondary lg:block">{d.settings.daycareName}</p>
      <p className="hidden text-small font-semibold tabular-nums text-ink-secondary sm:block">{fmtLong(now.date)} · {fmtTime(now.time)}</p>
      {role === 'owner' && (
        <>
          <Button variant="subtle" size="md" icon={<Sparkles className="h-4 w-4" />} onClick={() => openAssistant()} className="hidden sm:inline-flex">Ask GoodHands</Button>
          <IconButton label="Ask GoodHands" onClick={() => openAssistant()} className="sm:hidden" variant="subtle"><Sparkles className="h-5 w-5" /></IconButton>
          <div className="relative">
            <IconButton label={items.length ? `Notifications, ${items.length} need attention` : 'Notifications, nothing needs attention'} onClick={() => setBell(true)}>
              <span className="relative"><Bell className="h-5 w-5" />{items.length > 0 && <span aria-hidden className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-bold text-primary-on">{items.length}</span>}</span>
            </IconButton>
          </div>
          <Drawer open={bell} onClose={() => setBell(false)} title="Needs your attention" description={items.length ? undefined : 'You’re all caught up.'}>
            {items.length ? <AttentionList items={items} onAct={() => setBell(false)} /> : <p className="text-small text-ink-secondary">Nothing needs you right now.</p>}
          </Drawer>
        </>
      )}
      <Menu
        label="Account" align="end"
        trigger={(p) => (
          <button {...p} aria-label={`Account menu, signed in as ${name}`} className="flex items-center gap-2 rounded-full p-0.5 pr-1 hover:bg-surface-sunken">
            {role === 'owner' ? <Avatar first="Denise" last="Carter" tint={0} size="sm" /> : emp ? <Avatar first={emp.firstName} last={emp.lastName} tint={emp.tint} size="sm" /> : <UserRound />}
          </button>
        )}
        items={[
          ...personas.map((p, i) => ({ label: p.label, icon: currentId === p.id ? <Check /> : <span className="inline-block w-4" />, onSelect: p.run, separatorBefore: i === 0 ? false : false })),
          { label: 'Design system', icon: <Palette />, onSelect: () => nav('/design-system'), separatorBefore: true },
          { label: 'Demo controls', icon: <FlaskConical />, onSelect: onDemo },
        ]}
      />
    </header>
  )
}
