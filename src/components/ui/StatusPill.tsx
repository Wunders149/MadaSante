import { cn } from '../../lib/cn'

export type PillTone = 'amber' | 'emerald' | 'red' | 'blue' | 'brand' | 'neutral'

const TONES: Record<PillTone, string> = {
  amber: 'bg-amber-50 text-amber-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-700',
  brand: 'bg-brand-50 text-brand-700',
  neutral: 'bg-gray-100 text-ink-soft',
}

/** Application-review status. One definition, previously duplicated per page. */
export const APPLICATION_TONE: Record<string, PillTone> = {
  pending: 'amber',
  approved: 'emerald',
  rejected: 'red',
}

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: PillTone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
