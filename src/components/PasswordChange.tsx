import { useState } from 'react'
import { KeyRound, Save } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Field'
import { useApp } from '../stores/AppStore'
import { apiRoutes } from '../lib/api'

export function PasswordChange() {
  const { t, toast } = useApp()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (next !== confirm) {
      toast(t('common.error'), t('profile.passwordMismatch'), 'error')
      return
    }
    if (next.length < 6) {
      toast(t('common.error'), t('profile.passwordTooShort'), 'error')
      return
    }
    setSaving(true)
    try {
      await apiRoutes.changePassword({ currentPassword: current, newPassword: next })
      toast(t('profile.passwordChanged'), t('profile.passwordChangedDesc'), 'success')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      toast(t('common.error'), err instanceof Error ? err.message : undefined, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl border border-line bg-card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <KeyRound className="h-4.5 w-4.5" />
        </span>
        <h3 className="text-base font-bold text-ink">{t('profile.passwordSection')}</h3>
      </div>
      <div className="space-y-4">
        <Input
          type="password"
          label={t('profile.currentPassword')}
          value={current}
          autoComplete="current-password"
          onChange={(e) => setCurrent(e.target.value)}
        />
        <Input
          type="password"
          label={t('profile.newPassword')}
          value={next}
          autoComplete="new-password"
          onChange={(e) => setNext(e.target.value)}
        />
        <Input
          type="password"
          label={t('profile.passwordConfirm')}
          value={confirm}
          autoComplete="new-password"
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button fullWidth loading={saving} onClick={submit}>
          <Save className="h-4 w-4" /> {t('common.save')}
        </Button>
      </div>
    </div>
  )
}