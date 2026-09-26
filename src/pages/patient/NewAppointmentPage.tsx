import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Brain,
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
import { useDoctor, usePractitioner } from '../../lib/hooks'
import { roleLabelKey } from '../../lib/roles'
import { nextDays } from '../../lib/constants'
import { ApiError } from '../../lib/api'
import type { BookableProvider, ConsultationType, PaymentMethod } from '../../types'
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
  const params = useParams<{ doctorId?: string; providerType?: string; providerId?: string }>()
  // Two route shapes reach this page: the original /new/:doctorId and the
  // generic /new/:providerType/:providerId used by the allied-health
  // directory. Both normalise to the same bookable shape.
  const providerType = params.providerType ?? (params.doctorId ? 'doctor' : undefined)
  const providerId = params.providerId ?? params.doctorId
  const isPractitioner = providerType !== undefined && providerType !== 'doctor'

  const doctorQuery = useDoctor(isPractitioner ? undefined : providerId)
  const practitionerQuery = usePractitioner(isPractitioner ? providerId : undefined)
  const { t, bookAppointment, pay, pushNotification, toast } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Normalise both roles into one shape. Fields are listed explicitly rather
  // than spread because `Doctor.type` ('generalist' | 'specialist') collides
  // with the provider-role `type` this shape carries.
  const doctor: BookableProvider | null = doctorQuery.data
    ? {
        type: 'doctor',
        id: doctorQuery.data.id,
        name: doctorQuery.data.name,
        photo: doctorQuery.data.photo,
        specialty: doctorQuery.data.specialty,
        location: doctorQuery.data.location,
        city: doctorQuery.data.city,
        price: doctorQuery.data.price,
        priceHome: doctorQuery.data.priceHome,
        consultationTypes: doctorQuery.data.consultationTypes,
        availabilitySlots: doctorQuery.data.availabilitySlots,
        description: doctorQuery.data.description,
      }
    : null
  const practitioner: BookableProvider | null = practitionerQuery.data
    ? {
        type: practitionerQuery.data.profession,
        id: practitionerQuery.data.id,
        name: practitionerQuery.data.name,
        photo: practitionerQuery.data.photo,
        specialty: practitionerQuery.data.specialty,
        location: practitionerQuery.data.location,
        city: practitionerQuery.data.city,
        price: practitionerQuery.data.price,
        priceHome: practitionerQuery.data.priceHome,
        consultationTypes: practitionerQuery.data.consultationTypes,
        availabilitySlots: practitionerQuery.data.availabilitySlots,
        description: practitionerQuery.data.description,
      }
    : null
  const provider = doctor ?? practitioner

  const [step, setStep] = useState<Step>(providerId ? 1 : 0)
  const [type, setType] = useState<ConsultationType | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('orange_money')
  const [paying, setPaying] = useState(false)
  const [confirmed, setConfirmed] = useState<{ reference: string; price: number } | null>(null)

  const isLoading = doctorQuery.isLoading || practitionerQuery.isLoading

  const price = useMemo(() => {
    if (!type) return provider?.price ?? 0
    return type === 'home' ? (provider?.priceHome ?? provider?.price ?? 0) : (provider?.price ?? 0)
  }, [type, provider])

  const platformFee = Math.round(price * 0.05)
  const total = price + platformFee

  const location = useMemo(() => {
    if (!provider) return user?.location ?? 'Antananarivo'
    if (type === 'cabinet') return provider.location
    if (type === 'home') return `${user?.location ?? 'Antananarivo'} — À domicile`
    return `${provider.location.split(',')[0]}, ${provider.city} — Hôpital partenaire`
  }, [provider, type, user])

  if (!providerId) {
    return (
      <div className="page-container py-5 sm:py-7">
        <PageHeader title={t('apt.title')} subtitle={t('apt.chooseProviderFirst')} />
        <div className="card space-y-2 p-4">
          <HubRow icon={Stethoscope} label={t('nav.doctors')} sub={t('apt.hubDoctors')} to="/patient/doctors" />
          <HubRow icon={Brain} label={t('nav.professionals')} sub={t('apt.hubProfessionals')} to="/patient/professionals" />
          <HubRow icon={Phone} label={t('nav.laboratories')} sub={t('apt.hubLabs')} to="/patient/laboratories" />
          <HubRow icon={CalendarDays} label={t('nav.imaging')} sub={t('apt.hubImaging')} to="/patient/imaging" />
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="page-container py-10 text-center">
        <p className="text-sm text-ink-soft">{t('common.loading')}</p>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="page-container py-10 text-center">
        <p className="text-sm text-ink-soft">{t('prac.notFound')}</p>
        <Button to={isPractitioner ? '/patient/professionals' : '/patient/doctors'} variant="outline" className="mt-3">
          {isPractitioner ? t('nav.professionals') : t('doctors.title')}
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
      // `consultationType` is the machine key the server prices from; `type` is
      // the translated label shown in the UI. The server ignores any price and
      // recomputes the total from the provider's catalog record.
      const appointment = await bookAppointment({
        providerId: provider.id,
        providerType: provider.type,
        providerName: provider.name,
        providerPhoto: provider.photo,
        type: t(consultMeta[type].label),
        consultationType: type,
        date,
        time,
        location,
      })
      const payment = await pay({ appointmentId: appointment.id, method })
      const charged = payment.amount
      pushNotification({
        category: 'appointment',
        title: t('apt.confirmedToast'),
        message: t('apt.confirmedToastBody', { date: monthDay(date), time, name: provider.name }),
        link: '/patient/appointments',
      })
      toast(t('apt.confirmedToast'), t('apt.refAmount', { ref: appointment.reference, amount: formatAr(charged) }), 'success')
      setConfirmed({ reference: appointment.reference, price: charged })
      setPaying(false)
      setStep(5)
    } catch (err) {
      setPaying(false)
      // Surface the server's reason (e.g. honoraires not yet defined) rather
      // than a generic failure, so the patient knows what to do next.
      const message = err instanceof ApiError ? err.message : t('common.error')
      toast('Paiement échoué', message, 'error')
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

      <PageHeader title={t('apt.title')} subtitle={provider.name} />

      <div className="mb-6">
        <ProgressTracker steps={stepTitles} />
      </div>

      <div className="card flex items-center gap-3 bg-brand-softer p-4">
        <Avatar name={provider.name} src={provider.photo} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{provider.name}</p>
          <p className="text-xs text-ink-soft">{provider.specialty} · {provider.city}</p>
        </div>
        {provider.type !== 'doctor' && (
          <Badge tone="brand">{t(roleLabelKey(provider.type))}</Badge>
        )}
      </div>

      {step === 1 && (
        <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {provider.consultationTypes.map((c) => {
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
                <span className="text-sm font-extrabold text-brand-700">{formatAr(c === 'home' ? (provider.priceHome ?? provider.price) : provider.price)}</span>
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
            {provider.availabilitySlots.map((slot) => {
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
              <span className="text-ink-soft">{t('apt.service')} — {provider.name}</span>
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
          doctorName={provider.name}
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