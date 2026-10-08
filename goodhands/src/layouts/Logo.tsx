import { cn } from '@/utils/cn'

/**
 * GoodHands mark: a child (the dot) held by two cupped hands (the arcs) inside a warm rounded square.
 * It reads as care and steadiness rather than "daycare clipart" — no cartoon, no primary-colour overload.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="9" fill="var(--primary)" />
      <circle cx="16" cy="10.6" r="3.6" fill="#fff" />
      <path d="M7.6 15.6c0 5.6 3.6 9.2 8.4 9.2" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M24.4 15.6c0 5.6-3.6 9.2-8.4 9.2" fill="none" stroke="#fdebdd" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
export function Wordmark({ className, size = 'md' }: { className?: string; size?: 'md' | 'lg' }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={size === 'lg' ? 40 : 32} />
      <span className={cn('font-bold tracking-tight text-ink', size === 'lg' ? 'text-h2' : 'text-lead')}>
        Good<span className="text-primary-text">Hands</span>
      </span>
    </span>
  )
}
