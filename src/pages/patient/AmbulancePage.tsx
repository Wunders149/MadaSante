import { useMemo, useState } from 'react'
import { Siren } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { SearchBar } from '../../components/SearchBar'
import { AmbulanceCard } from '../../components/AmbulanceCard'
import { EmptyState } from '../../components/ui/States'
import { useApp } from '../../stores/AppStore'
import { useAmbulances } from '../../lib/hooks'

export function AmbulancePage() {
  const { t } = useApp()
  const { data: ambulances = [] } = useAmbulances()
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const list = useMemo(
    () =>
      ambulances.filter(
        (a) =>
          !needle ||
          a.provider.toLowerCase().includes(needle) ||
          a.city.toLowerCase().includes(needle) ||
          a.vehicles.some((v) => v.toLowerCase().includes(needle)),
      ),
    [ambulances, needle],
  )

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('amb.title')} subtitle={t('amb.subtitle')} />
      <SearchBar value={query} onChange={setQuery} placeholder={t('common.search')} />

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Siren className="h-6 w-6" />}
            title={t('common.noResults')}
            description={t('common.noResultsDesc')}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map((a) => (
            <AmbulanceCard key={a.id} ambulance={a} />
          ))}
        </div>
      )}
    </div>
  )
}
