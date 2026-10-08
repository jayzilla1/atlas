import type { AppData } from '@/types'
import type { Now } from '@/domain/now'
import type { AiItem, AiResponse } from './types'
import { attentionItems } from '@/domain/attention'
import { attendanceRows, summarize } from '@/domain/attendance'
import { childIssues } from '@/domain/documents'
import { childName, primaryGuardian } from '@/domain/people'
import { paymentStatus, paymentsForWeek } from '@/domain/payments'
import { nextOccurrence, remindersForToday, restockTodos } from '@/domain/reminders'
import { shiftOn, shiftRecord } from '@/domain/tasks'
import { SUPPLY_LABEL } from '@/domain/supplies'
import { addDays, fmtLong, fmtMonthDay, fmtRange, fmtTime, mondayOf, relativeDay, WEEKDAYS, weekdayOf } from '@/utils/dates'
import { joinList, money, plural } from '@/utils/format'

/**
 * THE ASSISTANT'S "BRAIN" (prototype version).
 * A real product would send the question to a language model together with the relevant data. Here,
 * simple keyword matching picks a topic and *real functions over the real mock data* build the answer —
 * so what it says is always consistent with the screens. The UI around it (sources, confidence,
 * approval before acting) is identical to what a model-backed version needs.
 */
export const SUGGESTED_PROMPTS = [
  'What do I need to know today?',
  'What needs my attention today?',
  'Who hasn’t paid this week?',
  'Who needs diapers?',
  'Which children are on vacation next week?',
  'Who hasn’t checked out?',
  'Which supplies need restocking?',
  'What do I need to remember before Friday?',
]

const has = (q: string, re: RegExp) => re.test(q)

export function answer(raw: string, d: AppData, now: Now): AiResponse {
  const q = raw.toLowerCase().replace(/[’']/g, '')
  const base = { question: raw }
  const kids = attendanceRows(d, now.date, now)
  const sum = summarize(kids)
  const first = (id: string) => d.children.find((c) => c.id === id)?.firstName ?? 'A child'

  // Out of scope: be honest rather than guess.
  if (has(q, /(medic(al|ine)|diagnos|dosage|should i give|legal|lawsuit|tax(es)?\b|insurance claim)/)) {
    return { ...base, headline: 'That’s outside what I can help with.', paragraphs: ['I can answer questions about your daycare’s data — attendance, payments, supplies, staff and reminders. For health, legal or tax questions, please ask a qualified professional.'], sources: [], confidence: 'low', followUps: SUGGESTED_PROMPTS.slice(0, 3) }
  }

  // ---- Diapers
  if (has(q, /diaper|pull-?up/)) {
    const need = d.children.filter((c) => c.diaper && c.diaper.status !== 'good').sort((a, b) => (a.diaper!.status === 'out' ? 0 : 1) - (b.diaper!.status === 'out' ? 0 : 1))
    if (need.length === 0) return { ...base, headline: 'No one needs diapers right now.', paragraphs: ['Every child in diapers is marked Good.'], sources: ['Diaper supply · all children'], confidence: 'high', followUps: ['Which supplies need restocking?'] }
    const unnotified = need.filter((c) => !c.diaper!.notified)
    const items: AiItem[] = need.map((c) => ({
      id: c.id, label: `${childName(c)} — ${c.diaper!.status === 'out' ? 'Out' : 'Running low'}`, tone: c.diaper!.status === 'out' ? 'danger' : 'warning',
      detail: c.diaper!.notified ? `Parent notified ${c.diaper!.notified.date === now.date ? 'today' : c.diaper!.notified.date} at ${fmtTime(c.diaper!.notified.time)}` : `Not yet told · ${primaryGuardian(c).name}`,
      cta: c.diaper!.notified ? undefined : { label: 'Notify parent', kind: 'notify', childId: c.id },
    }))
    return {
      ...base, headline: `${plural(need.length, 'child', 'children')} need${need.length === 1 ? 's' : ''} diapers.`, items,
      proposal: unnotified.length ? { id: 'notify-diapers', title: unnotified.length === 1 ? `Notify ${first(unnotified[0].id)}’s parent?` : `Notify ${unnotified.length} parents?`, description: 'I can prepare a message for each family. Nothing is sent until you approve it.', kind: 'notify_parents', childIds: unnotified.map((c) => c.id) } : undefined,
      sources: ['Diaper supply · all children', 'Notification history'], confidence: 'high', followUps: ['What needs my attention today?'],
    }
  }

  // ---- Payments
  if (has(q, /paid|payment|owe|unpaid|overdue|tuition|balance|collect/)) {
    const week = mondayOf(now.date)
    const unpaid = paymentsForWeek(d, week).filter((p) => !p.paidOn)
    const older = d.payments.filter((p) => !p.paidOn && p.weekStart < week)
    const all = [...older, ...unpaid]
    if (all.length === 0) return { ...base, headline: 'Everyone has paid this week.', paragraphs: ['No unpaid payments for the week of ' + fmtMonthDay(week) + '.'], sources: [`Payments · week of ${fmtMonthDay(week)}`], confidence: 'high' }
    return {
      ...base, headline: `${plural(all.length, 'payment')} ${all.length === 1 ? 'is' : 'are'} still unpaid.`,
      paragraphs: [`Total outstanding: ${money(all.reduce((t, p) => t + p.amount, 0))}.`],
      items: all.map((p) => { const st = paymentStatus(p, now.date); return { id: p.id, label: `${first(p.childId)} — ${money(p.amount)}`, detail: `${st === 'overdue' ? 'Overdue' : 'Due'} · was due ${relativeDay(p.dueDate, now.date).toLowerCase()} (week of ${fmtMonthDay(p.weekStart)})`, tone: st === 'overdue' ? 'danger' : 'warning', cta: { label: 'Open payments', kind: 'navigate', to: '/payments' } } as AiItem }),
      sources: [`Payments · week of ${fmtMonthDay(week)}`], confidence: 'high', caveat: 'I only know what’s recorded in GoodHands. If a family paid and it isn’t marked yet, the list will be out of date.',
      followUps: ['What needs my attention today?'],
    }
  }

  // ---- Vacation / time away
  if (has(q, /vacation|away|time off|out next|off next|\bout\b.*week/)) {
    const next = has(q, /next week/)
    const mon = mondayOf(now.date), start = next ? addDays(mon, 7) : now.date, end = next ? addDays(mon, 11) : addDays(mon, 4)
    const kidsAway = d.absences.filter((a) => a.kind === 'vacation' && a.end >= start && a.start <= end)
    const staffAway = d.timeOff.filter((t) => t.end >= start && t.start <= end)
    const items: AiItem[] = [
      ...kidsAway.map((a) => ({ id: a.id, label: `${first(a.childId)} — vacation`, detail: fmtRange(a.start, a.end), tone: 'info' as const, cta: { label: 'Open profile', kind: 'navigate' as const, to: `/children/${a.childId}` } })),
      ...staffAway.map((t) => ({ id: t.id, label: `${d.employees.find((e) => e.id === t.employeeId)?.firstName} (staff) — ${t.reason.toLowerCase()}`, detail: fmtRange(t.start, t.end), tone: 'neutral' as const })),
    ]
    const label = next ? 'next week' : 'this week'
    if (items.length === 0) return { ...base, headline: `No one is scheduled to be away ${label}.`, sources: ['Absences & vacations', 'Staff time off'], confidence: 'high' }
    return { ...base, headline: `${plural(items.length, 'person', 'people')} ${items.length === 1 ? 'is' : 'are'} away ${label}.`, items, sources: ['Absences & vacations', 'Staff time off'], confidence: 'high', followUps: ['What do I need to remember before Friday?'] }
  }

  // ---- Checkout (ambiguous: staff or children)
  if (has(q, /check(ed)?[ -]?out|checkout|leave|gone home/)) {
    const staffOpen = d.shifts.filter((s) => s.checkIn && !s.checkOut && !s.resolvedNote && (s.date < now.date || (shiftOn(d, s.employeeId, s.date) && s.date === now.date && false)))
    const staffOn = d.employees.filter((e) => { const r = shiftRecord(d, e.id, now.date); return r?.checkIn && !r.checkOut })
    const here = kids.filter((r) => r.view.status === 'present' || r.view.status === 'late')
    const items: AiItem[] = [
      ...staffOpen.map((s) => { const e = d.employees.find((x) => x.id === s.employeeId)!; return { id: `s-${e.id}-${s.date}`, label: `${e.firstName} (staff) — no checkout on ${WEEKDAYS[weekdayOf(s.date)]}`, detail: `Checked in ${fmtTime(s.checkIn)}, never checked out.`, tone: 'warning' as const, cta: { label: 'Review closeout', kind: 'navigate' as const, to: `/employees/${e.id}?tab=shifts&resolve=${s.date}` } } }),
      ...staffOn.map((e) => ({ id: `on-${e.id}`, label: `${e.firstName} (staff) — still on shift`, detail: `Shift ends ${fmtTime(shiftOn(d, e.id, now.date)?.end)}.`, tone: 'neutral' as const })),
      ...here.map((r) => ({ id: r.child.id, label: `${childName(r.child)} — still here`, detail: `Checked in ${fmtTime(r.view.record?.checkIn)}`, tone: 'neutral' as const })),
    ]
    return { ...base, headline: items.length ? `${plural(items.length, 'person', 'people')} ${items.length === 1 ? 'hasn’t' : 'haven’t'} checked out.` : 'Everyone has checked out.', items, sources: ['Staff check-ins', 'Child attendance · today'], confidence: 'medium', caveat: 'You didn’t say whether you meant staff or children, so I included both. Tell me if you meant just one.', followUps: ['Who is here right now?'] }
  }

  // ---- Supplies
  if (has(q, /suppl|restock|wipes|gloves|paper towel|cleaning|running (low|out)/)) {
    const todo = restockTodos(d)
    if (todo.length === 0) return { ...base, headline: 'Nothing needs restocking.', paragraphs: ['All tracked supplies are marked Good.'], sources: ['Supplies'], confidence: 'high' }
    return { ...base, headline: `${plural(todo.length, 'supply', 'supplies')} need${todo.length === 1 ? 's' : ''} restocking.`, items: todo.map((s) => ({ id: s.id, label: `${s.name} — ${SUPPLY_LABEL[s.status]}`, detail: s.note, tone: s.status === 'restock' ? 'danger' as const : 'warning' as const, cta: { label: 'Open supplies', kind: 'navigate' as const, to: '/tasks?tab=supplies' } })), sources: ['Supplies', 'Weekly supply check'], confidence: 'high', followUps: ['Who needs diapers?'] }
  }

  // ---- Paperwork
  if (has(q, /document|paperwork|missing|expir|form|file/)) {
    const list = d.children.map((c) => ({ c, issues: childIssues(d, c, now.date) })).filter((x) => x.issues.length)
    if (!list.length) return { ...base, headline: 'All children’s paperwork looks complete.', sources: ['Children records', 'Documents'], confidence: 'high' }
    return { ...base, headline: `${plural(list.length, 'child’s record', 'children’s records')} need paperwork.`, items: list.map(({ c, issues }) => ({ id: c.id, label: childName(c), detail: issues.map((i) => i.text).join(' · '), tone: issues.some((i) => i.tone === 'danger') ? 'danger' as const : 'warning' as const, cta: { label: 'Open profile', kind: 'navigate' as const, to: `/children/${c.id}?tab=documents` } })), sources: ['Children records', 'Documents'], confidence: 'high', caveat: 'Employee documents aren’t included here — ask me about those separately.' }
  }

  // ---- Attention
  if (has(q, /attention|need my|needs me|what needs|to do today|priorit/)) {
    const att = attentionItems(d, now)
    const lead = remindersForToday(d, now.date).filter((o) => o.daysAway > 0 && !o.done)
    const items: AiItem[] = [
      ...att.map((a) => ({ id: a.id, label: a.title, detail: a.detail, tone: a.tone, cta: a.action.kind === 'notify_parent' ? { label: a.action.label, kind: 'notify' as const, childId: a.action.childId } : { label: a.action.label, kind: 'navigate' as const, to: a.action.to } })),
      ...lead.map((o) => ({ id: `r-${o.reminder.id}`, label: `${relativeDay(o.date, now.date)} is ${o.reminder.title}`, detail: 'Coming up soon.', tone: 'info' as const, cta: o.reminder.link ? { label: 'Open', kind: 'navigate' as const, to: o.reminder.link } : undefined })),
    ]
    if (!items.length) return { ...base, headline: 'Nothing needs your attention right now.', paragraphs: ['You’re all caught up.'], sources: ['Attendance', 'Payments', 'Supplies', 'Staff'], confidence: 'high' }
    return { ...base, headline: `${plural(items.length, 'thing')} need${items.length === 1 ? 's' : ''} your attention today.`, items, sources: ['Attendance', 'Diaper supply', 'Payments', 'Supplies', 'Staff check-ins', 'Reminders'], confidence: 'high', caveat: 'I suggest next steps — I won’t do anything until you choose.', followUps: ['Who needs diapers?', 'Who hasn’t paid this week?'] }
  }

  // ---- Daily summary
  if (has(q, /need to know|summary|catch me up|overview|how.s today|how is today|today\??$/)) {
    const att = attentionItems(d, now)
    const lead = remindersForToday(d, now.date).filter((o) => o.daysAway > 0)
    const p1 = `You have ${plural(sum.expected + sum.vacation, 'child', 'children')} scheduled today. ${sum.present} ${sum.present === 1 ? 'has' : 'have'} arrived${sum.late ? ` (${sum.late} late)` : ''}${sum.vacation ? `, ${sum.vacation} ${sum.vacation === 1 ? 'is' : 'are'} on vacation` : ''}${sum.absent ? `, ${sum.absent} ${sum.absent === 1 ? 'is' : 'are'} absent` : ''}, and ${sum.notArrived} ${sum.notArrived === 1 ? 'has' : 'have'} not arrived yet.`
    const flags = att.map((a) => a.title.replace(/\.$/, ''))
    const p2 = flags.length ? `Heads-up: ${joinList(flags.slice(0, 4).map((t) => t[0].toLowerCase() + t.slice(1)))}.` : 'Nothing is flagged.'
    return { ...base, headline: 'Here’s today in brief.', paragraphs: [p1, p2, ...lead.map((o) => `${o.reminder.title} is ${relativeDay(o.date, now.date).toLowerCase()}.`)], sources: ['Attendance · today', 'Payments', 'Supplies', 'Reminders', 'Staff'], confidence: 'high', followUps: ['What needs my attention today?'] }
  }

  // ---- Reminders / before a day
  if (has(q, /remember|before (mon|tue|wed|thu|fri)|coming up|upcoming|this week|reminder/)) {
    const dayMatch = q.match(/before (mon|tue|wed|thu|fri)/)
    const target = dayMatch ? WEEKDAYS.findIndex((w) => w.toLowerCase().startsWith(dayMatch[1])) : 5
    let end = now.date; while (weekdayOf(end) !== target) end = addDays(end, 1)
    const items: AiItem[] = []
    for (const r of d.reminders) {
      const n = nextOccurrence(r, now.date, 14)
      if (n && n <= end && r.recurrence.type !== 'weekdays') items.push({ id: r.id, label: r.title, detail: `${relativeDay(n, now.date)} · ${fmtLong(n)}`, tone: 'info', cta: r.link ? { label: 'Open', kind: 'navigate', to: r.link } : undefined })
    }
    for (const s of restockTodos(d)) items.push({ id: `rs-${s.id}`, label: `Restock ${s.name.toLowerCase()}`, detail: SUPPLY_LABEL[s.status], tone: s.status === 'restock' ? 'danger' : 'warning', cta: { label: 'Open supplies', kind: 'navigate', to: '/tasks?tab=supplies' } })
    for (const a of d.absences) if (a.kind === 'vacation' && a.start > now.date && a.start <= end) items.push({ id: a.id, label: `${first(a.childId)} starts vacation`, detail: fmtRange(a.start, a.end), tone: 'neutral' })
    return { ...base, headline: items.length ? `Before ${WEEKDAYS[target]}, you’ll want to remember ${plural(items.length, 'thing')}.` : `Nothing to remember before ${WEEKDAYS[target]}.`, items, sources: ['Reminders', 'Supplies', 'Absences & vacations'], confidence: 'high' }
  }

  // ---- Attendance
  if (has(q, /who.*(here|absent|late|arrived|present|missing|coming)|not arrived|haventarrived|attendance/)) {
    const items: AiItem[] = kids.filter((r) => ['expected', 'late', 'absent', 'vacation'].includes(r.view.status)).map((r) => ({ id: r.child.id, label: `${childName(r.child)} — ${r.view.status === 'expected' ? 'not arrived' : r.view.status === 'late' ? `arrived late (${r.view.lateMinutes} min)` : r.view.status}`, detail: r.view.status === 'expected' ? `Expected ${fmtTime(r.child.schedule.arrival)}` : r.view.absence?.note, tone: r.view.status === 'expected' ? 'warning' as const : 'neutral' as const, cta: { label: 'Open attendance', kind: 'navigate' as const, to: '/attendance' } }))
    return { ...base, headline: `${sum.inCare} ${sum.inCare === 1 ? 'child is' : 'children are'} here right now.`, paragraphs: [`${sum.notArrived} still expected, ${sum.absent} absent, ${sum.vacation} on vacation.`], items, sources: ['Attendance · today'], confidence: 'high' }
  }

  // ---- A child by name
  const named = d.children.find((c) => q.includes(c.firstName.toLowerCase()))
  if (named) {
    const r = kids.find((x) => x.child.id === named.id)
    const pay = paymentsForWeek(d, mondayOf(now.date)).find((p) => p.childId === named.id)
    const issues = childIssues(d, named, now.date)
    return {
      ...base, headline: `${childName(named)} — here’s what I can see.`,
      items: [
        { id: 'att', label: `Today: ${r ? r.view.status.replace('_', ' ') : 'not scheduled'}`, tone: 'neutral' },
        ...(named.diaper ? [{ id: 'dp', label: `Diapers: ${named.diaper.status === 'good' ? 'good' : named.diaper.status === 'low' ? 'running low' : 'out'}`, tone: named.diaper.status === 'good' ? 'success' as const : named.diaper.status === 'low' ? 'warning' as const : 'danger' as const }] : []),
        ...(pay ? [{ id: 'pay', label: `This week’s payment: ${paymentStatus(pay, now.date)}`, tone: paymentStatus(pay, now.date) === 'paid' ? 'success' as const : 'warning' as const }] : []),
        ...(named.allergies.length ? [{ id: 'al', label: `Allergies: ${named.allergies.join(', ')}`, tone: 'danger' as const }] : []),
        ...issues.map((i) => ({ id: i.text, label: i.text, tone: i.tone as 'danger' | 'warning' })),
      ],
      proposal: undefined, sources: [`${named.firstName}’s record`, 'Attendance · today', 'Payments'], confidence: 'medium', caveat: 'This is a short summary. Open the profile for the full record.',
      followUps: [`Open ${named.firstName}’s profile`],
    }
  }

  // ---- Fallback: say so plainly.
  return { ...base, headline: 'I’m not sure I understood that.', paragraphs: ['I may be missing it, or it might not be something I have data for. Try asking about attendance, payments, diapers, supplies, staff or reminders.'], sources: [], confidence: 'low', followUps: SUGGESTED_PROMPTS.slice(0, 4) }
}
