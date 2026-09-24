import { cn } from '../../lib/cn'

type Tone = 'brand' | 'green' | 'blue' | 'red' | 'orange' | 'amber' | 'gray' | 'slate'

const dot: Record<Tone, string> = {
  brand: 'bg-brand-600',
  green: 'bg-brand-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  gray: 'bg-gray-400',
  slate: 'bg-slate-400',
}

const text: Record<Tone, string> = {
  brand: 'text-brand-700 bg-brand-50',
  green: 'text-brand-700 bg-brand-50',
  blue: 'text-blue-700 bg-blue-50',
  red: 'text-red-700 bg-red-50',
  orange: 'text-orange-700 bg-orange-50',
  amber: 'text-amber-700 bg-amber-50',
  gray: 'text-gray-600 bg-gray-100',
  slate: 'text-slate-600 bg-slate-100',
}

interface Props {
  label: string
  tone?: Tone
  showDot?: boolean
  className?: string
}

export function StatusBadge({ label, tone = 'gray', showDot = true, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        text[tone],
        className,
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', dot[tone])} />}
      {label}
    </span>
  )
}