/** Verifies the semantic colour pairs meet WCAG AA (4.5:1 text, 3:1 UI). Run: npm run check:contrast */
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const pairs: [string, string, string, number][] = [
  ['text on canvas', '#2A2420', '#F8F1E9', 4.5],
  ['text-secondary on canvas', '#5C534B', '#F8F1E9', 4.5],
  ['text-secondary on surface', '#5C534B', '#FFFFFF', 4.5],
  ['text-tertiary on surface', '#6F655C', '#FFFFFF', 4.5],
  ['white on hero gradient start', '#FFFFFF', '#8F3305', 4.5],
  ['white on hero gradient end', '#FFFFFF', '#C4480C', 4.5],
  ['sidebar text on sidebar', '#D9CDC6', '#2A1A14', 4.5],
  ['white on sidebar', '#FFFFFF', '#2A1A14', 4.5],
  ['white on primary (active nav)', '#FFFFFF', '#B8470A', 4.5],
  ['white on primary', '#FFFFFF', '#B8470A', 4.5],
  ['white on primary-hover', '#FFFFFF', '#9A3A06', 4.5],
  ['primary-text on surface', '#A83F06', '#FFFFFF', 4.5],
  ['primary-text on primary-subtle', '#A83F06', '#FDEBDD', 4.5],
  ['success-text on success-bg', '#1F5C3F', '#E3F1E8', 4.5],
  ['warning-text on warning-bg', '#7A4F00', '#FFF0CC', 4.5],
  ['danger-text on danger-bg', '#A52114', '#FCE6E3', 4.5],
  ['info-text on info-bg', '#1F5483', '#E3EEF8', 4.5],
  ['neutral-text on neutral-bg', '#4A423B', '#EFE9E1', 4.5],
  ['success icon on surface (UI)', '#2E7D55', '#FFFFFF', 3],
  ['warning icon on surface (UI)', '#B26B00', '#FFFFFF', 3],
  ['danger icon on surface (UI)', '#C42B1C', '#FFFFFF', 3],
  ['border-strong on surface (UI)', '#8C8175', '#FFFFFF', 3],
  ['focus ring on canvas (UI)', '#1D4ED8', '#F8F1E9', 3],
]
let bad = 0
for (const [name, fg, bg, min] of pairs) {
  const r = ratio(fg, bg)
  const ok = r >= min
  if (!ok) bad++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}  (min ${min})  ${name}`)
}
process.exit(bad ? 1 : 0)
