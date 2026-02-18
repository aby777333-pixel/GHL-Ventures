'use client'

/**
 * SpaceHero — Reusable space-themed animated background overlays.
 * Each variant is visually unique: stars, constellations, orbits, nebulas, rockets, etc.
 * Animations are CSS-only for performance (no JS requestAnimationFrame).
 */

type SpaceVariant =
  | 'constellation'   // About page — constellation lines + twinkling stars
  | 'nebula'          // Fund page — nebula cloud gradients + pulsars
  | 'rocket'          // Blog page — rocket trail + shooting stars
  | 'satellite'       // Portfolio page — orbiting satellite + star field
  | 'lunar'           // Contact page — moon + craters + stars
  | 'pulsar'          // Financial IQ page — pulsing rings + particles
  | 'hubble'          // Downloads page — deep space Hubble-style + galaxies
  | 'lightning'       // Disclaimer page — electric lightning + storm

interface SpaceHeroProps {
  variant: SpaceVariant
}

export default function SpaceHero({ variant }: SpaceHeroProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Star field — shared across all variants */}
      <div className="space-stars" />
      <div className="space-stars-2" />

      {/* Variant-specific elements */}
      {variant === 'constellation' && (
        <>
          {/* Constellation lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
            <line x1="10%" y1="20%" x2="25%" y2="35%" stroke="#D0021B" strokeWidth="0.5" className="animate-constellation-1" />
            <line x1="25%" y1="35%" x2="40%" y2="15%" stroke="#D0021B" strokeWidth="0.5" className="animate-constellation-1" />
            <line x1="40%" y1="15%" x2="55%" y2="45%" stroke="#D0021B" strokeWidth="0.5" className="animate-constellation-2" />
            <line x1="55%" y1="45%" x2="70%" y2="25%" stroke="#D0021B" strokeWidth="0.5" className="animate-constellation-2" />
            <line x1="70%" y1="25%" x2="85%" y2="40%" stroke="#D0021B" strokeWidth="0.5" className="animate-constellation-1" />
            <line x1="60%" y1="60%" x2="80%" y2="70%" stroke="#D0021B" strokeWidth="0.5" className="animate-constellation-2" />
            <line x1="15%" y1="65%" x2="35%" y2="75%" stroke="#D0021B" strokeWidth="0.5" className="animate-constellation-1" />
            {/* Constellation nodes */}
            <circle cx="10%" cy="20%" r="2" fill="#D0021B" className="animate-twinkle-1" />
            <circle cx="25%" cy="35%" r="2.5" fill="#D0021B" className="animate-twinkle-2" />
            <circle cx="40%" cy="15%" r="2" fill="#D0021B" className="animate-twinkle-3" />
            <circle cx="55%" cy="45%" r="3" fill="#D0021B" className="animate-twinkle-1" />
            <circle cx="70%" cy="25%" r="2" fill="#D0021B" className="animate-twinkle-2" />
            <circle cx="85%" cy="40%" r="2.5" fill="#D0021B" className="animate-twinkle-3" />
          </svg>
          <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-brand-red/5 rounded-full blur-3xl animate-pulse-slow" />
        </>
      )}

      {variant === 'nebula' && (
        <>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] animate-nebula-drift"
            style={{ background: 'radial-gradient(circle, rgba(208,2,27,0.08) 0%, rgba(139,92,246,0.05) 50%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] animate-nebula-drift-2"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, rgba(208,2,27,0.04) 50%, transparent 70%)' }} />
          {/* Pulsar rings */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2">
            <div className="w-4 h-4 bg-white/20 rounded-full animate-pulsar-core" />
            <div className="absolute inset-0 w-4 h-4 rounded-full border border-white/10 animate-pulsar-ring-1" />
            <div className="absolute inset-0 w-4 h-4 rounded-full border border-white/5 animate-pulsar-ring-2" />
          </div>
        </>
      )}

      {variant === 'rocket' && (
        <>
          {/* Shooting stars */}
          <div className="space-shooting-star animate-shoot-1" />
          <div className="space-shooting-star animate-shoot-2" />
          <div className="space-shooting-star animate-shoot-3" />
          {/* Rocket trail */}
          <div className="absolute bottom-0 right-[20%] w-1 opacity-[0.15] animate-rocket-launch"
            style={{ background: 'linear-gradient(to top, rgba(208,2,27,0), rgba(208,2,27,0.8), rgba(255,255,255,0.5))' }} />
          {/* Rocket glow */}
          <div className="absolute top-[15%] right-[20%] w-8 h-8 bg-brand-red/10 rounded-full blur-xl animate-rocket-glow" />
        </>
      )}

      {variant === 'satellite' && (
        <>
          {/* Orbital path */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] border border-white/[0.03] rounded-full"
            style={{ transform: 'translate(-50%, -50%) rotateX(60deg)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[225px] border border-white/[0.04] rounded-full"
            style={{ transform: 'translate(-50%, -50%) rotateX(60deg) rotateZ(30deg)' }} />
          {/* Satellite dot */}
          <div className="absolute animate-orbit-satellite">
            <div className="w-2 h-2 bg-sky-400/60 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
          </div>
          {/* Planet */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-brand-red/10 rounded-full border border-brand-red/20" />
        </>
      )}

      {variant === 'lunar' && (
        <>
          {/* Moon */}
          <div className="absolute top-16 right-[15%] w-24 h-24 rounded-full opacity-[0.08]"
            style={{ background: 'radial-gradient(circle at 40% 40%, #fff 0%, #ccc 50%, #666 100%)', boxShadow: '0 0 60px rgba(255,255,255,0.1)' }}>
            {/* Craters */}
            <div className="absolute top-4 left-6 w-4 h-4 rounded-full bg-black/20" />
            <div className="absolute top-10 right-5 w-3 h-3 rounded-full bg-black/15" />
            <div className="absolute bottom-4 left-8 w-5 h-5 rounded-full bg-black/10" />
          </div>
          {/* Moonlight glow */}
          <div className="absolute top-10 right-[12%] w-40 h-40 bg-white/[0.02] rounded-full blur-3xl" />
        </>
      )}

      {variant === 'pulsar' && (
        <>
          {/* Central pulsar */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-3 h-3 bg-brand-red/30 rounded-full animate-pulsar-core" />
            <div className="absolute -inset-4 rounded-full border border-brand-red/10 animate-pulsar-ring-1" />
            <div className="absolute -inset-10 rounded-full border border-brand-red/5 animate-pulsar-ring-2" />
            <div className="absolute -inset-20 rounded-full border border-brand-red/[0.03] animate-pulsar-ring-3" />
          </div>
          {/* Particles */}
          <div className="space-particles" />
        </>
      )}

      {variant === 'hubble' && (
        <>
          {/* Deep space gradient */}
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(88,28,135,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(208,2,27,0.04) 0%, transparent 50%)' }} />
          {/* Spiral galaxy */}
          <div className="absolute top-1/4 right-1/4 w-32 h-32 opacity-[0.06] animate-slow-rotate">
            <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.3) 25%, transparent 50%, rgba(255,255,255,0.2) 75%, transparent 100%)', filter: 'blur(4px)' }} />
            <div className="absolute inset-[40%] bg-white/30 rounded-full blur-sm" />
          </div>
          {/* Second galaxy */}
          <div className="absolute bottom-1/3 left-[15%] w-20 h-20 opacity-[0.04] animate-slow-rotate-reverse">
            <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 90deg, transparent 0%, rgba(208,2,27,0.4) 25%, transparent 50%, rgba(208,2,27,0.3) 75%, transparent 100%)', filter: 'blur(3px)' }} />
          </div>
        </>
      )}

      {variant === 'lightning' && (
        <>
          {/* Storm clouds */}
          <div className="absolute top-0 left-0 right-0 h-1/2 opacity-[0.05]"
            style={{ background: 'radial-gradient(ellipse at 30% 0%, rgba(139,92,246,0.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 0%, rgba(208,2,27,0.2) 0%, transparent 50%)' }} />
          {/* Lightning bolts (CSS animated) */}
          <div className="absolute top-[10%] left-[25%] w-px h-32 animate-lightning-1"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(139,92,246,0.3), transparent)' }} />
          <div className="absolute top-[5%] left-[65%] w-px h-24 animate-lightning-2"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(208,2,27,0.3), transparent)' }} />
          {/* Electric glow */}
          <div className="absolute top-[10%] left-[25%] w-8 h-8 bg-violet-500/10 rounded-full blur-xl animate-lightning-glow-1" />
          <div className="absolute top-[5%] left-[65%] w-6 h-6 bg-brand-red/10 rounded-full blur-xl animate-lightning-glow-2" />
        </>
      )}
    </div>
  )
}
