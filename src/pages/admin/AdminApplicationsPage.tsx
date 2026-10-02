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
type SortMode = 'newest' | 'oldest' | 'name'

const FILTERS: Filter[] = ['all', 'pending', 'approved', 'rejected']

export function AdminApplicationsPage() {
  const { t } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const { data, isLoading, isError, refetch } = useAdminApplications()

  const all = data ?? []
  const count = (f: Filter) => (f === 'all' ? all.length : all.filter((a) => a.status === f).length)

  const summaryCards = [
    { label: t('admin.pending'), value: count('pending'), tone: 'amber' },
    { label: t('admin.approved'), value: count('approved'), tone: 'green' },
    { label: t('admin.rejected'), value: count('rejected'), tone: 'red' },
    { label: t('admin.all'), value: all.length, tone: 'brand' },
  ]

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = all
      .filter((a) => (filter === 'all' ? true : a.status === filter))
      .filter((a) => {
        if (!needle) return true
        return [a.reference, a.orgName, a.email, a.firstName, a.lastName, a.city, a.licenseNumber]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle))
      })

    const sorted = [...filtered]
    sorted.sort((a, b) => {
      const aTime = new Date(a.createdAt ?? 0).getTime()
      const bTime = new Date(b.createdAt ?? 0).getTime()
      if (sortMode === 'oldest') return aTime - bTime
      if (sortMode === 'name') return `${a.orgName}`.localeCompare(`${b.orgName}`)
      return bTime - aTime
    })

    return sorted
  }, [all, filter, query, sortMode])

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">{t('admin.applications')}</h2>
        <p className="text-sm text-ink-soft">{t('admin.applicationsDesc')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">{card.label}</p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink">{card.value}</p>
          </div>
        ))}
      </div>

      <FilterChips
        value={filter}
        onChange={setFilter}
        ariaLabel={t('admin.applications')}
        options={FILTERS.map((f) => ({ key: f, label: t(`admin.${f}`), count: count(f) }))}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={t('admin.searchPlaceholder')}
            aria-label={t('admin.searchPlaceholder')}
          />
        </div>

        <label className="flex min-w-[170px] flex-col gap-1 text-xs font-semibold text-ink-faint">
          <span>Tri</span>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="rounded-xl border border-line bg-card px-3 py-2.5 text-sm font-medium text-ink focus:border-brand-300 focus:outline-none"
          >
            <option value="newest">Plus récents</option>
            <option value="oldest">Plus anciens</option>
            <option value="name">Par établissement</option>
          </select>
        </label>
      </div>

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
              <article className="card p-4 transition hover:border-brand-300 hover:shadow-soft">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-700">{app.reference}</span>
                  <StatusPill tone={APPLICATION_TONE[app.status] ?? 'neutral'}>
                    {t(`admin.${app.status}`)}
                  </StatusPill>
                  {app.createdAt ? (
                    <span className="ml-auto text-xs text-ink-faint">{formatDateShort(app.createdAt)}</span>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-base font-extrabold text-ink">
                      <ScrollText className="h-4 w-4 shrink-0 text-brand-600" /> {app.orgName}
                    </h3>
                    <p className="mt-1 text-sm text-ink-soft">
                      {app.firstName} {app.lastName} · {t(roleLabelKey(app.role))}
                    </p>
                  </div>

                  <Link
                    to={`/admin/applications/${app.id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
                  >
                    Revoir le dossier
                  </Link>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-faint">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> {t('admin.documents')}: {app.documentCount ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {app.city}
                  </span>
                  <span className="truncate">{app.email}</span>
                </div>
              </article>
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
