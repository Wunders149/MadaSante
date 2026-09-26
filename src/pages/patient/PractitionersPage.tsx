import { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { SearchBar } from '../../components/SearchBar'
import { PractitionerCard } from '../../components/PractitionerCard'
import { EmptyState } from '../../components/ui/States'
import { FilterChips } from '../../components/ui/Tabs'
import { useApp } from '../../stores/AppStore'
import { usePractitioners } from '../../lib/hooks'
import { PROFESSIONS, roleLabelKey } from '../../lib/roles'
import type { Profession } from '../../types'

type Filter = 'all' | Profession

/**
 * One directory for all seven allied-health professions. A patient looking for
 * a physiotherapist or a psychologist lands here and filters, rather than
 * having to guess which of seven separate pages they want.
 */
export function PractitionersPage() {
  const { t } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const { data: practitioners = [], isLoading } = usePractitioners()

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return practitioners
      .filter((p) => (filter === 'all' ? true : p.profession === filter))
      .filter((p) => {
        if (!needle) return true
        return [p.name, p.specialty, p.qualification, p.city, ...p.services]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle))
      })
  }, [practitioners, filter, query])

  const count = (f: Filter) =>
    f === 'all' ? practitioners.length : practitioners.filter((p) => p.profession === f).length

  return (
    <div className="page-container max-w-5xl py-5 sm:py-7">
      <PageHeader title={t('prac.title')} subtitle={t('prac.subtitle')} />

      <div className="mt-5 space-y-4">
        <FilterChips
          value={filter}
          onChange={setFilter}
          ariaLabel={t('prac.profession')}
          options={[
            { key: 'all' as Filter, label: t('common.all'), count: count('all') },
            ...PROFESSIONS.map((profession) => ({
              key: profession as Filter,
              label: t(roleLabelKey(profession)),
              count: count(profession),
            })),
          ]}
        />
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={t('prac.searchPlaceholder')}
          aria-label={t('prac.searchPlaceholder')}
        />
      </div>

      {isLoading ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title={t('common.loading')} />
      ) : visible.length > 0 ? (
        <>
          <p className="mt-5 text-xs font-semibold text-ink-faint">
            {t('prac.resultsCount', { n: visible.length })}
          </p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visible.map((p) => (
              <PractitionerCard key={p.id} practitioner={p} />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title={query ? t('common.noResults') : t('prac.empty')}
            description={query ? t('common.noResultsDesc') : t('prac.emptyDesc')}
          />
        </div>
      )}
    </div>
  )
}
