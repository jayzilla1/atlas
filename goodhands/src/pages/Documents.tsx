import { useMemo, useState } from 'react'
import { FolderOpen, Plus } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Field, SearchInput, Select } from '@/components/ui/Form'
import { Pagination } from '@/components/ui/Pagination'
import { NoResults, EmptyState } from '@/components/ui/States'
import { DocumentCard } from '@/components/domain/DocumentCard'
import { UploadDocumentDialog } from '@/components/dialogs/UploadDocumentDialog'
import { useData } from '@/state/store'
import { useSession } from '@/state/session'
import { CATEGORY_LABEL, CHILD_CATEGORIES, EMPLOYEE_CATEGORIES, DOC_STATUS_LABEL, docStatus } from '@/domain/documents'
import { childName, employeeName } from '@/domain/people'
import type { DocCategory, DocStatus } from '@/types'

type Tab = 'child' | 'employee'
const PAGE = 9
export default function Documents() { return <Page id="documents"><Screen /></Page> }

function Screen() {
  const d = useData()
  const { today } = useSession()
  const [tab, setTab] = useState<Tab>('child')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<DocCategory | ''>('')
  const [status, setStatus] = useState<DocStatus | ''>('')
  const [owner, setOwner] = useState('')
  const [page, setPage] = useState(1)
  const [upload, setUpload] = useState(false)

  const ownerName = (t: 'child' | 'employee', id: string) => (t === 'child' ? d.children.find((c) => c.id === id) && childName(d.children.find((c) => c.id === id)!) : d.employees.find((e) => e.id === id) && employeeName(d.employees.find((e) => e.id === id)!)) ?? ''
  const base = useMemo(() => d.documents.filter((x) => x.ownerType === tab), [d.documents, tab])
  const docs = useMemo(() => base.filter((x) => {
    const st = docStatus(x, today)
    return (!cat || x.category === cat) && (!status || st === status) && (!owner || x.ownerId === owner) && (!q.trim() || `${x.title} ${ownerName(x.ownerType, x.ownerId)}`.toLowerCase().includes(q.trim().toLowerCase()))
  }).sort((a, b) => ['missing', 'expired', 'expiring', 'current'].indexOf(docStatus(a, today)) - ['missing', 'expired', 'expiring', 'current'].indexOf(docStatus(b, today))), // eslint-disable-line
  [base, cat, status, owner, q, today]) // eslint-disable-line
  const needs = base.filter((x) => docStatus(x, today) !== 'current').length
  const reset = () => { setQ(''); setCat(''); setStatus(''); setOwner(''); setPage(1) }
  const owners = tab === 'child' ? d.children.map((c) => ({ id: c.id, name: childName(c) })) : d.employees.map((e) => ({ id: e.id, name: employeeName(e) }))
  const cats = tab === 'child' ? CHILD_CATEGORIES : EMPLOYEE_CATEGORIES
  const shown = docs.slice((page - 1) * PAGE, page * PAGE)

  return (
    <>
      <PageHeader title="Documents" description="Everything on file, grouped by who it belongs to. Missing and expiring items come first." actions={<Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setUpload(true)}>Add document</Button>} />
      <Tabs<Tab> label="Document groups" idBase="docs" value={tab} onChange={(t) => { setTab(t); reset() }} items={[{ id: 'child', label: 'Children', count: d.documents.filter((x) => x.ownerType === 'child' && docStatus(x, today) !== 'current').length || undefined }, { id: 'employee', label: 'Employees', count: d.documents.filter((x) => x.ownerType === 'employee' && docStatus(x, today) !== 'current').length || undefined }]} />
      <div role="tabpanel" id={`docs-panel-${tab}`} tabIndex={0} className="pt-5">
        <p className="mb-3 text-small text-ink-secondary" aria-live="polite">{needs} {needs === 1 ? 'document needs' : 'documents need'} attention in this group.</p>
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem_12rem]">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Search documents or names" label="Search documents" />
          <Field label="Type" className="[&>label]:sr-only">{(p) => <Select {...p} value={cat} onChange={(e) => { setCat(e.target.value as DocCategory | ''); setPage(1) }}><option value="">All types</option>{cats.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</Select>}</Field>
          <Field label="Status" className="[&>label]:sr-only">{(p) => <Select {...p} value={status} onChange={(e) => { setStatus(e.target.value as DocStatus | ''); setPage(1) }}><option value="">Any status</option>{(Object.keys(DOC_STATUS_LABEL) as DocStatus[]).map((s) => <option key={s} value={s}>{DOC_STATUS_LABEL[s]}</option>)}</Select>}</Field>
          <Field label={tab === 'child' ? 'Child' : 'Employee'} className="[&>label]:sr-only">{(p) => <Select {...p} value={owner} onChange={(e) => { setOwner(e.target.value); setPage(1) }}><option value="">{tab === 'child' ? 'All children' : 'All employees'}</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select>}</Field>
        </div>
        {base.length === 0 ? <EmptyState icon={<FolderOpen />} title="No documents yet" action={<Button variant="primary" onClick={() => setUpload(true)}>Add the first document</Button>} /> : docs.length === 0 ? <NoResults query={q} onClear={reset} /> : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{shown.map((doc) => <DocumentCard key={doc.id} doc={doc} showOwner ownerLabel={ownerName(doc.ownerType, doc.ownerId)} />)}</div>
            <Pagination page={page} pageSize={PAGE} total={docs.length} onPage={setPage} noun="documents" />
          </>
        )}
      </div>
      {upload && <UploadDocumentDialog onClose={() => setUpload(false)} preset={undefined} />}
    </>
  )
}
