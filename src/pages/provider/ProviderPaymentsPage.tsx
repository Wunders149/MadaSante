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

const todayIsoForFile = () => new Date().toISOString().slice(0, 10)

export function ProviderPaymentsPage() {
  const { t, payments, toast } = useApp()
  const { user } = useAuth()
  const providerId = user?.providerId
  const mine = useMemo(() => payments.filter((p) => p.providerId === providerId), [payments, providerId])
  const accepted = mine.filter((p) => p.status === 'success')
  const total = accepted.reduce((s, p) => s + p.amount, 0)

  /** Quotes a CSV cell, doubling embedded quotes per RFC 4180. */
  const csvCell = (value: string | number) => {
    const text = String(value)
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  const exportCsv = () => {
    if (mine.length === 0) {
      toast(t('common.error'), t('prov.nothingToExport'), 'error')
      return
    }
    const header = [
      t('pay.col.reference'),
      t('pay.col.date'),
      t('pay.col.patient'),
      t('pay.col.service'),
      t('pay.col.method'),
      t('pay.col.amount'),
      t('pay.col.status'),
    ]
    const rows = mine.map((p) =>
      [
        p.reference,
        p.date,
        p.patientId,
        p.service,
        p.method,
        p.amount,
        p.status,
      ]
        .map(csvCell)
        .join(','),
    )
    // BOM so Excel opens accented text correctly.
    const csv = `﻿${[header.map(csvCell).join(','), ...rows].join('\r\n')}`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `madasante-paiements-${todayIsoForFile()}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast(t('prov.exportDone'), `${mine.length}`, 'success')
  }

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('prov.payments')} subtitle={user ? `${user.firstName} ${user.lastName}` : ''}>
        <Button size="sm" variant="ghost" onClick={exportCsv} disabled={mine.length === 0}>
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