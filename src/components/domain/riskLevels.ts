import { useStore } from '@/state/store'
import { entityRiskLevel } from '@/data/selectors'
import { getVendor } from '@/data/vendors'
import type { Severity } from '@/data/types'

/** Hooks that compute an app/vendor’s effective risk level from live risk state. */
export function useRiskLevels() {
  const { risks, appById } = useStore()
  return {
    forApp: (id: string): Severity => entityRiskLevel('application', id, appById(id)?.baselineRisk ?? 'low', risks),
    forVendor: (id: string): Severity => entityRiskLevel('vendor', id, getVendor(id)?.baselineRisk ?? 'low', risks),
  }
}
