import { useState } from 'react'
import { Stethoscope, Building2, FlaskConical, Scan, UserRound, Brain, HandHeart } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { OrientationBanner } from '../../components/OrientationBanner'
import { Button } from '../../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../stores/AppStore'
import { cn } from '../../lib/cn'

const TYPES = [
  { key: 'doctor', icon: Stethoscope, to: '/patient/doctors', desc: 'orient.type.doctorDesc' },
  { key: 'hospital', icon: Building2, to: '/patient/hospitals', desc: 'orient.type.hospitalDesc' },
  { key: 'laboratory', icon: FlaskConical, to: '/patient/laboratories', desc: 'orient.type.labDesc' },
  { key: 'imaging', icon: Scan, to: '/patient/imaging', desc: 'orient.type.imagingDesc' },
  { key: 'nurse', icon: UserRound, to: '/patient/nurses', desc: 'orient.type.nurseDesc' },
  { key: 'professional', icon: Brain, to: '/patient/professionals', desc: 'orient.type.professionalDesc' },
  { key: 'ngo', icon: HandHeart, to: '/patient/ngos', desc: 'orient.type.ngoDesc' },
]

export function OrientationPage() {
  const { t } = useApp()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string>()

  return (
    <div className="page-container max-w-2xl py-5 sm:py-7">
      <PageHeader title={t('orient.title')} subtitle={t('orient.intro')} />

      <OrientationBanner title={t('orient.intro')} />

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink-soft">{t('orient.question')}</h2>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TYPES.map(({ key, icon: Icon, desc }) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            className={cn(
              'flex items-start gap-3 rounded-2xl border p-4 text-left transition',
              selected === key ? 'border-brand-500 bg-brand-soft ring-2 ring-brand-100' : 'border-line bg-card hover:border-brand-300',
            )}
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{t(`orient.type.${key}`)}</p>
              <p className="mt-0.5 text-xs text-ink-soft">{t(desc)}</p>
            </div>
          </button>
        ))}
      </div>

      <Button className="mt-6" size="lg" fullWidth disabled={!selected} onClick={() => selected && navigate(TYPES.find((x) => x.key === selected)!.to)}>
        {t('orient.results')}
      </Button>
    </div>
  )
}
