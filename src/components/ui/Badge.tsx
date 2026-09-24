import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone =
  | 'brand'
  | 'green'
  | 'blue'
  | 'red'
  | 'orange'
  | 'amber'
  | 'neutral'
  | 'slate'

const tones: Record<Tone, string> = {
  brand: 'bg-brand-600 text-white',
  green: 'bg-brand-100 text-brand-800',
  blue: 'bg-blue-100 text-blue-800',
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-800',
  amber: 'bg-amber-100 text-amber-800',
  neutral: 'bg-gray-100 text-gray-700',
  slate: 'bg-slate-100 text-slate-700',
}

interface Props {
  children: ReactNode
  tone?: Tone
  className?: string
  icon?: ReactNode
}

export function Badge({ children, tone = 'brand', className, icon }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}