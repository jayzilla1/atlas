/**
 * Tailwind is a *consumer* of the design tokens, never a source of raw values.
 * Think of it as a shorthand: `bg-surface` simply means `background: var(--surface)`.
 * Change a token in src/styles/tokens.css and every screen follows.
 */
const v = (name) => `var(--${name})`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    extend: {
      colors: {
        primary: { DEFAULT: v('primary'), hover: v('primary-hover'), subtle: v('primary-subtle'), 'subtle-hover': v('primary-subtle-hover'), text: v('primary-text'), on: v('on-primary') },
        canvas: v('canvas'),
        surface: { DEFAULT: v('surface'), muted: v('surface-muted'), sunken: v('surface-sunken'), hover: v('surface-hover') },
        line: { DEFAULT: v('border'), subtle: v('border-subtle'), strong: v('border-strong') },
        ink: { DEFAULT: v('text-primary'), secondary: v('text-secondary'), tertiary: v('text-tertiary'), inverse: v('text-inverse') },
        success: { DEFAULT: v('success'), text: v('success-text'), bg: v('success-bg') },
        warning: { DEFAULT: v('warning'), text: v('warning-text'), bg: v('warning-bg') },
        danger: { DEFAULT: v('danger'), text: v('danger-text'), bg: v('danger-bg') },
        info: { DEFAULT: v('info'), text: v('info-text'), bg: v('info-bg') },
        neutral: { DEFAULT: v('neutral'), text: v('neutral-text'), bg: v('neutral-bg') },
      },
      fontFamily: { sans: v('font-sans'), display: v('font-display') },
      fontSize: {
        caption: ['var(--text-caption)', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        small: ['var(--text-small)', { lineHeight: '1.25rem' }],
        body: ['var(--text-body)', { lineHeight: '1.5rem' }],
        lead: ['var(--text-lead)', { lineHeight: '1.75rem' }],
        h3: ['var(--text-h3)', { lineHeight: '1.75rem', fontWeight: '600' }],
        h2: ['var(--text-h2)', { lineHeight: '2rem', fontWeight: '700' }],
        h1: ['var(--text-h1)', { lineHeight: '2.25rem', fontWeight: '700' }],
        display: ['var(--text-display)', { lineHeight: '1', fontWeight: '700' }],
      },
      borderRadius: { sm: v('radius-sm'), md: v('radius-md'), lg: v('radius-lg'), xl: v('radius-xl'), full: v('radius-full') },
      boxShadow: { sm: v('shadow-sm'), md: v('shadow-md'), lg: v('shadow-lg') },
      transitionDuration: { fast: v('motion-fast'), base: v('motion-base'), slow: v('motion-slow') },
      transitionTimingFunction: { out: v('ease-out') },
      spacing: { sidebar: v('sidebar-width'), 'bottom-nav': v('bottom-nav-height'), control: v('control-height') },
      maxWidth: { content: v('content-max') },
    },
  },
  plugins: [],
}
