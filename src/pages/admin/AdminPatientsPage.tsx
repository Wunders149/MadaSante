import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, FileText, MapPin, Phone, Users } from 'lucide-react'
import { useApp } from '../../stores/AppStore'
import { useAdminUsers } from '../../lib/hooks'
import { SearchBar } from '../../components/SearchBar'
import { FilterChips } from '../../components/ui/Tabs'
import { StatusPill } from '../../components/ui/StatusPill'
import { EmptyState, LoadingState } from '../../components/ui/States'
import { roleLabelKey } from '../../lib/roles'
import { formatDateShort } from '../../lib/format'
import type { PillTone } from '../../components/ui/StatusPill'

type Filter = 'all' | 'patient' | 'admin'

const FILTERS: Filter[] = ['all', 'patient', 'admin']

const ROLE_TONE: Record<string, PillTone> = {
  patient: 'blue',
  admin: 'emerald',
}

const PAGE_SIZE = 20

export function AdminPatientsPage() {
  const { t } = useApp()
  const [filter, setFilter] = useState<Filter>('patient')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useAdminUsers({ role: filter, page, limit: PAGE_SIZE })

  const all = data?.users ?? []

  // Filtering happens server-side by role, but the free-text search is local:
  // it only narrows the current page, which is why the result count is shown
  // next to the search field rather than pretending to be a global total.
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return all
    return all.filter((u) =>
      [u.id, u.firstName, u.lastName, u.email, u.phone, u.location]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle)),
    )
  }, [all, query])

  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">{t('admin.patients')}</h2>
        <p className="text-sm text-ink-soft">{t('admin.patientsDesc')}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          value={filter}
          onChange={(next) => {
            setFilter(next)
            setPage(1)
          }}
          ariaLabel={t('admin.patients')}
          options={FILTERS.map((f) => ({
            key: f,
            label: t(`admin.${f}`),
            count: f === 'all' ? undefined : f === 'patient' ? total : undefined,
          }))}
        />
        <p className="text-xs font-semibold text-ink-faint">
          {t('admin.totalAccounts', { n: total })}
        </p>
      </div>

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder={t('admin.searchPatients')}
        aria-label={t('admin.searchPatients')}
      />

      {isLoading ? (
        <LoadingState label={t('common.loading')} />
      ) : isError ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
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
        <>
          <ul className="space-y-3">
            {visible.map((u) => (
              <li key={u.id}>
                <Link
                  to={`/admin/patients/${u.id}`}
                  className="card block p-4 transition hover:border-brand-300 hover:shadow-soft"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-700">{u.id}</span>
                    <StatusPill tone={ROLE_TONE[u.role] ?? 'neutral'}>{t(roleLabelKey(u.role))}</StatusPill>
                    {u.createdAt ? (
                      <span className="ml-auto text-xs text-ink-faint">{formatDateShort(u.createdAt)}</span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 flex items-center gap-2 text-base font-extrabold text-ink">
                    <Users className="h-4 w-4 shrink-0 text-brand-600" />
                    {u.firstName} {u.lastName}
                  </h3>
                  <p className="mt-1 truncate text-sm text-ink-soft">{u.email}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-faint">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {u.phone}
                    </span>
                    {u.location ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {u.location}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> {t('admin.appointments')}: {u.appointmentCount ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> {t('admin.payments')}: {u.paymentCount ?? 0}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav className="flex items-center justify-between pt-1" aria-label={t('common.pagination')}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-line px-3.5 text-sm font-semibold text-ink-soft transition hover:border-brand-300 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> {t('common.previous')}
              </button>
              <span className="text-xs font-semibold text-ink-faint">
                {t('common.pageOf', { page, totalPages })}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-line px-3.5 text-sm font-semibold text-ink-soft transition hover:border-brand-300 disabled:opacity-40"
              >
                {t('common.next')} <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </>
      ) : (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={query ? t('admin.noResults') : t('admin.noPatients')}
          description={query ? t('admin.noResultsDesc') : t('admin.noPatientsDesc')}
        />
      )}
    </div>
  )
}
