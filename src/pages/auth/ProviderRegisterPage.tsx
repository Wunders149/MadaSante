import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileUp, ShieldCheck, X } from 'lucide-react'
import { AuthShell } from './shared'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Field'
import { useApp } from '../../stores/AppStore'
import { apiRoutes } from '../../lib/api'
import { CITIES } from '../../lib/constants'
import { roleLabelKey } from '../../lib/roles'
import type { Role } from '../../types'

const providerRoles: Role[] = ['doctor', 'nurse', 'pharmacy', 'laboratory', 'imaging_center', 'hospital', 'ambulance_driver']
const docTypes = ['license', 'diploma', 'id', 'certificate'] as const

interface DraftDoc {
  docType: string
  fileName: string
  mime: string
  data: string
}

function fileToBase64(file: File): Promise<{ mime: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result)
      const idx = result.indexOf('base64,')
      resolve({ mime: file.type || 'application/octet-stream', data: idx >= 0 ? result.slice(idx + 7) : result })
    }
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

export function ProviderRegisterPage() {
  const { t } = useApp()
  const [form, setForm] = useState({
    orgName: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    city: 'Antananarivo',
    location: '',
    role: 'doctor' as Role,
    licenseNumber: '',
    password: '',
    passwordConfirm: '',
  })
  const [docs, setDocs] = useState<DraftDoc[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState<{ reference: string } | null>(null)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const addDocument = (file: File, docType: string) => {
    setError('')
    fileToBase64(file).then(({ mime, data }) => {
      setDocs((prev) => {
        if (prev.length >= 3) return prev
        return [...prev, { docType, fileName: file.name, mime, data }]
      })
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.passwordConfirm) {
      setError(t('reg.passwordMismatch'))
      return
    }
    if (docs.length === 0) {
      setError(t('reg.docsRequired'))
      return
    }
    setLoading(true)
    try {
      const { reference } = await apiRoutes.providerRegister({
        ...form,
        documents: docs.map((d) => ({ ...d })),
      })
      setSubmitted({ reference })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('reg.submitError'))
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <AuthShell title={t('reg.pendingTitle')} subtitle={t('reg.pendingDesc')}>
        <div className="card mt-5 flex flex-col items-center gap-3 p-8 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-700">
            <ShieldCheck className="h-8 w-8" />
          </span>
          <h2 className="text-lg font-extrabold text-ink">{t('reg.pendingTitle')}</h2>
          <p className="text-sm text-ink-soft">{t('reg.pendingStatus')}</p>
          <p className="rounded-xl bg-gray-50 px-4 py-2 font-mono text-sm font-bold text-brand-700">
            {submitted.reference}
          </p>
          <p className="text-xs text-ink-faint">{t('reg.pendingNote')}</p>
          <Button to="/login" fullWidth>
            {t('auth.signIn')}
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t('reg.title')} subtitle={t('reg.subtitle')}>
      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <Select label={t('reg.role')} value={form.role} onChange={set('role')}>
          {providerRoles.map((r) => (
            <option key={r} value={r}>
              {t(roleLabelKey(r))}
            </option>
          ))}
        </Select>
        <Input label={t('reg.orgName')} value={form.orgName} onChange={set('orgName')} required />

        <div className="grid grid-cols-2 gap-3">
          <Input label={t('auth.firstName')} value={form.firstName} onChange={set('firstName')} required />
          <Input label={t('auth.lastName')} value={form.lastName} onChange={set('lastName')} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('auth.phone')} type="tel" value={form.phone} onChange={set('phone')} placeholder="+261 34 …" required />
          <Input label={t('auth.email')} type="email" value={form.email} onChange={set('email')} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label={t('reg.city')} value={form.city} onChange={set('city')}>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Input label={t('reg.location')} value={form.location} onChange={set('location')} placeholder="Analakely, Antananarivo 101" required />
        </div>
        <Input label={t('reg.licenseNumber')} value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="MED-2024-12345" required />
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

        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="mb-2 text-sm font-semibold text-ink">{t('reg.documents')}</p>
          <p className="mb-3 text-xs text-ink-faint">{t('reg.documentsHint')}</p>
          <div className="space-y-2">
            {docs.map((d, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
                <FileUp className="h-4 w-4 shrink-0 text-brand-600" />
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">{d.fileName}</span>
                <select
                  value={d.docType}
                  onChange={(e) => setDocs((prev) => prev.map((p, j) => (j === i ? { ...p, docType: e.target.value } : p)))}
                  className="rounded-lg border border-line bg-card px-2 py-1 text-xs font-semibold text-ink focus:outline-none"
                >
                  {docTypes.map((dt) => (
                    <option key={dt} value={dt}>{t(`reg.docType.${dt}`)}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setDocs((prev) => prev.filter((_, j) => j !== i))}
                  className="shrink-0 text-ink-faint transition hover:text-red-500"
                  aria-label={t('reg.removeDocument')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {docs.length < 3 && (
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-soft/40 px-3 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-soft/70">
              <FileUp className="h-4 w-4" />
              {t('reg.addDocument')}
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) addDocument(file, 'id')
                  e.currentTarget.value = ''
                }}
              />
            </label>
          )}
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          <ShieldCheck className="h-4 w-4" /> {t('reg.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          {t('auth.signIn')}
        </Link>
      </p>
    </AuthShell>
  )
}