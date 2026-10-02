import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut, Stethoscope } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { AvatarUploader } from '../../components/AvatarUploader'
import { PasswordChange } from '../../components/PasswordChange'
import { ConfirmationModal } from '../../components/ui/ConfirmationModal'
import { ProviderCatalogForm } from '../../components/ProviderCatalogForm'
import { AccountProfileForm, type AccountValues } from '../../components/AccountProfileForm'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import { apiRoutes } from '../../lib/api'
import { roleLabelKey, PROVIDER_ROLES } from '../../lib/roles'

export function ProviderProfilePage() {
  const { t, toast } = useApp()
  const { user, logout, updateUser, replaceSession } = useAuth()
  const queryClient = useQueryClient()
  const [showLogout, setShowLogout] = useState(false)
  const [nextRole, setNextRole] = useState('')
  const [showSwitch, setShowSwitch] = useState(false)
  const [switching, setSwitching] = useState(false)

  if (!user) return null

  const save = async (values: AccountValues) => {
    const { user: updated } = await apiRoutes.updateProviderMe(values)
    return { user: updated }
  }

  const savePhoto = async (photo: string | null) => {
    const { user: updated } = await apiRoutes.updateProviderMe({ photo: photo ?? '' })
    updateUser(updated)
    toast(t('profile.photoUpdated'), '', 'success')
  }

  return (
    <div className="page-container max-w-2xl py-5 sm:py-7">
      <PageHeader title={t('prov.profile')} subtitle={t('prov.profileDesc')} />

      <div className="mt-5 flex flex-col items-center gap-4 rounded-3xl border border-line bg-card p-5 text-center sm:flex-row sm:text-left">
        <AvatarUploader
          src={user.photo}
          name={`${user.firstName[0] ?? 'P'}${user.lastName[0] ?? ''}`}
          onChange={async (photo) => { await savePhoto(photo) }}
        />
        <div className="min-w-0">
          <p className="text-lg font-bold text-ink">
            {user.firstName} {user.lastName}
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            <Badge tone="brand">
              <Stethoscope className="h-3 w-3" /> {user.role}
            </Badge>
            {user.location && <Badge tone="slate">{user.location}</Badge>}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <AccountProfileForm
          onSave={save}
          sectionTitle={t('admin.profileInfo')}
          sectionIcon={Stethoscope}
          savedMessage={t('prov.saved')}
          savedDescription={t('prov.profileSavedDesc')}
          footer={
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-xs font-medium text-ink-faint">{t('profile.role')}</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">{user.role}</p>
            </div>
          }
        />
      </div>

      {/* Catalog details (practice name, city, price) live on the provider's
          catalog record, not the users table, because the server prices every
          booking from it. It is a separate card with its own save button, so it
          is not nested inside the identity form above. */}
      <div className="mt-6">
        <ProviderCatalogForm />
      </div>

      {/* Let the provider switch between healthcare functions. Switching
          role replaces the catalog record (new table, new pricing shape),
          so it goes through a confirm dialog. */}
      <div className="card mt-6 space-y-4 p-5">
        <div>
          <h2 className="section-title">{t('prov.roleSwitch')}</h2>
          <p className="mt-0.5 text-sm text-ink-soft">{t('prov.roleSwitchDesc')}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm text-ink"
            value={nextRole}
            onChange={(e) => setNextRole(e.target.value)}
          >
            <option value="">{t('prov.roleSwitchPlaceholder')}</option>
            {PROVIDER_ROLES.filter((r) => r !== user.role).map((r) => (
              <option key={r} value={r}>
                {t(roleLabelKey(r))}
              </option>
            ))}
          </select>
          <Button size="lg" disabled={!nextRole || switching} onClick={() => setShowSwitch(true)}>
            {t('prov.roleSwitchAction')}
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <PasswordChange />
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
        <Button fullWidth size="lg" variant="danger" onClick={() => setShowLogout(true)}>
          <LogOut className="h-4 w-4" /> {t('nav.logout')}
        </Button>
      </div>

      <ConfirmationModal
        open={showSwitch}
        onClose={() => setShowSwitch(false)}
        onConfirm={async () => {
          if (!nextRole) return
          setSwitching(true)
          try {
            const { token, user: updated } = await apiRoutes.switchProviderRole(nextRole)
            replaceSession(token, updated)
            await queryClient.invalidateQueries({ queryKey: ['providers', 'me'] })
            toast(t('prov.saved'), t('prov.roleSwitched'), 'success')
            setNextRole('')
          } catch (err) {
            toast(t('common.error'), err instanceof Error ? err.message : undefined, 'error')
          } finally {
            setSwitching(false)
            setShowSwitch(false)
          }
        }}
        title={t('prov.roleSwitchConfirmTitle')}
        message={t('prov.roleSwitchConfirm')}
        confirmLabel={t('prov.roleSwitchAction')}
        cancelLabel={t('common.cancel')}
      />

      <ConfirmationModal
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={logout}
        title={`${t('nav.logout')} ?`}
        message={t('profile.logoutDesc')}
        confirmLabel={t('nav.logout')}
        cancelLabel={t('common.cancel')}
        tone="danger"
      />
    </div>
  )
}