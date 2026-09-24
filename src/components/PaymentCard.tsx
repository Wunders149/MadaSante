import { Smartphone } from 'lucide-react'
import type { Payment } from '../types'
import { useApp } from '../stores/AppStore'
import { StatusBadge } from './ui/StatusBadge'
import { formatAr, monthDay } from '../lib/format'

const statusTone: Record<Payment['status'], 'green' | 'slate' | 'red'> = {
  success: 'green',
  pending: 'slate',
  failed: 'red',
}

export function PaymentCard({ payment, onOpen }: { payment: Payment; onOpen?: () => void }) {
  const { t } = useApp()
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card touch-target flex w-full items-center gap-3 p-4 text-left transition hover:border-brand-300 hover:shadow-soft"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-om/10 text-om">
        <Smartphone className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">{payment.service}</p>
        <p className="text-sm text-ink-soft">
          {monthDay(payment.date)} · {t(payment.method === 'orange_money' ? 'pay.method.orange' : 'pay.method.mvola')}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <p className="text-base font-extrabold text-ink">{formatAr(payment.amount)}</p>
        <StatusBadge label={t(`pay.${payment.status}`)} tone={statusTone[payment.status]} showDot={false} />
      </div>
    </button>
  )
}