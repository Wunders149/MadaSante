import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarPlus, CheckCircle2, Languages, MapPin, Star } from 'lucide-react'
import { useApp } from '../../stores/AppStore'
import { usePractitioner } from '../../lib/hooks'
import { PageHeader } from '../../components/ui/Headers'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/Avatar'
import { Modal } from '../../components/ui/Modal'
import { EmptyState, LoadingState } from '../../components/ui/States'
import { roleLabelKey } from '../../lib/roles'
import { formatAr } from '../../lib/format'
import type { ConsultationType } from '../../types'

const CONSULT_LABEL: Record<ConsultationType, string> = {
  cabinet: 'doctors.cabinetConsult',
  home: 'doctors.homeConsult',
  hospital: 'doctors.hospitalConsult',
}

/**
 * Detail page for an allied-health professional. The booking CTA points at the
 * shared appointment wizard with the profession as the provider type, so a
 * physiotherapist or psychologist is bookable through the same flow as a
 * doctor.
 */
export function PractitionerProfilePage() {
  const { id } = useParams()
  const { t } = useApp()
  const { data: practitioner, isLoading } = usePractitioner(id)
  const [contactOpen, setContactOpen] = useState(false)

  if (isLoading) return <LoadingState label={t('common.loading')} />

  if (!practitioner) {
    return (
      <div className="page-container max-w-3xl py-5 sm:py-7">
        <PageHeader title={t('prac.notFound')} subtitle="" />
        <EmptyState
          title={t('prac.notFound')}
          description={t('prac.notFoundDesc')}
          action={<Button to="/patient/professionals">{t('nav.professionals')}</Button>}
        />
      </div>
    )
  }

  const bookPath = `/patient/appointments/new/${practitioner.profession}/${practitioner.id}`
  const prices: { key: ConsultationType; amount: number }[] =
    practitioner.consultationTypes.map((c) => ({
      key: c,
      amount: c === 'home' ? (practitioner.priceHome ?? practitioner.price) : practitioner.price,
    }))

  return (
    <div className="page-container max-w-5xl py-5 sm:py-7">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="card p-5">
            <div className="flex items-start gap-4">
              <Avatar name={practitioner.name} src={practitioner.photo} size="xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-extrabold tracking-tight text-ink">{practitioner.name}</h1>
                  {practitioner.rating > 0 && (
                    <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      {practitioner.rating.toFixed(1)}
                      {practitioner.reviews > 0 && (
                        <span className="font-medium text-ink-faint">({practitioner.reviews})</span>
                      )}
                    </span>
                  )}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" />
                  {t(roleLabelKey(practitioner.profession))} · {practitioner.specialty}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                  <MapPin className="h-4 w-4 shrink-0" /> {practitioner.location}
                </p>
                {practitioner.languages.length > 0 && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                    <Languages className="h-4 w-4 shrink-0" /> {practitioner.languages.join(' · ')}
                  </p>
                )}
                <p className="mt-3 text-xs font-medium text-ink-faint">{practitioner.qualification}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <Badge tone="brand">{t(roleLabelKey(practitioner.profession))}</Badge>
              {practitioner.services.map((service) => (
                <Badge key={service} tone="slate">
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          {practitioner.description && (
            <div className="card mt-4 p-5">
              <h2 className="section-title">{t('prac.about')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{practitioner.description}</p>
            </div>
          )}

          <div className="card mt-4 p-5">
            <h2 className="section-title">{t('doctors.slots')}</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {practitioner.availabilitySlots.length === 0 ? (
                <p className="text-sm text-ink-soft">{t('doctors.noSlot')}</p>
              ) : (
                practitioner.availabilitySlots.map((slot) => (
                  <span
                    key={slot}
                    className="rounded-lg bg-brand-soft px-2.5 py-1.5 font-mono text-xs font-semibold text-brand-800"
                  >
                    {slot}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-line bg-card p-5 lg:sticky lg:top-24">
          <h2 className="text-base font-bold text-ink">{t('doctors.consultOptions')}</h2>
          {prices.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">{t('prac.noConsultTypes')}</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {prices.map(({ key, amount }) => (
                <li key={key} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-ink-soft">{t(CONSULT_LABEL[key])}</span>
                  <span className="font-bold text-ink">
                    {amount > 0 ? formatAr(amount) : t('prac.priceOnRequest')}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-xs text-ink-faint">{t('prac.bookingNote')}</p>

          <Button className="mt-4 w-full" size="lg" to={bookPath} disabled={practitioner.price <= 0}>
            <CalendarPlus className="h-4 w-4" /> {t('doctors.book')}
          </Button>
          {practitioner.price <= 0 && (
            <p className="mt-2 text-xs font-medium text-amber-700">{t('prac.noPriceYet')}</p>
          )}
          <Button className="mt-2 w-full" variant="outline" onClick={() => setContactOpen(true)}>
            {t('common.contact')}
          </Button>

          <Link
            to="/patient/professionals"
            className="mt-4 block text-center text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            {t('nav.professionals')}
          </Link>
        </aside>
      </div>

      <Modal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title={t('prac.contactTitle', { name: practitioner.name })}
        size="sm"
        closeLabel={t('common.close')}
        footer={
          <Button variant="outline" onClick={() => setContactOpen(false)} className="w-full">
            {t('common.close')}
          </Button>
        }
      >
        <p className="text-sm text-ink-soft">{t('prac.contactDesc')}</p>
        <p className="mt-3 text-sm font-semibold text-ink">{practitioner.location}</p>
        {practitioner.languages.length > 0 && (
          <p className="mt-1 text-sm text-ink-soft">{practitioner.languages.join(' · ')}</p>
        )}
      </Modal>
    </div>
  )
}
