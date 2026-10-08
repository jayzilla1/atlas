import { cn } from '@/utils/cn'

/**
 * GoodHands mark: a child (the dot) held by two cupped hands (the arcs) inside a warm rounded square,
 * with a small "sun" spark — care, steadiness, a bright day. No cartoon, no baby clipart.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="10" fill="var(--primary)" />
      <circle cx="16" cy="10.4" r="3.7" fill="#fff" />
      <circle cx="23.6" cy="6.6" r="1.7" fill="#fff" fillOpacity=".6" />
      <path d="M7.6 15.6c0 5.6 3.6 9.2 8.4 9.2" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M24.4 15.6c0 5.6-3.6 9.2-8.4 9.2" fill="none" stroke="#fdebdd" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
export function Wordmark({ className, size = 'md', tone = 'dark' }: { className?: string; size?: 'md' | 'lg'; tone?: 'dark' | 'light' }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={size === 'lg' ? 44 : 36} />
      <span className={cn('font-display font-bold leading-none tracking-tight', size === 'lg' ? 'text-h1' : 'text-lead sm:text-h3', tone === 'light' ? 'text-white' : 'text-ink')}>
        Good<span className={tone === 'light' ? 'text-primary-subtle-hover' : 'text-primary-text'}>Hands</span>
      </span>
    </span>
  )
}
