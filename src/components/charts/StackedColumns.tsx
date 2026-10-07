import { useState } from 'react'
import { useWidth } from './useWidth'
import { ChartFrame, type Series } from './ChartFrame'

/** StackedColumns — totals over time split by category. 2px surface gaps between segments, rounded cap on top. */
export function StackedColumns({ title, description, labels, series, height = 240 }: { title: string; description?: string; labels: string[]; series: Series[]; height?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const pad = { l: 30, r: 8, t: 10, b: 26 }
  const totals = labels.map((_, i) => series.reduce((a, s) => a + s.values[i], 0))
  const hi = Math.ceil(Math.max(...totals) / 5) * 5
  const bw = Math.min(28, ((w - pad.l - pad.r) / labels.length) * 0.62)
  const cx = (i: number) => pad.l + ((i + 0.5) * (w - pad.l - pad.r)) / labels.length
  const y = (v: number) => pad.t + (1 - v / hi) * (height - pad.t - pad.b)
  const step = w < 480 ? 2 : 1
  return (
    <ChartFrame title={title} description={description} legend={series.map((s) => ({ label: s.label, color: s.color }))}
      table={{ columns: ['Period', ...series.map((s) => s.label), 'Total'], rows: labels.map((l, i) => [l, ...series.map((s) => s.values[i]), totals[i]]) }}>
      <div ref={ref} className="relative" style={{ height }}>
        <svg width={w} height={height} role="img" aria-label={`${title}. Use “View as table” for exact values.`} onPointerLeave={() => setHover(null)}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => <g key={t}><line x1={pad.l} x2={w - pad.r} y1={y(hi * t)} y2={y(hi * t)} stroke="var(--color-chart-grid)" /><text x={pad.l - 6} y={y(hi * t) + 4} textAnchor="end" fontSize="11" fill="var(--color-chart-axis)">{Math.round(hi * t)}</text></g>)}
          {labels.map((l, i) => {
            let acc = 0
            return (
              <g key={l} onPointerEnter={() => setHover(i)} opacity={hover === null || hover === i ? 1 : 0.55}>
                <rect x={cx(i) - ((w - pad.l - pad.r) / labels.length) / 2} y={pad.t} width={(w - pad.l - pad.r) / labels.length} height={height - pad.t - pad.b} fill="transparent" />
                {series.map((s, si) => {
                  const v = s.values[i]; if (!v) return null
                  const y0 = y(acc); acc += v; const y1 = y(acc)
                  const isTop = si === series.length - 1 || series.slice(si + 1).every((t) => !t.values[i])
                  const hgt = Math.max(0, y0 - y1 - 2)
                  return <rect key={s.id} x={cx(i) - bw / 2} y={y1} width={bw} height={hgt} rx={isTop ? 3 : 0} fill={s.color} />
                })}
                {i % step === 0 && <text x={cx(i)} y={height - 6} textAnchor="middle" fontSize="11" fill="var(--color-chart-axis)">{l}</text>}
              </g>
            )
          })}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-1 z-10 min-w-[8.5rem] rounded-md border border-line bg-elevated px-3 py-2 text-caption shadow-md" style={{ left: Math.min(Math.max(cx(hover) + 14, 0), w - 160) }} role="status">
            <p className="mb-1 font-semibold">{labels[hover]} · {totals[hover]} open</p>
            {[...series].reverse().map((s) => <p key={s.id} className="flex items-center justify-between gap-4 text-ink-secondary"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />{s.label}</span><span className="font-semibold tabular-nums text-ink">{s.values[hover]}</span></p>)}
          </div>
        )}
      </div>
    </ChartFrame>
  )
}
