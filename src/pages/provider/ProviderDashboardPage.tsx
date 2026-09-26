import { useMemo } from 'react'
import { CalendarCheck2, Clock3, TrendingUp, Wallet } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { AppointmentCard } from '../../components/AppointmentCard'
import { EmptyState } from '../../components/ui/States'
import { Button } from '../../components/ui/Button'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import { useProviderMe } from '../../lib/hooks'
import { formatAr } from '../../lib/format'

export function ProviderDashboardPage() {
  const { t, appointments, payments } = useApp()
  const { user } = useAuth()
  const { data: providerMe } = useProviderMe()
  const profile = providerMe?.provider

  const providerId = user?.providerId
  const mine = useMemo(() => appointments.filter((a) => a.providerId === providerId), [appointments, providerId])
  const today = mine.filter((a) => a.date === new Date().toISOString().slice(0, 10))
  const upcoming = mine.filter((a) => a.date >= new Date().toISOString().slice(0, 10))
  const minePayments = useMemo(() => payments.filter((p) => p.providerId === providerId), [payments, providerId])
  const revenue = minePayments.filter((p) => p.status === 'success')
  const total = revenue.reduce((s, p) => s + p.amount, 0)
  const pendingRequests = mine.filter((a) => a.status === 'pending').length

  // Appointments arrive newest-first from the API, so the five to show are the
  // first five — slicing from the end showed the *oldest*.
  const recent = mine.slice(0, 5)

  const stats = [
    { icon: CalendarCheck2, label: t('prov.today'), value: String(today.length), cls: 'text-brand-600 bg-brand-50' },
    { icon: Clock3, label: t('prov.upcoming'), value: String(upcoming.length), cls: 'text-blue-600 bg-blue-50' },
    { icon: Wallet, label: t('prov.revenue'), value: formatAr(total), cls: 'text-green-600 bg-green-50' },
    { icon: TrendingUp, label: t('prov.pendingRequests'), value: String(pendingRequests), cls: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="page-container max-w-4xl py-5 sm:py-7">
      <PageHeader title={t('prov.dashboard')} subtitle={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} />

      {/* A provider whose catalog record still has placeholders cannot take
          bookings, so point them at the one thing standing in the way. */}
      {profile?.needsSetup && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">{t('prov.setupWarning')}</p>
          <Button size="sm" to="/provider/profile">
            {t('prov.completeProfile')}
          </Button>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, cls }) => (
          <div key={label} className="card flex items-center gap-3 p-4">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${cls}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs text-ink-soft">{label}</p>
              <p className="truncate text-lg font-extrabold text-ink">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <PageHeader title={t('prov.nextAppointments')} />
        <Button size="sm" variant="ghost" to="/provider/appointments">
          {t('prov.viewAll')}
        </Button>
      </div>

      {recent.length === 0 ? (
        <EmptyState title={t('prov.noAppointments')} description={t('prov.noAppointmentsDesc')} />
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3">
          {recent.map((a) => (
            <AppointmentCard key={a.id} appointment={a} />
          ))}
        </div>
      )}
    </div>
  )
}