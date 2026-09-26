import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bike,
  CalendarDays,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Siren,
  Users,
  Wallet,
} from 'lucide-react'
import { useApp } from '../../stores/AppStore'
import { useAdminUser } from '../../lib/hooks'
import { PageHeader } from '../../components/ui/Headers'
import { StatusPill } from '../../components/ui/StatusPill'
import { EmptyState, LoadingState } from '../../components/ui/States'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/Avatar'
import { SegmentedTabs } from '../../components/ui/Tabs'
import { roleLabelKey } from '../../lib/roles'
import { formatAr, formatDateShort, monthDay } from '../../lib/format'
import type { PillTone } from '../../components/ui/StatusPill'

type Tab = 'appointments' | 'payments' | 'deliveries' | 'emergency'

const APPOINTMENT_TONE: Record<string, PillTone> = {
  confirmed: 'emerald',
  pending: 'amber',
  completed: 'blue',
  cancelled: 'red',
}

const PAYMENT_TONE: Record<string, PillTone> = {
  success: 'emerald',
  pending: 'amber',
  failed: 'red',
}

function Row({ icon, primary, secondary, right }: { icon: React.ReactNode; primary: string; secondary?: string; right?: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{primary}</p>
        {secondary ? <p className="truncate text-xs text-ink-faint">{secondary}</p> : null}
      </div>
      {right}
    </li>
  )
}

/**
 * Admin view of one account and its recent activity.
 *
 * This used to resolve to the application-review screen, so following a
 * patient from the list loaded an application by the wrong id.
 */
export function AdminPatientDetailPage() {
  const { id } = useParams()
  const { t } = useApp()
  const { data, isLoading, isError } = useAdminUser(id)
  const [tab, setTab] = useState<Tab>('appointments')

  if (isLoading) return <LoadingState label={t('common.loading')} />

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Link to="/admin/patients" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
          ← {t('admin.backToPatients')}
        </Link>
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={t('admin.userNotFound')}
          description={t('admin.userNotFoundDesc')}
          action={<Button to="/admin/patients">{t('admin.backToPatients')}</Button>}
        />
      </div>
    )
  }

  const { user, totals, appointments, payments, deliveries, emergencyRequests } = data

  const tabs = [
    { key: 'appointments' as Tab, label: t('admin.appointments'), count: appointments.length },
    { key: 'payments' as Tab, label: t('admin.payments'), count: payments.length },
    { key: 'deliveries' as Tab, label: t('admin.deliveries'), count: deliveries.length },
    { key: 'emergency' as Tab, label: t('erg.title'), count: emergencyRequests.length },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/admin/patients" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
        <ArrowLeft className="h-4 w-4" /> {t('admin.backToPatients')}
      </Link>

      <PageHeader title={`${user.firstName} ${user.lastName}`} subtitle={user.email} />

      <div className="card flex flex-wrap items-center gap-4 p-5">
        <Avatar name={`${user.firstName} ${user.lastName}`} src={user.photo} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={user.role === 'admin' ? 'emerald' : 'blue'}>
              {t(roleLabelKey(user.role))}
            </StatusPill>
            {user.createdAt ? (
              <span className="text-xs text-ink-faint">
                {t('admin.joined')} {formatDateShort(user.createdAt)}
              </span>
            ) : null}
          </div>
          <div className="mt-2 grid gap-1 text-sm text-ink-soft sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-ink-faint" />
              <span className="truncate">{user.email}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-ink-faint" /> {user.phone}
            </p>
            {user.location ? (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-ink-faint" /> {user.location}
              </p>
            ) : null}
            <p className="truncate font-mono text-xs text-ink-faint">{user.id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: CalendarDays, label: t('admin.appointments'), value: String(totals.appointments), cls: 'text-brand-600 bg-brand-50' },
          { icon: CreditCard, label: t('admin.payments'), value: String(totals.payments), cls: 'text-blue-600 bg-blue-50' },
          { icon: Wallet, label: t('admin.paidTotal'), value: formatAr(totals.paidTotal), cls: 'text-emerald-600 bg-emerald-50' },
          { icon: Siren, label: t('erg.title'), value: String(totals.emergency), cls: 'text-amber-600 bg-amber-50' },
        ].map(({ icon: Icon, label, value, cls }) => (
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

      <div>
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          ariaLabel={t('admin.activity')}
          options={tabs}
          className="mb-3"
        />

        <div className="card divide-y divide-line overflow-hidden">
          {tab === 'appointments' &&
            (appointments.length === 0 ? (
              <EmptyState icon={<CalendarDays className="h-6 w-6" />} title={t('admin.noActivity')} />
            ) : (
              <ul className="divide-y divide-line">
                {appointments.map((a) => (
                  <Row
                    key={a.id}
                    icon={<CalendarDays className="h-4 w-4" />}
                    primary={`${a.provider_name} · ${a.type}`}
                    secondary={`${monthDay(a.date)} · ${a.time} · ${a.reference}`}
                    right={
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-bold text-ink">{formatAr(a.price)}</span>
                        <StatusPill tone={APPOINTMENT_TONE[a.status] ?? 'neutral'}>
                          {t(`apt.status.${a.status}`)}
                        </StatusPill>
                      </div>
                    }
                  />
                ))}
              </ul>
            ))}

          {tab === 'payments' &&
            (payments.length === 0 ? (
              <EmptyState icon={<CreditCard className="h-6 w-6" />} title={t('admin.noActivity')} />
            ) : (
              <ul className="divide-y divide-line">
                {payments.map((p) => (
                  <Row
                    key={p.id}
                    icon={<CreditCard className="h-4 w-4" />}
                    primary={`${p.service} · ${p.provider_name}`}
                    secondary={`${formatDateShort(p.date)} · ${p.method} · ${p.reference}`}
                    right={
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-bold text-ink">{formatAr(p.amount)}</span>
                        <StatusPill tone={PAYMENT_TONE[p.status] ?? 'neutral'}>
                          {t(`pay.${p.status}`)}
                        </StatusPill>
                      </div>
                    }
                  />
                ))}
              </ul>
            ))}

          {tab === 'deliveries' &&
            (deliveries.length === 0 ? (
              <EmptyState icon={<Bike className="h-6 w-6" />} title={t('admin.noActivity')} />
            ) : (
              <ul className="divide-y divide-line">
                {deliveries.map((d) => (
                  <Row
                    key={d.id}
                    icon={<Bike className="h-4 w-4" />}
                    primary={`${d.medicine_name} × ${d.quantity}`}
                    secondary={`${formatDateShort(d.date)} · ${d.reference}`}
                    right={
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-bold text-ink">{formatAr(d.total)}</span>
                        <StatusPill tone="blue">{t(`del.status.${d.status}`)}</StatusPill>
                      </div>
                    }
                  />
                ))}
              </ul>
            ))}

          {tab === 'emergency' &&
            (emergencyRequests.length === 0 ? (
              <EmptyState icon={<Siren className="h-6 w-6" />} title={t('admin.noActivity')} />
            ) : (
              <ul className="divide-y divide-line">
                {emergencyRequests.map((e) => (
                  <Row
                    key={e.id}
                    icon={<Siren className="h-4 w-4" />}
                    primary={`${e.emergency_type} → ${e.destination_hospital}`}
                    secondary={`${formatDateShort(e.date)} · ${e.reference}`}
                    right={<StatusPill tone="amber">{t(`erg.status.${e.status}`)}</StatusPill>}
                  />
                ))}
              </ul>
            ))}
        </div>
      </div>
    </div>
  )
}
