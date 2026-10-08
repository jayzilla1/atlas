import { useNavigate } from 'react-router-dom'
import { Baby, Clock3, FileWarning, Package, UserX, Wallet } from 'lucide-react'
import type { AttentionItem } from '@/domain/attention'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { useDialogs } from '@/state/dialogs'

const ICONS = { diaper: Baby, money: Wallet, clock: Clock3, box: Package, 'user-x': UserX, file: FileWarning }
const TONE = { danger: 'bg-danger-bg text-danger', warning: 'bg-warning-bg text-warning', info: 'bg-info-bg text-info' }
const TONE_TEXT = { danger: 'Urgent', warning: 'Needs attention', info: 'FYI' }

/** One "needs your attention" line: what, why, and the one next step. Tone is an icon + word, not only a colour. */
export function AttentionRow({ item, onAct }: { item: AttentionItem; onAct?: () => void }) {
  const nav = useNavigate()
  const dialogs = useDialogs()
  const Icon = ICONS[item.icon]
  const run = () => {
    onAct?.()
    if (item.action.kind === 'notify_parent') dialogs.notifyParent(item.action.childId)
    else nav(item.action.to)
  }
  return (
    <li className="flex items-center gap-3 py-3">
      <span aria-hidden className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', TONE[item.tone])}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold leading-snug"><span className="sr-only">{TONE_TEXT[item.tone]}: </span>{item.title}</p>
        {item.detail && <p className="text-small text-ink-secondary">{item.detail}</p>}
      </div>
      <Button size="md" onClick={run} className="shrink-0">{item.action.label}</Button>
    </li>
  )
}
export function AttentionList({ items, onAct }: { items: AttentionItem[]; onAct?: () => void }) {
  return <ul className="divide-y divide-line-subtle">{items.map((i) => <AttentionRow key={i.id} item={i} onAct={onAct} />)}</ul>
}
