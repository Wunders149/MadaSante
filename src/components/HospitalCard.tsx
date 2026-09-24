import { useState } from 'react'
import { Building2, Clock, MapPin, Phone, Siren, Star } from 'lucide-react'
import type { Hospital } from '../types'
import { useApp } from '../stores/AppStore'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { cn } from '../lib/cn'

export function HospitalCard({ hospital }: { hospital: Hospital }) {
  const { t } = useApp()
  const [showDetails, setShowDetails] = useState(false)
  const [showContact, setShowContact] = useState(false)

  return (
    <article className="card flex flex-col gap-4 p-4 transition-shadow hover:shadow-soft sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Building2 className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold leading-snug text-ink sm:text-base">{hospital.name}</h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge tone={hospital.type === 'hospital' ? 'blue' : 'green'}>
              {t(hospital.type === 'hospital' ? 'hosp.typeHospital' : 'hosp.typeClinic')}
            </Badge>
            <Badge tone={hospital.sector === 'public' ? 'neutral' : 'amber'}>
              {t(hospital.sector === 'public' ? 'hosp.sector.public' : 'hosp.sector.private')}
            </Badge>
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            {hospital.location}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-700">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {hospital.rating.toFixed(1)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {hospital.services.slice(0, 4).map((s) => (
          <Badge key={s} tone="neutral">{s}</Badge>
        ))}
        {hospital.services.length > 4 && <Badge tone="neutral">+{hospital.services.length - 4}</Badge>}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-sm">
        <span className="flex items-center gap-1.5 text-ink-soft">
          <Clock className="h-4 w-4 text-ink-faint" /> {hospital.openingHours}
        </span>
        <span
          className={cn(
            'flex items-center gap-1.5 font-semibold',
            hospital.emergencyAvailable ? 'text-red-600' : 'text-ink-faint',
          )}
        >
          {hospital.emergencyAvailable ? (
            <>
              <Siren className="h-4 w-4" /> {t('hosp.emergencyYes')}
            </>
          ) : (
            t('hosp.emergencyNo')
          )}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        <Button variant="ghost" size="sm" onClick={() => setShowDetails(true)}>
          {t('common.view')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowContact(true)}>
          <Phone className="h-4 w-4" /> {t('common.contact')}
        </Button>
        <Button size="sm" to="/patient/orientation">
          {t('hosp.orient')}
        </Button>
      </div>

      <Modal open={showDetails} onClose={() => setShowDetails(false)} title={hospital.name}>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={hospital.type === 'hospital' ? 'blue' : 'green'}>
              {t(hospital.type === 'hospital' ? 'hosp.typeHospital' : 'hosp.typeClinic')}
            </Badge>
            <Badge tone={hospital.sector === 'public' ? 'neutral' : 'amber'}>
              {t(hospital.sector === 'public' ? 'hosp.sector.public' : 'hosp.sector.private')}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed text-ink-soft">{hospital.description}</p>
          <div className="grid grid-cols-1 gap-3 rounded-xl bg-brand-softer p-3.5 text-sm sm:grid-cols-2">
            <span className="flex items-center gap-2 text-ink"><MapPin className="h-4 w-4 text-brand-600" />{hospital.location}</span>
            <span className="flex items-center gap-2 text-ink"><Clock className="h-4 w-4 text-brand-600" />{hospital.openingHours}</span>
            <span className="flex items-center gap-2 text-ink"><Phone className="h-4 w-4 text-brand-600" />{hospital.phone}</span>
            <span className={cn('flex items-center gap-2', hospital.emergencyAvailable ? 'text-red-600' : 'text-ink')}>
              <Siren className="h-4 w-4" />
              {t(hospital.emergencyAvailable ? 'hosp.emergencyYes' : 'hosp.emergencyNo')}
            </span>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">{t('hosp.services')}</p>
            <div className="flex flex-wrap gap-1.5">
              {hospital.services.map((s) => (
                <Badge key={s} tone="neutral">{s}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={showContact} onClose={() => setShowContact(false)} title={hospital.name} size="sm">
        <div className="space-y-3">
          <a
            href={`tel:${hospital.phone.replace(/\s/g, '')}`}
            className="card flex w-full items-center justify-between p-4 transition hover:border-brand-300"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Phone className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">Téléphone</span>
                <span className="text-sm text-ink-soft">{hospital.phone}</span>
              </span>
            </span>
          </a>
          <Button fullWidth to="/patient/orientation">{t('hosp.orient')}</Button>
        </div>
      </Modal>
    </article>
  )
}