import { useQuery } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'
import { useApp } from '../../stores/AppStore'
import { apiRoutes } from '../../lib/api'
import { PageHeader } from '../../components/ui/Headers'
import { EmptyState } from '../../components/ui/States'

export function AdminReportsPage() {
  const { t } = useApp()
  const { data } = useQuery({ queryKey: ['admin', 'reports'], queryFn: apiRoutes.adminReports })

  return (
    <div className="page-container max-w-4xl py-5 sm:py-7">
      <PageHeader title={t('admin.reports')} subtitle={t('admin.reportsDesc')} />
      {!data ? (
        <div className="mt-6"><EmptyState icon={<BarChart3 className="h-6 w-6" />} title={t('admin.noData')} description={t('admin.noDataDesc')} /></div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section className="card p-5">
            <h2 className="section-title">{t('nav.appointments')}</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {data.appointments.map((r) => (
                <li key={r.status} className="flex justify-between"><span className="text-ink-soft">{r.status}</span><span className="font-bold">{r.count}</span></li>
              ))}
            </ul>
          </section>
          <section className="card p-5">
            <h2 className="section-title">{t('nav.payments')}</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {data.payments.map((r) => (
                <li key={r.status} className="flex justify-between"><span className="text-ink-soft">{r.status}</span><span className="font-bold">{r.count} · {r.total.toLocaleString()} Ar</span></li>
              ))}
            </ul>
          </section>
          <section className="card p-5">
            <h2 className="section-title">{t('nav.ambulance')}</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {data.emergencies.map((r) => (
                <li key={r.status} className="flex justify-between"><span className="text-ink-soft">{r.status}</span><span className="font-bold">{r.count}</span></li>
              ))}
            </ul>
          </section>
          <section className="card p-5">
            <h2 className="section-title">{t('nav.delivery')}</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {data.deliveries.map((r) => (
                <li key={r.status} className="flex justify-between"><span className="text-ink-soft">{r.status}</span><span className="font-bold">{r.count}</span></li>
              ))}
            </ul>
          </section>
          <section className="card p-5 sm:col-span-2">
            <h2 className="section-title">{t('admin.usersByRole')}</h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
              {data.usersByRole.map((r) => (
                <li key={r.role} className="flex justify-between"><span className="text-ink-soft">{r.role}</span><span className="font-bold">{r.count}</span></li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}
