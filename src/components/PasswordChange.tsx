import { useState } from 'react'
import { KeyRound, Save } from 'lucide-react'
import { Button } from './ui/Button'
import { PasswordInput } from './ui/Field'
import { useApp } from '../stores/AppStore'
import { apiRoutes } from '../lib/api'
import { getPasswordIssues } from '../lib/password'

export function PasswordChange() {
  const { t, toast } = useApp()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event?: React.FormEvent) => {
    event?.preventDefault()

    if (next !== confirm) {
      toast(t('common.error'), t('profile.passwordMismatch'), 'error')
      return
    }

    const issues = getPasswordIssues(next)
    if (issues.length > 0) {
      const message = issues.includes('length')
        ? t('profile.passwordTooShort')
        : t('profile.passwordPolicy')
      toast(t('common.error'), message, 'error')
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
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <PasswordInput
          label={t('profile.currentPassword')}
          value={current}
          name="currentPassword"
          autoComplete="current-password"
          onChange={(e) => setCurrent(e.target.value)}
          // An existing password has no strength to build; only the toggle.
          showMeter={false}
          showHint={false}
        />
        <PasswordInput
          label={t('profile.newPassword')}
          value={next}
          name="newPassword"
          autoComplete="new-password"
          onChange={(e) => setNext(e.target.value)}
        />
        <PasswordInput
          label={t('profile.passwordConfirm')}
          value={confirm}
          name="confirmPassword"
          autoComplete="new-password"
          onChange={(e) => setConfirm(e.target.value)}
          compareTo={next}
        />
        <Button type="submit" fullWidth loading={saving}>
          <Save className="h-4 w-4" /> {t('common.save')}
        </Button>
      </form>
    </div>
  )
}