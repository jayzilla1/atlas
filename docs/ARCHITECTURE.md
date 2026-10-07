# Atlas — product & system architecture

> Atlas is a fictional B2B SaaS product built as a design portfolio piece.
> Tagline: **Complex enterprise information, made understandable.**

This document is the "think first" step: product, information architecture, design-system
foundations and the reusable component list. The code follows it.

---

## 1. Product

**What Atlas does.** Companies keep their operations data in many systems (HR, identity, apps,
vendors, policies). Atlas connects them and answers six questions for a busy leader:

1. What is going well? 2. What needs attention? 3. What risks exist? 4. Why does it matter?
5. What should we do next? 6. Can Atlas help do it?

**Primary persona.** *Maya Okafor, Security & Operations Manager* at **Harborlight Software**
(fictional, 248 people). She is accountable for "are we safe and audit-ready?" but is not a
specialist in every technical area. Every screen must answer, in this order:

> What is happening → Why does it matter → What should I do → What can Atlas help with
> → What does the AI know / not know → What needs my approval

**Design decisions made on the user's behalf** (documented, not asked):

| Decision | Why |
| --- | --- |
| Fixed "today" = **7 Oct 2026** (`src/data/clock.ts`) | Demo numbers ("expires in 12 days") never rot. |
| Dashboard numbers are **derived from the data**, never typed in twice | 12 open risks on the dashboard == 12 rows on the Risks page. |
| Jargon is a first-class feature: a glossary (`src/data/glossary.ts`) feeds `<Term>` tooltips, "Why this matters" panels and the Help page | The user is learning the domain by using the product. |
| AI uses a restrained teal "AI" colour family, a small spark mark and a left rule — no purple gradients | AI should feel like part of the product, not a gimmick. |
| AI is a **local simulation** (`src/ai/engine.ts`) with deliberately non-deterministic UX: thinking → streaming → confidence → sources → caveats → errors | Demonstrates designing for probabilistic systems without a backend. |
| Anything that changes data goes through **propose → review → approve → result → undo** | Human-in-the-loop is a pattern (`AiActionCard`), not a one-off. |
| A **demo role switcher** (Admin / Manager / Auditor) | Lets reviewers see permission-restricted states. |
| A **demo controls** menu (simulate slow/failed loads, AI outage, reset) | Lets reviewers see loading / error states on demand. |

---

## 2. Information architecture

```
Workspace switcher (Harborlight Software ▾)
├─ Overview            /                      "What do I need to know today?"
├─ Risks               /risks                 list + filters
│   └─ Risk detail     /risks/:id             summary · why it matters · evidence · action · activity · related · ask Atlas
├─ Tasks               /tasks                 list/board of work, assign, complete
├─ People              /people
│   └─ Person          /people/:id            apps, training, access-review workflow
├─ Applications        /applications
│   └─ Application     /applications/:id      users, risks, access review
├─ Vendors             /vendors
│   └─ Vendor          /vendors/:id           security docs, contract, risks
├─ Policies            /policies
│   └─ Policy          /policies/:id          document, acknowledgements
├─ Reports             /reports               trends, tables
├─ AI Assistant        /assistant             Atlas AI workspace (+ Ask Atlas drawer anywhere)
└─ Help · Settings · Profile
    Help      /help             glossary, guided tour
    Settings  /settings         workspace, permissions, AI controls
    Design System /design-system   (hidden-ish: linked from Help, Settings, ⌘K and the profile menu)
```

**Data model (all relationships navigable in the UI):**

```
Company ─┬─ People ───────┬─ has access to ──► Applications ──► owner: Person
         │                └─ manager: Person
         ├─ Vendors ──────────────────────────► owner: Person
         ├─ Policies ◄── acknowledged by ── People
         ├─ Risks  ── related: Person[] · Application[] · Vendor[] · Policy[]
         └─ Tasks  ── risk? · entity? · owner: Person
```

---

## 3. Design-system foundations

Three token layers, all CSS custom properties (`src/styles/tokens`):

| Layer | File | Example | Rule |
| --- | --- | --- | --- |
| Primitive | `primitives.css` | `--blue-600: #1d4ed8` | Raw values. Never used in components. |
| Semantic  | `semantic.css`   | `--color-action-primary: var(--blue-700)` | Meaning. Light + dark themes are remaps here. |
| Component | `component.css`  | `--button-primary-bg: var(--color-action-primary)` | Per-component decisions. Components read these. |

Tailwind (`tailwind.config.js`) only *references* semantic tokens, so utilities like `bg-surface`
or `text-ink-secondary` are theme-aware by construction.

* **Type** — Inter Variable; 9-step scale (display → overline), tight tracking on headings.
* **Space** — 4px base grid (`--space-1`…`--space-16`).
* **Radius** — restrained: 4 / 6 / 8 / 12; cards use 12 max (no pill-shaped cards).
* **Elevation** — borders first, shadow second (xs → lg). Elevation is used for overlays.
* **Motion** — 3 durations, 2 easings; everything collapses to ~0 under `prefers-reduced-motion`.
* **Colour semantics** — `bg / fg / border / solid` families for critical, high, warning, success,
  info, neutral + a distinct AI family. Contrast checked ≥ 4.5:1 for text pairs.
* **Never colour alone** — severity & status always render *icon + label + colour* (`SeverityBadge`, `StatusBadge`).

## 4. Component inventory (`src/components`)

* **ui/** Button, IconButton, Input, Textarea, SearchInput, Select, Checkbox, Radio(Group), Toggle,
  Tabs, Badge, SeverityBadge, StatusBadge, StatusIndicator, Avatar(Group), Tooltip, Term (glossary),
  Dropdown, Modal, ConfirmDialog, Drawer, Toast, Card, DataTable (table ↔ cards), Pagination,
  Breadcrumbs, EmptyState, ErrorState, LoadingState, Skeleton, ProgressBar, MetricCard, Callout,
  PageHeader, Timeline, FilterBar, Disclosure, DescriptionList
* **charts/** LineChart, StackedBar, SeverityBar, Donut/Gauge, Sparkline, ChartFrame (adds an accessible "view as table")
* **ai/** AiBadge, ConfidenceBadge, SourceList, AiThinking, StreamingText, AiResponse, AiActionCard,
  AiInsight, AtlasChat
* **domain/** EntityLink / EntityChip, RelatedRecords
* **layouts/** AppShell, Sidebar, Header, CommandPalette, Onboarding
* **pages/** one per route
* **state/** one reducer-backed store (tasks, risks, access reviews, AI conversations, toasts, demo flags)
* **ai/** pure functions: intent matching → structured response (no UI)

## 5. Responsive strategy

| Concern | Desktop ≥1024 | Tablet 768–1023 | Mobile <768 |
| --- | --- | --- | --- |
| Navigation | Sidebar (expanded, collapsible to rail) | Rail by default, expands as overlay | Off-canvas drawer behind a menu button |
| Tables | Full table, sortable | Table, secondary columns hidden | **Stacked record cards** (same data, same sort controls) |
| Filters | Inline filter bar | Inline, wraps | "Filters" button → bottom sheet drawer with active-count |
| Cards/grids | 3–4 col | 2 col | 1 col; metric cards 2-up |
| Charts | Full legends + hover | Same | Simplified labels, legend below, always a table alternative |
| AI conversation | Chat + sources rail | Chat; sources inline | Full-width chat, history in a sheet, composer docked |
| Side panels | Right drawer 480px | Right drawer 420px | Bottom sheet / full-screen |

## 6. Accessibility baseline (WCAG 2.2 AA)

Skip link · landmarks · one `h1` per page · visible 2px focus ring (`:focus-visible`) with ≥3:1
contrast · 24px minimum targets (44px for primary mobile actions) · dialogs trap focus, close on
Esc and restore focus · tooltips reachable by keyboard · `aria-live` for toasts, AI status and
results counts · sortable headers expose `aria-sort` · charts have text/table alternatives ·
`prefers-reduced-motion` honoured · severity/status never colour-only.
