import { useMemo, useState } from 'react'
import { UserRound } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { SearchBar } from '../../components/SearchBar'
import { NurseCard } from '../../components/NurseCard'
import { EmptyState } from '../../components/ui/States'
import { useApp } from '../../stores/AppStore'
import { nurses } from '../../data/mock'

export function NursesPage() {
  const { t } = useApp()
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()

  const list = useMemo(
    () =>
      nurses.filter(
        (n) =>
          !needle ||
          n.name.toLowerCase().includes(needle) ||
          n.city.toLowerCase().includes(needle) ||
          n.services.some((s) => s.toLowerCase().includes(needle)),
      ),
    [needle],
  )

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('nav.nurses')} subtitle={t('nurse.subtitle')} />
      <SearchBar value={query} onChange={setQuery} placeholder={t('common.search')} />

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<UserRound className="h-6 w-6" />}
            title={t('common.noResults')}
            description={t('common.noResultsDesc')}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map((n) => (
            <NurseCard key={n.id} nurse={n} />
          ))}
        </div>
      )}
    </div>
  )
}
