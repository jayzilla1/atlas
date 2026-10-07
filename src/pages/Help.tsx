import { useMemo, useState } from 'react'
import { BookOpen, Compass, Keyboard } from 'lucide-react'
import { PageHeader } from '@/components/ui/Page'
import { Card, CardHeader } from '@/components/ui/Card'
import { SearchInput } from '@/components/ui/Form'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { GLOSSARY } from '@/data/glossary'
import { usePageTitle } from '@/hooks/usePage'
import { useUi } from '@/layouts/UiContext'

export function HelpPage() {
  usePageTitle('Help')
  const [q, setQ] = useState(''); const ui = useUi()
  const list = useMemo(() => GLOSSARY.filter((g) => !q || (g.term + g.short + g.long + (g.aka ?? []).join(' ')).toLowerCase().includes(q.toLowerCase())), [q])
  return (
    <>
      <PageHeader title="Help & glossary" description="You don’t need a security background to use Atlas. Every technical term in the product is defined here in plain English, with an example from Harborlight." />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Card><Compass className="mb-2 h-5 w-5 text-action" aria-hidden /><h2 className="text-title-3">Take the tour</h2><p className="mt-1 text-body text-ink-secondary">A 1-minute introduction and four things to try first.</p><Button className="mt-3" onClick={() => ui.setTourOpen(true)}>Replay the tour</Button></Card>
        <Card><Keyboard className="mb-2 h-5 w-5 text-action" aria-hidden /><h2 className="text-title-3">Keyboard shortcuts</h2><dl className="mt-2 space-y-1.5 text-body-sm"><div className="flex justify-between"><dt>Search everything</dt><dd><kbd className="rounded border border-line px-1.5">Ctrl / ⌘ K</kbd></dd></div><div className="flex justify-between"><dt>Skip to content</dt><dd><kbd className="rounded border border-line px-1.5">Tab</kbd> on load</dd></div><div className="flex justify-between"><dt>Close dialogs</dt><dd><kbd className="rounded border border-line px-1.5">Esc</kbd></dd></div></dl></Card>
        <Card><BookOpen className="mb-2 h-5 w-5 text-action" aria-hidden /><h2 className="text-title-3">For designers & developers</h2><p className="mt-1 text-body text-ink-secondary">Tokens, components and states behind this product.</p><ButtonLink to="/design-system" className="mt-3">Open the Design System</ButtonLink></Card>
      </div>
      <Card aria-labelledby="gl-h">
        <CardHeader id="gl-h" title={`Glossary (${list.length})`} description="Terms with a dotted underline anywhere in Atlas show these definitions on hover or focus." actions={<SearchInput className="w-64 max-w-full" value={q} onChange={setQ} label="Search the glossary" placeholder="Search terms" />} />
        {list.length === 0 ? <EmptyState title="No terms match" description="Try a simpler word, such as “password” or “vendor”." /> : (
          <dl className="divide-y divide-line">{list.map((g) => (
            <div key={g.id} className="grid gap-1 py-4 md:grid-cols-[14rem_1fr] md:gap-6">
              <dt className="text-body font-semibold">{g.term}{g.aka && <span className="mt-0.5 block text-caption font-normal text-ink-tertiary">Also: {g.aka.join(', ')}</span>}</dt>
              <dd><p className="text-body font-medium">{g.short}</p><p className="mt-1 text-body text-ink-secondary">{g.long}</p><p className="mt-1.5 rounded-md bg-sunken px-3 py-2 text-body-sm"><span className="font-semibold">Example: </span>{g.example}</p></dd>
            </div>))}</dl>)}
      </Card>
    </>
  )
}
