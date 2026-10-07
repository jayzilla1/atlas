/**
 * Token manifest — a typed index of the CSS custom properties declared in
 * src/styles/tokens/*.css. The values live in CSS (single source of truth);
 * this file only lists *names* and *roles* so the Design System page and the
 * Portfolio Inspector can display and reverse-look-up them at runtime.
 */
export interface TokenDef { name: string; role: string }
export interface TokenGroup { id: string; title: string; layer: 'primitive' | 'semantic' | 'component'; description: string; tokens: TokenDef[] }

const t = (name: string, role: string): TokenDef => ({ name, role })

export const SEMANTIC_COLORS: TokenGroup[] = [
  { id: 'surface', title: 'Surface', layer: 'semantic', description: 'Backgrounds, from page to overlay.', tokens: [
    t('--color-bg-canvas', 'Page background'), t('--color-bg-surface', 'Cards, tables, panels'), t('--color-bg-elevated', 'Menus, dialogs'),
    t('--color-bg-sunken', 'Inset areas, table headers'), t('--color-bg-hover', 'Hover wash'), t('--color-bg-selected', 'Selected row / nav') ] },
  { id: 'border', title: 'Border', layer: 'semantic', description: 'Dividers and control outlines.', tokens: [
    t('--color-border-subtle', 'Hairlines'), t('--color-border-default', 'Cards, dividers'), t('--color-border-strong', 'Inputs (≥ 3:1)') ] },
  { id: 'text', title: 'Text', layer: 'semantic', description: 'All pairs ≥ 4.5:1 on their surfaces.', tokens: [
    t('--color-text-primary', 'Body & headings'), t('--color-text-secondary', 'Supporting text'), t('--color-text-tertiary', 'Hints, placeholders'), t('--color-text-link', 'Links') ] },
  { id: 'action', title: 'Action (primary / secondary)', layer: 'semantic', description: 'Brand blue is the single primary action colour; secondary actions are neutral.', tokens: [
    t('--color-action-primary', 'Primary button, links'), t('--color-action-primary-hover', 'Hover'), t('--color-action-primary-pressed', 'Pressed'), t('--color-action-primary-subtle', 'Tinted background'), t('--color-focus-ring', 'Focus ring') ] },
  { id: 'ai', title: 'AI', layer: 'semantic', description: 'Teal marks everything that comes from Atlas AI.', tokens: [
    t('--color-ai-accent', 'AI mark, rule'), t('--color-ai-subtle', 'AI surface'), t('--color-ai-border', 'AI border'), t('--color-ai-text', 'AI text') ] },
  { id: 'status', title: 'Status (bg / fg / border / solid)', layer: 'semantic', description: 'Always paired with an icon and a label.', tokens: [
    ...(['critical', 'high', 'warning', 'success', 'info', 'neutral'] as const).flatMap((k) => [t(`--color-${k}-bg`, `${k} background`), t(`--color-${k}-fg`, `${k} text/icon`), t(`--color-${k}-border`, `${k} border`), t(`--color-${k}-solid`, `${k} fill (bars)`)]) ] },
  { id: 'chart', title: 'Data visualisation', layer: 'semantic', description: 'Categorical order is fixed; never cycled.', tokens: [t('--color-chart-1', 'Series 1'), t('--color-chart-2', 'Series 2'), t('--color-chart-3', 'Series 3'), t('--color-chart-4', 'Series 4'), t('--color-chart-grid', 'Gridlines'), t('--color-chart-axis', 'Axis text')] },
]

export const PRIMITIVE_RAMPS: { name: string; steps: string[]; note: string }[] = [
  { name: 'slate', steps: ['0', '25', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'], note: 'Neutrals (cool)' },
  { name: 'blue', steps: ['50', '100', '200', '300', '400', '500', '600', '700', '800'], note: 'Brand / action' },
  { name: 'teal', steps: ['50', '100', '200', '400', '500', '600', '700', '800', '900'], note: 'AI' },
  { name: 'red', steps: ['50', '100', '200', '300', '500', '600', '700', '900'], note: 'Critical' },
  { name: 'orange', steps: ['50', '100', '200', '300', '500', '600', '900'], note: 'High' },
  { name: 'amber', steps: ['50', '100', '200', '300', '500', '600', '900'], note: 'Warning / medium' },
  { name: 'green', steps: ['50', '100', '200', '300', '500', '600', '900'], note: 'Success' },
  { name: 'sky', steps: ['50', '100', '200', '300', '500', '600', '900'], note: 'Info / low' },
]

export const TYPE_SCALE = [
  { id: 'display', name: 'Display', use: 'Health score, hero numbers', weight: 600, track: '-0.025em' },
  { id: 'title-1', name: 'Title 1', use: 'Page titles (h1)', weight: 600, track: '-0.02em' },
  { id: 'title-2', name: 'Title 2', use: 'Section emphasis, AI insight', weight: 600, track: '-0.015em' },
  { id: 'title-3', name: 'Title 3', use: 'Card titles (h2/h3)', weight: 600, track: '-0.01em' },
  { id: 'body-lg', name: 'Body large', use: 'Lead paragraphs, AI answers', weight: 400, track: '0' },
  { id: 'body', name: 'Body', use: 'Default UI text', weight: 400, track: '0' },
  { id: 'body-sm', name: 'Body small', use: 'Table cells, secondary', weight: 400, track: '0' },
  { id: 'caption', name: 'Caption', use: 'Meta, timestamps', weight: 400, track: '0.005em' },
  { id: 'overline', name: 'Overline', use: 'Eyebrows, group labels', weight: 600, track: '0.06em' },
]
export const SPACING = ['1', '2', '3', '4', '5', '6', '8', '10', '12', '16']
export const RADII = ['xs', 'sm', 'md', 'lg', 'xl', 'full']
export const SHADOWS = [{ n: 'xs', use: 'Cards, buttons' }, { n: 'sm', use: 'Hover cards' }, { n: 'md', use: 'Charts tooltips' }, { n: 'lg', use: 'Menus, dialogs, drawers' }]
export const MOTION = [{ n: '--motion-duration-fast', use: 'Hover, press (120ms)' }, { n: '--motion-duration-base', use: 'Expand, fade (200ms)' }, { n: '--motion-duration-slow', use: 'Drawers, progress (320ms)' }]

export const COMPONENT_TOKENS: TokenDef[] = [
  t('--button-radius', 'Button corner radius'), t('--button-primary-bg', 'Primary button fill'), t('--button-primary-bg-hover', 'Primary hover'), t('--button-primary-bg-pressed', 'Primary pressed'), t('--button-primary-fg', 'Primary label'),
  t('--button-secondary-bg', 'Secondary fill'), t('--button-secondary-border', 'Secondary outline'), t('--button-danger-bg', 'Danger fill'),
  t('--button-height-sm', 'Small height'), t('--button-height-md', 'Medium height'), t('--button-height-lg', 'Large height'),
  t('--input-radius', 'Input corner radius'), t('--input-border', 'Input outline (≥ 3:1)'), t('--input-border-error', 'Error outline'), t('--input-height', 'Input height'),
  t('--card-radius', 'Card radius'), t('--card-bg', 'Card fill'), t('--card-border', 'Card outline'), t('--card-padding', 'Card padding'),
  t('--badge-radius', 'Badge radius'), t('--badge-height', 'Badge height'), t('--table-header-bg', 'Table header fill'), t('--table-row-hover', 'Row hover'), t('--table-row-height', 'Row height'),
  t('--modal-radius', 'Dialog radius'), t('--drawer-width', 'Drawer width'), t('--ai-card-bg', 'AI card fill'), t('--ai-card-border', 'AI card outline'), t('--ai-rule-width', 'AI left rule'),
]

/** Read the *resolved* value of a custom property from :root. */
export const tokenValue = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
