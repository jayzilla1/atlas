import { Suspense, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Info, X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { CommandPalette } from './CommandPalette'
import { DemoPanel } from './DemoPanel'
import { Onboarding } from './Onboarding'
import { useUi } from './UiContext'
import { Drawer } from '@/components/ui/Overlay'
import { LoadingState } from '@/components/ui/Feedback'
import { AtlasChat } from '@/components/ai/AtlasChat'
import { useAssistant } from '@/ai/AssistantContext'
import { Link } from 'react-router-dom'
import { InspectorOverlay } from '@/components/system/Inspector'

function AskDrawer() {
  const ui = useUi(); const a = useAssistant()
  const sent = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (ui.askOpen && ui.askPrompt && sent.current !== ui.askPrompt) { sent.current = ui.askPrompt; a.send('quick', ui.askPrompt) }
    if (!ui.askOpen) sent.current = undefined
  }, [ui.askOpen, ui.askPrompt]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Drawer open={ui.askOpen} onClose={ui.closeAsk} width="lg" title="Ask Atlas"
      description="Answers come from your own records. Open the full workspace for history.">
      <div className="flex h-[68vh] flex-col md:h-[calc(100vh-11rem)]">
        <AtlasChat threadId="quick" compact emptyTitle="Ask Atlas anything" autoFocus />
        <Link to="/assistant" onClick={ui.closeAsk} className="mt-2 self-center text-body-sm font-medium text-ink-link hover:underline">Open the AI Assistant workspace</Link>
      </div>
    </Drawer>
  )
}

/** AppShell — landmarks, skip link, route focus management, global overlays. */
export function AppShell() {
  const loc = useLocation(); const ui = useUi()
  const main = useRef<HTMLElement>(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    window.scrollTo(0, 0)
    main.current?.focus({ preventScroll: true }) // announce route change to keyboard / screen-reader users
  }, [loc.pathname])
  return (
    <div className="flex min-h-screen">
      <a href="#main" className="skip-link">Skip to main content</a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {!ui.bannerDismissed && (
          <div className="flex items-center gap-2 bg-ink px-4 py-1.5 text-body-sm text-ink-inverse" role="region" aria-label="Demo notice">
            <Info className="h-4 w-4 shrink-0" aria-hidden />
            <p className="min-w-0 flex-1">Sample workspace — <strong>Harborlight Software</strong> is fictional and every record here is made up. <button type="button" className="font-semibold underline underline-offset-2" onClick={() => ui.setTourOpen(true)}>Take the tour</button></p>
            <button type="button" aria-label="Dismiss notice" onClick={ui.dismissBanner} className="flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-white/15"><X className="h-4 w-4" aria-hidden /></button>
          </div>
        )}
        <Header />
        <main id="main" ref={main} tabIndex={-1} className="mx-auto w-full max-w-page flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<LoadingState label="Loading…" />}><Outlet /></Suspense>
        </main>
        <footer className="border-t border-line px-6 py-4 text-caption text-ink-tertiary">Atlas is a fictional product created for design portfolio purposes. All people, companies and data are invented.</footer>
      </div>
      <CommandPalette />
      <DemoPanel />
      <Onboarding />
      <AskDrawer />
      <InspectorOverlay />
    </div>
  )
}
