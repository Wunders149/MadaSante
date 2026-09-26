import { Languages } from 'lucide-react'
import { useApp } from '../stores/AppStore'

const langLabel = { fr: 'FR', en: 'EN', mg: 'MG' } as const

export function LangSwitch() {
  const { lang, setLang } = useApp()
  return (
    <button
      onClick={() => {
        const next = lang === 'fr' ? 'mg' : lang === 'mg' ? 'en' : 'fr'
        setLang(next)
      }}
      className="flex h-11 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-sm font-bold text-ink-soft shadow-sm transition hover:text-brand-700"
      aria-label="Changer de langue"
    >
      <Languages className="h-4 w-4" />
      <span>{langLabel[lang]}</span>
    </button>
  )
}
