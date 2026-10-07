import { createContext, forwardRef, useContext, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { AlertCircle, Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'

/* ---------- Field: label + hint + error/success message, wired with aria ---------- */
interface FieldProps {
  label: string
  hint?: ReactNode
  error?: string
  success?: string
  required?: boolean
  hideLabel?: boolean
  className?: string
  children: (a: { id: string; describedBy?: string; invalid: boolean }) => ReactNode
}
export function Field({ label, hint, error, success, required, hideLabel, className, children }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`; const msgId = `${id}-msg`
  const describedBy = [hint ? hintId : '', error || success ? msgId : ''].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)} data-ds="Field">
      <label htmlFor={id} className={cn('text-body-sm font-medium text-ink', hideLabel && 'sr-only')}>
        {label}{required && <span className="text-critical-fg" aria-hidden> *</span>}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && <p id={hintId} className="text-caption text-ink-secondary">{hint}</p>}
      {error && <p id={msgId} role="alert" className="flex items-center gap-1.5 text-caption font-medium text-critical-fg"><AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />{error}</p>}
      {success && !error && <p id={msgId} className="flex items-center gap-1.5 text-caption font-medium text-success-fg"><Check className="h-3.5 w-3.5 shrink-0" aria-hidden />{success}</p>}
    </div>
  )
}

const controlBase =
  'w-full rounded-md border bg-surface px-3 text-body text-ink placeholder:text-ink-tertiary transition-[border-color,box-shadow] duration-fast hover:border-ink-tertiary focus-visible:border-action focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-tertiary'
const borderFor = (invalid?: boolean, success?: boolean) => invalid ? 'border-critical-solid' : success ? 'border-success-solid' : 'border-line-strong'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { invalid?: boolean; valid?: boolean }
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, invalid, valid, ...rest }, ref) {
  return <input ref={ref} data-ds="Input" aria-invalid={invalid || undefined} className={cn(controlBase, 'h-10', borderFor(invalid, valid), className)} {...rest} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea({ className, invalid, ...rest }, ref) {
  return <textarea ref={ref} data-ds="Textarea" aria-invalid={invalid || undefined} className={cn(controlBase, 'min-h-[5rem] py-2', borderFor(invalid), className)} {...rest} />
})

/* ---------- Search ---------- */
export function SearchInput({ value, onChange, placeholder = 'Search', label = 'Search', className, onClear }: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string; className?: string; onClear?: () => void }) {
  return (
    <div className={cn('relative', className)} data-ds="SearchInput">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" aria-hidden />
      <input type="search" role="searchbox" aria-label={label} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className={cn(controlBase, 'h-10 rounded-full border-line-strong pl-10 pr-9 [&::-webkit-search-cancel-button]:hidden')} />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => { onChange(''); onClear?.() }}
          className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-sm text-ink-tertiary hover:bg-sunken hover:text-ink">
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  )
}

/* ---------- Select (native element: best keyboard + screen-reader + mobile behaviour) ---------- */
export interface Option { value: string; label: string; disabled?: boolean }
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { options: Option[]; invalid?: boolean; placeholder?: string }>(function Select({ options, invalid, placeholder, className, ...rest }, ref) {
  return (
    <div className="relative" data-ds="Select">
      <select ref={ref} aria-invalid={invalid || undefined} className={cn(controlBase, 'h-10 appearance-none pr-9', borderFor(invalid), className)} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" aria-hidden />
    </div>
  )
})

/* ---------- Checkbox ---------- */
export const Checkbox = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode; description?: ReactNode }>(function Checkbox({ label, description, className, id, ...rest }, ref) {
  const auto = useId(); const cid = id ?? auto
  return (
    <div className={cn('flex items-start gap-2.5', className)} data-ds="Checkbox">
      <span className="relative mt-0.5 flex h-4 w-4 shrink-0">
        <input ref={ref} id={cid} type="checkbox" className="peer h-4 w-4 cursor-pointer appearance-none rounded-xs border border-line-strong bg-surface transition-colors duration-fast checked:border-action checked:bg-action hover:border-ink-tertiary focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50" {...rest} />
        <Check className="pointer-events-none absolute inset-0 h-4 w-4 p-[2px] text-action-on opacity-0 peer-checked:opacity-100" strokeWidth={3.5} aria-hidden />
      </span>
      <label htmlFor={cid} className="cursor-pointer text-body text-ink">
        {label}
        {description && <span className="mt-0.5 block text-caption text-ink-secondary">{description}</span>}
      </label>
    </div>
  )
})

/* ---------- Radio group ---------- */
const RadioCtx = createContext<{ name: string; value: string; onChange: (v: string) => void; disabled?: boolean } | null>(null)
export function RadioGroup({ legend, value, onChange, children, disabled, className, orientation = 'vertical', hideLegend }: { legend: string; value: string; onChange: (v: string) => void; children: ReactNode; disabled?: boolean; className?: string; orientation?: 'vertical' | 'horizontal'; hideLegend?: boolean }) {
  const name = useId()
  return (
    <RadioCtx.Provider value={{ name, value, onChange, disabled }}>
      <fieldset className={cn('m-0 min-w-0 border-0 p-0', className)} data-ds="RadioGroup" disabled={disabled}>
        <legend className={cn('mb-2 p-0 text-body-sm font-medium text-ink', hideLegend && 'sr-only')}>{legend}</legend>
        <div role="radiogroup" className={cn('flex gap-2.5', orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap gap-x-5')}>{children}</div>
      </fieldset>
    </RadioCtx.Provider>
  )
}
export function Radio({ value, label, description, disabled }: { value: string; label: ReactNode; description?: ReactNode; disabled?: boolean }) {
  const ctx = useContext(RadioCtx)!; const id = useId()
  return (
    <div className="flex items-start gap-2.5" data-ds="Radio">
      <input id={id} type="radio" name={ctx.name} value={value} checked={ctx.value === value} disabled={disabled || ctx.disabled} onChange={() => ctx.onChange(value)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-full border border-line-strong bg-surface transition-colors duration-fast checked:border-[5px] checked:border-action hover:border-ink-tertiary focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50" />
      <label htmlFor={id} className="cursor-pointer text-body text-ink">{label}{description && <span className="mt-0.5 block text-caption text-ink-secondary">{description}</span>}</label>
    </div>
  )
}

/* ---------- Toggle (switch) ---------- */
export function Toggle({ checked, onChange, label, description, disabled, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: ReactNode; disabled?: boolean; id?: string }) {
  const auto = useId(); const tid = id ?? auto
  return (
    <div className="flex items-start justify-between gap-4" data-ds="Toggle">
      <label htmlFor={tid} className="cursor-pointer text-body text-ink">
        {label}{description && <span className="mt-0.5 block text-caption text-ink-secondary">{description}</span>}
      </label>
      <button id={tid} type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors duration-base ease-standard focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50', checked ? 'border-action bg-action' : 'border-line-strong bg-sunken')}>
        <span className={cn('absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full shadow-sm transition-transform duration-base ease-standard', checked ? 'translate-x-[1.1rem] bg-action-on' : 'translate-x-[0.2rem] bg-ink-tertiary')} />
        <span className="sr-only">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  )
}
