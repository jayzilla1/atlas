# Atlas

**Complex enterprise information, made understandable.**

Atlas is a *fictional* B2B SaaS product — an AI-powered operations & risk intelligence platform — built as a
portfolio piece covering product design, visual design, design systems and AI product design.
Everything is local mock data for a made-up company (**Harborlight Software**, 248 people). There is no backend.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build
npm run check:data   # verifies the demo data's story numbers and cross-references
```

## Take the tour (≈ 5 minutes)

1. **Overview** — health score (87), "Attention required", AI insight, risk chart, upcoming tasks.
2. **Risks → R-101** — summary · *why this matters* in plain English · evidence · recommended action · related records · *Ask Atlas about this risk*.
3. **AI Assistant** → *"Find employees who haven't completed required security training and create tasks for their managers."*
   Review the proposal, untick someone, **Approve & create**, see the activity log, then **Undo**.
4. **People → Jordan Williams** → *Start access review* → *Apply suggestions* → *Review & submit*.
5. **People → Devon Park** — a former contractor who still has access → *Remove all access*.
6. **Demo controls** (flask icon): switch role to *Auditor* (permission-restricted states), force a load error, simulate an AI outage, turn on the **Portfolio inspector**.
7. **Design System** (account menu, Help page, or ⌘K) — tokens, live contrast checks, every component and state.

## Structure

```
docs/ARCHITECTURE.md      product, IA, token layers, component inventory, responsive + a11y strategy
src/styles/tokens/        primitives.css → semantic.css (light/dark) → component.css
src/tokens/manifest.ts    typed index of token names (drives Design System + inspector)
src/components/ui/        Button, Form controls, Badge, Tooltip/Term, Overlay (Modal/Drawer/Confirm), Toast, DataTable, …
src/components/charts/    hand-built SVG charts (line, stacked, bar list, severity bar, gauge) with table alternatives
src/components/ai/        AiBadge, ConfidenceBadge, SourceList, AiThinking, AiResponseView, AiActionCard, AtlasChat
src/components/domain/    EntityChip/PersonLink (cross-linking), TaskModal, badges
src/layouts/              AppShell, Sidebar, Header, CommandPalette, Onboarding, Demo panel
src/pages/                one file per route
src/data/                 interconnected mock data + selectors (dashboard numbers are derived, never typed twice)
src/ai/                   simulated reasoning engine + conversation/streaming state (no UI)
src/state/                store (tasks, risks, reviews, activity) + role permissions
```

## Notable design decisions

* **Plain-language first.** `<Term id="mfa">` wraps jargon with a tooltip from `src/data/glossary.ts`; Help lists the full glossary.
* **AI as a non-deterministic system.** Thinking → streaming → confidence → sources → caveats → "I couldn't find enough information" → outage/retry; stop/regenerate/feedback.
* **Human in the loop.** Anything that changes data: propose → review → approve → result → undo, plus an activity log.
* **Never colour alone.** Severity/status = colour + icon + label; contrast verified live on the Design System page.
* **Teal marks AI**, blue marks action; no purple gradients.
* **One table, two layouts.** `DataTable` renders a semantic table ≥ 768px and record cards below.
* **Frozen date** (7 Oct 2026) so "expires in 12 days" never rots.

Dependencies: React, React Router, Lucide icons, Inter (self-hosted via Fontsource), Tailwind CSS. Charts are hand-built SVG.
