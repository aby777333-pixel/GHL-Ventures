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
      className={`relative rounded-xl border border-gray-200 transition-all duration-300 bg-white
        ${hover ? 'hover:shadow-md hover:-translate-y-0.5' : ''}
        ${glow ? 'shadow-sm' : ''} ${padding} ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      <div className="relative">{children}</div>
    </div>
  )
}
