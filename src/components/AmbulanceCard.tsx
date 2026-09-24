import { Ambulance as AmbulanceIcon, Clock, MapPin, Phone, Siren } from 'lucide-react'
import type { Ambulance } from '../types'
import { useApp } from '../stores/AppStore'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'

export function AmbulanceCard({ ambulance }: { ambulance: Ambulance }) {
  const { t } = useApp()
  return (
    <article className="card flex flex-col gap-3 p-4 transition-shadow hover:shadow-soft sm:p-5">
      <div className="flex items-start gap-3">
        <span
          className={
            ambulance.available
              ? 'grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700'
              : 'grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-400'
          }
        >
          <AmbulanceIcon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-ink">{ambulance.provider}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            {ambulance.location}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
            <Clock className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            {t('common.min')} — réponse {ambulance.responseTime}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {ambulance.vehicles.map((v) => (
          <Badge key={v} tone="neutral">{v}</Badge>
        ))}
        <Badge tone={ambulance.available ? 'green' : 'neutral'}>
          {t(ambulance.available ? 'common.available' : 'common.unavailable')}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        <Button variant="outline" size="sm" to={`tel:${ambulance.phone.replace(/\s/g, '')}`}>
          <Phone className="h-4 w-4" /> {t('common.contact')}
        </Button>
        <Button variant="emergency" size="sm" to="/patient/ambulance">
          <Siren className="h-4 w-4" /> {t('erg.ambulanceBtn')}
        </Button>
      </div>
    </article>
  )
}