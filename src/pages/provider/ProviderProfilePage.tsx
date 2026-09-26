import { useState } from 'react'
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

export function ProviderProfilePage() {
  const { t, toast } = useApp()
  const { user, logout, updateUser } = useAuth()
  const [showLogout, setShowLogout] = useState(false)

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

      <div className="mt-6">
        <PasswordChange />
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
        <Button fullWidth size="lg" variant="danger" onClick={() => setShowLogout(true)}>
          <LogOut className="h-4 w-4" /> {t('nav.logout')}
        </Button>
      </div>

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