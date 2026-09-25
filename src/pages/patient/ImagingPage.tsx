import { useMemo, useState } from 'react'
import { ScanSearch } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { SearchBar } from '../../components/SearchBar'
import { ImagingCard } from '../../components/ImagingCard'
import { EmptyState } from '../../components/ui/States'
import { useApp } from '../../stores/AppStore'
import { useImagingCenters } from '../../lib/hooks'

export function ImagingPage() {
const { t } = useApp()
  const { data: imagingCenters = [] } = useImagingCenters()
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const list = useMemo(
    () =>
      imagingCenters.filter(
        (c) =>
          !needle ||
          c.name.toLowerCase().includes(needle) ||
          c.city.toLowerCase().includes(needle) ||
          c.exams.some((e) => e.type.toLowerCase().includes(needle)),
      ),
    [imagingCenters, needle],
  )

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('img.title')} subtitle={t('img.subtitle')} />
      <SearchBar value={query} onChange={setQuery} placeholder={t('img.searchPlaceholder')} />

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<ScanSearch className="h-6 w-6" />}
            title={t('common.noResults')}
            description={t('common.noResultsDesc')}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map((c) => (
            <ImagingCard key={c.id} center={c} />
          ))}
        </div>
      )}
    </div>
  )
}
