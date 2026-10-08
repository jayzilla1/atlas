import { useState } from 'react'
import { Download, Eye, FileImage, FileText, FileType2, Lock, Upload } from 'lucide-react'
import type { DocumentRecord } from '@/types'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Modal } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toast'
import { DocBadge, SensitiveBadge } from './Status'
import { UploadDocumentDialog } from '@/components/dialogs/UploadDocumentDialog'
import { useSession } from '@/state/session'
import { CATEGORY_LABEL, docStatus } from '@/domain/documents'
import { fmtFull, fmtMonthDay } from '@/utils/dates'
import { cn } from '@/utils/cn'

const ICON = { pdf: FileText, jpg: FileImage, docx: FileType2 }

/**
 * One document. Restricted ones (W-2, licence, health records) show a lock and ask for a quick
 * confirmation before opening — a deliberate pause, not a fake security gate.
 * A *missing* document is shown too, as a gap with an Upload button: absence is information.
 */
export function DocumentCard({ doc, ownerLabel, showOwner }: { doc: DocumentRecord; ownerLabel?: string; showOwner?: boolean }) {
  const { today } = useSession()
  const toast = useToast()
  const status = docStatus(doc, today)
  const Icon = doc.missing ? Upload : ICON[doc.fileType]
  const [confirm, setConfirm] = useState(false)
  const [preview, setPreview] = useState(false)
  const [upload, setUpload] = useState(false)
  const open = () => (doc.sensitive ? setConfirm(true) : setPreview(true))

  return (
    <article className={cn('flex flex-col gap-3 rounded-lg border bg-surface p-4', doc.missing ? 'border-dashed border-danger/50 bg-danger-bg/30' : 'border-line')} aria-label={doc.title}>
      <div className="flex items-start gap-3">
        <span aria-hidden className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-md', doc.missing ? 'bg-danger-bg text-danger' : 'bg-surface-sunken text-ink-secondary')}><Icon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-body font-semibold leading-snug">{doc.title}</h3>
          <p className="text-small text-ink-secondary">{CATEGORY_LABEL[doc.category]}{showOwner && ownerLabel ? ` · ${ownerLabel}` : ''}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5"><DocBadge status={status} />{doc.sensitive && <SensitiveBadge />}</div>
      <p className="text-caption text-ink-secondary">
        {doc.missing ? 'Not on file yet.' : <>Added {fmtMonthDay(doc.uploadedOn!)}{doc.expiresOn && <> · {status === 'expired' ? 'Expired' : 'Expires'} {fmtFull(doc.expiresOn)}</>} · {doc.fileType.toUpperCase()}, {doc.sizeKb} KB</>}
      </p>
      <div className="mt-auto flex gap-2">
        {doc.missing
          ? <Button variant="primary" size="sm" icon={<Upload className="h-4 w-4" />} onClick={() => setUpload(true)}>Upload</Button>
          : <><Button size="sm" icon={doc.sensitive ? <Lock className="h-4 w-4" /> : <Eye className="h-4 w-4" />} onClick={open} aria-label={`View ${doc.title}`}>View</Button>
              <Button size="sm" variant="ghost" icon={<Download className="h-4 w-4" />} onClick={() => (doc.sensitive ? setConfirm(true) : toast({ title: 'Download started', description: 'Prototype: no file is created.', tone: 'info' }))} aria-label={`Download ${doc.title}`}>Download</Button></>}
      </div>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title="Open restricted document?" description={`${doc.title} contains sensitive information. Only the owner can open it.`} confirmLabel="Open document" onConfirm={() => { setConfirm(false); setPreview(true) }} />
      <Modal open={preview} onClose={() => setPreview(false)} title={doc.title} description={`${CATEGORY_LABEL[doc.category]} · ${doc.fileType.toUpperCase()}`} size="lg" footer={<Button onClick={() => setPreview(false)}>Close</Button>}>
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong/50 bg-surface-muted text-center">
          <Icon className="h-10 w-10 text-ink-tertiary" aria-hidden /><p className="font-semibold">Document preview</p><p className="max-w-xs text-small text-ink-secondary">This prototype doesn’t store real files. A live version would display the document here.</p>
        </div>
      </Modal>
      {upload && <UploadDocumentDialog onClose={() => setUpload(false)} preset={{ ownerType: doc.ownerType, ownerId: doc.ownerId, category: doc.category }} />}
    </article>
  )
}
