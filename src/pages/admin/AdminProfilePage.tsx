import { useEffect, useState } from 'react'
import { Save, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { AvatarUploader } from '../../components/AvatarUploader'
import { PasswordChange } from '../../components/PasswordChange'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import { apiRoutes } from '../../lib/api'

export function AdminProfilePage() {
  const { t, toast } = useApp()
  const { user, logout, updateUser } = useAuth()
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

  const savePhoto = async (photo: string | null) => {
    const { user: updated } = await apiRoutes.updateMe({ ...form, photo: photo ?? '' })
    updateUser(updated)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={t('admin.profile')} subtitle={t('admin.profileDesc')} />

      <div className="card flex items-center gap-4 p-5">
        <AvatarUploader src={user.photo} name={`${form.firstName} ${form.lastName}`} onChange={savePhoto} />
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-ink">
            {form.firstName} {form.lastName}
          </h2>
          <p className="text-sm text-ink-soft">{form.email}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge tone="brand">
              <ShieldCheck className="h-3 w-3" /> {t('admin.role')}
            </Badge>
            {form.phone ? <Badge tone="slate">{form.phone}</Badge> : null}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-4 text-base font-bold text-ink">{t('admin.profileInfo')}</h3>
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

      <PasswordChange />

      <Button variant="danger" fullWidth onClick={() => setShowLogout(true)}>
        {t('nav.logout')}
      </Button>

      {showLogout && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4" onClick={() => setShowLogout(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink">{t('nav.logout')} ?</h3>
            <p className="mt-1 text-sm text-ink-soft">{t('profile.logoutDesc')}</p>
            <div className="mt-5 flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setShowLogout(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" fullWidth onClick={logout}>
                {t('nav.logout')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
