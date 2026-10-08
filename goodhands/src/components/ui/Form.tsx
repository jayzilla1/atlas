import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Check, Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'

/* ------------------------------------------------------------------ Field */
/** Label + control + hint + error, wired together so screen readers announce all of it. */
export function Field({ label, hint, error, required, children, className }: { label: string; hint?: string; error?: string; required?: boolean; children: (p: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean; required?: boolean }) => ReactNode; className?: string }) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-small font-semibold text-ink">
        {label}{required && <span className="ml-0.5 text-danger-text" aria-hidden> *</span>}
        {!required && <span className="sr-only"> (optional)</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required })}
      {hint && !error && <p id={`${id}-hint`} className="text-caption text-ink-secondary">{hint}</p>}
      {error && <p id={`${id}-err`} className="text-caption font-semibold text-danger-text">{error}</p>}
    </div>
  )
}

const control = 'w-full rounded-md border border-line-strong bg-surface px-3 text-body text-ink placeholder:text-ink-tertiary transition-colors duration-fast hover:border-ink-secondary disabled:bg-surface-sunken disabled:text-ink-tertiary disabled:cursor-not-allowed aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger-bg/40'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(control, 'min-h-control', className)} {...p} />
})
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} rows={3} className={cn(control, 'py-2', className)} {...p} />
})
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...p }, ref) {
  return <select ref={ref} className={cn(control, 'min-h-control pr-8', className)} {...p}>{children}</select>
})

/** Search box: labelled for assistive tech, with a clear button once there is text. */
export function SearchInput({ value, onChange, placeholder = 'Search', label = 'Search', className }: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string; className?: string }) {
  return (
    <div role="search" className={cn('relative', className)}>
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
      <input type="search" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(control, 'min-h-control pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden')} />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange('')} className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-ink-tertiary hover:bg-surface-sunken hover:text-ink">
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- Checkbox */
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> { label: ReactNode; description?: ReactNode; size?: 'md' | 'lg' }
/**
 * A real <input type="checkbox"> (so it is keyboard and screen-reader friendly by default),
 * drawn with our own box. The tick "pops" when checked; reduced-motion users get no animation.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, description, size = 'md', className, ...p }, ref) {
  const box = size === 'lg' ? 'h-7 w-7' : 'h-5 w-5'
  return (
    <label className={cn('group flex cursor-pointer items-start gap-3 py-1.5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60', className)}>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input ref={ref} type="checkbox" className="peer absolute inset-0 h-full w-full cursor-[inherit] opacity-0" {...p} />
        <span className={cn('pointer-events-none flex items-center justify-center rounded-[6px] border-2 border-line-strong bg-surface transition-colors duration-fast peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus-ring)] group-hover:border-ink-secondary peer-checked:[&>svg]:scale-100 peer-checked:[&>svg]:opacity-100', box)} aria-hidden>
          <Check className="h-[70%] w-[70%] scale-50 text-primary-on opacity-0 transition-all duration-base ease-out" strokeWidth={3.5} />
        </span>
        {/* Tap target extends beyond the visible box without changing layout */}
        <span className="pointer-events-none absolute -inset-2" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-small font-medium text-ink peer-checked:text-ink">{label}</span>
        {description && <span className="block text-caption text-ink-secondary">{description}</span>}
      </span>
    </label>
  )
})

/* ----------------------------------------------------------------- Radio */
export function RadioGroup<T extends string>({ legend, value, onChange, options, inline }: { legend: string; value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string; description?: string; disabled?: boolean }>; inline?: boolean }) {
  const name = useId()
  return (
    <fieldset>
      <legend className="mb-1.5 text-small font-semibold text-ink">{legend}</legend>
      <div className={cn('flex gap-x-5 gap-y-1', inline ? 'flex-wrap' : 'flex-col')}>
        {options.map((o) => (
          <label key={o.value} className="group flex cursor-pointer items-start gap-3 py-1.5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
            <span className="relative mt-0.5 inline-flex shrink-0">
              <input type="radio" name={name} value={o.value} checked={value === o.value} disabled={o.disabled} onChange={() => onChange(o.value)} className="peer absolute inset-0 h-full w-full cursor-[inherit] opacity-0" />
              <span aria-hidden className="pointer-events-none flex h-5 w-5 items-center justify-center rounded-full border-2 border-line-strong bg-surface transition-colors duration-fast peer-checked:border-primary peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus-ring)] group-hover:border-ink-secondary peer-checked:[&>span]:scale-100">
                <span className="h-2.5 w-2.5 scale-0 rounded-full bg-primary transition-transform duration-fast" />
              </span>
              <span className="pointer-events-none absolute -inset-2" aria-hidden />
            </span>
            <span><span className="block text-small font-medium">{o.label}</span>{o.description && <span className="block text-caption text-ink-secondary">{o.description}</span>}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/* ---------------------------------------------------------------- Toggle */
/** On/off switch. Uses role="switch" so assistive tech announces "on"/"off" rather than "checked". */
export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-small font-semibold text-ink">{label}</label>
        {description && <p className="text-caption text-ink-secondary">{description}</p>}
      </div>
      <button
        id={id} type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors duration-base ease-out disabled:opacity-50', checked ? 'border-primary bg-primary' : 'border-line-strong bg-surface-sunken')}
      >
        <span aria-hidden className={cn('inline-block h-5 w-5 rounded-full shadow-sm transition-transform duration-base ease-out', checked ? 'translate-x-[22px] bg-white' : 'translate-x-0.5 bg-ink-tertiary')} />
        <span className="sr-only">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  )
}
