import { useState } from 'react'
import { useWidth } from './useWidth'
import { ChartFrame, type Series } from './ChartFrame'

/**
 * LineChart — 2px lines, recessive grid, crosshair + tooltip on hover/keyboard.
 * Layout adapts: fewer x-axis labels on narrow screens. Direct end-labels for ≤ 4 series.
 */
export function LineChart({ title, description, labels, series, height = 240, min, max, unit = '', area, yTicks = 4 }: {
  title: string; description?: string; labels: string[]; series: Series[]; height?: number; min?: number; max?: number; unit?: string; area?: boolean; yTicks?: number
}) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const pad = { l: 36, r: w < 480 ? 12 : 56, t: 12, b: 26 }
  const all = series.flatMap((s) => s.values)
  const lo = min ?? Math.floor(Math.min(...all) / 5) * 5; const hi = max ?? Math.ceil(Math.max(...all) / 5) * 5
  const x = (i: number) => pad.l + (i * (w - pad.l - pad.r)) / Math.max(1, labels.length - 1)
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * (height - pad.t - pad.b)
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => lo + ((hi - lo) * i) / yTicks)
  const step = w < 480 ? 3 : w < 720 ? 2 : 1
  const path = (s: Series) => s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((e.clientX - r.left - pad.l) / (w - pad.l - pad.r)) * (labels.length - 1))
    setHover(Math.max(0, Math.min(labels.length - 1, i)))
  }
  return (
    <ChartFrame title={title} description={description} legend={series.map((s) => ({ label: s.label, color: s.color, dashed: s.dashed }))}
      table={{ columns: ['Period', ...series.map((s) => s.label)], rows: labels.map((l, i) => [l, ...series.map((s) => `${s.values[i]}${unit}`)]) }}>
      <div ref={ref} className="relative" style={{ height }}>
        <svg width={w} height={height} role="img" aria-label={`${title}. ${description ?? ''} Use “View as table” for exact values.`} tabIndex={0}
          onPointerMove={onMove} onPointerLeave={() => setHover(null)} onBlur={() => setHover(null)}
          onKeyDown={(e) => { if (e.key === 'ArrowRight') setHover((h) => Math.min(labels.length - 1, (h ?? -1) + 1)); if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? labels.length) - 1)); if (e.key === 'Escape') setHover(null) }}
          className="block touch-pan-y rounded-sm outline-none focus-visible:shadow-focus">
          {ticks.map((t) => (
            <g key={t}><line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="var(--color-chart-grid)" strokeWidth="1" />
              <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-chart-axis)" className="tabular-nums">{Math.round(t)}{unit}</text></g>
          ))}
          {labels.map((l, i) => i % step === 0 || i === labels.length - 1 ? <text key={l + i} x={x(i)} y={height - 6} textAnchor="middle" fontSize="11" fill="var(--color-chart-axis)">{l}</text> : null)}
          {area && series.length === 1 && <path d={`${path(series[0])} L${x(labels.length - 1)},${y(lo)} L${x(0)},${y(lo)} Z`} fill={series[0].color} opacity="0.1" />}
          {series.map((s) => <path key={s.id} d={path(s)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? '4 4' : undefined} />)}
          {w >= 480 && series.length <= 4 && series.map((s) => <text key={s.id + 'l'} x={x(labels.length - 1) + 8} y={y(s.values[s.values.length - 1]) + 4} fontSize="11" fontWeight="600" fill="var(--color-text-secondary)">{s.values[s.values.length - 1]}{unit}</text>)}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={height - pad.b} stroke="var(--color-border-strong)" strokeWidth="1" />
              {series.map((s) => <circle key={s.id} cx={x(hover)} cy={y(s.values[hover])} r="4.5" fill={s.color} stroke="var(--color-bg-surface)" strokeWidth="2" />)}
            </g>
          )}
          {hover === null && series.map((s) => <circle key={s.id} cx={x(labels.length - 1)} cy={y(s.values[s.values.length - 1])} r="4" fill={s.color} stroke="var(--color-bg-surface)" strokeWidth="2" />)}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-1 z-10 min-w-[8rem] rounded-md border border-line bg-elevated px-3 py-2 text-caption shadow-md" style={{ left: Math.min(Math.max(x(hover) + 12, 0), w - 150) }} role="status">
            <p className="mb-1 font-semibold">{labels[hover]}</p>
            {series.map((s) => <p key={s.id} className="flex items-center justify-between gap-4 text-ink-secondary"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</span><span className="font-semibold tabular-nums text-ink">{s.values[hover]}{unit}</span></p>)}
          </div>
        )}
      </div>
    </ChartFrame>
  )
}
