import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, KeyRound, ShieldCheck, UserRound } from 'lucide-react'
import { AuthShell, RoleTabs } from './shared'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import type { Role } from '../../types'

const providerRoles: Role[] = ['doctor', 'nurse', 'pharmacy', 'laboratory', 'imaging_center', 'hospital', 'ambulance_driver']

export function LoginPage() {
  const { t } = useApp()
  const { login, loginAsPatient, loginAsProvider } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'patient' | 'provider'>('patient')
  const [providerRole, setProviderRole] = useState<Role>('doctor')
  const [email, setEmail] = useState('voahangy.andrianiaina@demo.mg')
  const [password, setPassword] = useState('demo')
  const [loading, setLoading] = useState(false)

  const go = (role: Role) => navigate(role === 'patient' ? '/patient' : '/provider')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const role = tab === 'patient' ? 'patient' : providerRole
      await login(email, password, role as Role)
      go(role as Role)
    } finally {
      setLoading(false)
    }
  }

  const quickPatient = async () => {
    setLoading(true)
    await loginAsPatient()
    navigate('/patient')
  }

  const quickProvider = async (role: Role) => {
    setLoading(true)
    await loginAsProvider(role)
    navigate('/provider')
  }

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSub')}>
      <RoleTabs value={tab} onChange={setTab} />

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <Input
          label={t('auth.email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Input
          label={t('auth.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {tab === 'provider' && (
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">{t('auth.asProvider')}</p>
            <div className="flex flex-wrap gap-1.5">
              {providerRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setProviderRole(r)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    providerRole === r
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-line bg-card text-ink-soft'
                  }`}
                >
                  {t(`auth.${r}Role`)}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          <KeyRound className="h-4 w-4" /> {t('auth.signIn')}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
        <span className="h-px flex-1 bg-line" />
        {t('auth.demoLabel')}
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-2">
        <button
          onClick={quickPatient}
          disabled={loading}
          className="card touch-target flex w-full items-center gap-3 p-4 text-left transition hover:border-brand-300"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <UserRound className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-ink">{t('auth.demoPatient')}</span>
            <span className="block text-xs text-ink-soft">{t('auth.demoPatientDesc')}</span>
          </span>
          <span className="text-brand-700">→</span>
        </button>

        <div className="card p-3">
          <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-faint">
            <Building2 className="h-3.5 w-3.5" /> {t('auth.demoProvider')}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {providerRoles.slice(0, 6).map((r) => (
              <button
                key={r}
                disabled={loading}
                onClick={() => quickProvider(r)}
                className="rounded-xl border border-line bg-card px-1 py-2 text-xs font-semibold text-ink-soft transition hover:border-brand-300 hover:text-brand-700"
              >
                {t(`auth.${r}Role`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
          {t('auth.createAccount')}
        </Link>
      </p>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-ink-faint">
        <ShieldCheck className="h-3.5 w-3.5" /> {t('auth.secureBadge')} · {t('auth.privacyNote')}
      </p>
    </AuthShell>
  )
}