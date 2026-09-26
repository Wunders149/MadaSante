import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { AuthShell, RoleTabs } from './shared'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Field'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import { roleLabelKey, PROVIDER_ROLES } from '../../lib/roles'
import type { Role } from '../../types'

const providerRoles: Role[] = [...PROVIDER_ROLES]

export function LoginPage() {
  const { t, toast } = useApp()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'patient' | 'provider'>('patient')
  const [providerRole, setProviderRole] = useState<Role>('doctor')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const go = (role: Role) => navigate(role === 'patient' ? '/patient' : '/provider')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const role = tab === 'patient' ? 'patient' : providerRole
      await login(email, password, role as Role)
      go(role as Role)
    } catch (err) {
      toast('Connexion impossible', err instanceof Error ? err.message : 'Erreur inattendue', 'error')
    } finally {
      setLoading(false)
    }
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
            {/* A chip per role stopped being readable once the catalogue grew
                past a dozen professions; a select keeps every role reachable. */}
            <Select
              label={t('auth.asProvider')}
              value={providerRole}
              onChange={(e) => setProviderRole(e.target.value as Role)}
            >
              {providerRoles.map((r) => (
                <option key={r} value={r}>
                  {t(roleLabelKey(r))}
                </option>
              ))}
            </Select>
            <p className="mt-1.5 text-xs text-ink-faint">{t('auth.roleHint')}</p>
          </div>
        )}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          <KeyRound className="h-4 w-4" /> {t('auth.signIn')}
        </Button>
      </form>

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