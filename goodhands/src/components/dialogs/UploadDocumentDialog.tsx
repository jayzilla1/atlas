import { useState } from 'react'
import type { DocCategory, DocumentRecord } from '@/types'
import { Modal } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Form'
import { useToast } from '@/components/ui/Toast'
import { useActions, useData } from '@/state/store'
import { useSession } from '@/state/session'
import { CATEGORY_LABEL, CHILD_CATEGORIES, EMPLOYEE_CATEGORIES } from '@/domain/documents'
import { childName, employeeName } from '@/domain/people'

/** "Upload" in the prototype records the document's details (name, type, owner). No file is stored anywhere. */
export function UploadDocumentDialog({ onClose, preset }: { onClose: () => void; preset?: { ownerType: 'child' | 'employee'; ownerId?: string; category?: DocCategory } }) {
  const d = useData()
  const act = useActions()
  const toast = useToast()
  const { today } = useSession()
  const [ownerType, setOwnerType] = useState<'child' | 'employee'>(preset?.ownerType ?? 'child')
  const [ownerId, setOwnerId] = useState(preset?.ownerId ?? (preset?.ownerType === 'employee' ? d.employees[0].id : d.children[0].id))
  const [category, setCategory] = useState<DocCategory>(preset?.category ?? (ownerType === 'child' ? 'health' : 'w2'))
  const [file, setFile] = useState<File | null>(null)
  const [expires, setExpires] = useState('')
  const [error, setError] = useState('')
  const cats = ownerType === 'child' ? CHILD_CATEGORIES : EMPLOYEE_CATEGORIES
  const owners = ownerType === 'child' ? d.children.map((c) => ({ id: c.id, name: childName(c) })) : d.employees.map((e) => ({ id: e.id, name: employeeName(e) }))

  const save = () => {
    if (!file) { setError('Choose a file to upload.'); return }
    const ext = file.name.split('.').pop()?.toLowerCase()
    const doc: Omit<DocumentRecord, 'id'> = {
      title: `${owners.find((o) => o.id === ownerId)?.name.split(' ')[0]} — ${CATEGORY_LABEL[category]}`, category, ownerType, ownerId,
      fileType: ext === 'jpg' || ext === 'jpeg' || ext === 'png' ? 'jpg' : ext === 'docx' ? 'docx' : 'pdf', sizeKb: Math.max(1, Math.round(file.size / 1024)), uploadedOn: today,
      expiresOn: expires || undefined, sensitive: ['w2', 'license', 'health', 'immunization'].includes(category),
    }
    act.addDocument(doc)
    toast({ title: 'Document added', description: doc.title })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Add a document" description="Choose who it belongs to and what it is." footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Add document</Button></>}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Belongs to" required>{(p) => <Select {...p} value={ownerType} disabled={!!preset} onChange={(e) => { const t = e.target.value as 'child' | 'employee'; setOwnerType(t); setOwnerId(t === 'child' ? d.children[0].id : d.employees[0].id); setCategory(t === 'child' ? 'health' : 'w2') }}><option value="child">A child</option><option value="employee">An employee</option></Select>}</Field>
          <Field label={ownerType === 'child' ? 'Child' : 'Employee'} required>{(p) => <Select {...p} value={ownerId} disabled={!!preset?.ownerId} onChange={(e) => setOwnerId(e.target.value)}>{owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select>}</Field>
        </div>
        <Field label="Document type" required>{(p) => <Select {...p} value={category} onChange={(e) => setCategory(e.target.value as DocCategory)}>{cats.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</Select>}</Field>
        <Field label="File" required error={error} hint="PDF, photo or Word document. In this prototype the file isn’t stored.">{(p) => <Input {...p} type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError('') }} className="py-2" />}</Field>
        <Field label="Expires on" hint="Optional. GoodHands will flag it 30 days before.">{(p) => <Input {...p} type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />}</Field>
      </div>
    </Modal>
  )
}
