'use client'

import Image from 'next/image'

interface LogoProps {
  size?: number
  className?: string
}

export default function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <Image
      src="/images/brand/ghl-logo.png"
      alt="GHL India Ventures Logo"
      width={size}
      height={size}
      className={className}
      priority
      style={{ objectFit: 'contain' }}
    />
  )
}
