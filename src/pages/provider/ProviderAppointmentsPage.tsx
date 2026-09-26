import { useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, MapPin, XCircle } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { SearchBar } from '../../components/SearchBar'
import { AppointmentCard } from '../../components/AppointmentCard'
import { EmptyState } from '../../components/ui/States'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import { ApiError } from '../../lib/api'
import { formatAr, monthDay } from '../../lib/format'

type Tab = 'all' | 'pending' | 'upcoming' | 'past'

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'common.all' },
  { key: 'pending', label: 'apt.status.pending' },
  { key: 'upcoming', label: 'apt.list.upcoming' },
  { key: 'past', label: 'apt.list.past' },
]

export function ProviderAppointmentsPage() {
  const { t, appointments, setAppointmentStatus, toast } = useApp()
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)

  const providerId = user?.providerId
  const list = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const needle = query.trim().toLowerCase()
    return appointments
      .filter((a) => a.providerId === providerId)
      .filter((a) => (tab === 'all' ? true : tab === 'pending' ? a.status === 'pending' : tab === 'past' ? a.date < today : a.date >= today))
      .filter((a) => !needle || a.reference.toLowerCase().includes(needle))
  }, [appointments, providerId, tab, query])
  const open = list.find((a) => a.id === openId)

  /**
   * Persists the decision instead of only showing a toast. The server owns the
   * status transition rules, so its response replaces the local row.
   */
  const decide = async (status: 'confirmed' | 'cancelled') => {
    if (!open) return
    setBusy(true)
    try {
      await setAppointmentStatus(open.id, status)
      toast(
        status === 'confirmed' ? t('prov.accepted') : t('prov.declined'),
        open.reference,
        status === 'confirmed' ? 'success' : 'info',
      )
      setOpenId(undefined)
    } catch (err) {
      toast(t('common.error'), err instanceof ApiError ? err.message : undefined, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('prov.appointments')} subtitle={t('apt.title')} />
      <div className="mt-4 flex flex-wrap gap-1 rounded-2xl border border-line bg-gray-100 p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              tab === key ? 'bg-card text-brand-700 shadow-sm' : 'text-ink-soft'
            }`}
            aria-pressed={tab === key}
          >
            {t(label)}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <SearchBar value={query} onChange={setQuery} placeholder={t('search.title')} />
      </div>

      {list.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={<CalendarDays className="h-6 w-6" />} title={t('prov.noAppointments')} description={t('prov.noAppointmentsDesc')} />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3">
          {list.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              onOpen={() => setOpenId(a.id)}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!open}
        onClose={() => setOpenId(undefined)}
        title={t('apt.detailsTitle')}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge tone="brand">{open?.reference}</Badge>
            <div className="flex gap-2">
              {open?.status === 'pending' && (
                <>
                  <Button size="sm" variant="ghost" loading={busy} onClick={() => void decide('cancelled')}>
                    <XCircle className="h-4 w-4" /> {t('prov.decline')}
                  </Button>
                  <Button size="sm" loading={busy} onClick={() => void decide('confirmed')}>
                    <CheckCircle2 className="h-4 w-4" /> {t('prov.accept')}
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={() => setOpenId(undefined)}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-ink">{open?.providerName}</p>
          <p className="text-ink-soft">{open?.type}</p>
          <div className="rounded-xl bg-surface-soft px-3 py-2 text-ink-soft">
            <p>{monthDay(open?.date ?? '')} à {open?.time}</p>
            <p className="mt-1 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-brand-600" /> {open?.location}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">{t('common.total')}</span>
            <span className="font-semibold text-ink">{open ? formatAr(open.price) : ''}</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}