import type { DiaperLevel, SupplyLevel } from '@/types'
export const SUPPLY_LABEL: Record<SupplyLevel, string> = { good: 'Good', low: 'Running low', restock: 'Need to restock' }
export const DIAPER_LABEL: Record<DiaperLevel, string> = { good: 'Good', low: 'Running low', out: 'Out' }
