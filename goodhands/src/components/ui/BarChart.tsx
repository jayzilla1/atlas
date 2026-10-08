import { useId } from 'react'

/**
 * A deliberately plain bar chart in SVG. Charts only appear where a *trend* is the point.
 * Every chart has: value labels (no hovering needed), a text summary for screen readers,
 * and a "View as table" fallback with the exact same numbers.
 */
export function BarChart({ data, summary, unit = '', height = 160 }: { data: Array<{ label: string; value: number; hint?: string }>; summary: string; unit?: string; height?: number }) {
  const id = useId()
  const max = Math.max(1, ...data.map((d) => d.value))
  const w = 100 / data.length
  return (
    <figure>
      <div role="img" aria-labelledby={id} className="w-full">
        <span id={id} className="sr-only">{summary}</span>
        <svg viewBox={`0 0 ${data.length * 40} ${height + 36}`} className="w-full" aria-hidden>
          <line x1="0" x2={data.length * 40} y1={height} y2={height} stroke="var(--border-strong)" strokeWidth="1" />
          {data.map((d, i) => {
            const h = (d.value / max) * (height - 22)
            return (
              <g key={`${d.label}-${i}`}>
                <rect x={i * 40 + 8} y={height - h} width="24" height={h} rx="3" fill="var(--primary)" opacity={d.value === 0 ? 0.25 : 1} />
                <text x={i * 40 + 20} y={height - h - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text-primary)">{d.value}{unit}</text>
                <text x={i * 40 + 20} y={height + 14} textAnchor="middle" fontSize="9.5" fill="var(--text-secondary)">{d.label}</text>
                {d.hint && <text x={i * 40 + 20} y={height + 26} textAnchor="middle" fontSize="8.5" fill="var(--text-tertiary)">{d.hint}</text>}
              </g>
            )
          })}
        </svg>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer rounded text-small font-semibold text-primary-text">View as table</summary>
        <table className="mt-2 w-full text-small"><caption className="sr-only">{summary}</caption><tbody>{data.map((d) => <tr key={`${d.label}-${d.hint}`} className="border-b border-line-subtle"><th scope="row" className="py-1.5 text-left font-medium">{d.label} {d.hint}</th><td className="py-1.5 text-right tabular-nums">{d.value}{unit}</td></tr>)}</tbody></table>
      </details>
      <span className="hidden" style={{ width: `${w}%` }} />
    </figure>
  )
}
