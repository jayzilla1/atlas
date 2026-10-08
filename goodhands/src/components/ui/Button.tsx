import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Tooltip } from './Tooltip'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-on hover:bg-primary-hover active:bg-primary-hover shadow-sm',
  secondary: 'bg-surface text-ink border border-line-strong/60 hover:bg-surface-sunken hover:border-line-strong',
  subtle: 'bg-primary-subtle text-primary-text hover:bg-primary-subtle-hover',
  ghost: 'text-ink-secondary hover:bg-surface-sunken hover:text-ink',
  danger: 'bg-danger-bg text-danger-text border border-danger/30 hover:bg-danger hover:text-white',
}
const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-3 text-small gap-1.5',
  md: 'min-h-control px-4 text-small gap-2',
  lg: 'min-h-12 px-5 text-body gap-2',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  iconAfter?: ReactNode
  block?: boolean
}

/** The one button. Variants express importance: primary (the main action on a screen), secondary, subtle, ghost, danger. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, icon, iconAfter, block, className, children, disabled, type = 'button', ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-semibold transition-colors duration-fast ease-out select-none disabled:opacity-50 disabled:pointer-events-none',
        variants[variant], sizes[size], block && 'w-full', className,
      )}
      {...rest}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
      {iconAfter}
    </button>
  )
})

interface IconButtonProps extends Omit<ButtonProps, 'children' | 'icon' | 'iconAfter' | 'block'> {
  /** Required: icon-only buttons have no visible text, so the label is what a screen reader announces. */
  label: string
  children: ReactNode
  tooltip?: boolean
}
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, children, variant = 'ghost', size = 'md', tooltip = true, className, ...rest }, ref,
) {
  const square = { sm: 'h-8 w-8', md: 'h-control w-control', lg: 'h-12 w-12' }[size]
  const btn = (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn('inline-flex items-center justify-center rounded-md transition-colors duration-fast ease-out disabled:opacity-50 disabled:pointer-events-none', variants[variant], square, className)}
      {...rest}
    >
      {children}
    </button>
  )
  return tooltip ? <Tooltip label={label}>{btn}</Tooltip> : btn
})
