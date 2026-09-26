import { useState } from 'react'
import { Clock, MapPin, Phone, Scan, Star } from 'lucide-react'
import type { ImagingCenter } from '../types'
import { useApp } from '../stores/AppStore'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { formatAr } from '../lib/format'

const examIcon: Record<string, string> = {
  Radiographie: 'text-blue-600 bg-blue-50',
  Échographie: 'text-amber-600 bg-amber-50',
  Scanner: 'text-violet-600 bg-violet-50',
  IRM: 'text-brand-700 bg-brand-50',
}

export function ImagingCard({ center }: { center: ImagingCenter }) {
  const { t } = useApp()
  const [showExams, setShowExams] = useState(false)

  return (
    <article className="card flex flex-col gap-3 p-4 transition-shadow hover:shadow-soft sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Scan className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-ink">{center.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            {center.location}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
            <Clock className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            {center.openingHours}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-700">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {center.rating.toFixed(1)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {center.exams.map((exam) => (
          <Badge key={exam.type} tone="neutral">{exam.type}</Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        <Button variant="ghost" size="sm" onClick={() => setShowExams(true)}>
          {t('common.view')}
        </Button>
        <Button variant="outline" size="sm" to={`tel:${center.phone.replace(/\s/g, '')}`}>
          <Phone className="h-4 w-4" /> {t('common.contact')}
        </Button>
        {/* No "book" action: imaging has no appointment flow yet. */}
      </div>

      <Modal open={showExams} onClose={() => setShowExams(false)} title={`${center.name} — ${t('img.exams')}`}>
        <div className="space-y-2.5">
          {center.exams.map((exam) => (
            <div key={exam.type} className="card flex items-center justify-between p-3.5">
              <span className={`grid h-9 w-9 place-items-center rounded-lg ${examIcon[exam.type] ?? examIcon.Radiographie}`}>
                <Scan className="h-4 w-4" />
              </span>
              <span className="flex-1 px-3 text-sm font-medium text-ink">{exam.type}</span>
              <span className="text-sm font-bold text-ink">{formatAr(exam.price)}</span>
            </div>
          ))}
          <p className="pt-2 text-xs text-ink-faint">{center.openingHours} — {center.phone}</p>
        </div>
      </Modal>
    </article>
  )
}