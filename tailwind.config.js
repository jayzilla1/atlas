/**
 * Tailwind is a *consumer* of the design tokens — it never defines raw values.
 * Every colour/space/radius below points at a semantic CSS variable declared in
 * src/styles/tokens/*.css. Change the token, the whole product follows.
 */
const v = (name) => `var(--${name})`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
    extend: {
      colors: {
        brand: v('color-brand'),
        canvas: v('color-bg-canvas'),
        surface: v('color-bg-surface'),
        elevated: v('color-bg-elevated'),
        sunken: v('color-bg-sunken'),
        hover: v('color-bg-hover'),
        selected: v('color-bg-selected'),
        line: { DEFAULT: v('color-border-default'), strong: v('color-border-strong'), subtle: v('color-border-subtle') },
        ink: {
          DEFAULT: v('color-text-primary'),
          secondary: v('color-text-secondary'),
          tertiary: v('color-text-tertiary'),
          inverse: v('color-text-inverse'),
          link: v('color-text-link'),
        },
        action: {
          DEFAULT: v('color-action-primary'),
          hover: v('color-action-primary-hover'),
          pressed: v('color-action-primary-pressed'),
          subtle: v('color-action-primary-subtle'),
          'on': v('color-action-primary-contrast'),
          ink: v('color-action-ink'),
        },
        ai: { DEFAULT: v('color-ai-accent'), subtle: v('color-ai-subtle'), border: v('color-ai-border'), ink: v('color-ai-text') },
        // Status colours always come as a bg / fg / border / icon family
        critical: { bg: v('color-critical-bg'), fg: v('color-critical-fg'), border: v('color-critical-border'), solid: v('color-critical-solid') },
        high: { bg: v('color-high-bg'), fg: v('color-high-fg'), border: v('color-high-border'), solid: v('color-high-solid') },
        warning: { bg: v('color-warning-bg'), fg: v('color-warning-fg'), border: v('color-warning-border'), solid: v('color-warning-solid') },
        success: { bg: v('color-success-bg'), fg: v('color-success-fg'), border: v('color-success-border'), solid: v('color-success-solid') },
        info: { bg: v('color-info-bg'), fg: v('color-info-fg'), border: v('color-info-border'), solid: v('color-info-solid') },
        neutral: { bg: v('color-neutral-bg'), fg: v('color-neutral-fg'), border: v('color-neutral-border'), solid: v('color-neutral-solid') },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        heading: ['"Plus Jakarta Sans Variable"', '"Inter Variable"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // [size, {lineHeight, letterSpacing, fontWeight}] — mirrors the type tokens
        'display': ['var(--font-size-display)', { lineHeight: 'var(--line-height-display)', letterSpacing: '-0.03em', fontWeight: '700' }],
        'title-1': ['var(--font-size-title-1)', { lineHeight: 'var(--line-height-title-1)', letterSpacing: '-0.025em', fontWeight: '700' }],
        'title-2': ['var(--font-size-title-2)', { lineHeight: 'var(--line-height-title-2)', letterSpacing: '-0.015em', fontWeight: '600' }],
        'title-3': ['var(--font-size-title-3)', { lineHeight: 'var(--line-height-title-3)', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['var(--font-size-body-lg)', { lineHeight: 'var(--line-height-body-lg)' }],
        'body': ['var(--font-size-body)', { lineHeight: 'var(--line-height-body)' }],
        'body-sm': ['var(--font-size-body-sm)', { lineHeight: 'var(--line-height-body-sm)' }],
        'caption': ['var(--font-size-caption)', { lineHeight: 'var(--line-height-caption)', letterSpacing: '0.005em' }],
        'overline': ['var(--font-size-overline)', { lineHeight: 'var(--line-height-overline)', letterSpacing: '0.06em', fontWeight: '600' }],
      },
      borderRadius: {
        xs: v('radius-xs'), sm: v('radius-sm'), md: v('radius-md'), lg: v('radius-lg'), xl: v('radius-xl'), '2xl': v('radius-2xl'), full: v('radius-full'),
      },
      boxShadow: {
        card: v('shadow-card'), xs: v('shadow-xs'), sm: v('shadow-sm'), md: v('shadow-md'), lg: v('shadow-lg'), focus: v('shadow-focus'),
      },
      transitionDuration: { fast: v('motion-duration-fast'), base: v('motion-duration-base'), slow: v('motion-duration-slow') },
      transitionTimingFunction: { standard: v('motion-ease-standard'), emphasized: v('motion-ease-emphasized') },
      maxWidth: { page: '1280px' },
    },
  },
  plugins: [],
}
