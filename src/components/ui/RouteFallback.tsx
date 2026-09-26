import { Loader2 } from 'lucide-react'

/** Suspense fallback shown while a lazily-loaded route chunk is fetched. */
export function RouteFallback() {
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status" aria-live="polite">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-hidden />
      </span>
      <span className="sr-only">Chargement…</span>
    </div>
  )
}
