import { cn } from '../lib/cn'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('h-9 w-9', className)} aria-hidden>
      <circle cx="32" cy="32" r="32" className="fill-brand-600" />
      <path
        d="M32 12c-6 0-11 4.6-12.6 10.8C15 24 12 27.5 12 31.5c0 5.5 4.5 10 10 10h20c5.5 0 10-4.5 10-10 0-4-3-7.5-7.4-8.7C43 16.6 38 12 32 12z"
        className="fill-white"
      />
      <rect x="30" y="24" width="4" height="15" rx="2" className="fill-brand-600" />
      <rect x="24.5" y="29.5" width="15" height="4" rx="2" className="fill-brand-600" />
    </svg>
  )
}

export function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className={compact ? 'h-8 w-8' : 'h-9 w-9'} />
      <div className="leading-none">
        <div
          className={cn(
            'font-extrabold tracking-tight',
            compact ? 'text-base' : 'text-lg',
            light ? 'text-white' : 'text-ink',
          )}
        >
          Mada&nbsp;Santé
        </div>
        <div className={cn('mt-0.5 text-[11px] font-medium', light ? 'text-white/80' : 'text-brand-600')}>
          manampy anao
        </div>
      </div>
    </div>
  )
}