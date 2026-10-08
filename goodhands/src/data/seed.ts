import type {
  Absence, AppData, AttendanceRecord, BlanketStatus, Child, DocumentRecord, Employee, ISODate, Payment,
  RoutineTask, ShiftRecord, Supply, SupplyEvent, TimeOff,
} from '@/types'
import { DEMO_TODAY } from './clock'
import { addDays, eachDay, fromMinutes, isWeekend, mondayOf, toMinutes, weekdayOf } from '@/utils/dates'

/**
 * Mock data for the prototype. Everything here is fictional — and everything is *connected*:
 * Maya's low diapers, her unpaid week, her sick day today and her documents all point at the
 * same child id, so the Home screen, her profile, Payments and the assistant tell one story.
 */

// Small repeatable random-number generator, so "random" arrival times are the same on every load.
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(20261007)
const between = (lo: number, hi: number) => Math.round(lo + rand() * (hi - lo))

const WEEKDAYS_ALL = [1, 2, 3, 4, 5]

/* ------------------------------------------------------------------ Children */
const children: Child[] = [
  {
    id: 'amari', firstName: 'Amari', lastName: 'Brooks', dob: '2023-09-02', tint: 0,
    guardians: [{ name: 'Danielle Brooks', relationship: 'Mother', phone: '(555) 555-0118', email: 'danielle.brooks@example.com', primary: true }, { name: 'Marcus Brooks', relationship: 'Father', phone: '(555) 555-0119', email: 'marcus.brooks@example.com' }],
    address: '88 Linden Avenue, Riverton', emergencyContact: { name: 'Gloria Brooks', relationship: 'Grandmother', phone: '(555) 555-0120' },
    authorizedPickup: ['Danielle Brooks', 'Marcus Brooks', 'Gloria Brooks'], allergies: [], medications: [], healthNotes: 'Mild eczema — use the unscented lotion from his bag.',
    notes: 'Loves the block corner. Nap with his green blanket.', enrolledOn: '2024-11-04',
    schedule: { days: WEEKDAYS_ALL, arrival: '07:30', departure: '16:30' }, billing: { weeklyRate: 250, dueWeekday: 1 }, diaper: { status: 'good', updatedOn: '2026-10-01' },
  },
  {
    id: 'jordan', firstName: 'Jordan', lastName: 'Smith', dob: '2024-02-20', tint: 1,
    guardians: [{ name: 'Keisha Smith', relationship: 'Mother', phone: '(555) 555-0131', email: 'keisha.smith@example.com', primary: true }],
    address: '17 Orchard Lane, Riverton', emergencyContact: { name: 'Andre Smith', relationship: 'Uncle', phone: '(555) 555-0132' },
    authorizedPickup: ['Keisha Smith', 'Andre Smith'], allergies: [], medications: [], notes: 'Takes a short nap — wakes around 1:45.', enrolledOn: '2025-03-10',
    schedule: { days: WEEKDAYS_ALL, arrival: '08:00', departure: '17:00' }, billing: { weeklyRate: 250, dueWeekday: 5 }, diaper: { status: 'good', updatedOn: '2026-10-05' },
  },
  {
    id: 'maya', firstName: 'Maya', lastName: 'Johnson', dob: '2024-06-05', tint: 2,
    guardians: [{ name: 'Sarah Johnson', relationship: 'Mother', phone: '(555) 555-0142', email: 'sarah.johnson@example.com', primary: true }, { name: 'Tom Johnson', relationship: 'Father', phone: '(555) 555-0143', email: 'tom.johnson@example.com' }],
    address: '123 Example Street, Riverton', emergencyContact: { name: 'Linda Park', relationship: 'Aunt', phone: '(555) 555-0144' },
    authorizedPickup: ['Sarah Johnson', 'Tom Johnson', 'Linda Park'], allergies: [], medications: [], healthNotes: 'None reported.', notes: 'Comfort item: small gray rabbit.', enrolledOn: '2025-01-13',
    schedule: { days: WEEKDAYS_ALL, arrival: '08:00', departure: '17:00' }, billing: { weeklyRate: 250, dueWeekday: 3 }, diaper: { status: 'low', updatedOn: '2026-10-06' },
  },
  {
    id: 'noah', firstName: 'Noah', lastName: 'Williams', dob: '2025-01-14', tint: 3,
    guardians: [{ name: 'Chris Williams', relationship: 'Father', phone: '(555) 555-0155', email: 'chris.williams@example.com', primary: true }, { name: 'Priscilla Williams', relationship: 'Mother', phone: '(555) 555-0156', email: 'priscilla.williams@example.com' }],
    address: '240 Birch Court, Riverton', emergencyContact: { name: 'Eleanor Williams', relationship: 'Grandmother', phone: '(555) 555-0157' },
    authorizedPickup: ['Chris Williams', 'Priscilla Williams', 'Eleanor Williams'], allergies: [], medications: [], notes: 'Wednesdays: speech class in the morning, arrives around 10:30.', enrolledOn: '2025-08-18',
    schedule: { days: WEEKDAYS_ALL, arrival: '10:30', departure: '16:30' }, billing: { weeklyRate: 250, dueWeekday: 1 }, diaper: { status: 'out', updatedOn: '2026-10-07' },
  },
  {
    id: 'priya', firstName: 'Priya', lastName: 'Patel', dob: '2026-02-11', tint: 4,
    guardians: [{ name: 'Anita Patel', relationship: 'Mother', phone: '(555) 555-0166', email: 'anita.patel@example.com', primary: true }, { name: 'Raj Patel', relationship: 'Father', phone: '(555) 555-0167', email: 'raj.patel@example.com' }],
    address: '9 Willow Way, Riverton', emergencyContact: { name: 'Meera Shah', relationship: 'Aunt', phone: '(555) 555-0168' },
    authorizedPickup: ['Anita Patel', 'Raj Patel'], allergies: [], medications: [], healthNotes: 'Formula-fed. 5 oz bottle about every 3 hours.', notes: 'Prefers to nap on her back with the sound machine on.', enrolledOn: '2026-08-24',
    schedule: { days: WEEKDAYS_ALL, arrival: '07:45', departure: '16:45' }, billing: { weeklyRate: 290, dueWeekday: 1 }, diaper: { status: 'good', updatedOn: '2026-10-02' },
  },
  {
    id: 'leo', firstName: 'Leo', lastName: 'Martinez', dob: '2024-12-03', tint: 5,
    guardians: [{ name: 'Elena Martinez', relationship: 'Mother', phone: '(555) 555-0177', email: 'elena.martinez@example.com', primary: true }],
    address: '56 Cedar Street, Riverton', emergencyContact: { name: 'Carlos Martinez', relationship: 'Uncle', phone: '(555) 555-0178' },
    authorizedPickup: ['Elena Martinez', 'Carlos Martinez'], allergies: [], medications: [], notes: 'Working on words — celebrates "up!" and "more".', enrolledOn: '2025-09-02',
    schedule: { days: WEEKDAYS_ALL, arrival: '08:00', departure: '17:00' }, billing: { weeklyRate: 260, dueWeekday: 1 }, diaper: { status: 'good', updatedOn: '2026-10-05' },
  },
  {
    id: 'zoe', firstName: 'Zoe', lastName: 'Chen', dob: '2022-05-19', tint: 6,
    guardians: [{ name: 'Wei Chen', relationship: 'Father', phone: '(555) 555-0189', email: 'wei.chen@example.com', primary: true }, { name: 'Mei Chen', relationship: 'Mother', phone: '(555) 555-0190', email: 'mei.chen@example.com' }],
    address: '301 Harbor Road, Riverton', emergencyContact: { name: 'Jun Chen', relationship: 'Grandfather', phone: '(555) 555-0191' },
    authorizedPickup: ['Wei Chen', 'Mei Chen', 'Jun Chen'], allergies: ['Tree nuts'], medications: [], healthNotes: 'Tree-nut allergy. Action plan on file.', notes: 'Part-time: Mon, Tue, Thu.', enrolledOn: '2024-02-12',
    schedule: { days: [1, 2, 4], arrival: '08:30', departure: '16:00' }, billing: { weeklyRate: 180, dueWeekday: 1 }, diaper: null,
  },
  {
    id: 'ethan', firstName: 'Ethan', lastName: 'Okafor', dob: '2023-04-28', tint: 7,
    guardians: [{ name: 'Ngozi Okafor', relationship: 'Mother', phone: '(555) 555-0201', email: 'ngozi.okafor@example.com', primary: true }],
    address: '72 Magnolia Drive, Riverton', authorizedPickup: ['Ngozi Okafor'], allergies: [], medications: ['Albuterol inhaler (as needed)'], healthNotes: 'Mild asthma. Inhaler lives in the red pouch in the cubby.', notes: 'Mon–Thu. Newly enrolled — paperwork still being collected.', enrolledOn: '2026-09-08',
    schedule: { days: [1, 2, 3, 4], arrival: '07:45', departure: '16:30' }, billing: { weeklyRate: 240, dueWeekday: 1 }, diaper: null,
  },
  {
    id: 'isla', firstName: 'Isla', lastName: 'Rivera', dob: '2025-09-20', tint: 8,
    guardians: [{ name: 'Lucia Rivera', relationship: 'Mother', phone: '(555) 555-0212', email: 'lucia.rivera@example.com', primary: true }, { name: 'Marco Rivera', relationship: 'Father', phone: '(555) 555-0213', email: 'marco.rivera@example.com' }],
    address: '14 Sycamore Place, Riverton', emergencyContact: { name: 'Rosa Rivera', relationship: 'Grandmother', phone: '(555) 555-0214' },
    authorizedPickup: ['Lucia Rivera', 'Marco Rivera', 'Rosa Rivera'], allergies: [], medications: [], notes: 'Just started walking. Loves the stacking cups.', enrolledOn: '2026-01-12',
    schedule: { days: WEEKDAYS_ALL, arrival: '07:30', departure: '16:30' }, billing: { weeklyRate: 270, dueWeekday: 1 }, diaper: { status: 'good', updatedOn: '2026-10-05' },
  },
  {
    id: 'theo', firstName: 'Theo', lastName: 'Nguyen', dob: '2022-02-01', tint: 9,
    guardians: [{ name: 'Linh Nguyen', relationship: 'Mother', phone: '(555) 555-0223', email: 'linh.nguyen@example.com', primary: true }],
    address: '5 Aspen Terrace, Riverton', emergencyContact: { name: 'Hoa Nguyen', relationship: 'Grandmother', phone: '(555) 555-0224' },
    authorizedPickup: ['Linh Nguyen', 'Hoa Nguyen'], allergies: ['Peanuts'], medications: ['Epinephrine auto-injector (emergency)'], healthNotes: 'Severe peanut allergy. Check every snack label. Auto-injector is in the kitchen cabinet.', notes: 'Turns 5 in February — kindergarten tour planned this winter.', enrolledOn: '2024-06-17',
    schedule: { days: WEEKDAYS_ALL, arrival: '08:15', departure: '17:00' }, billing: { weeklyRate: 230, dueWeekday: 1 }, diaper: null,
  },
]

/* ------------------------------------------------------------------ Absences */
const absences: Absence[] = [
  { id: 'abs-1', childId: 'maya', kind: 'sick', start: '2026-10-07', end: '2026-10-07', note: 'Fever overnight — Sarah called at 6:50 AM.' },
  { id: 'abs-2', childId: 'priya', kind: 'vacation', start: '2026-10-05', end: '2026-10-09', note: 'Visiting family out of state.' },
  { id: 'abs-3', childId: 'noah', kind: 'vacation', start: '2026-10-12', end: '2026-10-16', note: 'Family trip.' },
  { id: 'abs-4', childId: 'maya', kind: 'sick', start: '2026-09-21', end: '2026-09-22' },
  { id: 'abs-5', childId: 'jordan', kind: 'vacation', start: '2026-09-28', end: '2026-10-02', note: 'Grandparents’ visit.' },
  { id: 'abs-6', childId: 'leo', kind: 'sick', start: '2026-09-17', end: '2026-09-17' },
  { id: 'abs-7', childId: 'theo', kind: 'other', start: '2026-09-25', end: '2026-09-25', note: 'Dentist appointment.' },
  { id: 'abs-8', childId: 'zoe', kind: 'absent', start: '2026-10-01', end: '2026-10-01' },
]

/* ---------------------------------------------------------------- Attendance */
const attendance: AttendanceRecord[] = []
const absentOn = (childId: string, date: ISODate) => absences.some((a) => a.childId === childId && date >= a.start && date <= a.end)
// Today so far (10:12 AM): hand-authored so the story is exact.
const todayCheckIns: Record<string, string> = { amari: '07:42', isla: '07:36', ethan: '07:55', jordan: '08:03', theo: '08:12', leo: '08:27' }
for (const [childId, checkIn] of Object.entries(todayCheckIns)) {
  attendance.push({ childId, date: DEMO_TODAY, checkIn, note: childId === 'theo' ? 'Brought an extra change of clothes.' : childId === 'leo' ? 'Traffic on Route 9.' : undefined })
}
// History: every scheduled weekday from Sep 14 to yesterday, with natural variation.
for (const date of eachDay('2026-09-14', addDays(DEMO_TODAY, -1))) {
  if (isWeekend(date)) continue
  for (const c of children) {
    if (!c.schedule.days.includes(weekdayOf(date)) || date < c.enrolledOn || absentOn(c.id, date)) continue
    const lateBias = c.id === 'leo' || c.id === 'ethan' ? 9 : 0
    attendance.push({
      childId: c.id, date,
      checkIn: fromMinutes(toMinutes(c.schedule.arrival) + between(-8, 12 + lateBias)),
      checkOut: fromMinutes(toMinutes(c.schedule.departure) + between(-35, 20)),
      note: date === '2026-10-02' && c.id === 'amari' ? 'Great day — first time using the potty.' : undefined,
    })
  }
}
// A designed late day for Leo last week.
const leoLate = attendance.find((r) => r.childId === 'leo' && r.date === '2026-10-01'); if (leoLate) leoLate.checkIn = '08:41'

/* ------------------------------------------------------------------ Payments */
const payments: Payment[] = []
let pid = 0
for (let week = '2026-08-03'; week <= mondayOf(DEMO_TODAY); week = addDays(week, 7)) {
  for (const c of children) {
    if (addDays(week, 6) < c.enrolledOn) continue
    const dueDate = addDays(week, c.billing.dueWeekday - 1)
    const p: Payment = { id: `pay-${++pid}`, childId: c.id, weekStart: week, amount: c.billing.weeklyRate, dueDate }
    const isCurrent = week === mondayOf(DEMO_TODAY)
    const shouldBePaid = !(isCurrent && (c.id === 'maya' || c.id === 'noah')) && !(week === '2026-09-28' && c.id === 'noah')
    if (shouldBePaid) {
      p.paidOn = addDays(dueDate, c.id === 'leo' && week === '2026-08-24' ? 3 : between(-1, 0))
      if (p.paidOn > DEMO_TODAY) p.paidOn = DEMO_TODAY
      p.method = (['zelle', 'check', 'cash', 'card'] as const)[c.tint % 4]
    }
    payments.push(p)
  }
}
// Noah: last week was paid late, after a reminder.
const noahLate = payments.find((p) => p.childId === 'noah' && p.weekStart === '2026-09-28')
if (noahLate) { noahLate.paidOn = '2026-10-02'; noahLate.method = 'zelle'; noahLate.note = 'Paid late after reminder.' }
const noahCur = payments.find((p) => p.childId === 'noah' && p.weekStart === '2026-10-05'); if (noahCur) noahCur.note = 'Dad said he would drop off a check this week.'
const mayaCur = payments.find((p) => p.childId === 'maya' && p.weekStart === '2026-10-05'); if (mayaCur) mayaCur.note = 'Sarah pays on Wednesdays.'

/* ----------------------------------------------------------------- Employees */
const employees: Employee[] = [
  {
    id: 'maria', firstName: 'Maria', lastName: 'Gonzalez', role: 'Lead caregiver', phone: '(555) 555-0301', email: 'maria.gonzalez@example.com', address: '212 Clover Street, Riverton',
    emergencyContact: { name: 'Luis Gonzalez', relationship: 'Husband', phone: '(555) 555-0302' }, hiredOn: '2021-03-15', tint: 0,
    weekly: { 1: { start: '07:00', end: '15:30' }, 2: { start: '07:00', end: '15:30' }, 3: { start: '07:00', end: '15:30' }, 4: { start: '07:00', end: '15:30' }, 5: { start: '07:00', end: '15:30' } },
  },
  {
    id: 'taylor', firstName: 'Taylor', lastName: 'Reed', role: 'Caregiver', phone: '(555) 555-0311', email: 'taylor.reed@example.com', address: '40 Fern Hollow Road, Riverton',
    emergencyContact: { name: 'Janet Reed', relationship: 'Mother', phone: '(555) 555-0312' }, hiredOn: '2023-08-21', tint: 3,
    weekly: { 1: { start: '08:30', end: '17:00' }, 2: { start: '08:30', end: '17:00' }, 3: { start: '08:30', end: '17:00' }, 4: { start: '08:30', end: '17:00' }, 5: { start: '08:30', end: '17:00' } },
  },
  {
    id: 'jasmine', firstName: 'Jasmine', lastName: 'Cole', role: 'Part-time assistant', phone: '(555) 555-0321', email: 'jasmine.cole@example.com', address: '9 Poplar Court, Riverton',
    emergencyContact: { name: 'Dee Cole', relationship: 'Sister', phone: '(555) 555-0322' }, hiredOn: '2025-02-03', tint: 6,
    weekly: { 1: { start: '12:00', end: '17:30' }, 3: { start: '12:00', end: '17:30' }, 4: { start: '12:00', end: '17:30' }, 5: { start: '12:00', end: '17:30' } },
  },
  {
    id: 'marcus', firstName: 'Marcus', lastName: 'Bell', role: 'Substitute caregiver', phone: '(555) 555-0331', email: 'marcus.bell@example.com', address: '118 Elm Grove, Riverton',
    emergencyContact: { name: 'Tasha Bell', relationship: 'Wife', phone: '(555) 555-0332' }, hiredOn: '2025-09-08', tint: 9,
    weekly: { 2: { start: '09:00', end: '15:00' } },
  },
]
const timeOff: TimeOff[] = [{ id: 'to-1', employeeId: 'jasmine', start: '2026-10-08', end: '2026-10-09', reason: 'Vacation' }]

/* ------------------------------------------------- Shifts, tasks and closeout */
const shifts: ShiftRecord[] = []
for (const date of eachDay('2026-09-21', addDays(DEMO_TODAY, -1))) {
  if (isWeekend(date)) continue
  for (const e of employees) {
    const s = e.weekly[weekdayOf(date)]
    if (!s || date < e.hiredOn) continue
    const total = e.id === 'jasmine' ? 5 : 8
    const rec: ShiftRecord = {
      employeeId: e.id, date, checkIn: fromMinutes(toMinutes(s.start) + between(-6, 5)), checkOut: fromMinutes(toMinutes(s.end) + between(-4, 18)),
      tasks: { done: rand() > 0.82 ? total - 1 : total, total },
    }
    shifts.push(rec)
  }
}
const findShift = (e: string, d: string) => shifts.find((s) => s.employeeId === e && s.date === d)
const t1 = findShift('taylor', '2026-10-06'); if (t1) { t1.checkOut = undefined; t1.flag = 'forgot_checkout'; t1.tasks = { done: 8, total: 8 } }
const t2 = findShift('taylor', '2026-09-22'); if (t2) { t2.flag = 'forgot_checkout'; t2.checkOut = '17:05'; t2.resolvedNote = 'Confirmed with Taylor — left at 5:05 PM.' }
const j1 = findShift('jasmine', '2026-09-30'); if (j1) { j1.flag = 'left_early'; j1.openItemsAtExit = 2; j1.checkOut = '17:00' }
shifts.push(
  { employeeId: 'maria', date: DEMO_TODAY, checkIn: '06:56' },
  { employeeId: 'taylor', date: DEMO_TODAY, checkIn: '08:26' },
)

const routines: RoutineTask[] = []
const taskDone: Record<string, string> = {}
const routine = (employeeId: string, items: Array<[string, string, string?, string?]>) =>
  items.forEach(([time, title, notes, done], i) => {
    const id = `${employeeId}-${i + 1}`
    routines.push({ id, employeeId, time, title, notes, kind: title.includes('closeout') ? 'closeout' : 'routine' })
    if (done) taskDone[`${id}@${DEMO_TODAY}`] = done
  })
routine('maria', [
  ['07:00', 'Welcome children and greet parents', undefined, '07:00'],
  ['07:30', 'Morning setup: floor mats, toys, sign-in sheet', undefined, '07:21'],
  ['08:30', 'Breakfast service and table wipe-down', undefined, '08:41'],
  ['09:30', 'Circle time and story', 'Fall books are on the low shelf.', '09:34'],
  ['10:30', 'Prepare snack', 'Theo has a peanut allergy — check every label. Zoe is out today.'],
  ['11:30', 'Prepare lunch area'],
  ['12:30', 'Fold blankets and set up nap area'],
  ['14:00', 'Check diaper and wipes stock', 'Wipes are running low — tell Pamela what is left.'],
  ['15:15', 'Classroom reset'],
  ['15:25', 'Complete end-of-day closeout'],
])
routine('taylor', [
  ['08:30', 'Welcome children and assist with morning setup', undefined, '08:30'],
  ['09:00', 'Prepare morning snack', 'Theo: peanut allergy. Check labels.', '09:05'],
  ['10:00', 'Set up craft activity', 'Fall leaf collage — glue sticks are in the blue bin.'],
  ['11:30', 'Prepare lunch area'],
  ['12:30', 'Fold blankets'],
  ['14:00', 'Prepare afternoon activity'],
  ['15:30', 'Classroom reset'],
  ['16:30', 'Complete end-of-day closeout'],
])
routine('jasmine', [
  ['12:00', 'Lunch support and clean-up'],
  ['13:00', 'Nap-time supervision', 'Quiet corner reading for anyone who wakes early.'],
  ['15:00', 'Outdoor play', 'Weather permitting. Sunscreen not needed in October.'],
  ['16:30', 'Sanitize toys and surfaces'],
  ['17:15', 'Complete end-of-day closeout'],
])

/* ------------------------------------------------------------------ Supplies */
const supplies: Supply[] = [
  { id: 'wipes', name: 'Wipes', status: 'low', updatedOn: '2026-10-05', note: 'About 1 pack left.' },
  { id: 'gloves', name: 'Gloves', status: 'restock', updatedOn: '2026-10-06', note: 'Out of medium.' },
  { id: 'paper-towels', name: 'Paper towels', status: 'good', updatedOn: '2026-10-01' },
  { id: 'cleaning', name: 'Cleaning supplies', status: 'good', updatedOn: '2026-09-30' },
]
const supplyEvents: SupplyEvent[] = [
  { id: 'se-1', supplyId: 'gloves', date: '2026-09-18', kind: 'restocked', to: 'good', by: 'Pamela' },
  { id: 'se-2', supplyId: 'wipes', date: '2026-09-25', kind: 'restocked', to: 'good', by: 'Pamela' },
  { id: 'se-3', supplyId: 'cleaning', date: '2026-09-30', kind: 'restocked', to: 'good', by: 'Pamela' },
  { id: 'se-4', supplyId: 'paper-towels', date: '2026-10-01', kind: 'restocked', to: 'good', by: 'Maria' },
  { id: 'se-5', supplyId: 'wipes', date: '2026-10-05', kind: 'status', to: 'low', by: 'Maria' },
  { id: 'se-6', supplyId: 'gloves', date: '2026-10-06', kind: 'status', to: 'restock', by: 'Taylor' },
]

/* --------------------------------------------------------- Reminders & blankets */
const blankets: Record<string, BlanketStatus> = {}
for (const c of children) blankets[`2026-09-25:${c.id}`] = c.id === 'ethan' ? 'na' : c.id === 'jordan' ? 'not_sent' : 'sent'

/* ----------------------------------------------------------------- Documents */
let did = 0
const doc = (d: Omit<DocumentRecord, 'id'>): DocumentRecord => ({ id: `doc-${++did}`, ...d })
const documents: DocumentRecord[] = []
for (const c of children) {
  const n = c.firstName
  documents.push(
    doc({ title: `${n} — Enrollment Contract`, category: 'contract', ownerType: 'child', ownerId: c.id, fileType: 'pdf', sizeKb: 320, uploadedOn: c.enrolledOn, sensitive: false }),
    doc({ title: `${n} — Health Form`, category: 'health', ownerType: 'child', ownerId: c.id, fileType: 'pdf', sizeKb: 210, uploadedOn: addDays(c.enrolledOn, 3), expiresOn: c.id === 'ethan' ? '2026-09-30' : c.id === 'priya' ? '2027-02-11' : '2027-0' + (3 + (c.tint % 5)) + '-15', sensitive: true }),
    c.id === 'ethan'
      ? doc({ title: `${n} — Emergency Contact Form`, category: 'emergency', ownerType: 'child', ownerId: c.id, fileType: 'pdf', sizeKb: 0, missing: true, sensitive: false })
      : doc({ title: `${n} — Emergency Contact Form`, category: 'emergency', ownerType: 'child', ownerId: c.id, fileType: 'pdf', sizeKb: 140, uploadedOn: addDays(c.enrolledOn, 3), sensitive: false }),
    doc({ title: `${n} — Immunization Record`, category: 'immunization', ownerType: 'child', ownerId: c.id, fileType: 'jpg', sizeKb: 880, uploadedOn: addDays(c.enrolledOn, 5), expiresOn: c.id === 'noah' ? '2026-10-25' : undefined, sensitive: true }),
  )
}
documents.push(
  doc({ title: 'Zoe — Tree-nut Allergy Action Plan', category: 'child_other', ownerType: 'child', ownerId: 'zoe', fileType: 'pdf', sizeKb: 190, uploadedOn: '2024-02-14', sensitive: true }),
  doc({ title: 'Theo — Peanut Allergy Action Plan', category: 'child_other', ownerType: 'child', ownerId: 'theo', fileType: 'pdf', sizeKb: 205, uploadedOn: '2025-08-30', expiresOn: '2027-08-30', sensitive: true }),
  doc({ title: 'Ethan — Asthma Medication Authorization', category: 'child_other', ownerType: 'child', ownerId: 'ethan', fileType: 'pdf', sizeKb: 160, uploadedOn: '2026-09-10', sensitive: true }),
  doc({ title: 'Priya — Feeding Instructions', category: 'child_other', ownerType: 'child', ownerId: 'priya', fileType: 'docx', sizeKb: 48, uploadedOn: '2026-08-24', sensitive: false }),
)
for (const e of employees) {
  const n = e.firstName
  documents.push(
    doc({ title: `${n} — W-2 (2025)`, category: 'w2', ownerType: 'employee', ownerId: e.id, fileType: 'pdf', sizeKb: 150, uploadedOn: '2026-01-29', sensitive: true, missing: e.id === 'marcus' }),
    doc({ title: `${n} — Driver’s License`, category: 'license', ownerType: 'employee', ownerId: e.id, fileType: 'jpg', sizeKb: 1100, uploadedOn: e.hiredOn, expiresOn: e.id === 'taylor' ? '2026-11-02' : '2029-06-1' + (e.tint % 9), sensitive: true }),
    doc({ title: `${n} — Employment Agreement`, category: 'employment', ownerType: 'employee', ownerId: e.id, fileType: 'pdf', sizeKb: 410, uploadedOn: e.hiredOn, sensitive: true }),
    doc({ title: `${n} — CPR & First Aid Certificate`, category: 'employment', ownerType: 'employee', ownerId: e.id, fileType: 'pdf', sizeKb: 260, uploadedOn: '2025-10-28', expiresOn: e.id === 'taylor' ? '2026-10-28' : '2027-10-28', sensitive: false }),
  )
}
// Missing docs shouldn't carry upload metadata
for (const d of documents) if (d.missing) { d.uploadedOn = undefined; d.sizeKb = 0 }

export function createSeed(): AppData {
  return {
    children, absences, attendance, payments, employees, timeOff, shifts, routines, oneTimeTasks: [], taskDone,
    closeouts: {},
    supplies, supplyEvents, supplyChecks: {},
    reminders: [
      { id: 'r-closeouts', title: 'Review employee closeouts', detail: 'Make sure everyone completed their end-of-day checklist.', kind: 'review', recurrence: { type: 'weekdays' }, leadDays: 0, link: '/employees' },
      { id: 'r-blanket', title: 'Blanket Day', detail: 'Send blankets home to be washed. Every other Friday.', kind: 'blanket', recurrence: { type: 'every_n_weeks', weekday: 5, anchor: '2026-09-25', n: 2 }, leadDays: 2, link: '/tasks?tab=blanket' },
      { id: 'r-supply', title: 'Weekly supply check', detail: 'Wipes, gloves, paper towels, cleaning supplies.', kind: 'supply_check', recurrence: { type: 'weekly', weekday: 5 }, leadDays: 0, link: '/tasks?tab=supplies' },
      { id: 'r-schedule', title: 'Review next week’s staff schedule', kind: 'review', recurrence: { type: 'weekly', weekday: 5 }, leadDays: 0, link: '/schedule' },
      { id: 'r-tuition', title: 'Collect weekly tuition', detail: 'Check Payments for anyone who has not paid yet.', kind: 'payments', recurrence: { type: 'weekly', weekday: 1 }, leadDays: 0, link: '/payments' },
      { id: 'r-drill', title: 'Practice the monthly fire drill', kind: 'custom', recurrence: { type: 'once', date: '2026-10-14' }, leadDays: 1 },
    ],
    reminderDone: {},
    blankets,
    documents,
    notices: [
      { id: 'n-1', childId: 'leo', kind: 'diapers_low', date: '2026-10-01', time: '15:40', by: 'Pamela', message: 'Hi Elena — Leo is running low on diapers. Could you bring more tomorrow?', channel: 'simulated_text' },
      { id: 'n-2', childId: 'isla', kind: 'diapers_low', date: '2026-09-28', time: '16:05', by: 'Maria', message: 'Hi Lucia — Isla is running low on diapers. Could you bring more tomorrow?', channel: 'simulated_text' },
    ],
    settings: { daycareName: 'GoodHands Home Daycare', ownerName: 'Pamela Williams', graceMinutes: 15, blanketLeadDays: 2, closeoutNudgeMinutes: 45, showStaffOnHome: true },
  }
}
