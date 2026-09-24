import { useState } from 'react'
import { Beaker, Clock, FlaskConical, MapPin, Phone, Star } from 'lucide-react'
import type { Laboratory } from '../types'
import { useApp } from '../stores/AppStore'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'

export function LaboratoryCard({ laboratory }: { laboratory: Laboratory }) {
  const { t } = useApp()
  const [showTests, setShowTests] = useState(false)

  return (
    <article className="card flex flex-col gap-3 p-4 transition-shadow hover:shadow-soft sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Beaker className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-ink">{laboratory.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            {laboratory.location}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
            <Clock className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            {laboratory.openingHours}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-700">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {laboratory.rating.toFixed(1)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {laboratory.tests.slice(0, 4).map((test) => (
          <Badge key={test} tone="neutral">{test}</Badge>
        ))}
        {laboratory.tests.length > 4 && (
          <button onClick={() => setShowTests(true)} className="text-xs font-semibold text-brand-700">
            +{laboratory.tests.length - 4}…
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        <Button variant="ghost" size="sm" onClick={() => setShowTests(true)}>
          {t('common.view')}
        </Button>
        <Button variant="outline" size="sm" to={`tel:${laboratory.phone.replace(/\s/g, '')}`}>
          <Phone className="h-4 w-4" /> {t('common.contact')}
        </Button>
        <Button size="sm">Prendre rendez-vous</Button>
      </div>

      <Modal open={showTests} onClose={() => setShowTests(false)} title={`${laboratory.name} — ${t('lab.tests')}`}>
        <div className="space-y-2.5">
          {laboratory.tests.map((test) => (
            <div key={test} className="card flex items-center justify-between p-3.5">
              <span className="flex items-center gap-2.5 text-sm font-medium text-ink">
                <FlaskConical className="h-4 w-4 text-brand-600" />
                {test}
              </span>
              <Badge tone="green">{t('common.available')}</Badge>
            </div>
          ))}
          <p className="pt-2 text-xs text-ink-faint">{laboratory.openingHours} — {laboratory.phone}</p>
        </div>
      </Modal>
    </article>
  )
}