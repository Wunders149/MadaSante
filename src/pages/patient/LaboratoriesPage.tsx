import { useMemo, useState } from 'react'
import { SearchX } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { SearchBar } from '../../components/SearchBar'
import { LaboratoryCard } from '../../components/LaboratoryCard'
import { EmptyState } from '../../components/ui/States'
import { useApp } from '../../stores/AppStore'
import { useLaboratories } from '../../lib/hooks'

export function LaboratoriesPage() {
const { t } = useApp()
  const { data: laboratories = [] } = useLaboratories()
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const list = useMemo(
    () =>
      laboratories.filter(
        (l) =>
          !needle ||
          l.name.toLowerCase().includes(needle) ||
          l.city.toLowerCase().includes(needle) ||
          l.tests.some((x) => x.toLowerCase().includes(needle)),
      ),
    [laboratories, needle],
  )

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('lab.title')} subtitle={t('lab.subtitle')} />
      <SearchBar value={query} onChange={setQuery} placeholder={t('lab.searchPlaceholder')} />

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title={t('common.noResults')}
            description={t('common.noResultsDesc')}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map((l) => (
            <LaboratoryCard key={l.id} laboratory={l} />
          ))}
        </div>
      )}
    </div>
  )
}
