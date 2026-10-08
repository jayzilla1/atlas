/**
 * What an assistant answer looks like. Plain English: instead of returning a blob of text, the assistant
 * returns a *structured* answer — a headline, a list of things, the sources it looked at, how sure it is,
 * and (sometimes) a *proposed* action. Structure is what lets the UI show sources, make list items
 * clickable, and demand approval before anything happens.
 */
export type AiTone = 'danger' | 'warning' | 'info' | 'neutral' | 'success'
export type AiCta = { label: string; kind: 'notify'; childId: string } | { label: string; kind: 'navigate'; to: string }
export interface AiItem { id: string; label: string; detail?: string; tone: AiTone; cta?: AiCta }
export interface AiProposal { id: string; title: string; description: string; kind: 'notify_parents'; childIds: string[] }
export interface AiResponse {
  question: string
  headline: string
  paragraphs?: string[]
  items?: AiItem[]
  proposal?: AiProposal
  /** which parts of GoodHands data the answer was built from — shown to the user */
  sources: string[]
  confidence: 'high' | 'medium' | 'low'
  caveat?: string
  followUps?: string[]
}
