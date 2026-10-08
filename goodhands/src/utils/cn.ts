/** Joins class names, skipping anything falsy. `cn('a', isOn && 'b')` → 'a b' or 'a'. */
export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')
