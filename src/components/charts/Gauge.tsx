import { cn } from '@/utils/cn'
/** Gauge — a 270° arc for a single 0–100 score. Number is the hero; arc is reinforcement. */
export function Gauge({ value, label, size = 168, previous }: { value: number; label: string; size?: number; previous?: number }) {
  const r = size / 2 - 12; const c = 2 * Math.PI * r; const arc = c * 0.75
  const tone = value >= 70 ? 'var(--color-brand)' : 'var(--color-critical-solid)'
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} data-ds="Chart" data-ds-variant="gauge">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${value} out of 100${previous ? `, previously ${previous}` : ''}`} className="-rotate-[225deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-bg-sunken)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${arc} ${c}`} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(arc * value) / 100} ${c}`} className="transition-[stroke-dasharray] duration-slow ease-standard" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-heading text-display tabular-nums leading-none')}>{value}</span>
        <span className="mt-1 text-body-sm text-ink-secondary">out of 100</span>
      </div>
    </div>
  )
}
export function Sparkline({ values, color = 'var(--color-chart-1)', width = 96, height = 28, label }: { values: number[]; color?: string; width?: number; height?: number; label: string }) {
  const lo = Math.min(...values); const hi = Math.max(...values)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * (width - 4) + 2},${height - 3 - ((v - lo) / (hi - lo || 1)) * (height - 6)}`)
  return <svg width={width} height={height} role="img" aria-label={label} data-ds="Sparkline"><polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="3" fill={color} stroke="var(--color-bg-surface)" strokeWidth="1.5" /></svg>
}
