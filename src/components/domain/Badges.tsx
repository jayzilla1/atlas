import { ArrowDown, ChevronsUp, Equal, ChevronUp } from 'lucide-react'
import type { TaskPriority } from '@/data/types'
import { Badge, type Tone } from '@/components/ui/Badge'

const P: Record<TaskPriority, { label: string; tone: Tone; Icon: typeof ArrowDown }> = {
  urgent: { label: 'Urgent', tone: 'critical', Icon: ChevronsUp }, high: { label: 'High', tone: 'high', Icon: ChevronUp },
  medium: { label: 'Medium', tone: 'warning', Icon: Equal }, low: { label: 'Low', tone: 'neutral', Icon: ArrowDown },
}
export const PRIORITY_RANK: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const m = P[priority]
  return <Badge tone={m.tone} icon={<m.Icon />}>{m.label}</Badge>
}
export const PRIORITY_OPTIONS = (Object.keys(P) as TaskPriority[]).map((k) => ({ value: k, label: P[k].label }))
