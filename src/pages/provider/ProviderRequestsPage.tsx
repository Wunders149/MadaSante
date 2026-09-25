import { useMemo, useState } from 'react'
import { Inbox, MapPin, Phone } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { Button } from '../../components/ui/Button'
import { AppointmentCard } from '../../components/AppointmentCard'
import { EmptyState } from '../../components/ui/States'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import { useAmbulances } from '../../lib/hooks'

type Tab = 'appointments' | 'requests'

export function ProviderRequestsPage() {
  const { t, appointments, toast } = useApp()
  const { user } = useAuth()
  const { data: ambulances = [] } = useAmbulances()
  const [tab, setTab] = useState<Tab>('appointments')

  const providerId = user?.providerId
  const mine = useMemo(() => appointments.filter((a) => a.providerId === providerId), [appointments, providerId])
  const pending = mine.filter((a) => a.status === 'pending')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'appointments', label: t('apt.list.title') },
    { key: 'requests', label: t('prov.requests') },
  ]

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('prov.requests')} subtitle={t('prov.subtitle')} />

      <div className="mt-4 flex flex-wrap gap-1 rounded-2xl border border-line bg-gray-100 p-1">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              tab === key ? 'bg-card text-brand-700 shadow-sm' : 'text-ink-soft'
            }`}
            aria-pressed={tab === key}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'appointments' ? (
        pending.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={<Inbox className="h-6 w-6" />} title={t('prov.noRequests')} description={t('prov.noRequestsDesc')} />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3">
            {pending.map((a) => (
              <div key={a.id} className="rounded-3xl border border-line bg-card">
                <AppointmentCard appointment={a} />
                <div className="flex gap-2 border-t border-line px-4 py-3">
                  <Button size="sm" fullWidth onClick={() => toast(t('prov.accepted'), t('apt.status.confirmed'), 'success')}>
                    {t('prov.accept')}
                  </Button>
                  <Button size="sm" fullWidth variant="ghost" onClick={() => toast(t('prov.declined'), '', 'error')}>
                    {t('prov.decline')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3">
          {ambulances.slice(0, 3).map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-card px-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-ink">{a.provider}</p>
                <p className="flex items-center gap-1 text-xs text-ink-soft">
                  <MapPin className="h-3.5 w-3.5" /> {a.location}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-brand-600" />
                <Button size="sm" variant="secondary" onClick={() => toast(t('prov.accepted'), t('apt.stepDone'), 'success')}>
                  {t('prov.accept')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}