import { useLayoutEffect, useState, type RefObject } from 'react'

export type Placement = 'top' | 'bottom' | 'bottom-start' | 'bottom-end' | 'top-start'
/**
 * Tiny positioning helper (replaces a floating-UI dependency).
 * Computes fixed-position coordinates for a popup relative to an anchor and
 * flips vertically if it would overflow the viewport.
 */
export function useFloating(anchor: RefObject<HTMLElement | null>, popup: RefObject<HTMLElement | null>, open: boolean, placement: Placement = 'bottom-start', offset = 8) {
  const [pos, setPos] = useState<{ top: number; left: number; placement: Placement } | null>(null)
  useLayoutEffect(() => {
    if (!open) { setPos(null); return }
    const update = () => {
      const a = anchor.current; const p = popup.current
      if (!a || !p) return
      const ar = a.getBoundingClientRect(); const pr = p.getBoundingClientRect()
      let place = placement
      const wantsTop = place.startsWith('top')
      const spaceBelow = window.innerHeight - ar.bottom; const spaceAbove = ar.top
      if (wantsTop && spaceAbove < pr.height + offset && spaceBelow > spaceAbove) place = place.replace('top', 'bottom') as Placement
      else if (!wantsTop && spaceBelow < pr.height + offset && spaceAbove > spaceBelow) place = place.replace('bottom', 'top') as Placement
      const top = place.startsWith('top') ? ar.top - pr.height - offset : ar.bottom + offset
      let left: number
      if (place.endsWith('start')) left = ar.left
      else if (place.endsWith('end')) left = ar.right - pr.width
      else left = ar.left + ar.width / 2 - pr.width / 2
      left = Math.max(8, Math.min(left, window.innerWidth - pr.width - 8))
      setPos({ top, left, placement: place })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update) }
  }, [open, anchor, popup, placement, offset])
  return pos
}
