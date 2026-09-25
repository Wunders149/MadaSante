import { useMemo } from 'react'
import { Download, Wallet } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { PaymentCard } from '../../components/PaymentCard'
import { EmptyState } from '../../components/ui/States'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import { formatAr } from '../../lib/format'

export function ProviderPaymentsPage() {
  const { t, payments, toast } = useApp()
  const { user } = useAuth()
  const providerId = user?.providerId
  const mine = useMemo(() => payments.filter((p) => p.providerId === providerId), [payments, providerId])
  const accepted = mine.filter((p) => p.status === 'success')
  const total = accepted.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('prov.payments')} subtitle={user ? `${user.firstName} ${user.lastName}` : ''}>
        <Button size="sm" variant="ghost" onClick={() => toast(t('prov.export'), t('apt.stepDone'), 'success')}>
          <Download className="h-4 w-4" /> {t('common.export')}
        </Button>
      </PageHeader>

      <div className="mt-4 rounded-3xl border border-line bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-ink-soft">{t('prov.revenue')}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{formatAr(total)}</p>
          </div>
          <Badge tone="green">
            <Wallet className="h-4 w-4" /> {String(accepted.length)}
          </Badge>
        </div>
      </div>

      {mine.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={<Wallet className="h-6 w-6" />} title={t('prov.noPayments')} description={t('prov.noPaymentsDesc')} />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3">
          {mine.map((p) => (
            <PaymentCard key={p.id} payment={p} />
          ))}
        </div>
      )}
    </div>
  )
}