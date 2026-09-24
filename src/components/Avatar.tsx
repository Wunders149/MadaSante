import { cn } from '../lib/cn'
import { initials } from '../lib/format'

interface AvatarProps {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  xs: 'h-8 w-8 text-xs',
  sm: 'h-10 w-10 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-20 w-20 text-xl',
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm', sizes[size], className)}
        referrerPolicy="no-referrer"
      />
    )
  }
  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-brand-600 font-bold text-white',
        sizes[size],
        className,
      )}
      role="img"
      aria-label={name}
    >
      {initials(name)}
    </div>
  )
}