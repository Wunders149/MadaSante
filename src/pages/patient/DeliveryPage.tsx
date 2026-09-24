import { useMemo, useState } from 'react'
import { Bike, Plus } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { SearchBar } from '../../components/SearchBar'
import { MedicineCard } from '../../components/MedicineCard'
import { DeliveryCard } from '../../components/DeliveryCard'
import { EmptyState } from '../../components/ui/States'
import { Button } from '../../components/ui/Button'
import { useApp } from '../../stores/AppStore'
import { medicines } from '../../data/mock'
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
  const [placing, setPlacing] = useState(false)

  const { deliveries, placeDeliveryOrder } = useApp()

  const list = useMemo(
    () =>
      medicines.filter(
        (m) =>
          !needle ||
          m.name.toLowerCase().includes(needle) ||
          m.genericName.toLowerCase().includes(needle) ||
          m.pharmacyName.toLowerCase().includes(needle),
      ),
    [needle],
  )

  const fee = selected ? (selected.price * selected.stock >= FREE_ABOVE ? 0 : DELIVERY_FEE) : 0
  const total = selected ? selected.price + fee : 0

  const slotText = {
    now: t('del.asap'),
    evening: `${t('apt.evening')} (18h - 20h)`,
    tomorrow: t('apt.date') + ' +1',
  }[slot]

  function handleOrder() {
    if (!selected || !address.trim()) {
      toast(t('common.error'), t('del.addressPlaceholder') === '' ? undefined : t('common.error'), 'error')
      return
    }
    setPlacing(true)
    void placeDeliveryOrder({
      medicineId: selected.id,
      medicineName: selected.name,
      dose: selected.form,
      quantity: 1,
      pharmacyId: selected.pharmacyId,
      pharmacyName: selected.pharmacyName,
      deliveryAddress: address,
      deliveryTimeSlot: slotText,
      deliveryFee: fee,
      total: total + 500,
    }).then(() => {
      setPlacing(false)
      toast(t('del.confirmed'), t('del.confirmedSub'))
      setSelected(undefined)
      setAddress('')
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
                className={`cursor-pointer rounded-2xl transition ${selected?.id === m.id ? 'ring-2 ring-brand-500' : ''}`}
                onClick={() => setSelected(m)}
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
          <h2 className="text-base font-bold text-ink">Commande</h2>
          <p className="mt-0.5 text-sm text-ink-soft">Choisissez un médicament, puis confirmez votre livraison.</p>

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

              {fee === 0 ? (
                <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  Commandes ≥ {formatAr(FREE_ABOVE)} — livraison {t('del.free')}
                </p>
              ) : null}

              <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex justify-between text-ink-soft">
                  <span>Sous-total</span>
                  <span>{selected.price ? formatAr(selected.price) : '—'}</span>
                </div>
                <div className="flex justify-between text-ink-soft">
                  <span>{t('del.fee')}</span>
                  <span>{fee === 0 ? t('del.free') : formatAr(fee)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-ink">
                  <span>{t('del.total')}</span>
                  <span>{total ? formatAr(total + 500) : '—'}</span>
                </div>
              </div>

              <Button
                className="mt-5 w-full"
                loading={placing}
                onClick={handleOrder}
                disabled={!address.trim()}
              >
                <Plus className="h-4 w-4" /> {t('del.place')}
              </Button>
              <p className="mt-2 text-center text-[11px] text-ink-faint">Frais de livraison simulés • Paiement à la livraison</p>
            </>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">Sélectionnez un médicament pour calculer la livraison.</p>
          )}
        </aside>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">Commandes en cours</h2>
          <span className="text-xs text-ink-faint">Historique des livraisons</span>
        </div>
        {deliveries.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon={<Bike className="h-6 w-6" />} title={t('del.noOrders')} description="Vos commandes de livraison apparaîtront ici." />
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
