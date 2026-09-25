import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapPinned, Pill, SearchX, Truck } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { SearchBar } from '../../components/SearchBar'
import { MedicineCard } from '../../components/MedicineCard'
import { OrientationBanner } from '../../components/OrientationBanner'
import { EmptyState } from '../../components/ui/States'
import { useApp } from '../../stores/AppStore'
import { useMedicines, usePharmacies } from '../../lib/hooks'
import type { Medicine } from '../../types'
import { formatAr } from '../../lib/format'

export function MedicinesPage() {
  const { t } = useApp()
  const { data: medicines = [] } = useMedicines()
  const { data: pharmacies = [] } = usePharmacies()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('pharmacy') ? '' : '')
  const pharmacyFilter = params.get('pharmacy') ?? ''
  const pharm = pharmacies.find((p) => p.id === pharmacyFilter)

  const results = useMemo<Medicine[]>(() => {
    const needle = query.trim().toLowerCase()
    let list = medicines
    if (pharmacyFilter) list = list.filter((m) => m.pharmacyId === pharmacyFilter)
    if (!needle) return list
    return list.filter((m) => m.name.toLowerCase().includes(needle) || m.genericName.toLowerCase().includes(needle))
  }, [medicines, query, pharmacyFilter])

  const knownMedicine = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return false
    return medicines.some((m) => m.name.toLowerCase().includes(needle) || m.genericName.toLowerCase().includes(needle))
  }, [medicines, query])

  const showUnavailable = query.trim().length > 1 && results.length === 0 && knownMedicine

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('med.title')} subtitle={pharm ? `${pharm.name} — ${pharm.location}` : t('med.subtitle')} />

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder={t('med.searchPlaceholder')}
      />

      {query.trim() === '' && (
        <section className="mt-6">
          <h2 className="section-title mb-2">{t('med.results')}</h2>
          <div className="space-y-2.5">
            {results.map((m) => (
              <MedicineCard key={m.id} medicine={m} />
            ))}
          </div>
        </section>
      )}

      {query.trim() !== '' && showUnavailable && (
        <section className="mt-6 space-y-4">
          <EmptyState
            icon={<SearchX className="h-6 w-6 text-red-500" />}
            title={t('med.notAvailable')}
            description={t('med.alternative')}
          />
          <OrientationBanner
            icon={MapPinned}
            compact
            title={`Nous vous orientons vers une pharmacie disponible.`}
            description={`${knownMedicine ? 'Le médicament existe mais n’est pas listé ici' : 'Mada Santé peut vous aider'} — laissez-nous chercher pour vous.`}
            actionLabel={t('med.alternativeBtn')}
            actionTo={`/patient/pharmacies`}
          />
        </section>
      )}

      {query.trim() !== '' && !showUnavailable && (
        <section className="mt-6 space-y-2.5">
          <p className="text-sm text-ink-soft">
            {results.length} résultat{results.length > 1 ? 's' : ''}
          </p>
          {results.map((m) => (
            <MedicineCard key={m.id} medicine={m} />
          ))}
          {results.length === 0 && (
            <EmptyState
              icon={<Pill className="h-6 w-6" />}
              title={t('common.noResults')}
              description={t('search.noResultsDesc')}
            />
          )}
        </section>
      )}

      <section className="mt-8 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white">
          <Truck className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-blue-900">{t('del.title')}</h3>
          <p className="mt-0.5 text-sm text-blue-800/80">{t('del.subtitle')}</p>
          <p className="mt-1 text-xs text-blue-700/70">Ex. {formatAr(3_000)} de frais · Orange Money / MVola</p>
        </div>
      </section>
    </div>
  )
}