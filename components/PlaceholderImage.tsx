'use client'

/* PlaceholderImage — Drop-in component that renders 3D WebGL scenes
   for non-hero themes, with gradient fallback for hero or no WebGL. */

import dynamic from 'next/dynamic'

// Dynamic import of WebGL component (no SSR for static export)
const WebGLPlaceholder = dynamic(
  () => import('@/components/webgl/WebGLPlaceholder'),
  { ssr: false }
)

interface Props {
  theme?: string
  aspectRatio?: string
  label?: string
  className?: string
  overlay?: boolean
}

export default function PlaceholderImage(props: Props) {
  return <WebGLPlaceholder {...props} />
}
