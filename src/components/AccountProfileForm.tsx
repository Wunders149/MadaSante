import { useEffect, useMemo, useState } from 'react'
import { Mail, MapPin, Phone, RotateCcw, Save, User, type LucideIcon } from 'lucide-react'
import { Button } from './ui/Button'
import { Input, Label } from './ui/Field'
import { ConfirmationModal } from './ui/ConfirmationModal'
import { useApp } from '../stores/AppStore'
import { useAuth } from '../stores/AuthStore'
import { apiRoutes, ApiError, type AccountPatch } from '../lib/api'
import { cn } from '../lib/cn'
import type { User as UserRecord } from '../types'

/**
 * The identity form shared by the patient, provider and admin profile pages.
 *
 * Those three pages were near-identical copies: same state, same save call, same
 * avatar handler, and none of them told you when you had unsaved edits. The
 * behaviour now lives here once.
 *
 * Differences between the three are supplied as props: a section title, whether
 * the role is shown read-only, and extra content rendered after the fields
 * (the provider's catalog form).
 */

export interface AccountValues {
  firstName: string
  lastName: string
  phone: string
  email: string
  location: string
}

interface Props {
  /** Persists the edit. Defaults to the shared `/auth/me` endpoint. */
  onSave?: (values: AccountValues) => Promise<{ user: UserRecord }>
  /** Heading for the fields card. */
  sectionTitle?: string
  sectionIcon?: LucideIcon
  sectionHint?: string
  /** Extra read-only rows shown in the card footer (role, account id, …). */
  footer?: React.ReactNode
  savedMessage?: string
  savedDescription?: string
  /**
   * Changing the sign-in address is the one edit here that can lock someone out
   * of their own account, so it is confirmed. Off by default.
   */
  confirmEmailChange?: boolean
  confirmEmailTitle?: string
  confirmEmailBody?: string
  emailHint?: string
  /** Rejects the save client-side, e.g. a price the server would refuse. */
  validate?: (values: AccountValues) => Partial<Record<keyof AccountValues, string>>
}

const EMPTY: AccountValues = { firstName: '', lastName: '', phone: '', email: '', location: '' }

/** Mirrors the server's `updateMeSchema` so the user is told before a round trip. */
function validateBasics(values: AccountValues): Partial<Record<keyof AccountValues, string>> {
  const errors: Partial<Record<keyof AccountValues, string>> = {}
  if (!values.firstName.trim()) errors.firstName = 'required'
  if (!values.lastName.trim()) errors.lastName = 'required'
  if (!values.phone.trim()) errors.phone = 'required'
  else if (values.phone.trim().length < 5) errors.phone = 'tooShort'
  if (!values.email.trim()) errors.email = 'required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'invalid'
  return errors
}

export function AccountProfileForm({
  onSave,
  sectionTitle,
  sectionIcon: Icon = User,
  sectionHint,
  footer,
  savedMessage,
  savedDescription,
  confirmEmailChange = false,
  confirmEmailTitle,
  confirmEmailBody,
  emailHint,
  validate,
}: Props) {
  const { t, toast } = useApp()
  const { user, updateUser } = useAuth()

  const baseline = useMemo<AccountValues>(
    () => ({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      email: user?.email ?? '',
      location: user?.location ?? '',
    }),
    [user],
  )

  const [values, setValues] = useState<AccountValues>(baseline)
  const [errors, setErrors] = useState<Partial<Record<keyof AccountValues, string>>>({})
  const [saving, setSaving] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  // Re-sync when the stored user changes (login, or a save from elsewhere).
  useEffect(() => setValues(baseline), [baseline])

  const dirty = useMemo(
    () => (Object.keys(EMPTY) as (keyof AccountValues)[]).some((k) => values[k] !== baseline[k]),
    [values, baseline],
  )

  const set = (key: keyof AccountValues) => (value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  /**
   * Refuse to lose edits. `beforeunload` covers a reload or a closed tab; the
   * in-app guard covers a sidebar link, which a native prompt cannot catch.
   */
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const errorText = (key: keyof AccountValues) => {
    const code = errors[key]
    if (!code) return undefined
    if (code === 'required') return t('profile.errRequired')
    if (code === 'tooShort') return t('profile.errTooShort')
    if (code === 'invalid') return t('profile.errInvalidEmail')
    return code
  }

  const commit = async (payload: AccountValues) => {
    setSaving(true)
    try {
      const result = onSave
        ? await onSave(payload)
        : await apiRoutes.updateMe(payload as AccountPatch)
      // The endpoint answers `{ user }`; keep the store authoritative.
      if (result?.user) updateUser(result.user)
      toast(
        savedMessage ?? t('prov.saved'),
        savedDescription ?? t('prov.profileSavedDesc'),
        'success',
      )
    } catch (err) {
      const message = err instanceof ApiError ? err.message : undefined
      toast(t('common.error'), message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const save = async () => {
    const found = { ...validateBasics(values), ...(validate?.(values) ?? {}) }
    setErrors(found)
    if (Object.keys(found).length > 0) {
      toast(t('common.error'), t('profile.errFixFields'), 'error')
      return
    }
    // An address change is the one edit that can lock the account out of its
    // own console, so it is confirmed before it is sent.
    if (confirmEmailChange && values.email.trim() !== baseline.email) {
      setPendingEmail(values.email.trim())
      return
    }
    await commit(values)
  }

  const discard = () => {
    setValues(baseline)
    setErrors({})
  }

  if (!user) return null

  const SectionHead = (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-bold text-ink">{sectionTitle ?? t('profile.title')}</h3>
        {sectionHint && <p className="text-xs text-ink-soft">{sectionHint}</p>}
      </div>
    </div>
  )

  return (
    <>
      <div className="rounded-3xl border border-line bg-card p-5">
        {SectionHead}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>{t('auth.firstName')}</Label>
            <Input
              value={values.firstName}
              onChange={(e) => set('firstName')(e.target.value)}
              aria-invalid={Boolean(errors.firstName)}
            />
            {errorText('firstName') && (
              <p className="mt-1 text-xs font-medium text-red-600">{errorText('firstName')}</p>
            )}
          </div>
          <div>
            <Label>{t('auth.lastName')}</Label>
            <Input
              value={values.lastName}
              onChange={(e) => set('lastName')(e.target.value)}
              aria-invalid={Boolean(errors.lastName)}
            />
            {errorText('lastName') && (
              <p className="mt-1 text-xs font-medium text-red-600">{errorText('lastName')}</p>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>{t('common.phone')}</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                value={values.phone}
                onChange={(e) => set('phone')(e.target.value)}
                placeholder="+261 34 …"
                aria-invalid={Boolean(errors.phone)}
                className={cn(
                  'w-full rounded-xl border bg-card py-2.5 pl-10 pr-3.5 text-sm text-ink transition focus:outline-none focus:ring-2',
                  errors.phone
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                    : 'border-line focus:border-brand-400 focus:ring-brand-200',
                )}
              />
            </div>
            {errorText('phone') && (
              <p className="mt-1 text-xs font-medium text-red-600">{errorText('phone')}</p>
            )}
          </div>
          <div>
            <Label>{t('common.email')}</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                type="email"
                value={values.email}
                onChange={(e) => set('email')(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                className={cn(
                  'w-full rounded-xl border bg-card py-2.5 pl-10 pr-3.5 text-sm text-ink transition focus:outline-none focus:ring-2',
                  errors.email
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                    : 'border-line focus:border-brand-400 focus:ring-brand-200',
                )}
              />
            </div>
            {errorText('email') ? (
              <p className="mt-1 text-xs font-medium text-red-600">{errorText('email')}</p>
            ) : (
              emailHint && <p className="mt-1 text-xs text-ink-faint">{emailHint}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Label>{t('common.address')}</Label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              value={values.location}
              onChange={(e) => set('location')(e.target.value)}
              className="w-full rounded-xl border border-line bg-card py-2.5 pl-10 pr-3.5 text-sm text-ink transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
        </div>

        {footer}

        {/* Save stays disabled until something actually changes, so the button
            is honest about whether there is anything to do. */}
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row">
          <Button
            fullWidth
            size="lg"
            loading={saving}
            disabled={!dirty}
            onClick={() => void save()}
          >
            <Save className="h-4 w-4" /> {t('common.save')}
          </Button>
          {dirty && (
            <Button fullWidth size="lg" variant="ghost" onClick={discard}>
              <RotateCcw className="h-4 w-4" /> {t('profile.discard')}
            </Button>
          )}
        </div>

        {dirty && (
          <p className="mt-2.5 text-center text-xs font-medium text-amber-700">
            {t('profile.unsaved')}
          </p>
        )}
      </div>

      <ConfirmationModal
        open={pendingEmail !== null}
        onClose={() => setPendingEmail(null)}
        onConfirm={async () => {
          const next = pendingEmail
          setPendingEmail(null)
          if (next) await commit({ ...values, email: next })
        }}
        title={confirmEmailTitle ?? t('profile.confirmEmailTitle')}
        message={confirmEmailBody ?? t('profile.confirmEmailBody')}
        confirmLabel={t('common.save')}
        cancelLabel={t('common.cancel')}
      />
    </>
  )
}
