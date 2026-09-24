import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { PaymentCard } from '../../components/PaymentCard'
import { EmptyState } from '../../components/ui/States'
import { Badge } from '../../components/ui/Badge'
import { useApp } from '../../stores/AppStore'
import type { PaymentMethod } from '../../types'

export function PaymentsPage() {
  const { t, payments } = useApp()
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all')

  const list = payments.filter((p) => methodFilter === 'all' || p.method === methodFilter)

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('pay.title')} subtitle={t('pay.subtitle')} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setMethodFilter('all')}>
          <Badge tone={methodFilter === 'all' ? 'brand' : 'slate'} className="cursor-pointer">
            Tous
          </Badge>
        </button>
        {(['orange_money', 'mvola'] as PaymentMethod[]).map((m) => (
          <button
            key={m}
            onClick={() => setMethodFilter(methodFilter === m ? 'all' : m)}
          >
            <Badge tone={methodFilter === m ? 'brand' : 'slate'} className="cursor-pointer">
              {m === 'orange_money' ? t('pay.method.orange') : t('pay.method.mvola')}
            </Badge>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<CreditCard className="h-6 w-6" />} title="Aucun paiement" description="Vos paiements apparaîtront ici." />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3">
          {list.map((p) => (
            <PaymentCard key={p.id} payment={p} />
          ))}
        </div>
      )}
    </div>
  )
}
