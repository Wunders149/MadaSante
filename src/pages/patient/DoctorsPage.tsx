import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { SearchBar } from '../../components/SearchBar'
import { DoctorCard } from '../../components/DoctorCard'
import { FilterPanel, FilterGroup, FilterChip } from '../../components/FilterPanel'
import { EmptyState } from '../../components/ui/States'
import { Button } from '../../components/ui/Button'
import { useApp } from '../../stores/AppStore'
import { CITIES } from '../../lib/constants'
import { useDoctors } from '../../lib/hooks'
import type { ConsultationType, Doctor } from '../../types'
import { cn } from '../../lib/cn'

interface Filters {
  text: string
  type: 'all' | 'generalist' | 'specialist'
  specialty: string
  city: string
  consultations: ConsultationType[]
  price: string
  availableToday: boolean
}

const priceBands = [
  { key: 'all', label: 'Tous les prix' },
  { key: 'lt30', label: 'Moins de 30 000 Ar' },
  { key: '30to60', label: '30 000 – 60 000 Ar' },
  { key: 'gt60', label: 'Plus de 60 000 Ar' },
]

const consults: { key: ConsultationType; label: string }[] = [
  { key: 'cabinet', label: 'Cabinet' },
  { key: 'home', label: 'À domicile' },
  { key: 'hospital', label: 'Hôpital / Clinique' },
]

const defaultFilters: Filters = {
  text: '',
  type: 'all',
  specialty: 'all',
  city: 'all',
  consultations: [],
  price: 'all',
  availableToday: false,
}

export function DoctorsPage() {
  const { t } = useApp()
  const { data: allDoctors = [] } = useDoctors()
  const specialities = useMemo(() => Array.from(new Set(allDoctors.map((d) => d.specialty))).sort(), [allDoctors])
  const [params] = useSearchParams()
  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters,
    type: params.get('type') === 'specialist' ? 'specialist' : params.get('type') === 'generalist' ? 'generalist' : 'all',
  }))

  const activeCount = useMemo(() => {
    let n = 0
    if (filters.text) n++
    if (filters.type !== 'all') n++
    if (filters.specialty !== 'all') n++
    if (filters.city !== 'all') n++
    if (filters.consultations.length) n++
    if (filters.price !== 'all') n++
    if (filters.availableToday) n++
    return n
  }, [filters])

  const results = useMemo(() => {
    const needle = filters.text.trim().toLowerCase()
    return allDoctors
      .filter((d) => {
        if (needle && !(d.name.toLowerCase().includes(needle) || d.specialty.toLowerCase().includes(needle))) return false
        if (filters.type !== 'all' && d.type !== filters.type) return false
        if (filters.specialty !== 'all' && d.specialty !== filters.specialty) return false
        if (filters.city !== 'all' && d.city !== filters.city) return false
        if (filters.consultations.length && !filters.consultations.some((c) => d.consultationTypes.includes(c))) return false
        if (filters.price !== 'all') {
          if (filters.price === 'lt30' && d.price >= 30_000) return false
          if (filters.price === '30to60' && (d.price < 30_000 || d.price > 60_000)) return false
          if (filters.price === 'gt60' && d.price <= 60_000) return false
        }
        return true
      })
      .sort((a, b) => {
        if (filters.availableToday) {
          const aa = a.availability.includes('Lun') ? 0 : 1
          const ba = b.availability.includes('Lun') ? 0 : 1
          if (aa !== ba) return aa - ba
        }
        return b.rating - a.rating
      })
  }, [allDoctors, filters])

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }))

  const toggleConsult = (c: ConsultationType) =>
    set(
      'consultations',
      filters.consultations.includes(c)
        ? filters.consultations.filter((x) => x !== c)
        : [...filters.consultations, c],
    )

  const reset = () => setFilters(defaultFilters)

  return (
    <div className="page-container py-5 sm:py-7">
      <PageHeader title={t('doctors.title')} subtitle={t('doctors.subtitle')}>
        <FilterPanel
          badge={activeCount}
          onReset={reset}
          onApply={() => undefined}
          className="lg:hidden"
        >
          <MobileDoctorFilters filters={filters} set={set} toggleConsult={toggleConsult} specialities={specialities} />
        </FilterPanel>
      </PageHeader>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Desktop filters */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="card sticky top-24 space-y-5 p-5">
            <FilterGroup title={t('doctors.specialty')}>
              <AddSelect
                value={filters.specialty}
                onChange={(v) => set('specialty', v)}
                options={['all', ...specialities]}
                labels={{ all: 'Toutes les spécialités' }}
              />
            </FilterGroup>
            <FilterGroup title={t('doctors.city')}>
              <div className="flex flex-wrap gap-1.5">
                {['all', ...CITIES].map((c) => (
                  <FilterChip key={c} active={filters.city === c} onClick={() => set('city', c)}>
                    {c === 'all' ? t('common.all') : c}
                  </FilterChip>
                ))}
              </div>
            </FilterGroup>
            <FilterGroup title={t('doctors.consultation')}>
              <div className="flex flex-wrap gap-1.5">
                {consults.map((c) => (
                  <FilterChip key={c.key} active={filters.consultations.includes(c.key)} onClick={() => toggleConsult(c.key)}>
                    {c.label}
                  </FilterChip>
                ))}
              </div>
            </FilterGroup>
            <FilterGroup title={t('doctors.priceFilter')}>
              <div className="space-y-1.5">
                {priceBands.map((p) => (
                  <label key={p.key} className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink">
                    <input
                      type="radio"
                      name="price"
                      checked={filters.price === p.key}
                      onChange={() => set('price', p.key)}
                      className="h-4 w-4 accent-[var(--brand-600)]"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </FilterGroup>
            <label className="flex cursor-pointer items-center justify-between text-sm font-medium text-ink">
              {t('doctors.availabilityFilter')}
              <input
                type="checkbox"
                checked={filters.availableToday}
                onChange={(e) => set('availableToday', e.target.checked)}
                className="h-4 w-4 accent-[var(--brand-600)]"
              />
            </label>
            <Button variant="outline" size="sm" fullWidth onClick={reset}>
              {t('common.reset')}
            </Button>
          </div>
        </aside>

        {/* Results */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBar
              value={filters.text}
              onChange={(v) => set('text', v)}
              placeholder={t('doctors.searchPlaceholder')}
              size="md"
              className="flex-1"
            />
            <div className="flex flex-wrap gap-1.5">
              <FilterChip active={filters.type === 'all'} onClick={() => set('type', 'all')}>
                {t('common.all')}
              </FilterChip>
              <FilterChip active={filters.type === 'generalist'} onClick={() => set('type', 'generalist')}>
                {t('doctors.generalistFilter')}
              </FilterChip>
              <FilterChip active={filters.type === 'specialist'} onClick={() => set('type', 'specialist')}>
                {t('doctors.specialistFilter')}
              </FilterChip>
            </div>
            <FilterPanel
              badge={activeCount}
              onReset={reset}
              className="lg:hidden"
            >
              <MobileDoctorFilters filters={filters} set={set} toggleConsult={toggleConsult} specialities={specialities} />
            </FilterPanel>
          </div>

          <p className="mb-3 text-sm text-ink-soft">
            {results.length} médecin{results.length > 1 ? 's' : ''}
          </p>

          {results.length === 0 ? (
            <EmptyState
              icon={<Stethoscope className="h-6 w-6" />}
              title={t('common.noResults')}
              description={t('common.noResultsDesc')}
              action={
                <Button variant="outline" onClick={reset}>
                  {t('common.reset')}
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {results.map((d: Doctor) => (
                <DoctorCard key={d.id} doctor={d} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AddSelect({
  value,
  onChange,
  options,
  labels = {},
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  labels: Record<string, string>
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm outline-none focus:border-brand-400"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {labels[o] ?? o}
        </option>
      ))}
    </select>
  )
}

function MobileDoctorFilters({
  filters,
  set,
  toggleConsult,
  specialities,
}: {
  filters: Filters
  set: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  toggleConsult: (c: ConsultationType) => void
  specialities: string[]
}) {
  const { t } = useApp()
  return (
    <div className="space-y-5">
      <FilterGroup title={t('doctors.specialty')}>
        <AddSelect
          value={filters.specialty}
          onChange={(v) => set('specialty', v)}
          options={['all', ...specialities]}
          labels={{ all: 'Toutes les spécialités' }}
        />
      </FilterGroup>
      <FilterGroup title={t('doctors.city')}>
        <div className="flex flex-wrap gap-1.5">
          {['all', ...CITIES].map((c) => (
            <FilterChip key={c} active={filters.city === c} onClick={() => set('city', c)}>
              {c === 'all' ? t('common.all') : c}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title={t('doctors.consultation')}>
        <div className="flex flex-wrap gap-1.5">
          {consults.map((c) => (
            <FilterChip key={c.key} active={filters.consultations.includes(c.key)} onClick={() => toggleConsult(c.key)}>
              {c.label}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title={t('doctors.priceFilter')}>
        <div className="space-y-1.5">
          {priceBands.map((p) => (
            <label key={p.key} className={cn('flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink')}>
              <input type="radio" name="price-mobile" checked={filters.price === p.key} onChange={() => set('price', p.key)} className="h-4 w-4 accent-[var(--brand-600)]" />
              {p.label}
            </label>
          ))}
        </div>
      </FilterGroup>
      <label className="flex cursor-pointer items-center justify-between text-sm font-medium text-ink">
        {t('doctors.availabilityFilter')}
        <input type="checkbox" checked={filters.availableToday} onChange={(e) => set('availableToday', e.target.checked)} className="h-4 w-4 accent-[var(--brand-600)]" />
      </label>
    </div>
  )
}