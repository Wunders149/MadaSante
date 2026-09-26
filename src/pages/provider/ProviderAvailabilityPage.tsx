import { useEffect, useState } from 'react'
import { CalendarDays, Check, MapPin } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { Button } from '../../components/ui/Button'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import { useAvailability, useProviderMe } from '../../lib/hooks'
import { apiRoutes } from '../../lib/api'
import { cn } from '../../lib/cn'

const DAYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']
const SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']

export function ProviderAvailabilityPage() {
  const { t, toast } = useApp()
  const { user } = useAuth()
  const { data: profile } = useProviderMe()
  const { data: availabilityEntries } = useAvailability()
  const [on, setOn] = useState<Record<string, boolean>>(() => {
    const base: Record<string, boolean> = {}
    DAYS.forEach((d) => SLOTS.forEach((s) => (base[`${d}-${s}`] = true)))
    return base
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!availabilityEntries || availabilityEntries.length === 0) return
    const next: Record<string, boolean> = {}
    DAYS.forEach((d) => SLOTS.forEach((s) => (next[`${d}-${s}`] = true)))
    availabilityEntries.forEach((e) => {
      const k = `${e.day}-${e.slot}`
      if (next[k] !== undefined) next[k] = e.available
    })
    setOn(next)
  }, [availabilityEntries])

  const toggle = (k: string) => setOn((p) => ({ ...p, [k]: !p[k] }))

  const openCount = DAYS.reduce(
    (sum, d) => sum + SLOTS.filter((s) => on[`${d}-${s}`]).length,
    0,
  )

  const save = async () => {
    setSaving(true)
    try {
      const entries = DAYS.flatMap((d) =>
        SLOTS.map((s) => ({ day: d, slot: s, available: on[`${d}-${s}`] })),
      )
      await apiRoutes.saveAvailability(entries)
      toast(t('prov.availabilitySaved'), t('apt.stepDone'), 'success')
    } catch {
      toast(t('common.error'), '', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container max-w-3xl py-5 sm:py-7">
      <PageHeader title={t('prov.availability')} subtitle={profile?.provider?.name ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`} />

      <div className="mt-4 overflow-hidden rounded-3xl border border-line bg-card">
        <div className="flex items-center gap-2 border-b border-line bg-brand-softer px-5 py-3">
          <CalendarDays className="h-4 w-4 text-brand-600" />
          <span className="text-xs font-semibold text-ink-soft">
            {t('prov.slotsOpen', { n: openCount, total: DAYS.length * SLOTS.length })}
          </span>
        </div>
        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map((d) =>
            SLOTS.map((s) => {
              const k = `${d}-${s}`
              return (
                <button
                  key={k}
                  onClick={() => toggle(k)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-left text-sm transition',
                    on[k] ? 'bg-brand-50 text-brand-800' : 'bg-card text-ink-faint',
                  )}
                >
                  <Check className={cn('h-4 w-4', on[k] ? 'text-brand-600' : 'opacity-30')} />
                  <span className="w-10 font-semibold">{t(`apt.dayShort.${d}`)}</span>
                  <span className="ml-auto font-mono text-xs">{s}</span>
                </button>
              )
            }),
          )}
        </div>
      </div>

      <div className="mt-9 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <MapPin className="h-4 w-4" />
          {profile?.provider?.location ?? user?.location ?? t('common.location')}
        </div>
        <Button onClick={save} loading={saving}>
          <Check className="h-4 w-4" /> {t('common.save')}
        </Button>
      </div>
    </div>
  )
}
