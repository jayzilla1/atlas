import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { Spinner } from './Spinner'
import { Tooltip } from './Tooltip'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-standard focus-visible:outline-none active:translate-y-px motion-reduce:active:translate-y-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50'
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-action text-action-on shadow-xs hover:bg-action-hover active:bg-action-pressed aria-disabled:hover:bg-action disabled:hover:bg-action',
  secondary: 'border border-line-strong bg-surface text-ink shadow-xs hover:bg-hover active:bg-sunken aria-disabled:hover:bg-surface',
  ghost: 'text-ink-secondary hover:bg-sunken hover:text-ink active:bg-line aria-disabled:hover:bg-transparent',
  subtle: 'bg-action-subtle text-action-ink hover:brightness-95 active:brightness-90',
  danger: 'bg-critical-fg text-ink-inverse shadow-xs hover:brightness-110 active:brightness-90',
}
const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-body-sm',
  md: 'h-9 px-3.5 text-body',
  lg: 'h-11 px-5 text-body-lg',
}
export const buttonClasses = (variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', className?: string) => cn(base, variants[variant], sizes[size], className)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  /** When set, the button is aria-disabled (still focusable) and explains why in a tooltip. */
  disabledReason?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, iconLeft, iconRight, disabledReason, disabled, className, children, onClick, type = 'button', ...rest }, ref) {
  const blocked = Boolean(disabledReason) || loading
  const btn = (
    <button
      ref={ref} type={type} data-ds="Button" data-ds-variant={variant} data-ds-size={size}
      disabled={disabled && !disabledReason}
      aria-disabled={blocked || undefined} aria-busy={loading || undefined}
      onClick={(e) => { if (blocked) { e.preventDefault(); return } onClick?.(e) }}
      className={buttonClasses(variant, size, className)} {...rest}
    >
      {loading ? <Spinner /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  )
  return disabledReason ? <Tooltip content={disabledReason}>{btn}</Tooltip> : btn
})

export function ButtonLink({ variant = 'secondary', size = 'md', iconLeft, iconRight, className, children, ...rest }: LinkProps & { variant?: ButtonVariant; size?: ButtonSize; iconLeft?: ReactNode; iconRight?: ReactNode }) {
  return (
    <Link data-ds="Button" data-ds-variant={variant} data-ds-size={size} className={buttonClasses(variant, size, className)} {...rest}>
      {iconLeft}{children}{iconRight}
    </Link>
  )
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only controls must have an accessible name. Also used as the tooltip. */
  label: string
  variant?: 'ghost' | 'secondary' | 'primary'
  size?: 'sm' | 'md' | 'lg'
  pressed?: boolean
}
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', size = 'md', pressed, className, children, type = 'button', ...rest }, ref) {
  const dim = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-11 w-11' }[size]
  return (
    <Tooltip content={label} placement="bottom">
      <button ref={ref} type={type} aria-label={label} aria-pressed={pressed} data-ds="IconButton" data-ds-variant={variant}
        className={cn(base, variants[variant], dim, 'px-0', pressed && 'bg-sunken text-ink', className)} {...rest}>
        {children}
      </button>
    </Tooltip>
  )
})
