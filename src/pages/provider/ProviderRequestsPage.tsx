import { useMemo, useState } from 'react'
import { Ambulance, Inbox, MapPin, Phone } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { SegmentedTabs } from '../../components/ui/Tabs'
import { Button } from '../../components/ui/Button'
import { AppointmentCard } from '../../components/AppointmentCard'
import { EmptyState } from '../../components/ui/States'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import { ApiError } from '../../lib/api'
import { useAmbulances } from '../../lib/hooks'

type Tab = 'appointments' | 'requests'

export function ProviderRequestsPage() {
  const { t, appointments, setAppointmentStatus, toast } = useApp()
  const { user } = useAuth()
  const { data: ambulances = [] } = useAmbulances()
  const [tab, setTab] = useState<Tab>('appointments')
  const [busyId, setBusyId] = useState<string | null>(null)

  const providerId = user?.providerId
  const mine = useMemo(() => appointments.filter((a) => a.providerId === providerId), [appointments, providerId])
  const pending = mine.filter((a) => a.status === 'pending')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'appointments', label: t('apt.list.title') },
    { key: 'requests', label: t('prov.requests') },
  ]

  const decide = async (id: string, reference: string, status: 'confirmed' | 'cancelled') => {
    setBusyId(id)
    try {
      await setAppointmentStatus(id, status)
      toast(
        status === 'confirmed' ? t('prov.accepted') : t('prov.declined'),
        reference,
        status === 'confirmed' ? 'success' : 'info',
      )
    } catch (err) {
      toast(t('common.error'), err instanceof ApiError ? err.message : undefined, 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('prov.requests')} subtitle={t('prov.subtitle')} />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        ariaLabel={t('prov.requests')}
        className="mt-4"
        options={tabs.map(({ key, label }) => ({ key, label }))}
      />

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
                  <Button
                    size="sm"
                    fullWidth
                    loading={busyId === a.id}
                    onClick={() => void decide(a.id, a.reference, 'confirmed')}
                  >
                    {t('prov.accept')}
                  </Button>
                  <Button
                    size="sm"
                    fullWidth
                    variant="ghost"
                    loading={busyId === a.id}
                    onClick={() => void decide(a.id, a.reference, 'cancelled')}
                  >
                    {t('prov.decline')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="mt-4">
          {ambulances.length === 0 ? (
            <EmptyState
              icon={<Ambulance className="h-6 w-6" />}
              title={t('prov.noEmergency')}
              description={t('prov.noEmergencyDesc')}
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3">
              {ambulances.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-card px-4 py-3.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{a.provider}</p>
                    <p className="flex items-center gap-1 text-xs text-ink-soft">
                      <MapPin className="h-3.5 w-3.5" /> {a.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-faint">{a.responseTime}</span>
                    {/* Read-only: dispatch is not modelled, so this is a
                        contactable directory entry rather than an action. */}
                    <a
                      href={`tel:${a.phone.replace(/\s+/g, '')}`}
                      className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-line bg-surface-soft px-3.5 text-sm font-semibold text-ink-soft transition hover:border-brand-300"
                    >
                      <Phone className="h-4 w-4 text-brand-600" /> {t('common.contact')}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}