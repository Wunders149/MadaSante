import { useState } from 'react'
import { Home as HomeIcon } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../components/ui/Headers'
import { Button } from '../../components/ui/Button'
import { Input, Label, Select } from '../../components/ui/Field'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/States'
import { apiRoutes } from '../../lib/api'
import { useApp } from '../../stores/AppStore'

const SERVICES = [
  'Soin infirmier de base',
  'Soins de plaie',
  'Injection',
  'Aide à la prise de médicaments',
  'Soins post-hospitalisation',
  'Aide aux personnes âgées',
]

export function HomeCarePage() {
  const { t, toast } = useApp()
  const queryClient = useQueryClient()
  const { data: requests = [] } = useQuery({ queryKey: ['home-requests'], queryFn: apiRoutes.homeRequests })
  const [form, setForm] = useState({ service: SERVICES[0], address: '', reason: '', preferredTime: '', urgency: 'normal' as 'normal' | 'urgence', location: '' })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.address || !form.reason || !form.preferredTime) {
      toast(t('common.error'), t('home.required'), 'error')
      return
    }
    setSaving(true)
    try {
      await apiRoutes.createHomeRequest(form)
      await queryClient.invalidateQueries({ queryKey: ['home-requests'] })
      toast(t('home.sent'), t('home.sentDesc'), 'success')
      setForm({ ...form, address: '', reason: '', preferredTime: '' })
    } catch (err) {
      toast(t('common.error'), err instanceof Error ? err.message : undefined, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('home.title')} subtitle={t('home.subtitle')} />

      <div className="card mt-5 space-y-4 p-5">
        <div>
          <Label>{t('home.service')}</Label>
          <Select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
            {SERVICES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
        <Input label={t('home.address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Input label={t('home.reason')} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t('home.preferredTime')} value={form.preferredTime} placeholder={t('home.preferredTimePh')} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} />
          <div>
            <Label>{t('home.urgency')}</Label>
            <Select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value as 'normal' | 'urgence' })}>
              <option value="normal">{t('home.urgencyNormal')}</option>
              <option value="urgence">{t('home.urgencyUrgent')}</option>
            </Select>
          </div>
        </div>
        <Input label={t('home.location')} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <Button fullWidth size="lg" loading={saving} onClick={submit}>
          <HomeIcon className="h-4 w-4" /> {t('home.submit')}
        </Button>
      </div>

      <h2 className="mt-8 text-lg font-bold text-ink">{t('home.myRequests')}</h2>
      {requests.length === 0 ? (
        <div className="mt-3"><EmptyState icon={<HomeIcon className="h-6 w-6" />} title={t('home.empty')} description={t('home.emptyDesc')} /></div>
      ) : (
        <div className="mt-3 space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-ink">{r.service}</p>
                <Badge tone={r.status === 'completed' ? 'green' : r.status === 'cancelled' ? 'red' : 'amber'}>
                  {t(`home.status.${r.status}`)}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{r.address} — {r.preferredTime}</p>
              {r.providerName && <p className="mt-1 text-xs font-medium text-ink-faint">{t('home.provider')}: {r.providerName}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
