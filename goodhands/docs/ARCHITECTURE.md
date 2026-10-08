# GoodHands — architecture & design decisions

## 1. Product thesis
> GoodHands tells staff what needs their attention instead of making them remember everything.

Every decision serves *"what is happening today, what needs attention, what happens next?"* — progressive disclosure, derived status, one source of truth, and workflows (not just records).

## 2. Information architecture
| Owner nav | Purpose | Employee nav |
|---|---|---|
| Home | Daily command center | Today |
| Attendance | The core workflow | Attendance |
| Children | Directory + profiles | — (limited *care card* only) |
| Payments | Who paid | — |
| Tasks & Reminders | Recurring routines, supplies, Blanket Day, diapers | My Tasks |
| Employees / Schedule | Staff records, shifts, checklists | My Schedule |
| Documents / Reports / Settings | Paperwork, summaries, configuration | — |
| *(Closeout)* | Owner sees status on Employees | Closeout |

Phones/tablets use a bottom bar (4 key destinations + More for the owner; all 5 for staff), because staff use the product one-handed while moving.

## 3. Key workflows
- **Attendance**: status is *derived* from (check-in record, absence/vacation range, weekly schedule). A new day needs no reset — it simply has no records yet — so history is never destroyed and past days are correctable. Late = arrival beyond a configurable grace period.
- **Diapers**: low/out → an Attention item → *Notify parent* (review/edit message → send (simulated) or "told in person") → recorded on the child → "Diapers received". Checkout toasts also prompt when pickup is the right moment.
- **Forgotten employee checkout (behavioural design)**: checkout is the *last step of a closeout checklist*. Some items are verified automatically (children out — or handed to a colleague still on shift; tasks done), others ticked. The button is never disabled: if items are open, a calm dialog offers *Review Closeout* or *Check out anyway* (flagged for the owner as "left with N items open"). A missed checkout becomes an Attention item that opens the fix dialog in one tap.
- **Recurring reminders**: a small rule engine (`weekdays | weekly | every_n_weeks | once` + lead days). Blanket Day = every 2 weeks on Friday, surfaced N days ahead. Low supplies auto-create restock to-dos.
- **Vacation**: a date range, so attendance fills in by itself.

## 4. Roles & privacy
`state/permissions.ts` is a capability table (`financials`, `sensitive_employee_records`, `full_child_records`, `care_card`…). Screens ask for capabilities, not roles — so a future Parent role is a new column, not a rewrite. Employees get separate routes; owner-only URLs show a "for the owner" state. Restricted documents (W-2, licence, health) show a lock and ask for confirmation before opening. No security feature is claimed that doesn't exist; there is no real authentication in V1.

## 5. Data model (src/types)
`Child` ↔ `Guardian[]`, `AttendanceRecord`, `Absence` (range), `Payment` (per week), `DocumentRecord`, `ParentNotice`, diaper state.
`Employee` ↔ `ShiftRecord` (check-in/out/flag), `RoutineTask` (template) + completions per date, `OneTimeTask`, `TimeOff`, closeout ticks.
`Supply` ↔ `SupplyEvent`. `Reminder` ↔ `reminderDone[id:date]`, `blankets[date:child]`. Everything references ids, so one change appears everywhere.

## 6. Code architecture (teaching notes)
- **Types** describe data shapes (a spell-checker for data).
- **Domain** = plain functions with business rules; unit-testable and shared by screens *and* the assistant, so they can never disagree.
- **Store** (reducer) = the app's memory; every change is a named action. Swapping to a real backend means rewriting only these actions.
- **Dialog host** lets any screen start the same workflow.
- **Pages are lazy-loaded** (downloaded when opened).
- `useSimulatedLoad` fakes network waits so loading/error states can be designed; Demo controls force the error.

## 7. Design tokens
Two layers (`styles/tokens.css`): *primitives* (raw palette) → *semantic* (`primary`, `surface`, `text-secondary`, `success|warning|danger|info` each with strong / text / bg). Tailwind only maps to semantic tokens. Orange (#B8470A) is the brand/action colour only; cream canvas, white surfaces, charcoal text. Spacing 4px base; modest radii (6/8/12); elevation mostly borders; motion tokens collapse to 0 under *reduce motion*. `npm run check:contrast` and the Design System page verify AA numerically.

## 8. Accessibility (WCAG 2.2 AA target)
Skip link; route-change focus + titles; native `<dialog>` for modals/drawers (focus trap, Esc, inert background); APG patterns for tabs, menus, calendar; visible 3px focus ring; labelled fields with hint/error wiring; table captions + `scope`; status = colour + icon + text; 44px touch targets on touch devices; reduced-motion honoured (including the assistant's streaming); live regions for toasts and counts.

## 9. Responsive strategy
≥1024: sidebar + tables. <1024: bottom nav and **cards instead of tables** (tablets included), large primary actions (48px) for check-in/out and task completion.

## 10. AI model
Assistant answers are *structured* (headline, items, sources, confidence, caveat, proposal). The prototype's "brain" is keyword routing over the same domain functions the UI uses — a model-backed version would keep the same contract. Principles: useful first · show sources & confidence · say "I'm not sure" · propose, never act (Review → Approve, Cancel) · graceful outage state · declines out-of-scope (medical/legal) questions.

## 11. Decisions made on ambiguity
- Today's vacation child is **Priya**; **Noah** has the Oct 12–16 trip (the brief assigned both to Noah).
- Blanket Day lands on **Friday Oct 9** (the brief says both "tomorrow" and "Friday").
- Weekly tuition with per-family due weekday, so Maya can be *Due* while Noah is *Overdue* in the same week.
- The app is a standalone folder (`goodhands/`) so the existing Atlas project is untouched.
- Demo data is in-memory and resets on reload (only "viewing as" persists per tab).

## 12. Not built (by design)
Parent portal, real messaging/payments/auth/uploads. Architecture leaves room: permission table, notice log, per-child contact data.
