import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { ButtonLink, Button } from '@/components/ui/Button'
import { ConfidenceBadge } from './AiParts'
import { Term } from '@/components/ui/Tooltip'
import { useUi } from '@/layouts/UiContext'

/** AiInsight — proactive, but quiet: tinted surface, one teal rule, two clear actions, confidence + source stated. */
export function AiInsight() {
  const { openAsk } = useUi()
  return (
    <section aria-labelledby="insight-h" data-ds="AiInsight" className="rounded-xl border border-ai-border bg-ai-subtle p-6 ">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-overline uppercase text-ai-ink"><Sparkles className="h-3.5 w-3.5" aria-hidden />Atlas AI insight</p>
        <ConfidenceBadge level="high" />
      </div>
      <h2 id="insight-h" className="mt-2 text-title-2">14 employees haven’t completed required <Term id="security-training">security training</Term>.</h2>
      <p className="mt-1.5 max-w-2xl text-body text-ink-secondary">That’s a <strong className="font-semibold text-ink">27% increase</strong> from last month (11 people). Six are already overdue, and most of the rest are due within two weeks. Training is checked by auditors, so this is worth closing out soon.</p>
      <p className="mt-2 text-caption text-ink-secondary">Based on Lumen Learning completions and the People directory · synced 3 hours ago · <Link to="/risks/R-107" className="font-medium text-ink-link hover:underline">See the evidence</Link></p>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink to="/risks/R-107" variant="primary">Review insight</ButtonLink>
        <Button onClick={() => openAsk('Find employees who haven’t completed required security training and create tasks for their managers.')}>Ask Atlas</Button>
      </div>
    </section>
  )
}
