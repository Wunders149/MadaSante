import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronRight, Languages, UserRound, Wallet } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { AvatarUploader } from '../../components/AvatarUploader'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { PasswordChange } from '../../components/PasswordChange'
import { ConfirmationModal } from '../../components/ui/ConfirmationModal'
import { AccountProfileForm, type AccountValues } from '../../components/AccountProfileForm'
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
      <PageHeader title={t('nav.profile')} subtitle={t('profile.subtitle')} />

      <div className="mt-4 flex items-center gap-4 rounded-3xl border border-line bg-card p-5">
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
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge tone="brand">{t('profile.patient')}</Badge>
            {user.location && <Badge tone="slate">{user.location}</Badge>}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <AccountProfileForm
          onSave={save}
          sectionTitle={t('profile.title')}
          sectionIcon={UserRound}
        />
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
              <Languages className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{t('profile.settings.language')}</p>
              <p className="text-xs text-ink-soft">{t('profile.settings.languageDesc')}</p>
            </div>
          </div>
          <Badge tone="green">{langLabel[lang]}</Badge>
        </div>

        <PasswordChange />
      </div>

      <div className="mt-8">
        <Button variant="danger" fullWidth size="lg" onClick={() => setShowLogout(true)}>
          {t('nav.logout')}
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