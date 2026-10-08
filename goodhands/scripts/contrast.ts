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
// Palette: one orange + neutral greys. Every pair below is a real text/background (or UI/background) pairing in the product.
const pairs: [string, string, string, number][] = [
  ['text on glass frame', '#1F1F23', '#F4F4F6', 4.5],
  ['text-secondary on white', '#55555C', '#FFFFFF', 4.5],
  ['text-secondary on frame', '#55555C', '#F4F4F6', 4.5],
  ['text-tertiary on white', '#62626A', '#FFFFFF', 4.5],
  ['text-tertiary on frame', '#62626A', '#F4F4F6', 4.5],
  ['text-tertiary on backdrop', '#62626A', '#E4E5E9', 4.5],
  ['white on primary (buttons, active nav, danger badge)', '#FFFFFF', '#B8470A', 4.5],
  ['white on primary-hover', '#FFFFFF', '#9A3A06', 4.5],
  ['white on hero gradient start', '#FFFFFF', '#8F3305', 4.5],
  ['white on hero gradient end', '#FFFFFF', '#C4480C', 4.5],
  ['primary-text on white', '#A83F06', '#FFFFFF', 4.5],
  ['primary-text on primary-subtle', '#A83F06', '#FDEBDD', 4.5],
  ['warning-text on warning-bg', '#8F3305', '#FDEBDD', 4.5],
  ['danger-text on danger-bg', '#A83F06', '#FBDCC8', 4.5],
  ['success-text on success-bg (quiet grey chip)', '#3A3A40', '#ECECEF', 4.5],
  ['info-text on white (outline chip)', '#3A3A40', '#FFFFFF', 4.5],
  ['neutral-text on neutral-bg', '#3A3A40', '#ECECEF', 4.5],
  ['white on ink (toast, count pill)', '#FFFFFF', '#1F1F23', 4.5],
  ['border-strong on white (UI)', '#8A8A93', '#FFFFFF', 3],
  ['focus ring on frame (UI)', '#1F1F23', '#F4F4F6', 3],
  ['focus ring on orange hero (UI)', '#1F1F23', '#B8470A', 3],
  ['orange icon on white (UI)', '#B8470A', '#FFFFFF', 3],
]
let bad = 0
for (const [name, fg, bg, min] of pairs) {
  const r = ratio(fg, bg)
  const ok = r >= min
  if (!ok) bad++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}  (min ${min})  ${name}`)
}
process.exit(bad ? 1 : 0)
