/** WCAG contrast ratio between two hex colours. Used by the design-system page to prove tokens pass AA. */
const lum = (hex: string) => {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
/** Resolves a CSS variable to a hex string, e.g. '--primary' → '#b8470a'. */
export const cssVarHex = (name: string) => {
  const probe = document.createElement('span'); probe.style.color = `var(${name})`; document.body.appendChild(probe)
  const rgb = getComputedStyle(probe).color; probe.remove()
  const m = rgb.match(/\d+/g)?.map(Number) ?? [0, 0, 0]
  return '#' + m.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('')
}
