import { cn } from '@/utils/cn'
import { initials } from '@/utils/format'

const SIZES = { sm: 'h-8 w-8 text-caption', md: 'h-10 w-10 text-small', lg: 'h-14 w-14 text-h3', xl: 'h-20 w-20 text-h2' }

/**
 * A neutral avatar: a white bubble with grey initials — every person looks equally important, and the
 * colour stays reserved for what needs attention. If a photo exists (`src`), it replaces the initials.
 * To use real photos later, put the image in public/avatars/ and set `photo` on the child/employee record.
 */
export function Avatar({ first, last, src, size = 'md', className }: { first: string; last?: string; src?: string; tint?: number; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span aria-hidden className={cn('inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-line bg-white font-semibold text-ink-tertiary shadow-sm', SIZES[size], className)}>
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials(first, last)}
    </span>
  )
}
