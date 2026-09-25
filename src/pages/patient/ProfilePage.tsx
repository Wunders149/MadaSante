import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronRight, Lock, Phone, Save, Wallet } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Field'
import { useAuth } from '../../stores/AuthStore'
import { useApp } from '../../stores/AppStore'
import { apiRoutes } from '../../lib/api'

const langLabel = { fr: 'Français', en: 'English', mg: 'Malagasy' } as const

const MENU = [
  { key: 'profile.section.appointments', to: '/patient/appointments', icon: CalendarDays },
  { key: 'profile.section.payments', to: '/patient/payments', icon: Wallet },
]

export function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const { t, toast, lang } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    location: user?.location ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [showLogout, setShowLogout] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      location: user.location ?? '',
    })
  }, [user])

  if (!user) return null
  const initials = `${form.firstName[0] ?? ''}${form.lastName[0] ?? ''}`.toUpperCase()

  const save = async () => {
    setSaving(true)
    try {
      const { user: updated } = await apiRoutes.updateMe(form)
      updateUser(updated)
      toast(t('prov.saved'), t('prov.profileSavedDesc'), 'success')
    } catch (err) {
      toast(t('common.error'), err instanceof Error ? err.message : undefined, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container max-w-2xl py-5 sm:py-7">
      <PageHeader title={t('nav.profile')} subtitle={t('profile.subtitle')} />

      <div className="mt-4 flex items-center gap-4 rounded-3xl border border-line bg-card p-5">
        <Avatar name={initials} src={user.photo} size="xl" />
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-ink">
            {form.firstName} {form.lastName}
          </h2>
          <p className="text-sm text-ink-soft">{form.email}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge tone="brand">Patient</Badge>
            {form.phone ? <Badge tone="slate">{form.phone}</Badge> : null}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-line bg-card p-5">
        <h3 className="mb-4 text-base font-bold text-ink">{t('profile.title')}</h3>
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
          <Input
            label={t('common.phone')}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label={t('common.email')}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Input
              label={t('common.address')}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-5">
          <Button fullWidth size="lg" loading={saving} onClick={save}>
            <Save className="h-4 w-4" /> {t('common.save')}
          </Button>
        </div>
      </div>

      {/* Navigation links */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-card">
        {MENU.map((m, i) => (
          <button
            key={m.key}
            onClick={() => navigate(m.to)}
            className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-brand-soft ${i > 0 ? 'border-t border-line' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <m.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{t(m.key)}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-ink-faint" />
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-3xl border border-line bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Langue</p>
              <p className="text-xs text-ink-soft">Langue d’affichage</p>
            </div>
          </div>
          <Badge tone="green">{langLabel[lang]}</Badge>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-3xl border border-line bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Confidentialité</p>
              <p className="text-xs text-ink-soft">Vos données restent privées et sécurisées</p>
            </div>
          </div>
          <Badge tone="green">Sécurisé</Badge>
        </div>
      </div>

      <div className="mt-8">
        <Button variant="danger" fullWidth onClick={() => setShowLogout(true)}>
          {t('nav.logout')}
        </Button>
      </div>

      {showLogout && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4" onClick={() => setShowLogout(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink">{t('nav.logout')} ?</h3>
            <p className="mt-1 text-sm text-ink-soft">Vous devrez vous reconnecter pour accéder à votre espace.</p>
            <div className="mt-5 flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setShowLogout(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" fullWidth onClick={() => logout()}>
                {t('nav.logout')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}