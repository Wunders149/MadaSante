import { Package } from 'lucide-react'
import type { DeliveryOrder, DeliveryStatus } from '../types'
import { useApp } from '../stores/AppStore'
import { Badge } from './ui/Badge'
import { formatAr, monthDay } from '../lib/format'
import { cn } from '../lib/cn'

const statusTone: Record<DeliveryStatus, 'green' | 'amber' | 'blue' | 'slate' | 'brand'> = {
  received: 'amber',
  preparing: 'blue',
  in_delivery: 'brand',
  delivered: 'green',
}

const statusStep: Record<DeliveryStatus, number> = {
  received: 1,
  preparing: 2,
  in_delivery: 3,
  delivered: 4,
}

export function DeliveryStatusTracker({ status }: { status: DeliveryStatus }) {
  const { t } = useApp()
  const current = statusStep[status]
  const labels: DeliveryStatus[] = ['received', 'preparing', 'in_delivery', 'delivered']
  return (
    <div className="flex items-center gap-1" aria-label="Statut de la livraison">
      {labels.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex min-w-0 flex-1 items-center gap-1">
            {i > 0 && <span className={cn('h-0.5 flex-1 rounded', done ? 'bg-brand-500' : 'bg-gray-200')} />}
            <span
              className={cn(
                'whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold',
                active && 'bg-brand-600 text-white',
                done && 'bg-brand-100 text-brand-800',
                !active && !done && 'bg-gray-100 text-gray-400',
              )}
            >
              {t(`del.status.${label}`)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function DeliveryCard({ order }: { order: DeliveryOrder }) {
  const { t } = useApp()
  return (
    <article className="card flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Package className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-ink">
            {order.medicineName} <span className="font-medium text-ink-faint">× {order.quantity}</span>
          </p>
          <p className="text-sm text-ink-soft">{order.pharmacyName}</p>
          <p className="text-xs text-ink-faint">{order.deliveryAddress}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-base font-extrabold text-ink">{formatAr(order.total)}</p>
          <Badge tone={statusTone[order.status]} className="mt-1">
            {t(`del.status.${order.status}`)}
          </Badge>
        </div>
      </div>
      <DeliveryStatusTracker status={order.status} />
      <div className="flex items-center justify-between border-t border-line pt-2.5 text-xs text-ink-faint">
        <span>{order.reference}</span>
        <span>{monthDay(order.date)} · {order.deliveryTimeSlot}</span>
      </div>
    </article>
  )
}