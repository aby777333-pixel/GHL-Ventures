'use client'

import Image from 'next/image'

// Full logo aspect ratio: 1383 x 623 ≈ 2.22:1
const ASPECT_RATIO = 1383 / 623

interface LogoProps {
  /** Height in pixels — width auto-scales from the 2.22:1 aspect ratio */
  size?: number
  className?: string
}

export default function Logo({ size = 40, className = '' }: LogoProps) {
  const width = Math.round(size * ASPECT_RATIO)
  return (
    <Image
      src="/images/brand/ghl-logo-full-red.png"
      alt="GHL India Ventures Logo"
      width={width}
      height={size}
      className={className}
      priority
      style={{ objectFit: 'contain' }}
    />
  )
}
