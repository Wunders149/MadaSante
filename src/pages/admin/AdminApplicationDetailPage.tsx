import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Building2, Check, FileText, Mail, MapPin, Phone, ScrollText, ShieldCheck, Stethoscope, X } from 'lucide-react'
import { useApp } from '../../stores/AppStore'
import { useAdminApplication } from '../../lib/hooks'
import { apiRoutes } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Field'
import { ConfirmationModal } from '../../components/ui/ConfirmationModal'
import { StatusPill, APPLICATION_TONE } from '../../components/ui/StatusPill'
import { EmptyState, LoadingState } from '../../components/ui/States'
import { roleLabelKey } from '../../lib/roles'
import { formatDateShort } from '../../lib/format'

type Decision = 'approved' | 'rejected'

function DocView({ mime, data, fileName, docTypeLabel }: { mime: string; data: string; fileName: string; docTypeLabel: string }) {
  const isImage = mime.startsWith('image/')
  const href = `data:${mime};base64,${data}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="card block overflow-hidden transition hover:border-brand-300"
    >
      <div className="flex h-32 items-center justify-center bg-gray-50">
        {isImage ? (
          <img src={href} alt={fileName} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <FileText className="h-6 w-6" />
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-bold text-ink">{fileName}</p>
        <p className="text-xs text-ink-faint">{docTypeLabel}</p>
      </div>
    </a>
  )
}

export function AdminApplicationDetailPage() {
  const { id } = useParams()
  const { t } = useApp()
  const { data, isLoading, isError } = useAdminApplication(id)
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')
  const [confirm, setConfirm] = useState<Decision | null>(null)

  const mutate = useMutation({
    mutationFn: (payload: { status: Decision; note?: string }) =>
      apiRoutes.adminReviewApplication(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'applications'] })
    },
  })

  if (isLoading) return <LoadingState label={t('common.loading')} />

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
          <ArrowLeft className="h-4 w-4" /> {t('admin.backToList')}
        </Link>
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title={t('admin.applicationNotFound')}
          description={t('admin.applicationNotFoundDesc')}
          action={<Button to="/admin">{t('admin.backToList')}</Button>}
        />
      </div>
    )
  }

  const app = data.application
  const reviewed = app.status !== 'pending'

  const runDecision = () => {
    if (!confirm) return
    mutate.mutate({ status: confirm, note: note.trim() || undefined })
    setConfirm(null)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
        <ArrowLeft className="h-4 w-4" /> {t('admin.backToList')}
      </Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-brand-700">{app.reference}</span>
          <StatusPill tone={APPLICATION_TONE[app.status] ?? 'neutral'}>{t(`admin.${app.status}`)}</StatusPill>
          {reviewed && app.reviewedAt ? (
            <span className="ml-auto text-xs text-ink-faint">{formatDateShort(app.reviewedAt)}</span>
          ) : null}
        </div>

        <h2 className="mt-3 flex items-center gap-2 text-xl font-extrabold tracking-tight text-ink">
          <Building2 className="h-5 w-5 shrink-0 text-brand-600" /> {app.orgName}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          <Stethoscope className="mr-1 inline h-3.5 w-3.5" />
          {t(roleLabelKey(app.role))} · {app.licenseNumber}
        </p>

        <div className="mt-4 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
          <p className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 shrink-0 text-ink-faint" /> {app.firstName} {app.lastName}
          </p>
          <p className="flex min-w-0 items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-ink-faint" /> <span className="truncate">{app.email}</span>
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-ink-faint" /> {app.phone}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-ink-faint" /> {app.city}
          </p>
        </div>
        <p className="mt-2 text-sm text-ink-faint">{app.location}</p>

        {reviewed && app.reviewNote && (
          <div className="mt-4 rounded-xl bg-gray-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">{t('admin.reviewNote')}</p>
            <p className="mt-1 text-sm text-ink">{app.reviewNote}</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-faint">
          {t('admin.documents')} ({app.documents?.length ?? 0})
        </h3>
        {app.documents && app.documents.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {app.documents.map((doc) => (
              <DocView
                key={doc.id}
                mime={doc.mime}
                data={doc.data}
                fileName={doc.fileName}
                docTypeLabel={t(`reg.docType.${doc.docType}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={<FileText className="h-6 w-6" />} title={t('admin.noDocuments')} />
        )}
      </div>

      {!reviewed ? (
        <>
          {/* Approval is one-way: it creates the login and a catalog record.
              Say so before the click, not after. */}
          <div className="card space-y-3 p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-faint">
              <Check className="h-4 w-4" /> {t('admin.decision')}
            </h3>
            <p className="flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-xs leading-relaxed text-brand-900">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              {t('admin.approvalEffect')}
            </p>
            <Textarea
              label={t('admin.note')}
              placeholder={t('admin.notePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => setConfirm('approved')}
              >
                <Check className="h-4 w-4" /> {t('admin.approve')}
              </Button>
              <Button
                variant="danger"
                onClick={() => setConfirm('rejected')}
              >
                <X className="h-4 w-4" /> {t('admin.reject')}
              </Button>
            </div>
            {mutate.isError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                {mutate.error instanceof Error ? mutate.error.message : t('common.error')}
              </p>
            )}
          </div>

          <ConfirmationModal
            open={confirm !== null}
            onClose={() => setConfirm(null)}
            onConfirm={runDecision}
            loading={mutate.isPending}
            tone={confirm === 'approved' ? 'brand' : 'danger'}
            title={confirm === 'approved' ? t('admin.confirmApproveTitle') : t('admin.confirmRejectTitle')}
            message={confirm === 'approved' ? t('admin.confirmApproveBody') : t('admin.confirmRejectBody')}
            confirmLabel={confirm === 'approved' ? t('admin.approve') : t('admin.reject')}
            cancelLabel={t('common.cancel')}
          />
        </>
      ) : (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <p
            className={`flex items-center gap-2 text-sm font-semibold ${
              app.status === 'approved' ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {app.status === 'approved' ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {app.status === 'approved' ? t('admin.approvedSummary') : t('admin.rejectedSummary')}
          </p>
          <Button size="sm" variant="outline" to="/admin">
            {t('admin.backToList')}
          </Button>
        </div>
      )}
    </div>
  )
}
