import type { ReactNode } from 'react'

/** A circular progress ring with content in the middle. The text label (not the ring) carries the meaning. */
export function Ring({ value, max, label, size = 132, stroke = 12, children, track = 'rgb(255 255 255 / 0.25)', color = '#fff' }: { value: number; max: number; label: string; size?: number; stroke?: number; children?: ReactNode; track?: string; color?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  const pct = max === 0 ? 0 : Math.min(1, value / max)
  return (
    <div role="img" aria-label={label} className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset var(--motion-slow) var(--ease-out)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}
