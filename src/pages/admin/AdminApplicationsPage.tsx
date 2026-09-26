import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, FileText, MapPin, ScrollText } from 'lucide-react'
import { useApp } from '../../stores/AppStore'
import { useAdminApplications } from '../../lib/hooks'
import { SearchBar } from '../../components/SearchBar'
import { FilterChips } from '../../components/ui/Tabs'
import { StatusPill, APPLICATION_TONE } from '../../components/ui/StatusPill'
import { EmptyState, LoadingState } from '../../components/ui/States'
import { roleLabelKey } from '../../lib/roles'
import { formatDateShort } from '../../lib/format'
import type { ProviderApplicationStatus } from '../../types'

type Filter = 'all' | ProviderApplicationStatus

const FILTERS: Filter[] = ['all', 'pending', 'approved', 'rejected']

export function AdminApplicationsPage() {
  const { t } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const { data, isLoading, isError, refetch } = useAdminApplications()

  const all = data ?? []
  const count = (f: Filter) => (f === 'all' ? all.length : all.filter((a) => a.status === f).length)

  // Search runs over the status-filtered set so the chip counts stay honest
  // while the list narrows.
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return all
      .filter((a) => (filter === 'all' ? true : a.status === filter))
      .filter((a) => {
        if (!needle) return true
        return [a.reference, a.orgName, a.email, a.firstName, a.lastName, a.city, a.licenseNumber]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle))
      })
  }, [all, filter, query])

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">{t('admin.applications')}</h2>
        <p className="text-sm text-ink-soft">{t('admin.applicationsDesc')}</p>
      </div>

      <FilterChips
        value={filter}
        onChange={setFilter}
        ariaLabel={t('admin.applications')}
        options={FILTERS.map((f) => ({ key: f, label: t(`admin.${f}`), count: count(f) }))}
      />

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder={t('admin.searchPlaceholder')}
        aria-label={t('admin.searchPlaceholder')}
      />

      {isLoading ? (
        <LoadingState label={t('common.loading')} />
      ) : isError ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title={t('common.error')}
          description={t('admin.loadError')}
          action={
            <button
              onClick={() => refetch()}
              className="rounded-xl border border-line px-3.5 py-2 text-sm font-semibold text-ink-soft transition hover:border-brand-300"
            >
              {t('common.retry')}
            </button>
          }
        />
      ) : visible.length > 0 ? (
        <ul className="space-y-3">
          {visible.map((app) => (
            <li key={app.id}>
              <Link
                to={`/admin/applications/${app.id}`}
                className="card block p-4 transition hover:border-brand-300 hover:shadow-soft"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-700">{app.reference}</span>
                  <StatusPill tone={APPLICATION_TONE[app.status] ?? 'neutral'}>
                    {t(`admin.${app.status}`)}
                  </StatusPill>
                  {app.createdAt ? (
                    <span className="ml-auto text-xs text-ink-faint">{formatDateShort(app.createdAt)}</span>
                  ) : null}
                </div>
                <h3 className="mt-2 flex items-center gap-2 text-base font-extrabold text-ink">
                  <ScrollText className="h-4 w-4 shrink-0 text-brand-600" /> {app.orgName}
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
                  <span className="truncate">{app.email}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title={query ? t('admin.noResults') : t('admin.noApplications')}
          description={query ? t('admin.noResultsDesc') : t('admin.noApplicationsDesc')}
        />
      )}
    </div>
  )
}
