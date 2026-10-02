import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Settings } from 'lucide-react'
import { useApp } from '../../stores/AppStore'
import { apiRoutes } from '../../lib/api'
import { PageHeader } from '../../components/ui/Headers'
import { Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/States'

export function AdminSettingsPage() {
  const { t, toast } = useApp()
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: ['admin', 'settings'], queryFn: apiRoutes.adminSettings })
  const [feeRate, setFeeRate] = useState('')
  const [deliveryFee, setDeliveryFee] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!data) return
    setFeeRate(String(Math.round(data.platformFeeRate * 10000) / 100))
    setDeliveryFee(String(data.deliveryFee))
  }, [data])

  const save = async () => {
    const ratePct = Number(feeRate)
    const fee = Number(deliveryFee)
    if (!Number.isFinite(ratePct) || ratePct < 0 || ratePct > 100 || !Number.isFinite(fee) || fee < 0) {
      toast(t('common.error'), t('admin.settingsInvalid'), 'error')
      return
    }
    setSaving(true)
    try {
      await apiRoutes.saveAdminSettings({ platformFeeRate: ratePct / 100, deliveryFee: Math.round(fee) })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
      toast(t('admin.settingsSaved'), undefined, 'success')
    } catch (err) {
      toast(t('common.error'), err instanceof Error ? err.message : undefined, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container max-w-2xl py-5 sm:py-7">
      <PageHeader title={t('admin.settings')} subtitle={t('admin.settingsDesc')} />
      {!data ? (
        <div className="mt-6"><EmptyState icon={<Settings className="h-6 w-6" />} title={t('admin.noData')} description={t('admin.noDataDesc')} /></div>
      ) : (
        <div className="card mt-6 space-y-4 p-5">
          <Input label={t('admin.platformFee')} type="number" min={0} max={100} step={0.5} value={feeRate} onChange={(e) => setFeeRate(e.target.value)} />
          <Input label={t('admin.deliveryFee')} type="number" min={0} step={500} value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
          <Button fullWidth size="lg" loading={saving} onClick={save}>
            {t('common.save')}
          </Button>
        </div>
      )}
    </div>
  )
}
