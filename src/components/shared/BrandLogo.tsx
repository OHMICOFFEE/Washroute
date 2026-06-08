'use client'
import Image from 'next/image'
import { Car } from 'lucide-react'
import { useBrand } from './BrandProvider'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

export default function BrandLogo({ size = 'md', showName = true, className = '' }: BrandLogoProps) {
  const brand = useBrand()
  const iconSizes = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-14 h-14' }
  const textSizes = { sm: 'text-[15px]', md: 'text-[17px]', lg: 'text-2xl' }
  const imgSizes  = { sm: 28, md: 36, lg: 56 }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {brand.logoUrl ? (
        <Image src={brand.logoUrl} alt={brand.name} width={imgSizes[size]} height={imgSizes[size]}
          className={`${iconSizes[size]} object-contain`} priority />
      ) : (
        <div className={`${iconSizes[size]} rounded-2xl flex items-center justify-center`}
          style={{ background: 'var(--brand-primary)' }}>
          <Car className="w-4 h-4 text-white" />
        </div>
      )}
      {showName && (
        <span className={`font-semibold tracking-tight ${textSizes[size]}`}
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {brand.shortName}
        </span>
      )}
    </div>
  )
}
