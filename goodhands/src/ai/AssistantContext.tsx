import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/** Lets any screen open the assistant, optionally with a question already typed in ("Ask about this"). */
interface AssistantApi { open: boolean; initialPrompt: string | null; openAssistant: (prompt?: string) => void; closeAssistant: () => void; consumePrompt: () => void }
const Ctx = createContext<AssistantApi | null>(null)
export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [initialPrompt, setPrompt] = useState<string | null>(null)
  const openAssistant = useCallback((p?: string) => { setPrompt(p ?? null); setOpen(true) }, [])
  const closeAssistant = useCallback(() => setOpen(false), [])
  const consumePrompt = useCallback(() => setPrompt(null), [])
  const value = useMemo(() => ({ open, initialPrompt, openAssistant, closeAssistant, consumePrompt }), [open, initialPrompt, openAssistant, closeAssistant, consumePrompt])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useAssistant = () => { const v = useContext(Ctx); if (!v) throw new Error('useAssistant must be used inside <AssistantProvider>'); return v }
