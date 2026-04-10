'use client'

/* PlaceholderImage — Renders royalty-free stock photos from Unsplash,
   with WebGL 3D scene fallback for hero theme or missing images. */

import dynamic from 'next/dynamic'

const WebGLPlaceholder = dynamic(
  () => import('@/components/webgl/WebGLPlaceholder'),
  { ssr: false }
)

/* ─── Stock images by theme (Unsplash — royalty-free, no attribution required) ─── */
const STOCK_IMAGES: Record<string, string[]> = {
  'real-estate': [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80&fit=crop&auto=format',
  ],
  'startup': [
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80&fit=crop&auto=format',
  ],
  'finance': [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=800&q=80&fit=crop&auto=format',
  ],
  'team': [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80&fit=crop&auto=format',
  ],
  'analytics': [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&q=80&fit=crop&auto=format',
  ],
  'compliance': [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80&fit=crop&auto=format',
  ],
  'education': [
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=800&q=80&fit=crop&auto=format',
  ],
  'portfolio': [
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1460472178825-e5240623afd5?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800&q=80&fit=crop&auto=format',
  ],
  'location': [
    'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80&fit=crop&auto=format',
  ],
  'fund': [
    'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80&fit=crop&auto=format',
  ],
  'default': [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80&fit=crop&auto=format',
  ],
}

/* Deterministic hash so the same label always picks the same image */
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

interface Props {
  theme?: string
  aspectRatio?: string
  label?: string
  className?: string
  overlay?: boolean
}

export default function PlaceholderImage({
  theme = 'default',
  aspectRatio = 'aspect-video',
  label,
  className = '',
  overlay = true,
}: Props) {
  // Hero theme keeps WebGL (used as background, not content image)
  if (theme === 'hero') {
    return <WebGLPlaceholder theme={theme} aspectRatio={aspectRatio} label={label} className={className} overlay={overlay} />
  }

  const images = STOCK_IMAGES[theme] || STOCK_IMAGES['default']
  const idx = hashStr(label || theme) % images.length
  const src = images[idx]

  return (
    <div className={`relative ${aspectRatio} bg-gray-900 overflow-hidden card-img-zoom group/img ${className}`}>
      <img
        src={src}
        alt={label || theme}
        className="w-full h-full object-cover transition-transform duration-500"
        loading="lazy"
      />
      {label && overlay && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 translate-y-1 opacity-90 group-hover/img:translate-y-0 group-hover/img:opacity-100 transition-all duration-300">
          <p className="text-white/90 text-xs font-medium">{label}</p>
        </div>
      )}
    </div>
  )
}
