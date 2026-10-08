import type { ReactNode } from 'react'

/**
 * The warm "good morning" panel at the top of Home and Today. It is the one place a gradient is used —
 * so the brand colour has a clear home, and everything else stays calm.
 * Text is white on a deep orange, checked to pass 4.5:1 along the whole gradient.
 */
export function Hero({ eyebrow, title, children, actions, aside }: { eyebrow: ReactNode; title: ReactNode; children?: ReactNode; actions?: ReactNode; aside?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden rounded-xl bg-[linear-gradient(115deg,var(--hero-from),var(--hero-to))] p-6 text-white shadow-md sm:p-8">
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
      <span aria-hidden className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/10" />
      <span aria-hidden className="pointer-events-none absolute left-1/3 top-0 h-24 w-24 rounded-full bg-white/5" />
      <div className="relative flex flex-wrap items-center justify-between gap-x-8 gap-y-6">
        <div className="min-w-0 max-w-xl">
          <p className="text-small font-semibold text-white/90">{eyebrow}</p>
          <h1 className="mt-1 text-[2rem] font-semibold leading-tight text-white sm:text-[2.5rem]">{title}</h1>
          {children && <div className="mt-2 text-body text-white">{children}</div>}
          {actions && <div className="mt-5 flex flex-wrap gap-2.5">{actions}</div>}
        </div>
        {aside && <div className="hidden sm:block">{aside}</div>}
      </div>
    </section>
  )
}
