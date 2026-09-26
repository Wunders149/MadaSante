import { Link } from 'react-router-dom'
import { Languages, MapPin, Sparkles, Star } from 'lucide-react'
import { Badge } from './ui/Badge'
import { Avatar } from './Avatar'
import { useApp } from '../stores/AppStore'
import { roleLabelKey } from '../lib/roles'
import { formatAr } from '../lib/format'
import type { Practitioner } from '../types'

/**
 * One allied-health professional. The profession is shown as a badge because
 * the directory mixes all seven, so it is the first thing a patient scans for.
 * The whole card links through to the profile, which is where booking happens.
 */
export function PractitionerCard({ practitioner }: { practitioner: Practitioner }) {
  const { t } = useApp()
  const { name, specialty, city, price, rating, reviews, photo, services, profession, id } = practitioner

  return (
    <Link
      to={`/patient/professionals/${id}`}
      className="card flex flex-col gap-3 p-4 transition hover:border-brand-300 hover:shadow-soft sm:p-5"
    >
      <div className="flex items-start gap-3">
        <Avatar name={name} src={photo} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold text-ink">{name}</p>
          <p className="truncate text-xs font-medium text-brand-700">{specialty}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> {city}
          </p>
        </div>
        {rating > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
            <Star className="h-3.5 w-3.5 fill-amber-400" />
            {rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="brand">{t(roleLabelKey(profession))}</Badge>
        {reviews > 0 && <Badge tone="neutral">{reviews} {t('common.reviews')}</Badge>}
        {services.slice(0, 3).map((service) => (
          <Badge key={service} tone="slate">
            {service}
          </Badge>
        ))}
        {services.length > 3 && <Badge tone="slate">+{services.length - 3}</Badge>}
      </div>

      <div className="flex items-center justify-between border-t border-line pt-3">
        <span className="flex items-center gap-1 text-sm font-bold text-ink">
          <Sparkles className="h-4 w-4 text-brand-600" />
          {price > 0 ? formatAr(price) : t('prac.priceOnRequest')}
        </span>
        {practitioner.languages.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-ink-faint">
            <Languages className="h-3.5 w-3.5" />
            {practitioner.languages.slice(0, 2).join(' · ')}
          </span>
        )}
      </div>
    </Link>
  )
}
