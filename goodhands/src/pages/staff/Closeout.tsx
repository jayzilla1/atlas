import { Page } from '@/components/ui/Page'
import { PageHeader } from '@/components/ui/PageHeader'
import { CloseoutPanel } from '@/components/domain/CloseoutPanel'
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee'

export default function Closeout() {
  const e = useCurrentEmployee()
  return (
    <Page id="closeout">
      <div className="mx-auto max-w-2xl">
        <PageHeader title="End of day" description="Before leaving GoodHands, complete your closeout." />
        <CloseoutPanel employee={e} />
      </div>
    </Page>
  )
}
