# GoodHands

**One calm place to see what's happening today, what needs attention, and what happens next** — childcare operations for a small home daycare. A portfolio prototype: all data is fictional and local; there is no backend, payments or messaging.

```bash
cd goodhands
npm install
npm run dev            # http://localhost:5173
npm run build          # type-check + production build
npm run check:contrast # verifies the colour tokens meet WCAG AA
```

## A 5-minute tour

The prototype opens on **Wednesday, Oct 7, 10:12 AM** as the owner (Pamela).

1. **Home** — snapshot numbers, *Attention needed* (one prioritised list), today's attendance, reminders, upcoming, optional staff glance.
2. **Attendance** — tap *Check in* (toast + Undo). Use ← / → or the calendar to browse history; correct a past day with ⋯ → *Edit times*. Tap a count (e.g. *Absent*) to filter.
3. **Diaper workflow** — Home → *Notify parent* (Noah or Maya): review message → send (simulated) → child record now reads "Parent notified · Today, 10:14 AM".
4. **Payments** — *Mark as Paid* (one tap, Undo). Filter by Paid / Due / Overdue; browse weeks.
5. **Tasks & Reminders** — recurring reminders, supplies + weekly check, **Blanket Day** (every other Friday), diapers.
6. **Assistant** (✨ top bar) — try *"Who needs diapers?"*, *"What needs my attention today?"*, then *Review → Approve*. Ask something nonsensical to see uncertainty.
7. **Employee experience** — account menu (top right) → *Taylor Reed*. Simplified nav; try visiting `/payments` (permission-restricted), open a child to see the limited **care card**, then **Closeout**.
8. **Forgotten checkout** — *Demo controls* → time travel to **4:45 PM**, check the children out, finish tasks, complete the closeout. As owner, Taylor's *yesterday* missed checkout is on Home → *Review closeout*.
9. **Fresh day** — *Demo controls* → *Tomorrow, 7:30 AM*: attendance resets to Expected; yesterday is preserved.
10. **Design system** — account menu → *Design system*: tokens, live contrast checks, components, states, patterns.

*Demo controls* also force load errors and an assistant outage, and reset the data.

## Structure

```
docs/ARCHITECTURE.md   product + IA + data + tokens + components + a11y + AI model + decisions
src/styles/tokens.css  design tokens (primitives → semantic)
src/types/             what every piece of data looks like
src/data/              fictional, interconnected seed data
src/domain/            pure business rules (attendance status, closeout, attention, reminders…)
src/state/             store (the app's memory), session (role + demo clock), permissions, dialog host
src/ai/                assistant engine (answers from real data) + chat UI
src/components/ui/     design-system components    src/components/domain/  product-specific pieces
src/components/dialogs/ shared workflows (notify parent, mark away, edit attendance, payment)
src/layouts/           app shell, nav, logo, demo panel
src/pages/             one file per screen (+ pages/staff/ for the employee experience)
```
