import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  Clock,
  FlaskConical,
  Pill,
  Scan,
  Search,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import { SearchBar } from '../../components/SearchBar'
import { PageHeader } from '../../components/ui/Headers'
import { EmptyState } from '../../components/ui/States'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/ui/Button'
import { useApp } from '../../stores/AppStore'
import { doctors, hospitals, imagingCenters, laboratories, medicines, nurses } from '../../data/mock'
import { formatAr } from '../../lib/format'
import { cn } from '../../lib/cn'

type Category = 'all' | 'doctors' | 'medicines' | 'facilities' | 'laboratories' | 'imaging' | 'nurses'

const categories: { key: Category; label: string; icon: typeof Search }[] = [
  { key: 'all', label: 'Tous', icon: Search },
  { key: 'doctors', label: 'Médecins', icon: Stethoscope },
  { key: 'medicines', label: 'Médicaments', icon: Pill },
  { key: 'facilities', label: 'Hôpitaux / Cliniques', icon: Building2 },
  { key: 'laboratories', label: 'Laboratoires', icon: FlaskConical },
  { key: 'imaging', label: 'Imagerie', icon: Scan },
  { key: 'nurses', label: 'Infirmières', icon: UserRound },
]

const match = (needle: string) => (haystack: string) => haystack.toLowerCase().includes(needle.toLowerCase())

export function SearchPage() {
  const { t } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const initial = new URLSearchParams(location.search).get('q') ?? ''
  const [query, setQuery] = useState(initial)
  const [category, setCategory] = useState<Category>('all')
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ms_recent') ?? '[]') as string[]
    } catch {
      return []
    }
  })

  const normalized = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!normalized) return null
    const m = match(normalized)
    const doctorHits = doctors.filter((d) => m(d.name) || m(d.specialty) || m(d.city))
    const medicineHits = medicines
      .map((med) => ({ med, hit: m(med.name) || m(med.genericName) }))
      .filter((x) => x.hit)
      .map((x) => x.med)
    const facilityHits = hospitals.filter((h) => m(h.name) || m(h.city) || h.services.some(m))
    const labHits = laboratories.filter((l) => m(l.name) || l.tests.some(m) || m(l.city))
    const imagingHits = imagingCenters.filter((c) => m(c.name) || m(c.city) || c.exams.some((e) => m(e.type)))
    const nurseHits = nurses.filter((n) => m(n.name) || m(n.city) || n.services.some(m))

    return {
      doctors: category === 'all' || category === 'doctors' ? doctorHits : [],
      medicines: category === 'all' || category === 'medicines' ? medicineHits : [],
      facilities: category === 'all' || category === 'facilities' ? facilityHits : [],
      laboratories: category === 'all' || category === 'laboratories' ? labHits : [],
      imaging: category === 'all' || category === 'imaging' ? imagingHits : [],
      nurses: category === 'all' || category === 'nurses' ? nurseHits : [],
    }
  }, [normalized, category])

  const total = results ? [results.doctors, results.medicines, results.facilities, results.laboratories, results.imaging, results.nurses].reduce((a, x) => a + x.length, 0) : 0

  const search = () => {
    if (!query.trim()) return
    const next = [query.trim(), ...recent.filter((r) => r.toLowerCase() !== query.trim().toLowerCase())].slice(0, 5)
    setRecent(next)
    localStorage.setItem('ms_recent', JSON.stringify(next))
  }

  return (
    <div className="page-container py-5 sm:py-7">
      <PageHeader title={t('search.title')} subtitle={t('search.subtitle')} />

      <SearchBar value={query} onChange={(v) => { setQuery(v); navigate(`/patient/search?q=${encodeURIComponent(v)}`, { replace: true }) }} placeholder={t('search.placeholder')} onSubmit={search} />

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition',
              category === c.key ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-card text-ink-soft hover:border-brand-300',
            )}
          >
            <c.icon className="h-4 w-4" />
            {c.label}
          </button>
        ))}
      </div>

      {!normalized && recent.length > 0 && (
        <section className="mt-6">
          <h2 className="section-title mb-2">{t('search.recent')}</h2>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <button
                key={r}
                onClick={() => setQuery(r)}
                className="card rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition hover:text-brand-700"
              >
                <Clock className="mr-1 inline h-3.5 w-3.5" /> {r}
              </button>
            ))}
          </div>
        </section>
      )}

      {results && (
        <section className="mt-6 space-y-6">
          <p className="text-sm text-ink-soft">
            {total} résultat{total > 1 ? 's' : ''}
            {total === 0 && <> pour « {query} »</>}
          </p>

          {total === 0 && (
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title={t('search.noResults')}
              description={t('search.noResultsDesc')}
              action={
                <Button variant="outline" to="/patient/orientation">
                  {t('hosp.orient')}
                </Button>
              }
            />
          )}

          {results.doctors.length > 0 && (
            <ResultsGroup title={`${t('nav.doctors')} (${results.doctors.length})`}>
              {results.doctors.map((d) => (
                <button key={d.id} onClick={() => navigate(`/patient/doctors/${d.id}`)} className="card touch-target flex w-full items-center gap-3 p-3.5 text-left transition hover:border-brand-300">
                  <Avatar name={d.name} src={d.photo} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{d.name}</span>
                    <span className="block text-xs text-ink-soft">{d.specialty} · {d.city}</span>
                  </span>
                  <span className="text-sm font-bold text-ink">{formatAr(d.price)}</span>
                </button>
              ))}
            </ResultsGroup>
          )}

          {results.medicines.length > 0 && (
            <ResultsGroup title={`${t('nav.pharmacies')} / ${t('med.title')} (${results.medicines.length})`}>
              {results.medicines.map((m) => (
                <button key={m.id} onClick={() => navigate('/patient/medicines')} className="card touch-target flex w-full items-center gap-3 p-3.5 text-left transition hover:border-brand-300">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <Pill className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{m.name}</span>
                    <span className="block text-xs text-ink-soft">{m.pharmacyName} · {m.city}</span>
                  </span>
                  <span className="text-sm font-bold text-ink">{formatAr(m.price)}</span>
                </button>
              ))}
            </ResultsGroup>
          )}

          {results.facilities.length > 0 && (
            <ResultsGroup title={`${t('nav.hospitals')} (${results.facilities.length})`}>
              {results.facilities.map((h) => (
                <button key={h.id} onClick={() => navigate('/patient/hospitals')} className="card touch-target flex w-full items-center gap-3 p-3.5 text-left transition hover:border-brand-300">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{h.name}</span>
                    <span className="block text-xs text-ink-soft">{h.city} · {h.services.slice(0, 2).join(' · ')}</span>
                  </span>
                </button>
              ))}
            </ResultsGroup>
          )}

          {results.laboratories.length > 0 && (
            <ResultsGroup title={`${t('nav.laboratories')} (${results.laboratories.length})`}>
              {results.laboratories.map((l) => (
                <button key={l.id} onClick={() => navigate('/patient/laboratories')} className="card touch-target flex w-full items-center gap-3 p-3.5 text-left transition hover:border-brand-300">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <FlaskConical className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{l.name}</span>
                    <span className="block text-xs text-ink-soft">{l.city}</span>
                  </span>
                </button>
              ))}
            </ResultsGroup>
          )}

          {results.imaging.length > 0 && (
            <ResultsGroup title={`${t('nav.imaging')} (${results.imaging.length})`}>
              {results.imaging.map((c) => (
                <button key={c.id} onClick={() => navigate('/patient/imaging')} className="card touch-target flex w-full items-center gap-3 p-3.5 text-left transition hover:border-brand-300">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">
                    <Scan className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{c.name}</span>
                    <span className="block text-xs text-ink-soft">{c.city} · {c.exams[0].type}</span>
                  </span>
                </button>
              ))}
            </ResultsGroup>
          )}

          {results.nurses.length > 0 && (
            <ResultsGroup title={`${t('nav.nurses')} (${results.nurses.length})`}>
              {results.nurses.map((n) => (
                <button key={n.id} onClick={() => navigate('/patient/nurses')} className="card touch-target flex w-full items-center gap-3 p-3.5 text-left transition hover:border-brand-300">
                  <Avatar name={n.name} src={n.photo} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{n.name}</span>
                    <span className="block text-xs text-ink-soft">{n.qualification} · {n.city}</span>
                  </span>
                  <span className="text-sm font-bold text-ink">{formatAr(n.price)}</span>
                </button>
              ))}
            </ResultsGroup>
          )}
        </section>
      )}
    </div>
  )
}

function ResultsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="section-title mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}