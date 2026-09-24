import { FileText, MapPin, Truck, Zap } from 'lucide-react'
import type { Medicine } from '../types'
import { useApp } from '../stores/AppStore'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { formatAr } from '../lib/format'

export function AvailabilityBadge({ stock }: { stock: number }) {
  const { t } = useApp()
  if (stock <= 0) return <Badge tone="red">{t('med.outStock')}</Badge>
  if (stock < 10) return <Badge tone="amber">{t('med.lowStock')}</Badge>
  return <Badge tone="green">{t('med.inStock')}</Badge>
}

export function MedicineCard({ medicine }: { medicine: Medicine }) {
  const { t } = useApp()
  return (
    <article className="card flex flex-col gap-3 p-4 transition-shadow hover:shadow-soft sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Zap className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-bold text-ink">{medicine.name}</h3>
            <AvailabilityBadge stock={medicine.stock} />
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">
            {medicine.genericName} · {medicine.form} · {medicine.dose}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5 text-ink-faint" />
            {medicine.pharmacyName} — {medicine.location}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-base font-extrabold text-ink">{formatAr(medicine.price)}</p>
          {medicine.prescriptionRequired && (
            <Badge tone="slate" icon={<FileText className="h-3 w-3" />} className="mt-1">
              {t('med.prescription')}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        <Button variant="outline" size="sm" to="/patient/medicines">
          {t('med.contactPharmacy')}
        </Button>
        <Button
          size="sm"
          to={`/patient/delivery?medicine=${medicine.id}`}
          disabled={!medicine.available}
        >
          <Truck className="h-4 w-4" /> {t('med.orderBtn')}
        </Button>
      </div>
    </article>
  )
}