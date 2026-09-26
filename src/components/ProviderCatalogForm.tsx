import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Save, Store, Home as HomeGlyph, Building as BuildingGlyph } from 'lucide-react'
import { Button } from './ui/Button'
import { Input, Label, Textarea } from './ui/Field'
import { ApiError, apiRoutes } from '../lib/api'
import { useProviderMe } from '../lib/hooks'
import { supportsConsultationTypes } from '../lib/roles'
import { useApp } from '../stores/AppStore'
import { cn } from '../lib/cn'
import type { ConsultationType } from '../types'

const CONSULT_OPTIONS: { key: ConsultationType; icon: typeof Store; labelKey: string }[] = [
  { key: 'cabinet', icon: Store, labelKey: 'doctors.cabinetConsult' },
  { key: 'home', icon: HomeGlyph, labelKey: 'doctors.homeConsult' },
  { key: 'hospital', icon: BuildingGlyph, labelKey: 'doctors.hospitalConsult' },
]

/**
 * The professional details a provider owns on their catalog record.
 *
 * These fields — especially the price — are what the server prices every
 * booking from, so they live here rather than in the users table. Approval
 * creates the record with placeholders, which is why this form is the thing
 * that makes a newly approved provider actually bookable.
 */
export function ProviderCatalogForm() {
  const { t, toast } = useApp()
  const queryClient = useQueryClient()
  const { data } = useProviderMe()
  const provider = data?.provider

  const [form, setForm] = useState({
    name: '',
    city: '',
    location: '',
    phone: '',
    price: '',
    priceHome: '',
    specialty: '',
    description: '',
    consultationTypes: [] as ConsultationType[],
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!provider) return
    setForm({
      name: provider.name ?? '',
      city: provider.city ?? '',
      location: provider.location ?? '',
      phone: '',
      price: provider.price != null ? String(provider.price) : '',
      priceHome: provider.priceHome != null ? String(provider.priceHome) : '',
      specialty: provider.specialty ?? '',
      description: provider.description ?? '',
      // Round-trip the configured modes instead of defaulting: overwriting
      // these with ['cabinet'] on save silently dropped a provider's home
      // visits, which changes what patients are charged.
      consultationTypes: (provider.consultationTypes?.length
        ? provider.consultationTypes
        : ['cabinet']) as ConsultationType[],
    })
  }, [provider])

  // Roles that bill per consultation are the only ones with a price to set.
  const isPriced = provider?.price !== undefined || provider?.role === 'doctor' || provider?.role === 'nurse'

  const save = async () => {
    const price = Number(form.price)
    if (isPriced && (!Number.isFinite(price) || price < 0)) {
      toast(t('common.error'), t('prov.priceInvalid'), 'error')
      return
    }
    const priceHomeRaw = form.priceHome.trim()
    const priceHome = priceHomeRaw === '' ? null : Number(priceHomeRaw)
    if (priceHome !== null && (!Number.isFinite(priceHome) || priceHome < 0)) {
      toast(t('common.error'), t('prov.priceInvalid'), 'error')
      return
    }
    setSaving(true)
    try {
      await apiRoutes.updateProviderCatalog({
        name: form.name,
        city: form.city,
        location: form.location,
        phone: form.phone || undefined,
        specialty: form.specialty || undefined,
        description: form.description || undefined,
        ...(isPriced ? { price, priceHome } : {}),
        ...(supportsConsultationTypes(provider?.role) && form.consultationTypes.length > 0
          ? { consultationTypes: form.consultationTypes }
          : {}),
      })
      await queryClient.invalidateQueries({ queryKey: ['providers', 'me'] })
      toast(t('prov.saved'), t('prov.catalogSavedDesc'), 'success')
    } catch (err) {
      toast(t('common.error'), err instanceof ApiError ? err.message : undefined, 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleConsult = (key: ConsultationType) => {
    setForm((prev) => {
      const has = prev.consultationTypes.includes(key)
      // Never let the last type be removed: the booking wizard needs one.
      if (has && prev.consultationTypes.length === 1) return prev
      return {
        ...prev,
        consultationTypes: has
          ? prev.consultationTypes.filter((c) => c !== key)
          : [...prev.consultationTypes, key],
      }
    })
  }

  return (
    <div className="card mt-6 space-y-4 p-5">
      <div>
        <h2 className="section-title">{t('prov.practiceSection')}</h2>
        <p className="mt-0.5 text-sm text-ink-soft">{t('prov.practiceDesc')}</p>
      </div>

      {provider?.needsSetup && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-900">
          {t('prov.setupWarning')}
        </p>
      )}

      <Input
        label={t('prov.orgName')}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t('reg.city')}
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />
        <Input
          label={t('reg.location')}
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
      </div>

      <Input
        label={t('auth.phone')}
        value={form.phone}
        placeholder={provider?.location ?? t('prov.phonePlaceholder')}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />

      {provider?.role === 'doctor' && (
        <Input
          label={t('prov.specialty')}
          value={form.specialty}
          onChange={(e) => setForm({ ...form, specialty: e.target.value })}
        />
      )}

      {provider?.role !== 'doctor' && provider?.specialty && (
        <Input
          label={t('prov.specialty')}
          value={form.specialty}
          onChange={(e) => setForm({ ...form, specialty: e.target.value })}
        />
      )}

      {isPriced && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>{t('prov.priceConsult')}</Label>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={500}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 pr-12 text-sm text-ink transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-faint">
                {t('misc.ar')}
              </span>
            </div>
          </div>
          <div>
            <Label>{t('prov.priceHome')}</Label>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={500}
                value={form.priceHome}
                placeholder={form.price}
                onChange={(e) => setForm({ ...form, priceHome: e.target.value })}
                className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 pr-12 text-sm text-ink transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-faint">
                {t('misc.ar')}
              </span>
            </div>
          </div>
        </div>
      )}

      {supportsConsultationTypes(provider?.role) && (
        <div>
          <Label>{t('prov.consultTypes')}</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {CONSULT_OPTIONS.map(({ key, icon: Icon, labelKey }) => {
              const active = form.consultationTypes.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleConsult(key)}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition',
                    active
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-line bg-card text-ink-soft hover:border-brand-300',
                  )}
                >
                  <Icon className="h-4 w-4" /> {t(labelKey)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <Label>{t('prov.about')}</Label>
        <Textarea
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="resize-none"
        />
      </div>

      <Button fullWidth size="lg" loading={saving} onClick={save}>
        <Save className="h-4 w-4" /> {t('prov.savePractice')}
      </Button>
    </div>
  )
}
