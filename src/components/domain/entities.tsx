import { Link } from 'react-router-dom'
import { AppWindow, Building2, FileText, ListChecks, ShieldAlert, User } from 'lucide-react'
import type { EntityRef, EntityType } from '@/data/types'
import { getVendor } from '@/data/vendors'
import { getPolicy } from '@/data/policies'
import { useStore } from '@/state/store'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/utils/cn'

export const ENTITY_META: Record<EntityType, { label: string; plural: string; Icon: typeof User; base: string }> = {
  person: { label: 'Person', plural: 'People', Icon: User, base: '/people' },
  application: { label: 'Application', plural: 'Applications', Icon: AppWindow, base: '/applications' },
  vendor: { label: 'Vendor', plural: 'Vendors', Icon: Building2, base: '/vendors' },
  policy: { label: 'Policy', plural: 'Policies', Icon: FileText, base: '/policies' },
  risk: { label: 'Risk', plural: 'Risks', Icon: ShieldAlert, base: '/risks' },
  task: { label: 'Task', plural: 'Tasks', Icon: ListChecks, base: '/tasks' },
}
export const entityPath = (r: EntityRef) => `${ENTITY_META[r.type].base}/${r.id}`

/** Resolve any record reference to a human name (used by links, chips, search, AI). */
export function useEntityName() {
  const s = useStore()
  return (r: EntityRef): string => {
    switch (r.type) {
      case 'person': return s.personById(r.id)?.name ?? r.id
      case 'application': return s.appById(r.id)?.name ?? r.id
      case 'vendor': return getVendor(r.id)?.name ?? r.id
      case 'policy': return getPolicy(r.id)?.name ?? r.id
      case 'risk': return s.riskById(r.id)?.name ?? r.id
      case 'task': return s.tasks.find((t) => t.id === r.id)?.name ?? r.id
    }
  }
}

/** EntityChip — a compact, clickable reference to any record. The backbone of the “one connected system” feel. */
export function EntityChip({ entity, className, showType = false }: { entity: EntityRef; className?: string; showType?: boolean }) {
  const name = useEntityName()(entity)
  const m = ENTITY_META[entity.type]
  return (
    <Link to={entityPath(entity)} data-ds="EntityChip" data-ds-variant={entity.type}
      className={cn('inline-flex max-w-full items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-body-sm font-medium text-ink transition-colors duration-fast hover:border-line-strong hover:bg-hover', className)}>
      <m.Icon className="h-3.5 w-3.5 shrink-0 text-ink-tertiary" aria-hidden />
      <span className="truncate">{name}</span>
      {showType && <span className="sr-only"> ({m.label})</span>}
    </Link>
  )
}

/** PersonCell — avatar + name (+ optional subtitle) linking to the person page. */
export function PersonLink({ id, subtitle, size = 'sm', plain }: { id?: string; subtitle?: string; size?: 'xs' | 'sm' | 'md'; plain?: boolean }) {
  const p = useStore().personById(id)
  if (!p) return <span className="text-ink-tertiary">Unassigned</span>
  const inner = (
    <>
      <Avatar name={p.name} size={size} muted={p.status === 'former'} />
      <span className="min-w-0"><span className="block truncate font-medium">{p.name}</span>{subtitle !== undefined && <span className="block truncate text-caption font-normal text-ink-secondary">{subtitle || p.title}</span>}</span>
    </>
  )
  return plain ? <span className="inline-flex min-w-0 items-center gap-2">{inner}</span> : <Link to={`/people/${p.id}`} className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-sm hover:underline">{inner}</Link>
}

/** Groups related records by type — used on every detail page. */
export function RelatedRecords({ refs, emptyText = 'No related records.' }: { refs: EntityRef[]; emptyText?: string }) {
  const groups = (Object.keys(ENTITY_META) as EntityType[]).map((t) => ({ t, items: refs.filter((r) => r.type === t) })).filter((g) => g.items.length)
  if (!groups.length) return <p className="text-body text-ink-secondary">{emptyText}</p>
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.t}>
          <h3 className="mb-2 text-overline uppercase text-ink-tertiary">{ENTITY_META[g.t].plural}</h3>
          <div className="flex flex-wrap gap-2">{g.items.map((r) => <EntityChip key={r.type + r.id} entity={r} />)}</div>
        </div>
      ))}
    </div>
  )
}
