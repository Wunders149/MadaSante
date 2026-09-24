import { useMemo, useState } from 'react'
import { Building2 } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { HospitalCard } from '../../components/HospitalCard'
import { EmptyState } from '../../components/ui/States'
import { SearchBar } from '../../components/SearchBar'
import { useApp } from '../../stores/AppStore'
import { hospitals } from '../../data/mock'

export function HospitalsPage() {
  const { t } = useApp()
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const list = useMemo(
    () =>
      hospitals.filter(
        (h) =>
          !needle ||
          h.name.toLowerCase().includes(needle) ||
          h.city.toLowerCase().includes(needle) ||
          h.services.some((s) => s.toLowerCase().includes(needle)),
      ),
    [needle],
  )

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('hosp.title')} subtitle={t('hosp.subtitle')} />
      <SearchBar value={query} onChange={setQuery} placeholder={t('hosp.searchPlaceholder')} />

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<Building2 className="h-6 w-6" />} title={t('common.noResults')} description={t('common.noResultsDesc')} />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map((h) => (
            <HospitalCard key={h.id} hospital={h} />
          ))}
        </div>
      )}
    </div>
  )
}