'use client'

interface LogoProps {
  size?: number
  className?: string
}

export default function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GHL India Ventures Logo"
    >
      {/* Red rounded square background */}
      <rect x="0" y="0" width="100" height="100" rx="20" ry="20" fill="#D0021B" />
      {/* GHL text — bold white */}
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="34"
        fontWeight="900"
        fontFamily="'TT Norms Pro', 'Helvetica Neue', Arial, sans-serif"
        letterSpacing="2"
      >
        GHL
      </text>
      {/* 4-pointed star accent — top-right */}
      <path
        d="M110 18 L112.5 12 L115 18 L121 20.5 L115 23 L112.5 29 L110 23 L104 20.5 Z"
        fill="#D0021B"
      />
    </svg>
  )
}
