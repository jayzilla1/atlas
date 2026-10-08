import { cn } from '@/utils/cn'
import { initials } from '@/utils/format'

/** Soft, low-saturation tints so a row of avatars looks calm rather than confetti. All pass 4.5:1 for the initials. */
const TINTS = [
  'bg-[#fde2cf] text-[#7a3206]', 'bg-[#dcebf7] text-[#1f4f7d]', 'bg-[#e0efe3] text-[#1d5a3c]', 'bg-[#f6e0e6] text-[#7d2a45]', 'bg-[#ece4f5] text-[#4d2f7a]',
  'bg-[#fbeec4] text-[#6e4a00]', 'bg-[#d9eeec] text-[#17554f]', 'bg-[#f3dfd6] text-[#74361b]', 'bg-[#e4e8f6] text-[#2f3f7d]', 'bg-[#e8eccf] text-[#4b5a12]',
]
const SIZES = { sm: 'h-8 w-8 text-caption', md: 'h-10 w-10 text-small', lg: 'h-14 w-14 text-h3', xl: 'h-20 w-20 text-h2' }

/** Initials on a soft tint. A real photo would replace this once photo upload exists. */
export function Avatar({ first, last, tint = 0, size = 'md', className }: { first: string; last?: string; tint?: number; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span aria-hidden className={cn('inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold', TINTS[tint % TINTS.length], SIZES[size], className)}>
      {initials(first, last)}
    </span>
  )
}
