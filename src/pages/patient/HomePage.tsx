import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Ambulance as AmbulanceIcon,
  Beaker,
  Building2,
  FlaskConical,
  HeartPulse,
  Pill,
  Scan,
  ScanFace,
  Siren,
  Sparkles,
  Stethoscope,
  Syringe,
  Truck,
} from 'lucide-react'
import { SearchBar } from '../../components/SearchBar'
import { ServiceCard } from '../../components/ServiceCard'
import { SectionHeader } from '../../components/ui/Headers'
import { Button } from '../../components/ui/Button'
import { OrientationBanner } from '../../components/OrientationBanner'
import { useApp } from '../../stores/AppStore'
import { doctors, medicines, imagingCenters, laboratories, nurses, hospitals } from '../../data/mock'
import type { LucideIcon } from 'lucide-react'

const quick = [
  { label: 'Médecin', to: '/patient/doctors', icon: Stethoscope },
  { label: 'Médicament', to: '/patient/medicines', icon: Pill },
  { label: 'Laboratoire', to: '/patient/laboratories', icon: FlaskConical },
  { label: 'Imagerie', to: '/patient/imaging', icon: Scan },
]

const v1Services = [
  { key: 'findDoctor', to: '/patient/doctors', icon: Stethoscope },
  { key: 'findSpecialist', to: '/patient/doctors?type=specialist', icon: Sparkles },
  { key: 'findMedicine', to: '/patient/medicines', icon: Pill },
  { key: 'labAnalysis', to: '/patient/laboratories', icon: Beaker },
  { key: 'medicalImaging', to: '/patient/imaging', icon: ScanFace },
  { key: 'consultation', to: '/patient/appointments/new', icon: Syringe },
]

interface V2Service {
  label: string
  to: string
  icon: LucideIcon
  tone: 'brand' | 'blue' | 'red' | 'amber' | 'orange'
}

const v2Services: V2Service[] = [
  { label: 'Médecins', to: '/patient/doctors', icon: Stethoscope, tone: 'brand' },
  { label: 'Hôpitaux', to: '/patient/hospitals', icon: Building2, tone: 'blue' },
  { label: 'Cliniques', to: '/patient/hospitals?type=clinic', icon: HeartPulse, tone: 'blue' },
  { label: 'Pharmacies', to: '/patient/pharmacies', icon: Pill, tone: 'brand' },
  { label: 'Laboratoires', to: '/patient/laboratories', icon: FlaskConical, tone: 'brand' },
  { label: 'Imagerie', to: '/patient/imaging', icon: Scan, tone: 'blue' },
  { label: 'Infirmières', to: '/patient/nurses', icon: Syringe, tone: 'blue' },
  { label: 'Ambulances', to: '/patient/ambulance', icon: AmbulanceIcon, tone: 'red' },
  { label: 'Livraison', to: '/patient/delivery', icon: Truck, tone: 'orange' },
]

export function HomePage() {
  const { t, theme } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const summary = useMemo(
    () => ({
      doctors: doctors.length,
      medicines: medicines.length,
      labs: laboratories.length,
      imaging: imagingCenters.length,
      nurses: nurses.length,
      facilities: hospitals.length,
    }),
    [],
  )

  const submit = () => {
    navigate(query.trim() ? `/patient/search?q=${encodeURIComponent(query.trim())}` : '/patient/search')
  }

  return (
    <div className="page-container space-y-8 py-5 sm:py-7">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-brand-softer p-5 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-100/70" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-44 w-44 rounded-full bg-brand-100/50" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            <Sparkles className="h-3.5 w-3.5" /> Mada Santé · 2026
          </span>
          <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
            {t('home.heroTitle')}
          </h1>
          <p className="mt-2 text-sm text-ink-soft sm:text-base">{t('home.heroSub')}</p>

          <div className="mt-5 max-w-xl">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder={t('home.searchPlaceholder')}
              onSubmit={submit}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {quick.map((q) => (
              <Button key={q.label} to={q.to} variant="outline" size="sm" className="bg-card">
                <q.icon className="h-4 w-4 text-brand-600" /> {q.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* V1 services */}
      <section>
        <SectionHeader title={t('home.whatLookingFor')} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {v1Services.map((s) => (
            <ServiceCard key={s.key} to={s.to} icon={s.icon} title={t(`home.services.${s.key}`)} description={t(`home.services.${s.key}Desc`)} />
          ))}
        </div>
      </section>

      {/* Orientation info */}
      <OrientationBanner
        title={t('home.infoTitle')}
        description={t('home.infoDesc')}
        actionLabel={t('hosp.orient')}
        actionTo="/patient/orientation"
      />

      {/* V2 services grid */}
      {theme === 'v2' && (
        <section>
          <SectionHeader title={t('home.v2Title')} subtitle={t('home.v2Sub')} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {v2Services.map((s) => (
              <ServiceCard key={s.label} to={s.to} icon={s.icon} title={s.label} tone={s.tone} compact />
            ))}
          </div>
        </section>
      )}

      {/* Emergency */}
      <section className="flex flex-col gap-3 rounded-3xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-600 text-white">
            <Siren className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-base font-bold text-red-700">{t('home.emergency')}</h3>
            <p className="mt-0.5 text-sm text-red-700/80">{t('home.emergencySub')}</p>
          </div>
        </div>
        <Button to="/patient/ambulance" variant="emergency" size="lg" className="w-full sm:w-auto">
          <AmbulanceIcon className="h-5 w-5" /> {t('home.emergencyBtn')}
        </Button>
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { icon: Stethoscope, label: t('nav.doctors'), value: summary.doctors },
          { icon: Building2, label: t('nav.hospitals'), value: summary.facilities },
          { icon: Pill, label: t('nav.pharmacies'), value: 8 },
          { icon: FlaskConical, label: t('nav.laboratories'), value: summary.labs },
          { icon: Scan, label: t('nav.imaging'), value: summary.imaging },
          { icon: HeartPulse, label: t('nav.nurses'), value: summary.nurses },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <s.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-extrabold leading-none text-ink">{s.value}+</p>
              <p className="mt-1 truncate text-xs font-medium text-ink-soft">{s.label}</p>
            </div>
          </div>
        ))}
      </section>

      <p className="pb-2 text-center text-xs text-ink-faint flex items-center justify-center gap-1.5">
        Mada Santé · manampy anao — {t('misc.offlineNote')}
      </p>
    </div>
  )
}