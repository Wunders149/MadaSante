import { Clock, MapPin, Phone, Pill, Star, Truck } from 'lucide-react'
import type { Pharmacy } from '../types'
import { useApp } from '../stores/AppStore'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'

export function PharmacyCard({ pharmacy }: { pharmacy: Pharmacy }) {
  const { t } = useApp()
  return (
    <article className="card flex flex-col gap-3 p-4 transition-shadow hover:shadow-soft sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Pill className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-ink">{pharmacy.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            {pharmacy.location}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-700">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {pharmacy.rating.toFixed(1)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-ink-faint" /> {pharmacy.openingHours}
        </span>
        {pharmacy.deliveryAvailable && (
          <Badge tone="green" icon={<Truck className="h-3.5 w-3.5" />}>{t('pharm.delivery')}</Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        <Button variant="outline" size="sm" to={`/patient/medicines?pharmacy=${pharmacy.id}`}>
          Médicaments
        </Button>
        <Button variant="ghost" size="sm" to={`tel:${pharmacy.phone.replace(/\s/g, '')}`}>
          <Phone className="h-4 w-4" /> {t('common.contact')}
        </Button>
      </div>
    </article>
  )
}