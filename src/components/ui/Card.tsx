import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  glass?: boolean
  glow?: boolean
  onClick?: () => void
}

export default function Card({ children, className, glass = true, glow, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl p-5',
        glass && 'glass',
        glow && 'shadow-glow',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn('font-display text-xl font-semibold text-white', className)}>
      {children}
    </h2>
  )
}
