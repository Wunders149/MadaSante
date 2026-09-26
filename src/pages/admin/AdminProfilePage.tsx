import { useState } from 'react'
import { Fingerprint, IdCard, LogOut, ShieldCheck, UserCog } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmationModal } from '../../components/ui/ConfirmationModal'
import { AvatarUploader } from '../../components/AvatarUploader'
import { PasswordChange } from '../../components/PasswordChange'
import { AccountProfileForm, type AccountValues } from '../../components/AccountProfileForm'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import { apiRoutes } from '../../lib/api'

/**
 * Super admin profile.
 *
 * The identity fields, validation and unsaved-edit handling are shared with the
 * patient and provider pages via `AccountProfileForm`; this page adds the parts
 * that are specific to an administrator — what the account is allowed to do, and
 * a warning that the sign-in address is the way back in.
 */
export function AdminProfilePage() {
  const { t, toast } = useApp()
  const { user, logout, updateUser } = useAuth()
  const [showLogout, setShowLogout] = useState(false)

  if (!user) return null

  const save = async (values: AccountValues) => {
    const { user: updated } = await apiRoutes.updateMe(values)
    return { user: updated }
  }

  const savePhoto = async (photo: string | null) => {
    const { user: updated } = await apiRoutes.updateMe({ photo: photo ?? '' })
    updateUser(updated)
    toast(t('profile.photoUpdated'), '', 'success')
  }

  return (
    <div className="page-container max-w-2xl py-5 sm:py-7">
      <PageHeader title={t('admin.profile')} subtitle={t('admin.profileDesc')} />

      {/* Identity banner */}
      <div className="mt-5 flex flex-col items-center gap-4 rounded-3xl border border-line bg-card p-5 text-center sm:flex-row sm:text-left">
        <AvatarUploader
          src={user.photo}
          name={`${user.firstName} ${user.lastName}`}
          onChange={async (photo) => { await savePhoto(photo) }}
        />
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-ink">
            {user.firstName} {user.lastName}
          </h2>
          <p className="truncate text-sm text-ink-soft">{user.email}</p>
          <div className="mt-1.5 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            <Badge tone="brand">
              <ShieldCheck className="h-3 w-3" /> {t('admin.role')}
            </Badge>
            {user.location && <Badge tone="slate">{user.location}</Badge>}
          </div>
        </div>
      </div>

      {/* What this account can do — an admin's authority is not obvious from a
          profile form, and it is the thing worth stating plainly. */}
      <section className="mt-6 rounded-3xl border border-line bg-card p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <UserCog className="h-4.5 w-4.5" />
          </span>
          <h3 className="text-base font-bold text-ink">{t('admin.authority')}</h3>
        </div>
        <p className="text-sm text-ink-soft">{t('admin.authorityDesc')}</p>
        <ul className="mt-3 space-y-1.5">
          {['admin.authorityValidate', 'admin.authorityPatients', 'admin.authorityRead'].map(
            (key) => (
              <li key={key} className="flex items-start gap-2 text-sm text-ink-soft">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                {t(key)}
              </li>
            ),
          )}
        </ul>
      </section>

      <div className="mt-6">
        <AccountProfileForm
          onSave={save}
          sectionTitle={t('admin.profileInfo')}
          sectionIcon={IdCard}
          savedMessage={t('admin.saved')}
          savedDescription={t('admin.savedDesc')}
          confirmEmailChange
          confirmEmailTitle={t('admin.confirmEmailTitle')}
          confirmEmailBody={t('admin.confirmEmailBody')}
          emailHint={t('admin.emailHint')}
          footer={
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-xs text-ink-faint">
              <Fingerprint className="h-3.5 w-3.5" />
              <span className="font-mono">{user.id}</span>
            </div>
          }
        />
      </div>

      <div className="mt-6">
        <PasswordChange />
      </div>

      <div className="mt-8">
        <Button variant="danger" fullWidth size="lg" onClick={() => setShowLogout(true)}>
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
