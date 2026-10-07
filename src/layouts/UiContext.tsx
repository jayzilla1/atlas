import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface Ui {
  collapsed: boolean; toggleCollapsed: () => void
  mobileNav: boolean; setMobileNav: (v: boolean) => void
  askOpen: boolean; askPrompt?: string; openAsk: (prompt?: string) => void; closeAsk: () => void
  paletteOpen: boolean; setPaletteOpen: (v: boolean) => void
  demoOpen: boolean; setDemoOpen: (v: boolean) => void
  tourOpen: boolean; setTourOpen: (v: boolean) => void
  bannerDismissed: boolean; dismissBanner: () => void
}
const Ctx = createContext<Ui | null>(null)
export const useUi = () => { const c = useContext(Ctx); if (!c) throw new Error('UiProvider missing'); return c }

const get = (k: string) => { try { return sessionStorage.getItem(k) } catch { return null } }
const set = (k: string, v: string) => { try { sessionStorage.setItem(k, v) } catch { /* ignore */ } }

export function UiProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => get('atlas-collapsed') === '1' || (typeof window !== 'undefined' && window.innerWidth < 1100 && window.innerWidth >= 768))
  const [mobileNav, setMobileNav] = useState(false)
  const [askOpen, setAskOpen] = useState(false)
  const [askPrompt, setAskPrompt] = useState<string>()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(() => get('atlas-toured') !== '1')
  const [bannerDismissed, setBanner] = useState(() => get('atlas-banner') === '1')
  const value = useMemo<Ui>(() => ({
    collapsed, toggleCollapsed: () => setCollapsed((c) => { set('atlas-collapsed', c ? '0' : '1'); return !c }),
    mobileNav, setMobileNav,
    askOpen, askPrompt, openAsk: (p) => { setAskPrompt(p); setAskOpen(true) }, closeAsk: () => { setAskOpen(false); setAskPrompt(undefined) },
    paletteOpen, setPaletteOpen, demoOpen, setDemoOpen,
    tourOpen, setTourOpen: (v) => { setTourOpen(v); if (!v) set('atlas-toured', '1') },
    bannerDismissed, dismissBanner: () => { setBanner(true); set('atlas-banner', '1') },
  }), [collapsed, mobileNav, askOpen, askPrompt, paletteOpen, demoOpen, tourOpen, bannerDismissed])
  // stable callbacks for children that only need openAsk
  void useCallback
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
