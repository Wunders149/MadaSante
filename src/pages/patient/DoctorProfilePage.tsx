import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Building as BuildingGlyph,
  CalendarDays,
  Clock,
  Globe,
  House as HomeGlyph,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  Stethoscope,
} from 'lucide-react'
import { useApp } from '../../stores/AppStore'
import { apiRoutes } from '../../lib/api'
import { useDoctor } from '../../lib/hooks'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { formatAr } from '../../lib/format'

export function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, toast } = useApp()
  const [showContact, setShowContact] = useState(false)
  const { data: doctor, isLoading } = useDoctor(id)

  if (isLoading) {
    return (
      <div className="page-container py-10 text-center">
        <p className="text-sm text-ink-soft">Chargement…</p>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="page-container py-10 text-center">
        <p className="text-sm text-ink-soft">Médecin introuvable.</p>
        <Button to="/patient/doctors" variant="outline" className="mt-3">
          Retour aux médecins
        </Button>
      </div>
    )
  }

  const ids = {
    cabinet: t('doctors.cabinetConsult'),
    home: t('doctors.homeConsult'),
    hospital: t('doctors.hospitalConsult'),
  }

  const consultIcon = (c: keyof typeof ids) =>
    c === 'home' ? <HomeGlyph className="h-4 w-4 text-brand-600" /> : c === 'hospital' ? <BuildingGlyph className="h-4 w-4 text-brand-600" /> : <Stethoscope className="h-4 w-4 text-brand-600" />

  const availabilitySummary = doctor.availabilitySlots.length > 0 ? doctor.availabilitySlots.slice(0, 4).join(' · ') : 'Disponibilité à confirmer'

  return (
    <div className="page-container py-5 sm:py-7">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-ink-soft transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div
            className="card overflow-hidden border border-brand-100 p-5 sm:p-6"
            style={{ backgroundImage: 'linear-gradient(90deg, rgba(236,253,245,0.9) 0%, rgba(255,255,255,0.96) 50%, rgba(240,253,244,0.9) 100%)' }}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Avatar name={doctor.name} src={doctor.photo} size="xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                    {doctor.name}
                    <BadgeCheck className="h-5 w-5 text-brand-600" aria-label="Vérifié" />
                  </h1>
                </div>

                <p className="mt-1 flex items-center gap-1.5 text-base font-semibold text-brand-700">
                  <Stethoscope className="h-4 w-4" />
                  {doctor.specialty}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone={doctor.type === 'generalist' ? 'green' : 'blue'}>
                    {doctor.type === 'generalist' ? t('doctors.generalistFilter') : t('doctors.specialistFilter')}
                  </Badge>
                  {doctor.consultationTypes.map((type) => (
                    <Badge key={type} tone="slate">
                      {ids[type]}
                    </Badge>
                  ))}
                </div>

                <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-soft">
                  <MapPin className="h-4 w-4 text-ink-faint" /> {doctor.location}
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/70 bg-white/70 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Avis</p>
                    <div className="mt-1 flex items-center gap-1 font-bold text-amber-600">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {doctor.rating.toFixed(1)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/70 bg-white/70 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Créneaux</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{doctor.availabilitySlots.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/70 bg-white/70 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Langues</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{doctor.languages.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="card p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="section-title">{t('doctors.about')}</h2>
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {doctor.reviews} {t('doctors.reviews')}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{doctor.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1.5 font-medium text-brand-700">
                <Globe className="h-3.5 w-3.5" />
                {doctor.languages.join(' · ')}
              </span>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="section-title mb-2">{t('doctors.slots')}</h2>
            <p className="mb-3 text-sm text-ink-soft">{doctor.availability.join(' · ')} — prochain créneau {availabilitySummary}</p>
            <div className="flex flex-wrap gap-2">
              {doctor.availabilitySlots.map((slot) => (
                <Button key={slot} variant="outline" size="sm" to={`/patient/appointments/new/${doctor.id}`}>
                  <Clock className="h-4 w-4" /> {slot}
                </Button>
              ))}
            </div>
          </section>
        </div>

        <div className="h-fit">
          <aside className="card sticky top-24 space-y-4 p-5">
            <div>
              <p className="text-sm font-medium text-ink-faint">{t('common.priceFrom')} — {t('doctors.consultation')}</p>
              <p className="text-3xl font-extrabold tracking-tight text-ink">{formatAr(doctor.price)}</p>
              <p className="text-xs text-ink-faint">
                {doctor.priceHome ? `À domicile : ${formatAr(doctor.priceHome)}` : 'Ouvert aux trois types de consultation'}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">{t('doctors.consultOptions')}</p>
              <div className="space-y-2">
                {doctor.consultationTypes.map((c) => (
                  <div key={c} className="flex items-center justify-between rounded-xl bg-brand-softer px-3.5 py-2.5 text-sm">
                    <span className="flex items-center gap-2 font-semibold text-ink">
                      {consultIcon(c)}
                      {ids[c]}
                    </span>
                    <span className="font-bold text-brand-700">
                      {formatAr(c === 'home' ? (doctor.priceHome ?? doctor.price) : doctor.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button size="lg" fullWidth to={`/patient/appointments/new/${doctor.id}`}>
                <CalendarDays className="h-5 w-5" /> {t('doctors.book')}
              </Button>
              <Button variant="outline" size="lg" fullWidth onClick={async () => {
                try {
                  await apiRoutes.openConversation(doctor.id)
                  navigate('/patient/messages')
                } catch (err) {
                  toast(t('common.error'), err instanceof Error ? err.message : undefined, 'error')
                }
              }}>
                <MessageCircle className="h-4 w-4" /> {t('msg.open')}
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setShowContact(true)}
              className="w-full rounded-xl border border-line bg-slate-50 px-3 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-brand-200 hover:text-brand-700"
            >
              Voir les moyens de contact
            </button>

            <p className="flex items-center justify-center gap-1 text-center text-xs text-ink-faint">
              <BadgeCheck className="h-3.5 w-3.5 text-brand-600" /> Profil vérifié par Mada Santé
            </p>
          </aside>
        </div>
      </div>

      <Modal open={showContact} onClose={() => setShowContact(false)} title={doctor.name} size="sm" centered>
        <div className="space-y-3">
          <a href="tel:+26133111000" className="card flex items-center gap-3 p-4 transition hover:border-brand-300">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <Phone className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">Téléphone</span>
              <span className="text-sm text-ink-soft">+261 33 11 000 00</span>
            </span>
          </a>
          <div className="card flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <MessageCircle className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">Messagerie</span>
              <span className="text-sm text-ink-soft">Réponse sous 2h · Via la plateforme</span>
            </span>
          </div>
        </div>
      </Modal>
    </div>
  )
}