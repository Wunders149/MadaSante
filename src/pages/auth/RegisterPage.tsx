import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, UserPlus } from 'lucide-react'
import { AuthShell, RoleTabs } from './shared'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Field'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import { CITIES } from '../../data/mock'
import type { Role } from '../../types'

export function RegisterPage() {
  const { t } = useApp()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'patient' | 'provider'>('patient')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    location: 'Antananarivo',
    password: '',
    passwordConfirm: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.passwordConfirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    try {
      const role: Role = tab === 'patient' ? 'patient' : 'doctor'
      await register({ ...form, role })
      navigate(role === 'patient' ? '/patient' : '/provider')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title={t('auth.registerTitle')} subtitle={t('auth.registerSub')}>
      <RoleTabs value={tab} onChange={setTab} />

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('auth.firstName')} value={form.firstName} onChange={set('firstName')} required />
          <Input label={t('auth.lastName')} value={form.lastName} onChange={set('lastName')} required />
        </div>
        <Input label={t('auth.phone')} type="tel" value={form.phone} onChange={set('phone')} placeholder="+261 34 …" required />
        <Input label={t('auth.email')} type="email" value={form.email} onChange={set('email')} required />
        <Select label={t('auth.location')} value={form.location} onChange={set('location')}>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('auth.password')} type="password" value={form.password} onChange={set('password')} required />
          <Input
            label={t('auth.passwordConfirm')}
            type="password"
            value={form.passwordConfirm}
            onChange={set('passwordConfirm')}
            required
          />
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          <UserPlus className="h-4 w-4" /> {t('auth.createAccount')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          {t('auth.signIn')}
        </Link>
      </p>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-ink-faint">
        <ShieldCheck className="h-3.5 w-3.5" /> {t('auth.secureBadge')}
      </p>
    </AuthShell>
  )
}