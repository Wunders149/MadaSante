import { useMemo, useState } from 'react'
import { HeartHandshake } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { SearchBar } from '../../components/SearchBar'
import { MedicalNgoCard } from '../../components/MedicalNgoCard'
import { EmptyState } from '../../components/ui/States'
import { useApp } from '../../stores/AppStore'
import { useMedicalNgos } from '../../lib/hooks'

/**
 * Medical NGOs and associations. These are not bookable, so this page is a
 * contact directory rather than a booking entry point.
 */
export function MedicalNgosPage() {
  const { t } = useApp()
  const [query, setQuery] = useState('')
  const { data: ngos = [], isLoading } = useMedicalNgos()

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return ngos
    return ngos.filter((ngo) =>
      [ngo.name, ngo.focus, ngo.city, ngo.description, ...ngo.services, ...ngo.coverage]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle)),
    )
  }, [ngos, query])

  return (
    <div className="page-container max-w-5xl py-5 sm:py-7">
      <PageHeader title={t('ngo.title')} subtitle={t('ngo.subtitle')} />

      <div className="mt-5">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={t('ngo.searchPlaceholder')}
          aria-label={t('ngo.searchPlaceholder')}
        />
      </div>

      {isLoading ? (
        <EmptyState icon={<HeartHandshake className="h-6 w-6" />} title={t('common.loading')} />
      ) : visible.length > 0 ? (
        <>
          <p className="mt-5 text-xs font-semibold text-ink-faint">
            {t('ngo.resultsCount', { n: visible.length })}
          </p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visible.map((ngo) => (
              <MedicalNgoCard key={ngo.id} ngo={ngo} />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={<HeartHandshake className="h-6 w-6" />}
            title={query ? t('common.noResults') : t('ngo.empty')}
            description={query ? t('common.noResultsDesc') : t('ngo.emptyDesc')}
          />
        </div>
      )}
    </div>
  )
}
