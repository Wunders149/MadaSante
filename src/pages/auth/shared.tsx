import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Logo } from '../../components/Logo'
import { useApp } from '../../stores/AppStore'
import { cn } from '../../lib/cn'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[44%] flex-col justify-between overflow-hidden bg-brand-700 p-10 lg:flex">
        <Logo light />
        <div className="max-w-sm">
          <h1 className="text-4xl font-extrabold leading-tight text-white">
            Votre santé, coordinate avec <span className="text-brand-100">Mada Santé</span>.
          </h1>
          <p className="mt-3 text-lg text-brand-100">
            manampy anao — médecins, hôpitaux, pharmacies, laboratoires, imagerie, infirmières et ambulances au même endroit.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-brand-50">
          <ShieldCheck className="h-6 w-6 shrink-0" />
          <p className="text-sm">
            Prototypes démo — données réalistes. L’API sécurisée (JWT) sera connectée au backend.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-page px-4 py-8">
        <div className="mb-6 w-full max-w-md lg:hidden">
          <Logo />
        </div>
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
            <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
            <p className="mt-1 text-ink-soft">{subtitle}</p>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function RoleTabs({ value, onChange }: { value: 'patient' | 'provider'; onChange: (v: 'patient' | 'provider') => void }) {
  const { t } = useApp()
  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-gray-100 p-1">
      {(['patient', 'provider'] as const).map((role) => (
        <button
          key={role}
          onClick={() => onChange(role)}
          className={cn(
            'rounded-xl py-2.5 text-sm font-semibold transition',
            value === role ? 'bg-card text-brand-700 shadow-sm' : 'text-ink-soft',
          )}
          aria-pressed={value === role}
        >
          {t(role === 'patient' ? 'auth.demoPatient' : 'auth.demoProvider')}
        </button>
      ))}
    </div>
  )
}

export function BottomLinks() {
  const { t } = useApp()
  return (
    <p className="mt-6 text-center text-sm text-ink-soft">
      {t('auth.noAccount')}{' '}
      <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
        {t('auth.createAccount')}
      </Link>
    </p>
  )
}

export function useLoginRedirect() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  return (path?: string) => navigate(path ?? from ?? '/')
}

export default AuthShell