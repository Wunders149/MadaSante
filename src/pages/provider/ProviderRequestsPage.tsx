import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Ambulance, Inbox, MapPin, Phone } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { SegmentedTabs } from '../../components/ui/Tabs'
import { Button } from '../../components/ui/Button'
import { AppointmentCard } from '../../components/AppointmentCard'
import { EmptyState } from '../../components/ui/States'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import { ApiError, apiRoutes } from '../../lib/api'
import { useAmbulances } from '../../lib/hooks'
import { Badge } from '../../components/ui/Badge'

const HOME_ROLES = ['nurse', 'doctor', 'psychologist', 'psychiatrist', 'kinesitherapist', 'ergotherapist', 'speech_therapist', 'dietitian', 'midwife']
const isHomeRole = (role?: string) => !!role && HOME_ROLES.includes(role)

type Tab = 'appointments' | 'requests'

function MedicationRequestsList() {
  const { t, toast } = useApp()
  const queryClient = useQueryClient()
  const { data = [] } = useQuery({ queryKey: ['medication-requests'], queryFn: apiRoutes.medicationRequests })
  if (data.length === 0) return <div className="mt-3"><EmptyState icon={<Inbox className="h-6 w-6" />} title={t('prov.noMedRequests')} description={t('prov.noMedRequestsDesc')} /></div>
  return (
    <ul className="mt-3 space-y-2">
      {data.map((r) => (
        <li key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-semibold text-ink">{r.medicineName} × {r.quantity}</p>
            <p className="text-xs text-ink-soft">{r.patientName} · {r.reference}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={r.status === 'available' ? 'green' : r.status === 'unavailable' ? 'red' : 'amber'}>{r.status}</Badge>
            {r.status === 'pending' && (
              <>
                <Button size="sm" onClick={async () => { await apiRoutes.setMedicationRequestStatus(r.id, 'available'); await queryClient.invalidateQueries({ queryKey: ['medication-requests'] }); toast(t('prov.availableSet'), r.reference, 'success') }}>{t('prov.medAvailable')}</Button>
                <Button size="sm" variant="ghost" onClick={async () => { await apiRoutes.setMedicationRequestStatus(r.id, 'unavailable'); await queryClient.invalidateQueries({ queryKey: ['medication-requests'] }) }}>{t('prov.medUnavailable')}</Button>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function DeliveriesList() {
  const { t, toast } = useApp()
  const queryClient = useQueryClient()
  const { data = [] } = useQuery({ queryKey: ['deliveries'], queryFn: apiRoutes.deliveries })
  const nextStatus: Record<string, string | null> = {
    received: 'pharmacy_confirmed',
    pharmacy_confirmed: 'preparing',
    preparing: 'delivery_assigned',
    delivery_assigned: 'in_delivery',
    in_delivery: 'delivered',
    delivered: null,
  }
  if (data.length === 0) return <div className="mt-3"><EmptyState icon={<Inbox className="h-6 w-6" />} title={t('prov.noDeliveries')} description={t('prov.noDeliveriesDesc')} /></div>
  return (
    <ul className="mt-3 space-y-2">
      {data.map((d) => (
        <li key={d.id} className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">{d.medicineName} × {d.quantity}</p>
            <Badge tone={d.status === 'delivered' ? 'green' : 'amber'}>{t(`del.status.${d.status}`)}</Badge>
          </div>
          <p className="mt-1 text-xs text-ink-soft">{d.pharmacyName} · {d.deliveryAddress} · {d.deliveryTimeSlot}</p>
          {nextStatus[d.status] && (
            <Button
              size="sm"
              className="mt-3"
              onClick={async () => {
                await apiRoutes.updateDeliveryStatus(d.id, nextStatus[d.status] as import('../../types').DeliveryStatus)
                await queryClient.invalidateQueries({ queryKey: ['deliveries'] })
                toast(t('del.updated'), d.reference, 'success')
              }}
            >
              {t(`del.next.${nextStatus[d.status]}`)}
            </Button>
          )}
        </li>
      ))}
    </ul>
  )
}

function HomeRequestsList() {
  const { t, toast } = useApp()
  const queryClient = useQueryClient()
  const { data = [] } = useQuery({ queryKey: ['home-requests'], queryFn: apiRoutes.homeRequests })
  if (data.length === 0) return <div className="mt-3"><EmptyState icon={<Inbox className="h-6 w-6" />} title={t('prov.noHomeRequests')} description={t('prov.noHomeRequestsDesc')} /></div>
  return (
    <ul className="mt-3 space-y-2">
      {data.map((r) => (
        <li key={r.id} className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">{r.service}</p>
            <Badge tone={r.status === 'completed' ? 'green' : r.status === 'cancelled' ? 'red' : 'amber'}>{r.status}</Badge>
          </div>
          <p className="mt-1 text-xs text-ink-soft">{r.patientName} · {r.address} · {r.preferredTime}</p>
          <p className="mt-0.5 text-xs text-ink-faint">{r.reason}</p>
          {r.status === 'received' && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={async () => { await apiRoutes.updateHomeRequest(r.id, 'accepted', r.providerName ?? 'Vous'); await queryClient.invalidateQueries({ queryKey: ['home-requests'] }); toast(t('prov.accepted'), r.reference, 'success') }}>{t('prov.accept')}</Button>
              <Button size="sm" variant="ghost" onClick={async () => { await apiRoutes.updateHomeRequest(r.id, 'cancelled'); await queryClient.invalidateQueries({ queryKey: ['home-requests'] }) }}>{t('prov.decline')}</Button>
            </div>
          )}
          {r.status === 'accepted' && (
            <Button size="sm" className="mt-3" onClick={async () => { await apiRoutes.updateHomeRequest(r.id, 'in_progress'); await queryClient.invalidateQueries({ queryKey: ['home-requests'] }) }}>{t('prov.startCare')}</Button>
          )}
          {r.status === 'in_progress' && (
            <Button size="sm" className="mt-3" onClick={async () => { await apiRoutes.updateHomeRequest(r.id, 'completed'); await queryClient.invalidateQueries({ queryKey: ['home-requests'] }) }}>{t('prov.completeCare')}</Button>
          )}
        </li>
      ))}
    </ul>
  )
}

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
        <div className="mt-4 space-y-8">
          {/* Medication requests (pharmacies triage them, patients get notified). */}
          {user?.role === 'pharmacy' && (
            <section>
              <h2 className="section-title">{t('prov.medRequests')}</h2>
              <MedicationRequestsList />
            </section>
          )}

          {/* Home-care requests matching providers can accept. */}
          {isHomeRole(user?.role) && (
            <section>
              <h2 className="section-title">{t('prov.homeRequests')}</h2>
              <HomeRequestsList />
            </section>
          )}

          {/* Deliveries the pharmacy/driver must process. */}
          {['pharmacy', 'ambulance_driver', 'delivery_driver'].includes(user?.role ?? '') && (
            <section>
              <h2 className="section-title">{t('del.title')}</h2>
              <DeliveriesList />
            </section>
          )}

          {(!user || (!isHomeRole(user.role) && user.role !== 'pharmacy')) && (
            <div>
              {ambulances.length === 0 ? (
                <EmptyState
                  icon={<Ambulance className="h-6 w-6" />}
                  title={t('prov.noEmergency')}
                  description={t('prov.noEmergencyDesc')}
                />
              ) : (
                <ul className="grid grid-cols-1 gap-3">
                  {ambulances.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-card px-4 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-ink">{a.provider}</p>
                        <p className="flex items-center gap-1 text-xs text-ink-soft">
                          <MapPin className="h-3.5 w-3.5" /> {a.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-ink-faint">{a.responseTime}</span>
                        <a href={`tel:${a.phone.replace(/\s+/g, '')}`} className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-line bg-surface-soft px-3.5 text-sm font-semibold text-ink-soft transition hover:border-brand-300">
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
      )}
    </div>
  )
}