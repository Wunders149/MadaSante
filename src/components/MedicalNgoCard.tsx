import { Clock, Globe, HeartHandshake, Mail, MapPin, Phone, Star } from 'lucide-react'
import { Badge } from './ui/Badge'
import { useApp } from '../stores/AppStore'
import { cn } from '../lib/cn'
import type { MedicalNgo } from '../types'

/**
 * A medical or humanitarian organisation.
 *
 * Unlike every other card in the app this one is not bookable — there is no
 * consultation to schedule — so the actions are contact channels. `freeCare` is
 * called out prominently because it is the single most decision-relevant fact
 * about a charitable provider.
 */
export function MedicalNgoCard({ ngo }: { ngo: MedicalNgo }) {
  const { t } = useApp()

  return (
    <article className="card flex flex-col gap-3 p-4 transition-shadow hover:shadow-soft sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <HeartHandshake className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold text-ink">{ngo.name}</p>
          <p className="truncate text-xs font-medium text-brand-700">{ngo.focus}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> {ngo.city}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
          <Star className="h-3.5 w-3.5 fill-amber-400" />
          {Number(ngo.rating || 0).toFixed(1)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ngo.freeCare && <Badge tone="green">{t('ngo.freeCare')}</Badge>}
        {ngo.services.slice(0, 3).map((service) => (
          <Badge key={service} tone="slate">
            {service}
          </Badge>
        ))}
        {ngo.services.length > 3 && <Badge tone="slate">+{ngo.services.length - 3}</Badge>}
      </div>

      {ngo.coverage.length > 0 && (
        <p className="text-xs text-ink-soft">
          <span className="font-semibold text-ink">{t('ngo.coverage')}: </span>
          {ngo.coverage.slice(0, 3).join(' · ')}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3 text-xs text-ink-soft">
        <span className="flex items-center gap-1">
          <Phone className="h-3.5 w-3.5 shrink-0 text-brand-600" />
          <a href={`tel:${ngo.phone.replace(/\s+/g, '')}`} className="font-semibold hover:text-brand-700">
            {ngo.phone}
          </a>
        </span>
        {ngo.openingHours && (
          <span className="flex min-w-0 items-center gap-1">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{ngo.openingHours}</span>
          </span>
        )}
        {ngo.website && (
          <a
            href={ngo.website.startsWith('http') ? ngo.website : `https://${ngo.website}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-1 hover:text-brand-700"
          >
            <Globe className={cn('h-3.5 w-3.5 shrink-0')} />
            <span className="truncate">{t('ngo.website')}</span>
          </a>
        )}
        {ngo.email && (
          <a href={`mailto:${ngo.email}`} className="flex min-w-0 items-center gap-1 hover:text-brand-700">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{ngo.email}</span>
          </a>
        )}
      </div>
    </article>
  )
}
