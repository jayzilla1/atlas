import { SearchX } from 'lucide-react'
import { EmptyState } from '@/components/ui/Feedback'
import { ButtonLink } from '@/components/ui/Button'
import { usePageTitle } from '@/hooks/usePage'

export function NotFoundPage({ what = 'page' }: { what?: string }) {
  usePageTitle('Not found')
  return (
    <div className="py-10">
      <h1 className="sr-only">Not found</h1>
      <EmptyState icon={<SearchX />} title={`We can’t find that ${what}`} description="It may have been removed, or the link might be wrong. Try the search (Ctrl/⌘ K) or go back to the overview." action={<ButtonLink to="/" variant="primary">Go to Overview</ButtonLink>} />
    </div>
  )
}
