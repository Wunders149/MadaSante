import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useApp } from '../../stores/AppStore'
import { cn } from '../../lib/cn'

export function ToastHost() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-card p-3.5 shadow-lifted animate-fade-up',
            toast.tone === 'success' && 'border-brand-200',
            toast.tone === 'error' && 'border-red-200',
          )}
        >
          {toast.tone === 'success' && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />}
          {toast.tone === 'error' && <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />}
          {toast.tone === 'info' && <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{toast.title}</p>
            {toast.message && <p className="mt-0.5 text-xs text-ink-soft">{toast.message}</p>}
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-gray-100"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}