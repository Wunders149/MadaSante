import { useState } from 'react'
import { ChevronRight, MapPin, Phone, Lock } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useAuth } from '../../stores/AuthStore'
import { useApp } from '../../stores/AppStore'

const MENU = [
  { key: 'nav.profile', to: '/patient/profile', desc: 'Vos informations personnelles' },
  { key: 'nav.appointments', to: '/patient/appointments', desc: 'Consultations et rendez-vous' },
  { key: 'nav.payments', to: '/patient/payments', desc: 'Historique des paiements' },
]

export function ProfilePage() {
  const { user, logout } = useAuth()
  const { t } = useApp()
  const [showLogout, setShowLogout] = useState(false)

  if (!user) return null
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="page-container max-w-2xl py-5 sm:py-7">
      <PageHeader title={t('nav.profile')} subtitle="Gérez vos informations personnelles" />

      <div className="mt-4 flex items-center gap-4 rounded-3xl border border-line bg-card p-5">
        <Avatar name={initials} src={user.photo} size="xl" />
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-ink">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-sm text-ink-soft">{user.email}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge tone="brand">Patient</Badge>
            {user.phone ? <Badge tone="slate">{user.phone}</Badge> : null}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-card">
        {MENU.map((m, i) => (
          <button
            key={m.key}
            onClick={() => {}}
            className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-brand-soft ${i > 0 ? 'border-t border-line' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{t(m.key)}</p>
                <p className="truncate text-xs text-ink-soft">{m.desc}</p>
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
              <p className="text-xs text-ink-soft">Français</p>
            </div>
          </div>
          <Badge tone="green">MG • FR</Badge>
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
          Se déconnecter
        </Button>
      </div>

      {showLogout && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4" onClick={() => setShowLogout(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink">Se déconnecter ?</h3>
            <p className="mt-1 text-sm text-ink-soft">Vous devrez vous reconnecter pour accéder à votre espace.</p>
            <div className="mt-5 flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setShowLogout(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" fullWidth onClick={() => logout()}>
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
