import { Pill } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { PharmacyCard } from '../../components/PharmacyCard'
import { EmptyState } from '../../components/ui/States'
import { SearchBar } from '../../components/SearchBar'
import { useApp } from '../../stores/AppStore'
import { usePharmacies } from '../../lib/hooks'
import { useState } from 'react'

export function PharmaciesPage() {
  const { t } = useApp()
  const { data: pharmacies = [] } = usePharmacies()
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const list = pharmacies.filter(
    (p) => !needle || p.name.toLowerCase().includes(needle) || p.city.toLowerCase().includes(needle) || p.location.toLowerCase().includes(needle),
  )

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('pharm.title')} subtitle={t('pharm.subtitle')} />
      <SearchBar value={query} onChange={setQuery} placeholder="Rechercher une pharmacie ou une ville…" />
      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<Pill className="h-6 w-6" />} title={t('common.noResults')} description={t('common.noResultsDesc')} />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map((p) => (
            <PharmacyCard key={p.id} pharmacy={p} />
          ))}
        </div>
      )}
    </div>
  )
}