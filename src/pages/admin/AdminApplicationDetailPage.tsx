import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Check, FileText, Mail, MapPin, Phone, ScrollText, Stethoscope, X } from 'lucide-react'
import { useApp } from '../../stores/AppStore'
import { useAdminApplication } from '../../lib/hooks'
import { apiRoutes } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Field'
import { cn } from '../../lib/cn'
import { roleLabelKey } from '../../lib/roles'
import type { ProviderApplicationStatus } from '../../types'

function statusClass(status: ProviderApplicationStatus) {
  return cn(
    'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
    status === 'pending' && 'bg-amber-50 text-amber-700',
    status === 'approved' && 'bg-emerald-50 text-emerald-700',
    status === 'rejected' && 'bg-red-50 text-red-600',
  )
}

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
  const { data, isLoading } = useAdminApplication(id)
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')

  const mutate = useMutation({
    mutationFn: (payload: { status: 'approved' | 'rejected'; note?: string }) =>
      apiRoutes.adminReviewApplication(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'applications'] })
    },
  })

  const app = data?.application

  if (isLoading || !app) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-ink-faint">
        <FileText className="mx-auto mb-2 h-8 w-8 animate-pulse" />
        {t('common.loading')}
      </div>
    )
  }

  const reviewed = app.status !== 'pending'

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/admin" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
        ← {t('admin.backToList')}
      </Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-brand-700">{app.reference}</span>
          <span className={statusClass(app.status)}>{t(`admin.${app.status}`)}</span>
          {reviewed && app.reviewedAt && <span className="ml-auto text-xs text-ink-faint">{app.reviewedAt.slice(0, 10)}</span>}
        </div>

        <h2 className="mt-3 flex items-center gap-2 text-xl font-extrabold tracking-tight text-ink">
          <Building2 className="h-5 w-5 text-brand-600" /> {app.orgName}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          <Stethoscope className="mr-1 inline h-3.5 w-3.5" />
          {t(roleLabelKey(app.role))} · {app.licenseNumber}
        </p>

        <div className="mt-4 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
          <p className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-ink-faint" /> {app.firstName} {app.lastName}
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-ink-faint" /> {app.email}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-ink-faint" /> {app.phone}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-ink-faint" /> {app.city}
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {app.documents?.map((doc) => (
            <DocView
              key={doc.id}
              mime={doc.mime}
              data={doc.data}
              fileName={doc.fileName}
              docTypeLabel={t(`reg.docType.${doc.docType}`)}
            />
          ))}
        </div>
      </div>

      {!reviewed && (
        <div className="card space-y-3 p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-faint">
            <Check className="h-4 w-4" /> {t('admin.decision')}
          </h3>
          <Textarea
            label={t('admin.note')}
            placeholder={t('admin.notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              loading={mutate.isPending && mutate.variables?.status === 'approved'}
              onClick={() => mutate.mutate({ status: 'approved', note: note || undefined })}
            >
              <Check className="h-4 w-4" /> {t('admin.approve')}
            </Button>
            <Button
              variant="danger"
              loading={mutate.isPending && mutate.variables?.status === 'rejected'}
              onClick={() => mutate.mutate({ status: 'rejected', note: note || undefined })}
            >
              <X className="h-4 w-4" /> {t('admin.reject')}
            </Button>
          </div>
          {mutate.isError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {mutate.error instanceof Error ? mutate.error.message : t('common.error')}
            </p>
          )}
          {mutate.isSuccess && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {t('admin.savedReview')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}