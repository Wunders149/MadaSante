import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, MapPin, Phone, Search, Users } from 'lucide-react'
import { useApp } from '../../stores/AppStore'
import { useAdminUsers } from '../../lib/hooks'
import { cn } from '../../lib/cn'
import { roleLabelKey } from '../../lib/roles'

type Filter = 'all' | 'patient' | 'admin'

const FILTERS: Filter[] = ['all', 'patient', 'admin']

const statusClass = (role: string) => {
  return cn(
    'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
    role === 'patient' && 'bg-blue-50 text-blue-700',
    role === 'admin' && 'bg-emerald-50 text-emerald-700',
  )
}

export function AdminPatientsPage() {
  const { t } = useApp()
  const [filter, setFilter] = useState<Filter>('patient')
  const { data, isLoading } = useAdminUsers()

  const visible = (data?.users ?? []).filter(
    (u) => filter === 'all' || u.role === filter,
  )
  const count = (f: Filter) =>
    (data?.users ?? []).filter((u) => (f === 'all' ? true : u.role === f)).length

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">{t('admin.patients')}</h2>
        <p className="text-sm text-ink-soft">{t('admin.patientsDesc')}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-bold transition',
              filter === f ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-card text-ink-soft',
            )}
          >
            {t(`admin.${f}`)}
            <span className="ml-1.5 opacity-70">{count(f)}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-ink-faint">
          <Search className="mr-2 h-5 w-5 animate-pulse" /> {t('common.loading')}
        </div>
      ) : visible.length > 0 ? (
        <div className="space-y-3">
          {visible.map((u) => (
            <Link
              key={u.id}
              to={`/admin/patients/${u.id}`}
              className="card block p-4 transition hover:border-brand-300"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-700">{u.id}</span>
                <span className={statusClass(u.role)}>{t(roleLabelKey(u.role))}</span>
                <span className="ml-auto text-xs text-ink-faint">{u.createdAt?.slice(0, 10)}</span>
              </div>
              <h3 className="mt-2 flex items-center gap-2 text-base font-extrabold text-ink">
                <Users className="h-4 w-4 text-brand-600" />
                {u.firstName} {u.lastName}
              </h3>
              <p className="mt-1 text-sm text-ink-soft">{u.email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-faint">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {u.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {u.location}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> {u.appointmentCount ?? 0} appointments
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-2 p-10 text-center">
          <Search className="h-8 w-8 text-ink-faint" />
          <p className="font-bold text-ink">{t('admin.noPatients')}</p>
          <p className="text-sm text-ink-soft">{t('admin.noPatientsDesc')}</p>
        </div>
      )}
    </div>
  )
}
