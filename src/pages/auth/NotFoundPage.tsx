import { Compass } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useApp } from '../../stores/AppStore'

export function NotFoundPage() {
  const { t } = useApp()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page px-4 text-center">
      <Compass className="h-14 w-14 text-brand-600" />
      <div>
        <p className="text-5xl font-extrabold tracking-tight text-ink">404</p>
        <h1 className="mt-2 text-xl font-bold text-ink">{t('common.notFound')}</h1>
        <p className="mt-1 text-sm text-ink-soft">{t('common.notFoundDesc')}</p>
      </div>
      <Button to="/">{t('common.backHome')}</Button>
    </div>
  )
}