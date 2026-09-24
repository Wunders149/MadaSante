import { Clock, MapPin, Star, Stethoscope } from 'lucide-react'
import type { Doctor } from '../types'
import { useApp } from '../stores/AppStore'
import { Avatar } from './Avatar'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { formatAr } from '../lib/format'

const typeLabel: Record<Doctor['type'], string> = {
  generalist: 'Médecin généraliste',
  specialist: 'Spécialiste',
}

const consultLabel: Record<Doctor['consultationTypes'][number], { t: string; cls: string }> = {
  cabinet: { t: 'Cabinet', cls: 'text-base' },
  home: { t: 'À domicile', cls: 'text-base' },
  hospital: { t: 'Hôpital / Clinique', cls: 'text-base' },
}

export function DoctorCard({ doctor, compact }: { doctor: Doctor; compact?: boolean }) {
  const { t } = useApp()
  return (
    <article className="card flex flex-col gap-4 p-4 transition-shadow hover:shadow-soft sm:p-5">
      <div className="flex items-start gap-3.5">
        <Avatar name={doctor.name} src={doctor.photo} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-[15px] font-bold leading-snug text-ink sm:text-base">{doctor.name}</h3>
            <Badge tone={doctor.type === 'generalist' ? 'green' : 'blue'}>
              {typeLabel[doctor.type]}
            </Badge>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
            <Stethoscope className="h-3.5 w-3.5 shrink-0 text-brand-600" />
            {doctor.specialty}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            {doctor.location}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-700">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {doctor.rating.toFixed(1)}
        </span>
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-1.5">
          {doctor.consultationTypes.map((c) => (
            <Badge key={c} tone="neutral" className="capitalize text-brand-700">
              {t(consultLabel[c].t)}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-faint">
            {t('doctors.nextSlot')}:{' '}
            <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
              <Clock className="h-3 w-3" /> {doctor.availabilitySlots[0]}
            </span>
          </p>
          <p className="mt-0.5">
            <span className="text-lg font-extrabold text-ink">{formatAr(doctor.price)}</span>
            <span className="text-xs text-ink-faint"> / consultation</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button to={`/patient/doctors/${doctor.id}`} variant="ghost" size="sm">
            {t('common.viewProfile')}
          </Button>
          <Button to={`/patient/appointments/new/${doctor.id}`} size="sm">
            {t('doctors.book')}
          </Button>
        </div>
      </div>
    </article>
  )
}