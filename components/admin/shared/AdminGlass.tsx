'use client'

interface AdminGlassProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  padding?: string
}

export default function AdminGlass({
  children,
  className = '',
  hover = true,
  glow = false,
  padding = 'p-5',
}: AdminGlassProps) {
  return (
    <div
      className={`relative rounded-xl border border-white/[0.08] transition-all duration-300
        ${hover ? 'hover:border-white/[0.14] hover:shadow-lg hover:-translate-y-0.5' : ''}
        ${glow ? 'shadow-sm' : ''} ${padding} ${className}`}
      style={{
        background: 'rgba(20, 16, 16, 0.85)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="relative">{children}</div>
    </div>
  )
}
