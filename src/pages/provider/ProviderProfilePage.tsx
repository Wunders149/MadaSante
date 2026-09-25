import { useEffect, useState } from 'react'
import { MapPin, Phone, Stethoscope, Save } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Label, Input, Textarea } from '../../components/ui/Field'
import { Avatar } from '../../components/Avatar'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import { apiRoutes } from '../../lib/api'
import { cn } from '../../lib/cn'

export function ProviderProfilePage() {
  const { t, toast } = useApp()
  const { user, logout } = useAuth()

  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    role: user?.role ?? '',
    location: user?.location ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      location: user.location ?? '',
      phone: user.phone,
      email: user.email,
    })
  }, [user])

  const save = async () => {
    setSaving(true)
    try {
      await apiRoutes.updateProviderMe({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        location: form.location,
      })
      toast(t('prov.saved'), t('prov.profileSavedDesc'), 'success')
    } catch {
      toast(t('common.error'), '', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container max-w-2xl py-5 sm:py-7">
      <PageHeader title={t('prov.profile')} subtitle={t('prov.profileDesc')} />

      <div className="mt-5 flex items-center gap-4">
        <Avatar src={user?.photo} name={`${form.firstName[0] ?? 'P'}${form.lastName[0] ?? ''}`} size="xl" />
        <div className="min-w-0">
          <p className="text-lg font-bold text-ink">{form.firstName} {form.lastName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone="brand">
              <Stethoscope className="h-3 w-3" /> {form.role}
            </Badge>
            {form.location && <Badge tone="slate">{form.location}</Badge>}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('auth.firstName')}
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Input
            label={t('auth.lastName')}
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>

        <Input
          label={t('apt.service')}
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>{t('common.address')}</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className={cn('w-full rounded-xl border border-line bg-card px-3.5 py-2.5 pl-10 text-sm text-ink transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200')}
              />
            </div>
          </div>
          <div>
            <Label>{t('common.email')}</Label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm text-ink transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
        </div>

        <div>
          <Label>{t('common.phone')}</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 pl-10 text-sm text-ink transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
        </div>

        <div>
          <Label>{t('profile.bio')}</Label>
          <Textarea
            rows={4}
            value={`${form.firstName} ${form.lastName} — ${form.role}`}
            onChange={() => undefined}
            className="resize-none"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button fullWidth size="lg" loading={saving} onClick={save}>
          <Save className="h-4 w-4" /> {t('common.save')}
        </Button>
        <Button fullWidth size="lg" variant="danger" onClick={logout}>
          {t('nav.logout')}
        </Button>
      </div>
    </div>
  )
}