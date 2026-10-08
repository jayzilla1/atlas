import { MessageCircle, Sparkles } from 'lucide-react'
import { useAssistant } from './AssistantContext'

/**
 * The floating chat bubble (bottom-right). One tap opens the assistant from any screen.
 * On phones it sits just above the bottom navigation so it never covers it. A text label slides out
 * on hover or keyboard focus, so it's clear what the bubble is without cluttering the screen.
 */
export function AssistantBubble() {
  const { open, openAssistant } = useAssistant()
  if (open) return null
  return (
    <button
      type="button"
      onClick={() => openAssistant()}
      aria-label="Ask GoodHands"
      className="group fixed bottom-[calc(var(--bottom-nav-height)+1rem)] right-4 z-40 flex h-14 items-center overflow-hidden rounded-full bg-primary pl-4 pr-4 text-primary-on shadow-lg transition-all duration-base ease-out hover:bg-primary-hover hover:pr-5 focus-visible:pr-5 sm:right-6 lg:bottom-9 lg:right-9"
    >
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
        <MessageCircle className="h-6 w-6" aria-hidden />
        <Sparkles className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 text-sun" aria-hidden />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-small font-semibold opacity-0 transition-all duration-base ease-out group-hover:ml-2.5 group-hover:max-w-[9rem] group-hover:opacity-100 group-focus-visible:ml-2.5 group-focus-visible:max-w-[9rem] group-focus-visible:opacity-100">Ask GoodHands</span>
    </button>
  )
}
