import type { Clock, ISODate } from '@/types'
/** "Right now" in the daycare: a date and a time. Passed explicitly so logic is easy to test and time-travel in the demo. */
export interface Now { date: ISODate; time: Clock }
