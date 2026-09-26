import { useMemo, useState } from 'react'
import { Bike, Plus } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { SearchBar } from '../../components/SearchBar'
import { MedicineCard } from '../../components/MedicineCard'
import { DeliveryCard } from '../../components/DeliveryCard'
import { EmptyState } from '../../components/ui/States'
import { Button } from '../../components/ui/Button'
import { useApp } from '../../stores/AppStore'
import { useMedicines } from '../../lib/hooks'
import { ApiError } from '../../lib/api'
import type { Medicine } from '../../types'
import { formatAr } from '../../lib/format'

const DELIVERY_FEE = 3500
const FREE_ABOVE = 20000

export function DeliveryPage() {
  const { t, toast } = useApp()
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const [selected, setSelected] = useState<Medicine>()
  const [address, setAddress] = useState('')
  const [slot, setSlot] = useState<'now' | 'evening' | 'tomorrow'>('now')
  const [quantity, setQuantity] = useState(1)
  const [prescriptionAccepted, setPrescriptionAccepted] = useState(false)
  const [lastTotal, setLastTotal] = useState<number | null>(null)
  const [placing, setPlacing] = useState(false)

  const { deliveries, placeDeliveryOrder } = useApp()
  const { data: medicines = [] } = useMedicines()

  const list = useMemo(
    () =>
      medicines.filter(
        (m) =>
          !needle ||
          m.name.toLowerCase().includes(needle) ||
          m.genericName.toLowerCase().includes(needle) ||
          m.pharmacyName.toLowerCase().includes(needle),
      ),
    [medicines, needle],
  )

  // Mirrors the server's fee rule so the summary matches what will be
  // charged. The authoritative total comes back from POST /deliveries.
  const subtotal = selected ? selected.price * quantity : 0
  const fee = selected ? (subtotal >= FREE_ABOVE ? 0 : DELIVERY_FEE) : 0
  const total = subtotal + fee

  const slotText = {
    now: t('del.asap'),
    evening: `${t('apt.evening')} (18h - 20h)`,
    tomorrow: t('apt.date') + ' +1',
  }[slot]

  function handleOrder() {
    if (!selected || !address.trim()) {
      toast(t('common.error'), t('del.addressRequired'), 'error')
      return
    }
    setPlacing(true)
    void placeDeliveryOrder({
      medicineId: selected.id,
      quantity,
      deliveryAddress: address,
      deliveryTimeSlot: slotText,
      prescriptionConfirmed: prescriptionAccepted,
    })
      .then((order) => {
        setPlacing(false)
        toast(t('del.confirmed'), t('del.confirmedSub'))
        setSelected(undefined)
        setAddress('')
        setPrescriptionAccepted(false)
        setQuantity(1)
        // Show what was actually charged, in case the price moved since load.
        setLastTotal(order.total)
      })
      .catch((err: unknown) => {
        setPlacing(false)
        const message = err instanceof ApiError ? err.message : t('common.error')
        toast(t('common.error'), message, 'error')
      })
  }

  return (
    <div className="page-container max-w-5xl py-5 sm:py-7">
      <PageHeader title={t('del.title')} subtitle={t('del.subtitle')} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <SearchBar value={query} onChange={setQuery} placeholder={t('common.search')} />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {list.map((m) => (
              <div
                key={m.id}
                // Unavailable medicines cannot be ordered, so they are not
                // selectable — the server rejects them anyway.
                className={`rounded-2xl transition ${
                  m.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                } ${selected?.id === m.id ? 'ring-2 ring-brand-500' : ''}`}
                onClick={() => m.available && setSelected(m)}
              >
                <MedicineCard medicine={m} />
              </div>
            ))}
          </div>
          {list.length === 0 && (
            <div className="mt-4">
              <EmptyState icon={<Bike className="h-6 w-6" />} title={t('common.noResults')} description={t('common.noResultsDesc')} />
            </div>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-line bg-card p-5 sm:p-6">
          <h2 className="text-base font-bold text-ink">{t('del.orderTitle')}</h2>
          <p className="mt-0.5 text-sm text-ink-soft">{t('del.orderSubtitle')}</p>

          {selected ? (
            <>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-brand-soft p-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{selected.name}</p>
                  <p className="text-xs text-ink-soft">{selected.pharmacyName}</p>
                </div>
                <p className="text-sm font-bold text-brand-700">{formatAr(selected.price)}</p>
              </div>

              <label className="mt-4 block text-sm font-medium text-ink">{t('del.address')}</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('del.addressPlaceholder')}
                className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />

              <label className="mt-4 block text-sm font-medium text-ink">{t('del.timeSlot')}</label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {(['now', 'evening', 'tomorrow'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlot(s)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      slot === s ? 'bg-brand-600 text-white' : 'bg-surface text-ink-soft hover:bg-brand-soft'
                    }`}
                  >
                    {s === 'now' ? t('del.asap') : s === 'evening' ? `${t('apt.evening')} (18h)` : '+1'}
                  </button>
                ))}
              </div>

              <label className="mt-4 block text-sm font-medium text-ink">{t('common.quantity')}</label>
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="-1"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-base font-bold text-ink-soft disabled:opacity-40"
                >
                  −
                </button>
                <span className="min-w-8 text-center text-sm font-bold text-ink">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(selected.stock, q + 1))}
                  disabled={quantity >= selected.stock}
                  aria-label="+1"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-base font-bold text-ink-soft disabled:opacity-40"
                >
                  +
                </button>
                <span className="text-xs text-ink-faint">{t('del.stockLeft', { n: selected.stock })}</span>
              </div>

              {selected.prescriptionRequired && (
                <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <input
                    type="checkbox"
                    checked={prescriptionAccepted}
                    onChange={(e) => setPrescriptionAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-amber-600"
                  />
                  <span className="text-xs font-medium text-amber-900">{t('del.prescriptionConfirm')}</span>
                </label>
              )}

              {fee === 0 ? (
                <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  {t('del.freeAbove', { amount: formatAr(FREE_ABOVE) })}
                </p>
              ) : null}

              <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex justify-between text-ink-soft">
                  <span>{t('del.subtotal')}</span>
                  <span>{subtotal ? formatAr(subtotal) : '—'}</span>
                </div>
                <div className="flex justify-between text-ink-soft">
                  <span>{t('del.fee')}</span>
                  <span>{fee === 0 ? t('del.free') : formatAr(fee)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-ink">
                  <span>{t('del.total')}</span>
                  <span>{total ? formatAr(total) : '—'}</span>
                </div>
                {lastTotal !== null && lastTotal !== total && (
                  <p className="pt-1 text-xs text-ink-faint">
                    {t('del.lastCharged', { amount: formatAr(lastTotal) })}
                  </p>
                )}
              </div>

              <Button
                className="mt-5 w-full"
                loading={placing}
                onClick={handleOrder}
                disabled={!address.trim() || (selected.prescriptionRequired && !prescriptionAccepted)}
              >
                <Plus className="h-4 w-4" /> {t('del.place')}
              </Button>
              <p className="mt-2 text-center text-[11px] text-ink-faint">{t('del.codNote')}</p>
            </>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">{t('del.selectFirst')}</p>
          )}
        </aside>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">{t('del.currentOrders')}</h2>
          <span className="text-xs text-ink-faint">{t('del.history')}</span>
        </div>
        {deliveries.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon={<Bike className="h-6 w-6" />} title={t('del.noOrders')} description={t('del.noOrdersDesc')} />
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {deliveries.map((o) => (
              <DeliveryCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
