'use client'

import { SOCIAL_LINKS } from '@/lib/constants'
import { Linkedin, Instagram, Youtube, Facebook, Send } from 'lucide-react'

/* X (Twitter) icon — custom SVG (Lucide doesn't have one) */
function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  linkedin: ({ className }) => <Linkedin className={className || 'w-4 h-4'} />,
  twitter: ({ className }) => <XIcon className={className || 'w-4 h-4'} />,
  instagram: ({ className }) => <Instagram className={className || 'w-4 h-4'} />,
  youtube: ({ className }) => <Youtube className={className || 'w-4 h-4'} />,
  facebook: ({ className }) => <Facebook className={className || 'w-4 h-4'} />,
  telegram: ({ className }) => <Send className={className || 'w-4 h-4'} />,
}

interface SocialLinksProps {
  /** 'row' for horizontal, 'col' for vertical */
  direction?: 'row' | 'col'
  /** Size of each icon button */
  size?: 'sm' | 'md'
  /** Visual variant */
  variant?: 'glass' | 'ghost' | 'outline'
  className?: string
}

export default function SocialLinks({
  direction = 'row',
  size = 'md',
  variant = 'glass',
  className = '',
}: SocialLinksProps) {
  const sizeClass = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const gap = size === 'sm' ? 'gap-1.5' : 'gap-2'

  const variantClass = {
    glass: 'bg-white/[0.06] border border-white/[0.08] text-white/60 hover:bg-brand-red hover:text-white hover:border-brand-red',
    ghost: 'text-gray-400 hover:text-brand-red',
    outline: 'border border-gray-700 text-gray-400 hover:border-brand-red hover:text-brand-red',
  }[variant]

  return (
    <div className={`flex ${direction === 'col' ? 'flex-col' : 'flex-row flex-wrap'} ${gap} ${className}`}>
      {SOCIAL_LINKS.map((social) => {
        const Icon = ICON_MAP[social.icon]
        if (!Icon) return null
        return (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${sizeClass} rounded-lg flex items-center justify-center transition-all duration-300 ${variantClass}`}
            aria-label={social.label}
            title={social.label}
          >
            <Icon className={iconSize} />
          </a>
        )
      })}
    </div>
  )
}
