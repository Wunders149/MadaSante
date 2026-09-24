import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { AppointmentCard } from '../../components/AppointmentCard'
import { EmptyState } from '../../components/ui/States'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApp } from '../../stores/AppStore'
import type { Appointment } from '../../types'
import { formatAr, monthDay } from '../../lib/format'
import { cn } from '../../lib/cn'

export function AppointmentsPage() {
  const { t, appointments } = useApp()
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [selected, setSelected] = useState<Appointment | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const upcoming = useMemo(
    () => appointments.filter((a) => a.status !== 'cancelled' && a.date >= today && a.status !== 'completed'),
    [appointments, today],
  )
  const past = useMemo(
    () => appointments.filter((a) => a.date < today || a.status === 'completed' || a.status === 'cancelled'),
    [appointments, today],
  )

  const list = tab === 'upcoming' ? upcoming : past

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('apt.list.title')} subtitle={t('apt.list.subtitle')}>
        <Button to="/patient/appointments/new" size="sm">
          + {t('apt.title')}
        </Button>
      </PageHeader>

      <div className="mb-4 flex gap-1 rounded-2xl border border-line bg-gray-100 p-1">
        {(['upcoming', 'past'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              'flex-1 rounded-xl py-2.5 text-sm font-semibold transition',
              tab === k ? 'bg-card text-brand-700 shadow-sm' : 'text-ink-soft',
            )}
          >
            {t(`apt.list.${k}`)} ({k === 'upcoming' ? upcoming.length : past.length})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title={t('apt.list.empty')}
          description={t('apt.list.emptyDesc')}
          action={
            <Button to="/patient/doctors">
              {t('doctors.title')}
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {list.map((a) => (
            <AppointmentCard key={a.id} appointment={a} onOpen={() => setSelected(a)} />
          ))}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? selected.providerName : ''}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <StatusBadge label={t(`apt.status.${selected.status}`)} tone={selected.status === 'confirmed' ? 'brand' : selected.status === 'completed' ? 'green' : selected.status === 'cancelled' ? 'red' : 'amber'} />
              <span className="text-sm font-semibold text-ink-faint">{selected.reference}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-brand-softer p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-ink-faint">{t('common.date')}</p>
                <p className="font-semibold text-ink">{monthDay(selected.date)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-faint">{t('common.time')}</p>
                <p className="font-semibold text-ink">{selected.time}</p>
              </div>
              <div>
                <p className="text-xs text-ink-faint">{t('apt.stepType')}</p>
                <p className="font-semibold text-ink">{selected.type}</p>
              </div>
              <div>
                <p className="text-xs text-ink-faint">{t('common.price')}</p>
                <p className="font-semibold text-ink">{formatAr(selected.price)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-ink-faint">{t('apt.location')}</p>
              <p className="text-sm font-semibold text-ink">{selected.location}</p>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" to="/patient/appointments/new">
                {t('apt.addCalendar')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}