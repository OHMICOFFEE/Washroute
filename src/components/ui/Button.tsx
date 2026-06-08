'use client'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const variantClass = {
      primary: 'btn-primary',
      gold:    'btn-gold',
      ghost:   'btn-ghost',
      danger:  'btn-danger',
    }[variant]

    const sizeClass = {
      sm: 'text-xs px-3 py-2',
      md: 'text-sm px-5 py-2.5',
      lg: 'text-base px-7 py-3',
    }[size]

    return (
      <button
        ref={ref}
        className={cn('btn', variantClass, sizeClass, className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
