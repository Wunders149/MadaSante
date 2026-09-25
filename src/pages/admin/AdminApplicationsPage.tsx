import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, MapPin, ScrollText, Search } from 'lucide-react'
import { useApp } from '../../stores/AppStore'
import { useAdminApplications } from '../../lib/hooks'
import { cn } from '../../lib/cn'
import { roleLabelKey } from '../../lib/roles'
import type { ProviderApplicationStatus } from '../../types'

type Filter = 'all' | ProviderApplicationStatus

const FILTERS: Filter[] = ['all', 'pending', 'approved', 'rejected']

function statusClass(status: ProviderApplicationStatus) {
  return cn(
    'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
    status === 'pending' && 'bg-amber-50 text-amber-700',
    status === 'approved' && 'bg-emerald-50 text-emerald-700',
    status === 'rejected' && 'bg-red-50 text-red-600',
  )
}

export function AdminApplicationsPage() {
  const { t } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const { data, isLoading } = useAdminApplications()

  const visible = (data ?? []).filter((a) => (filter === 'all' ? true : a.status === filter))
  const count = (f: Filter) => (data ?? []).filter((a) => (f === 'all' ? true : a.status === f)).length

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">{t('admin.applications')}</h2>
        <p className="text-sm text-ink-soft">{t('admin.applicationsDesc')}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-bold transition',
              filter === f ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-card text-ink-soft',
            )}
          >
            {t(`admin.${f}`)}
            <span className="ml-1.5 opacity-70">{count(f)}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-ink-faint">
          <Search className="mr-2 h-5 w-5 animate-pulse" /> {t('common.loading')}
        </div>
      ) : visible.length > 0 ? (
        <div className="space-y-3">
          {visible.map((app) => (
            <Link
              key={app.id}
              to={`/admin/applications/${app.id}`}
              className="card block p-4 transition hover:border-brand-300"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-700">{app.reference}</span>
                <span className={statusClass(app.status)}>{t(`admin.${app.status}`)}</span>
                <span className="ml-auto text-xs text-ink-faint">{app.createdAt?.slice(0, 10)}</span>
              </div>
              <h3 className="mt-2 flex items-center gap-2 text-base font-extrabold text-ink">
                <ScrollText className="h-4 w-4 text-brand-600" /> {app.orgName}
              </h3>
              <p className="mt-1 text-sm text-ink-soft">
                {app.firstName} {app.lastName} · {t(roleLabelKey(app.role))}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-faint">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> {t('admin.documents')}: {app.documentCount ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {app.city}
                </span>
                <span>{app.email}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-2 p-10 text-center">
          <Search className="h-8 w-8 text-ink-faint" />
          <p className="font-bold text-ink">{t('admin.noApplications')}</p>
          <p className="text-sm text-ink-soft">{t('admin.noApplicationsDesc')}</p>
        </div>
      )}
    </div>
  )
}