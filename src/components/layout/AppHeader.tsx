import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Languages, Search } from 'lucide-react'
import { Logo } from '../Logo'
import { Avatar } from '../Avatar'
import { NotificationBell } from '../NotificationCard'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'

const langLabel = { fr: 'FR', en: 'EN', mg: 'MG' } as const

export function AppHeader() {
  const { user } = useAuth()
  const { t, setLang, lang, unreadCount } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleSearch = () => {
    navigate(query.trim() ? `/patient/search?q=${encodeURIComponent(query.trim())}` : '/patient/search')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur">
      {/* Mobile header */}
      <div className="flex items-center justify-between px-4 py-3 lg:hidden">
        <Logo compact />
        <div className="flex items-center gap-2">
          <NotificationBell onClick={() => navigate('/patient/notifications')} />
          <button
            onClick={() => navigate('/patient/profile')}
            className="grid h-11 w-11 place-items-center rounded-full border border-line bg-card shadow-sm"
            aria-label="Profil"
          >
            <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} src={user?.photo} size="xs" />
          </button>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden items-center justify-between gap-6 px-8 py-4 lg:flex">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-ink-soft">
            {t('brand.welcomeBack')}, <span className="font-bold text-ink">{user?.firstName}</span> 👋
          </p>
        </div>
        <form role="search" onSubmit={(e) => { e.preventDefault(); handleSearch() }} className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('home.searchPlaceholder')}
            className="w-full min-h-11 rounded-full border border-line bg-card pl-10 pr-4 text-sm shadow-sm outline-none transition placeholder:text-ink-faint focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
        </form>
        <div className="flex items-center gap-2.5">
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
          <NotificationBell onClick={() => navigate('/patient/notifications')} />
          <button
            onClick={() => navigate('/patient/profile')}
            className="flex items-center gap-2.5 rounded-full border border-line bg-card py-1 pl-1 pr-3 shadow-sm transition hover:border-brand-300"
            aria-label="Profil"
          >
            <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} src={user?.photo} size="xs" />
            <span className="max-w-28 truncate text-sm font-semibold text-ink">
              {user?.firstName} {user?.lastName}
            </span>
            {unreadCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}