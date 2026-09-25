import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building as BuildingGlyph,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Home as HomeGlyph,
  MapPin,
  PackageCheck,
  Phone,
  Smartphone,
  Stethoscope,
  Store,
} from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { ProgressTracker } from '../../components/ui/ProgressTracker'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/Avatar'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import { useDoctor } from '../../lib/hooks'
import { nextDays } from '../../lib/constants'
import type { ConsultationType, PaymentMethod } from '../../types'
import { formatAr, monthDay } from '../../lib/format'
import { cn } from '../../lib/cn'

type Step = 0 | 1 | 2 | 3 | 4 | 5

const STEP_LABELS = ['apt.stepType', 'apt.stepDate', 'apt.stepTime', 'apt.stepConfirm', 'apt.stepPayment', 'apt.stepDone']

const consultMeta: Record<ConsultationType, { label: string; icon: typeof Stethoscope; desc: string }> = {
  cabinet: { label: 'doctors.cabinetConsult', icon: Store, desc: 'Au cabinet du professionnel' },
  home: { label: 'doctors.homeConsult', icon: HomeGlyph, desc: 'Le professionnel se déplace' },
  hospital: { label: 'doctors.hospitalConsult', icon: BuildingGlyph, desc: 'En établissement partenaire' },
}

export function NewAppointmentPage() {
  const params = useParams<{ doctorId?: string }>()
  const { data: doctor, isLoading } = useDoctor(params.doctorId)
  const { t, bookAppointment, pay, pushNotification, toast } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>(params.doctorId ? 1 : 0)
  const [type, setType] = useState<ConsultationType | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('orange_money')
  const [paying, setPaying] = useState(false)
  const [confirmed, setConfirmed] = useState<{ reference: string; price: number } | null>(null)

  const price = useMemo(() => {
    if (!type) return doctor?.price ?? 0
    return type === 'home' ? (doctor?.priceHome ?? doctor?.price ?? 0) : (doctor?.price ?? 0)
  }, [type, doctor])

  const platformFee = Math.round(price * 0.05)
  const total = price + platformFee

  const location = useMemo(() => {
    if (!doctor) return user?.location ?? 'Antananarivo'
    if (type === 'cabinet') return doctor.location
    if (type === 'home') return `${user?.location ?? 'Antananarivo'} — À domicile`
    return `${doctor.location.split(',')[0]}, ${doctor.city} — Hôpital partenaire`
  }, [doctor, type, user])

  const hasDoctorId = Boolean(params.doctorId)

  if (!hasDoctorId) {
    return (
      <div className="page-container py-5 sm:py-7">
        <PageHeader title={t('apt.title')} subtitle="Choisissez d’abord un professionnel" />
        <div className="card space-y-2 p-4">
          <HubRow icon={Stethoscope} label={t('nav.doctors')} sub="Trouver un médecin, un spécialiste" to="/patient/doctors" />
          <HubRow icon={Phone} label={t('nav.laboratories')} sub="Prélever un échantillon" to="/patient/laboratories" />
          <HubRow icon={CalendarDays} label={t('nav.imaging')} sub="Radiographie, écho, scanner, IRM" to="/patient/imaging" />
        </div>
      </div>
    )
  }

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

  const nextStep = () => setStep((s) => Math.min(5, s + 1) as Step)
  const prevStep = () => setStep((s) => Math.max(1, s - 1) as Step)

  const submit = async () => {
    if (!type || !date || !time) return
    setPaying(true)
    try {
      const start = Date.now()
      const appointment = await bookAppointment({
        providerId: doctor.id,
        providerType: 'doctor',
        providerName: doctor.name,
        providerPhoto: doctor.photo,
        type: t(consultMeta[type].label),
        date,
        time,
        location,
        price: total,
      })
      await pay({
        service: `Consultation — ${doctor.name}`,
        providerName: doctor.name,
        providerId: doctor.id,
        amount: total,
        method,
        breakdown: [
          { label: t(consultMeta[type].label), amount: price },
          { label: t('pay.platformFee'), amount: platformFee },
        ],
      })
      const elapsed = Date.now() - start
      if (elapsed < 900) await new Promise((r) => setTimeout(r, 900 - elapsed))
      pushNotification({
        category: 'appointment',
        title: 'Votre rendez-vous est confirmé.',
        message: `Rendez-vous le ${monthDay(date)} à ${time} avec ${doctor.name}.`,
        link: '/patient/appointments',
      })
      toast('Rendez-vous confirmé', `Réf. ${appointment.reference} · ${formatAr(total)}`, 'success')
      setConfirmed({ reference: appointment.reference, price: total })
      setPaying(false)
      setStep(5)
    } catch {
      setPaying(false)
      toast('Paiement échoué', 'Veuillez réessayer.', 'error')
    }
  }

  const stepTitles = STEP_LABELS.map((k, i) => ({
    label: t(k),
    done: i < step,
    current: i === step,
    tone: i === 5 ? 'brand' : undefined,
  })) as { label: string; done: boolean; current: boolean; tone?: 'brand' }[]

  return (
    <div className="page-container max-w-2xl py-5 sm:py-7">
      <button
        onClick={() => (step > 1 ? prevStep() : navigate(-1))}
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-ink-soft transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <PageHeader title={t('apt.title')} subtitle={doctor.name} />

      <div className="mb-6">
        <ProgressTracker steps={stepTitles} />
      </div>

      <div className="card flex items-center gap-3 bg-brand-softer p-4">
        <Avatar name={doctor.name} src={doctor.photo} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{doctor.name}</p>
          <p className="text-xs text-ink-soft">{doctor.specialty} · {doctor.city}</p>
        </div>
        <Badge tone="green">{t('doctors.availableToday')}</Badge>
      </div>

      {step === 1 && (
        <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {doctor.consultationTypes.map((c) => {
            const Icon = consultMeta[c].icon
            const active = type === c
            return (
              <button
                key={c}
                onClick={() => { setType(c); setTime(null) }}
                className={cn(
                  'card touch-target flex flex-col items-start gap-2 p-4 text-left transition',
                  active ? 'border-brand-500 ring-2 ring-brand-200' : 'hover:border-brand-300',
                )}
              >
                <span className={cn('grid h-10 w-10 place-items-center rounded-xl', active ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700')}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-bold text-ink">{t(consultMeta[c].label)}</span>
                <span className="text-xs text-ink-soft">{consultMeta[c].desc}</span>
                <span className="text-sm font-extrabold text-brand-700">{formatAr(c === 'home' ? (doctor.priceHome ?? doctor.price) : doctor.price)}</span>
              </button>
            )
          })}
          <div className="sm:col-span-3">
            <Button size="lg" fullWidth disabled={!type} onClick={nextStep}>
              {t('common.next')}
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mt-4">
          <h2 className="section-title mb-2">{t('apt.chooseDate')}</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {nextDays.map((d) => {
              const num = new Date(`${d}T00:00:00`).getDate()
              const isToday = new Date().getDate() === num
              const active = date === d
              return (
                <button
                  key={d}
                  onClick={() => setDate(d)}
                  className={cn(
                    'flex w-16 shrink-0 flex-col items-center gap-1 rounded-2xl border p-3 transition',
                    active ? 'border-brand-500 bg-brand-600 text-white' : 'border-line bg-card text-ink hover:border-brand-300',
                  )}
                >
                  <span className={cn('text-[11px] font-semibold', active ? 'text-white/80' : 'text-ink-faint')}>
                    {isToday ? t('misc.today') : new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </span>
                  <span className="text-lg font-extrabold">{num}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-4">
            <Button size="lg" fullWidth disabled={!date} onClick={nextStep}>
              {t('common.next')}
            </Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-4">
          <h2 className="section-title mb-2">{t('apt.chooseTime')}</h2>
          <p className="mb-3 text-sm text-ink-soft">{date ? monthDay(date) : ''}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {doctor.availabilitySlots.map((slot) => {
              const active = time === slot
              return (
                <button
                  key={slot}
                  onClick={() => setTime(slot)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-bold transition',
                    active ? 'border-brand-500 bg-brand-600 text-white' : 'border-line bg-card text-ink hover:border-brand-300',
                  )}
                >
                  <Clock className="h-4 w-4" /> {slot}
                </button>
              )
            })}
          </div>
          <div className="mt-4">
            <Button size="lg" fullWidth disabled={!time} onClick={nextStep}>
              {t('common.next')}
            </Button>
          </div>
        </section>
      )}

      {step === 4 && type && date && time && (
        <section className="mt-4 space-y-4">
          <h2 className="section-title">{t('apt.confirmTitle')}</h2>
          <div className="card divide-y divide-line">
            <SummaryRow label={t('apt.stepType')} value={t(consultMeta[type].label)} />
            <SummaryRow label={t('common.date')} value={monthDay(date)} />
            <SummaryRow label={t('common.time')} value={time} />
            <SummaryRow label={t('apt.location')} value={location} icon={<MapPin className="h-4 w-4 text-brand-600" />} />
            <SummaryRow label={t('apt.patient')} value={`${user?.firstName} ${user?.lastName}`} />
            <div className="flex items-center justify-between p-4">
              <span className="text-sm font-medium text-ink-soft">{t('common.price')}</span>
              <span className="text-base font-extrabold text-ink">{formatAr(price)}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-sm font-medium text-ink-soft">{t('pay.platformFee')}</span>
              <span className="text-base font-extrabold text-ink">{formatAr(platformFee)}</span>
            </div>
            <div className="flex items-center justify-between bg-brand-softer p-4">
              <span className="text-sm font-bold text-ink">{t('common.total')}</span>
              <span className="text-lg font-extrabold text-brand-700">{formatAr(total)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={prevStep} className="flex-1">
              {t('common.back')}
            </Button>
            <Button size="lg" onClick={nextStep} className="flex-1">
              {t('common.continue')}
            </Button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="mt-4 space-y-4">
          <h2 className="section-title">{t('apt.paymentTitle')}</h2>
          <p className="text-sm text-ink-soft">{t('apt.paymentSub')}</p>

          <div className="space-y-2.5">
            <PaymentOption
              active={method === 'orange_money'}
              name={t('pay.method.orange')}
              desc={t('pay.method.orangeDesc')}
              icon={<span className="grid h-10 w-10 place-items-center rounded-xl bg-om text-white text-lg font-extrabold">OM</span>}
              onClick={() => setMethod('orange_money')}
            />
            <PaymentOption
              active={method === 'mvola'}
              name={t('pay.method.mvola')}
              desc={t('pay.method.mvolaDesc')}
              icon={<span className="grid h-10 w-10 place-items-center rounded-xl bg-mvola text-white text-lg font-extrabold">MV</span>}
              onClick={() => setMethod('mvola')}
            />
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">{t('apt.service')} — {doctor.name}</span>
              <span className="font-semibold text-ink">{formatAr(price)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-sm">
              <span className="text-ink-soft">{t('pay.platformFee')}</span>
              <span className="font-semibold text-ink">{formatAr(platformFee)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-sm">
              <span className="text-ink-soft">{t('common.date')} · {t('common.time')}</span>
              <span className="font-semibold text-ink">{monthDay(date ?? '')} · {time ?? ''}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="font-bold text-ink">{t('common.total')}</span>
              <span className="text-xl font-extrabold text-brand-700">{formatAr(total)}</span>
            </div>
          </div>

          <div className="mt-3 flex gap-3">
            <Button variant="outline" size="lg" onClick={prevStep} className="flex-1">
              {t('common.back')}
            </Button>
            <Button variant="pay" size="lg" onClick={submit} loading={paying} className="flex-1">
              <Smartphone className="h-5 w-5" /> {t('apt.pay')}
            </Button>
          </div>
        </section>
      )}

      {step === 5 && confirmed && (
        <ConfirmationView
          reference={confirmed.reference}
          doctorName={doctor.name}
          details={[
            { label: t('common.date'), value: monthDay(date ?? '') },
            { label: t('common.time'), value: time ?? '' },
            { label: t('apt.location'), value: location },
            { label: t('apt.stepType'), value: type ? t(consultMeta[type].label) : '' },
            { label: t('common.total'), value: formatAr(confirmed.price) },
          ]}
          onMyAppointments={() => navigate('/patient/appointments')}
          onHome={() => navigate('/patient')}
        />
      )}
    </div>
  )
}

function SummaryRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <span className="flex items-center gap-1.5 text-right text-sm font-semibold text-ink">
        {icon}
        {value}
      </span>
    </div>
  )
}

function HubRow({ icon: Icon, label, sub, to }: { icon: typeof Stethoscope; label: string; sub: string; to: string }) {
  return (
    <Button variant="outline" fullWidth size="lg" to={to} className="justify-start">
      <Icon className="h-5 w-5 text-brand-600" />
      <span className="text-left">
        <span className="block font-semibold">{label}</span>
        <span className="block text-xs font-normal text-ink-soft">{sub}</span>
      </span>
    </Button>
  )
}

function PaymentOption({
  active,
  name,
  desc,
  icon,
  onClick,
}: {
  active?: boolean
  name: string
  desc: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'card touch-target flex w-full items-center gap-3 p-4 text-left transition',
        active ? 'border-brand-500 ring-2 ring-brand-200' : 'hover:border-brand-300',
      )}
      aria-pressed={active}
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink">{name}</span>
        <span className="block text-xs text-ink-soft">{desc}</span>
      </span>
      <span
        className={cn(
          'grid h-6 w-6 place-items-center rounded-full border-2 transition',
          active ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300',
        )}
      >
        {active && <Check className="h-3.5 w-3.5" />}
      </span>
    </button>
  )
}

function ConfirmationView({
  reference,
  doctorName,
  details,
  onMyAppointments,
  onHome,
}: {
  reference: string
  doctorName: string
  details: { label: string; value: string }[]
  onMyAppointments: () => void
  onHome: () => void
}) {
  const { t } = useApp()
  return (
    <section className="mt-4 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-100">
        <CheckCircle2 className="h-10 w-10 text-brand-600" />
      </div>
      <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">{t('apt.confirmed')}</h2>
      <p className="mt-1 text-sm text-ink-soft">{t('apt.confirmedSub')}</p>

      <div className="card mt-5 p-5">
        <div className="flex items-center justify-center gap-2">
          <PackageCheck className="h-4 w-4 text-brand-600" />
          <p className="text-sm font-semibold text-ink">{doctorName}</p>
        </div>
        <div className="mt-4 space-y-2.5 text-left">
          {details.map((d) => (
            <div key={d.label} className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">{d.label}</span>
              <span className="font-semibold text-ink">{d.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-brand-softer px-3 py-2.5">
          <p className="text-xs font-medium text-ink-faint">{t('apt.reference')}</p>
          <p className="text-base font-extrabold tracking-wide text-brand-700">{reference}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button size="lg" variant="outline" onClick={onHome} className="flex-1">
          {t('common.backHome')}
        </Button>
        <Button size="lg" onClick={onMyAppointments} className="flex-1">
          {t('nav.appointments')}
        </Button>
      </div>
    </section>
  )
}