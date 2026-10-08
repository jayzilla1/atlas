import type { ReactNode } from 'react'
import { ErrorState, PageSkeleton } from './States'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'

/**
 * Wrap a screen in <Page id="..."> and it handles the "waiting for data" and "couldn't load" states.
 * (In a real product this would be a network request; here it's a short simulated wait.)
 */
export function Page({ id, children, skeleton }: { id: string; children: ReactNode; skeleton?: ReactNode }) {
  const { state, retry } = useSimulatedLoad(id)
  if (state === 'loading') return <>{skeleton ?? <PageSkeleton />}</>
  if (state === 'error') return <ErrorState title="We couldn’t load this screen" description="This is the error state. Your data is safe — try again." onRetry={retry} className="mt-8" />
  return <div className="anim-fade-in">{children}</div>
}
