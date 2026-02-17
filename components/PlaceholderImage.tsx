'use client'

import { Building2, Rocket, TrendingUp, Users, BarChart3, Shield, BookOpen, Briefcase, MapPin, Landmark } from 'lucide-react'

const THEMES: Record<string, { gradient: string; icon: string }> = {
  'real-estate': { gradient: 'from-amber-900 via-red-900 to-gray-900', icon: 'building' },
  'startup': { gradient: 'from-indigo-900 via-purple-900 to-gray-900', icon: 'rocket' },
  'finance': { gradient: 'from-emerald-900 via-teal-900 to-gray-900', icon: 'trending' },
  'team': { gradient: 'from-slate-700 via-gray-800 to-gray-900', icon: 'users' },
  'analytics': { gradient: 'from-blue-900 via-cyan-900 to-gray-900', icon: 'chart' },
  'compliance': { gradient: 'from-red-900 via-rose-900 to-gray-900', icon: 'shield' },
  'education': { gradient: 'from-violet-900 via-purple-900 to-gray-900', icon: 'book' },
  'portfolio': { gradient: 'from-orange-900 via-amber-900 to-gray-900', icon: 'briefcase' },
  'location': { gradient: 'from-green-900 via-emerald-900 to-gray-900', icon: 'map' },
  'fund': { gradient: 'from-yellow-900 via-amber-900 to-gray-900', icon: 'landmark' },
  'hero': { gradient: 'from-gray-900 via-red-950 to-gray-900', icon: 'trending' },
  'default': { gradient: 'from-gray-800 via-gray-900 to-black', icon: 'chart' },
}

const IconMap: Record<string, React.FC<{ className?: string }>> = {
  building: Building2,
  rocket: Rocket,
  trending: TrendingUp,
  users: Users,
  chart: BarChart3,
  shield: Shield,
  book: BookOpen,
  briefcase: Briefcase,
  map: MapPin,
  landmark: Landmark,
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
  const t = THEMES[theme] || THEMES.default
  const Icon = IconMap[t.icon] || BarChart3

  return (
    <div className={`relative ${aspectRatio} bg-gradient-to-br ${t.gradient} rounded-lg overflow-hidden ${className}`}>
      {/* Decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-[60px]" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-brand-red/10 rounded-full blur-[40px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>
      {/* Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className="w-12 h-12 text-white/15" />
      </div>
      {/* Label */}
      {label && overlay && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <p className="text-white/70 text-xs font-medium">{label}</p>
        </div>
      )}
    </div>
  )
}
