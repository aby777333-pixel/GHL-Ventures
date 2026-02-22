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
      className={`relative rounded-2xl border border-white/[0.08] overflow-hidden transition-all duration-500
        ${hover ? 'hover:border-white/[0.14] hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5' : ''}
        ${glow ? 'shadow-brand-red/5 shadow-lg' : ''} ${padding} ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)' }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
