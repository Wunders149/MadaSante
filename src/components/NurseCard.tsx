import { MapPin, Star } from 'lucide-react'
import type { Nurse } from '../types'
import { useApp } from '../stores/AppStore'
import { Avatar } from './Avatar'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { formatAr } from '../lib/format'

export function NurseCard({ nurse, onRequest }: { nurse: Nurse; onRequest?: () => void }) {
  const { t } = useApp()
  return (
    <article className="card flex flex-col gap-4 p-4 transition-shadow hover:shadow-soft sm:p-5">
      <div className="flex items-start gap-3.5">
        <Avatar name={nurse.name} src={nurse.photo} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-ink">{nurse.name}</h3>
          <p className="text-sm font-medium text-brand-700">{nurse.qualification}</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            {nurse.location}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-700">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {nurse.rating.toFixed(1)}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {nurse.services.slice(0, 3).map((s) => (
            <Badge key={s} tone="neutral">{s}</Badge>
          ))}
          {nurse.services.length > 3 && <Badge tone="neutral">+{nurse.services.length - 3}</Badge>}
        </div>
        <Badge tone="green">
          {t('nurse.availableNow')}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
        <p>
          <span className="text-lg font-extrabold text-ink">{formatAr(nurse.price)}</span>
          <span className="text-xs text-ink-faint"> / intervention</span>
        </p>
        <Button size="sm" onClick={onRequest}>{t('nurse.request')}</Button>
      </div>
    </article>
  )
}