import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, MapPin, RotateCcw } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { Button } from '../../components/ui/Button'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import { useAvailability, useProviderMe } from '../../lib/hooks'
import { ApiError, apiRoutes } from '../../lib/api'
import { cn } from '../../lib/cn'

const DAYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'] as const
const SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'] as const
const ALL_ON = DAYS.flatMap((d) => SLOTS.map((s) => `${d}-${s}`))

export function ProviderAvailabilityPage() {
  const { t, toast } = useApp()
  const { user } = useAuth()
  const { data: profile } = useProviderMe()
  const { data: savedEntries } = useAvailability()
  const [on, setOn] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [savedSnapshot, setSavedSnapshot] = useState<Record<string, boolean>>({})

  // Seed from the server, defaulting every slot to open. GET /me/availability
  // returns only the rows that were written, so absent rows mean "open".
  useEffect(() => {
    if (!savedEntries) return
    const next: Record<string, boolean> = {}
    ALL_ON.forEach((key) => (next[key] = true))
    savedEntries.forEach((e) => {
      const key = `${e.day}-${e.slot}`
      if (key in next) next[key] = e.available
    })
    setOn(next)
    setSavedSnapshot(next)
  }, [savedEntries])

  const toggle = (key: string) => setOn((prev) => ({ ...prev, [key]: !prev[key] }))

  const toggleDay = (day: string) =>
    setOn((prev) => {
      const shouldOpen = SLOTS.some((slot) => !prev[`${day}-${slot}`])
      const next = { ...prev }
      SLOTS.forEach((slot) => (next[`${day}-${slot}`] = shouldOpen))
      return next
    })

  const openCount = useMemo(
    () => DAYS.reduce((sum, d) => sum + SLOTS.filter((s) => on[`${d}-${s}`]).length, 0),
    [on],
  )
  const total = DAYS.length * SLOTS.length
  const dirty = useMemo(
    () => ALL_ON.some((key) => on[key] !== savedSnapshot[key]),
    [on, savedSnapshot],
  )

  const save = async () => {
    setSaving(true)
    try {
      const entries = DAYS.flatMap((d) =>
        SLOTS.map((s) => ({ day: d, slot: s, available: Boolean(on[`${d}-${s}`]) })),
      )
      await apiRoutes.saveAvailability(entries)
      setSavedSnapshot(on)
      toast(t('prov.availabilitySaved'), t('prov.availabilitySavedDesc', { n: openCount }), 'success')
    } catch (err) {
      toast(t('common.error'), err instanceof ApiError ? err.message : undefined, 'error')
    } finally {
      setSaving(false)
    }
  }

  const location = profile?.provider?.location ?? user?.location ?? t('common.location')

  return (
    <div className="page-container max-w-4xl py-5 sm:py-7">
      <PageHeader title={t('prov.availability')} subtitle={profile?.provider?.name ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`} />

      <div className="mt-4 overflow-hidden rounded-3xl border border-line bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-brand-softer px-5 py-3">
          <span className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
            <CalendarDays className="h-4 w-4 text-brand-600" />
            {t('prov.slotsOpen', { n: openCount, total })}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOn(() => Object.fromEntries(ALL_ON.map((k) => [k, true])))}
            >
              {t('prov.openAll')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOn(() => Object.fromEntries(ALL_ON.map((k) => [k, false])))}
            >
              <RotateCcw className="h-4 w-4" /> {t('prov.closeAll')}
            </Button>
          </div>
        </div>

        {/* One row per day with a whole-day toggle, instead of a flat wall of
            63 identical cells where it is impossible to tell where one day
            ends and the next begins. */}
        <div className="divide-y divide-line">
          {DAYS.map((day) => {
            const openSlots = SLOTS.filter((slot) => on[`${day}-${slot}`]).length
            const allOpen = openSlots === SLOTS.length
            return (
              <div key={day} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  aria-pressed={!allOpen}
                  className="flex w-20 shrink-0 items-center gap-2 text-sm font-bold text-ink"
                >
                  <span
                    className={cn(
                      'grid h-5 w-5 place-items-center rounded-md border transition',
                      allOpen ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-card',
                    )}
                  >
                    {allOpen ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>
                  {t(`apt.dayShort.${day}`)}
                </button>
                <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                  {SLOTS.map((slot) => {
                    const key = `${day}-${slot}`
                    const active = Boolean(on[key])
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggle(key)}
                        aria-pressed={active}
                        className={cn(
                          'min-h-9 rounded-lg px-2.5 font-mono text-xs font-semibold transition',
                          active
                            ? 'bg-brand-50 text-brand-800 hover:bg-brand-100'
                            : 'bg-gray-100 text-ink-faint hover:bg-gray-200',
                        )}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate">{location}</span>
        </div>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs font-semibold text-amber-700">{t('prov.unsavedChanges')}</span>}
          <Button onClick={save} loading={saving} disabled={!dirty}>
            <Check className="h-4 w-4" /> {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
