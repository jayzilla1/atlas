import type { ActivityEvent } from './types'

const at = (n: number, hhmm: string) => {
  const d = new Date(2026, 9, 7 + n)
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${hhmm}`
}

/** Recent activity across the workspace (newest first). */
export const initialActivity: ActivityEvent[] = [
  { id: 'a1', at: at(0, '09:12'), actor: 'Atlas AI', kind: 'ai', text: 'identified a potential access risk: 3 laptops haven’t reported encryption status.', entity: { type: 'risk', id: 'R-111' } },
  { id: 'a2', at: at(0, '08:40'), actor: 'Sarah Chen', actorId: 'sarah-chen', kind: 'human', text: 'completed security awareness training.', entity: { type: 'person', id: 'sarah-chen' } },
  { id: 'a3', at: at(-1, '16:05'), actor: 'Priya Raman', actorId: 'priya-raman', kind: 'human', text: 'started task “Suspend Devon Park’s Google Workspace account”.', entity: { type: 'task', id: 'T-201' } },
  { id: 'a4', at: at(-1, '11:30'), actor: 'Atlas', kind: 'system', text: 'Google Workspace access review completed — 244 accounts reviewed, 0 removed.', entity: { type: 'application', id: 'google-workspace' } },
  { id: 'a5', at: at(-2, '15:20'), actor: 'Elena Vasquez', actorId: 'elena-vasquez', kind: 'human', text: 'added a new vendor: Lighthouse Docs.', entity: { type: 'vendor', id: 'lighthouse-docs' } },
  { id: 'a6', at: at(-3, '08:12'), actor: 'Atlas AI', kind: 'ai', text: 'identified a potential access risk: Former contractor still has access to Google Workspace.', entity: { type: 'risk', id: 'R-101' } },
  { id: 'a7', at: at(-4, '14:00'), actor: 'Marcus Lee', actorId: 'marcus-lee', kind: 'human', text: 'started the GitHub access review.', entity: { type: 'application', id: 'github' } },
  { id: 'a8', at: at(-5, '10:45'), actor: 'David Kim', actorId: 'david-kim', kind: 'human', text: 'requested a renewed SOC 2 report from Cloudline Hosting.', entity: { type: 'vendor', id: 'cloudline-hosting' } },
  { id: 'a9', at: at(-6, '09:00'), actor: 'Maya Okafor', actorId: 'maya-okafor', kind: 'human', text: 'took ownership of “14 employees have not completed security training”.', entity: { type: 'risk', id: 'R-107' } },
  { id: 'a10', at: at(-8, '13:10'), actor: 'Nina Petrov', actorId: 'nina-petrov', kind: 'human', text: 'published Privacy Policy (Internal) v4.4 for review.', entity: { type: 'policy', id: 'privacy' } },
]
