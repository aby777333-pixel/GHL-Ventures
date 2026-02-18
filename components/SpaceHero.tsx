'use client'

/**
 * SpaceHero — Vivid, clearly visible space-themed animated background overlays.
 * Each variant is visually distinct and HIGHLY visible with bold colors and prominent animations.
 * CSS-only animations for performance.
 */

type SpaceVariant =
  | 'constellation'   // About — bold constellation lines + bright twinkling stars
  | 'nebula'          // Fund — vivid nebula clouds + bright pulsars
  | 'rocket'          // Blog — bright shooting stars + rocket with fire trail
  | 'satellite'       // Portfolio — visible orbits + glowing satellite + planet
  | 'lunar'           // Contact — large luminous moon + floating particles
  | 'pulsar'          // Financial IQ — bold pulsing rings + streaming particles
  | 'hubble'          // Downloads — vivid galaxies + cosmic dust
  | 'lightning'       // Disclaimer — bright lightning + storm flashes

interface SpaceHeroProps {
  variant: SpaceVariant
}

export default function SpaceHero({ variant }: SpaceHeroProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Dense star field — shared across ALL variants — 3 layers for depth */}
      <div className="space-stars-layer-1" />
      <div className="space-stars-layer-2" />
      <div className="space-stars-layer-3" />

      {/* ═══════════════════════════════════════════════════════════
          CONSTELLATION — About Page
          Bold red/white lines connecting bright star nodes
         ═══════════════════════════════════════════════════════════ */}
      {variant === 'constellation' && (
        <>
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Bold constellation lines */}
            <line x1="8%" y1="18%" x2="22%" y2="38%" stroke="rgba(208,2,27,0.35)" strokeWidth="1.5" className="animate-constellation-1" />
            <line x1="22%" y1="38%" x2="38%" y2="12%" stroke="rgba(208,2,27,0.3)" strokeWidth="1.5" className="animate-constellation-2" />
            <line x1="38%" y1="12%" x2="55%" y2="42%" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="animate-constellation-1" />
            <line x1="55%" y1="42%" x2="72%" y2="22%" stroke="rgba(208,2,27,0.35)" strokeWidth="1.5" className="animate-constellation-2" />
            <line x1="72%" y1="22%" x2="88%" y2="38%" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="animate-constellation-1" />
            <line x1="88%" y1="38%" x2="95%" y2="60%" stroke="rgba(208,2,27,0.25)" strokeWidth="1" className="animate-constellation-2" />
            <line x1="12%" y1="62%" x2="32%" y2="72%" stroke="rgba(208,2,27,0.3)" strokeWidth="1.5" className="animate-constellation-2" />
            <line x1="32%" y1="72%" x2="55%" y2="42%" stroke="rgba(255,255,255,0.15)" strokeWidth="1" className="animate-constellation-1" />
            <line x1="60%" y1="65%" x2="80%" y2="75%" stroke="rgba(208,2,27,0.25)" strokeWidth="1" className="animate-constellation-1" />
            <line x1="80%" y1="75%" x2="72%" y2="22%" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" className="animate-constellation-2" />

            {/* Bright star nodes with glow */}
            <circle cx="8%" cy="18%" r="3" fill="#D0021B" opacity="0.8" className="animate-twinkle-1">
              <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="22%" cy="38%" r="4" fill="#fff" opacity="0.9" className="animate-twinkle-2">
              <animate attributeName="r" values="3;5;3" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="38%" cy="12%" r="3" fill="#D0021B" opacity="0.7" className="animate-twinkle-3">
              <animate attributeName="r" values="2;4;2" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="55%" cy="42%" r="5" fill="#fff" opacity="0.9" className="animate-twinkle-1">
              <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="72%" cy="22%" r="3.5" fill="#D0021B" opacity="0.8" className="animate-twinkle-2">
              <animate attributeName="r" values="2.5;4.5;2.5" dur="2.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="88%" cy="38%" r="3" fill="#fff" opacity="0.7" className="animate-twinkle-3">
              <animate attributeName="r" values="2;4;2" dur="2.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="12%" cy="62%" r="3.5" fill="#D0021B" opacity="0.7" className="animate-twinkle-1">
              <animate attributeName="r" values="2;4.5;2" dur="2.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="32%" cy="72%" r="3" fill="#fff" opacity="0.8" className="animate-twinkle-2">
              <animate attributeName="r" values="2;4;2" dur="3.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="60%" cy="65%" r="2.5" fill="#D0021B" opacity="0.6" className="animate-twinkle-3" />
            <circle cx="80%" cy="75%" r="3" fill="#fff" opacity="0.7" className="animate-twinkle-1" />

            {/* Star glow halos */}
            <circle cx="55%" cy="42%" r="12" fill="rgba(255,255,255,0.08)" className="animate-twinkle-1">
              <animate attributeName="r" values="8;16;8" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="22%" cy="38%" r="10" fill="rgba(208,2,27,0.06)" className="animate-twinkle-2">
              <animate attributeName="r" values="6;14;6" dur="3.5s" repeatCount="indefinite" />
            </circle>
          </svg>
          {/* Large ambient glow */}
          <div className="absolute top-[15%] right-[25%] w-72 h-72 bg-brand-red/10 rounded-full blur-[80px] animate-pulse-slow" />
          <div className="absolute bottom-[20%] left-[10%] w-48 h-48 bg-white/5 rounded-full blur-[60px] animate-pulse-slow-2" />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          NEBULA — Fund Page
          Vivid colorful gas clouds + bright pulsar center
         ═══════════════════════════════════════════════════════════ */}
      {variant === 'nebula' && (
        <>
          {/* Large vivid nebula clouds */}
          <div className="absolute -top-20 -right-20 w-[600px] h-[600px] rounded-full blur-[80px] animate-nebula-drift"
            style={{ background: 'radial-gradient(circle, rgba(208,2,27,0.25) 0%, rgba(139,92,246,0.15) 40%, transparent 70%)' }} />
          <div className="absolute -bottom-10 -left-20 w-[500px] h-[500px] rounded-full blur-[70px] animate-nebula-drift-2"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(208,2,27,0.12) 40%, transparent 70%)' }} />
          <div className="absolute top-[40%] left-[30%] w-[350px] h-[350px] rounded-full blur-[90px] animate-nebula-drift-3"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(236,72,153,0.08) 50%, transparent 70%)' }} />

          {/* Bright pulsar center */}
          <div className="absolute top-[30%] left-[55%] -translate-x-1/2">
            <div className="w-5 h-5 bg-white rounded-full animate-pulsar-core" style={{ boxShadow: '0 0 20px rgba(255,255,255,0.6), 0 0 40px rgba(208,2,27,0.3)' }} />
            <div className="absolute -inset-3 rounded-full border-2 border-white/30 animate-pulsar-ring-1" />
            <div className="absolute -inset-8 rounded-full border border-brand-red/25 animate-pulsar-ring-2" />
            <div className="absolute -inset-16 rounded-full border border-violet-500/15 animate-pulsar-ring-3" />
          </div>

          {/* Cosmic dust streaks */}
          <div className="space-cosmic-dust" />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ROCKET — Blog Page
          Bright shooting stars + visible rocket with fire trail
         ═══════════════════════════════════════════════════════════ */}
      {variant === 'rocket' && (
        <>
          {/* Thick, bright shooting stars */}
          <div className="space-shooting-star-vivid animate-shoot-1" />
          <div className="space-shooting-star-vivid animate-shoot-2" />
          <div className="space-shooting-star-vivid animate-shoot-3" />
          <div className="space-shooting-star-vivid animate-shoot-4" />
          <div className="space-shooting-star-vivid animate-shoot-5" />

          {/* Rocket body */}
          <div className="absolute animate-rocket-fly" style={{ zIndex: 2 }}>
            <div className="relative">
              {/* Rocket shape */}
              <div className="w-3 h-8 bg-gradient-to-t from-gray-400 to-white rounded-t-full rounded-b-sm opacity-80" />
              {/* Rocket nose */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-transparent border-b-red-500 opacity-80" />
              {/* Engine fire */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4 h-8 animate-rocket-fire"
                style={{ background: 'linear-gradient(to bottom, #ff6600, #ff3300, #ff0000, transparent)', borderRadius: '0 0 50% 50%', filter: 'blur(2px)' }} />
              {/* Fire glow */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-orange-500/40 rounded-full blur-md animate-rocket-fire" />
            </div>
          </div>

          {/* Rocket exhaust trail */}
          <div className="absolute animate-rocket-trail"
            style={{ background: 'linear-gradient(to bottom, rgba(255,102,0,0.4), rgba(255,50,0,0.2), rgba(208,2,27,0.1), transparent)', filter: 'blur(3px)' }} />

          {/* Ambient red glow */}
          <div className="absolute top-[10%] right-[15%] w-64 h-64 bg-brand-red/8 rounded-full blur-[60px] animate-pulse-slow" />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SATELLITE — Portfolio Page
          Clearly visible orbits + glowing satellite + planet
         ═══════════════════════════════════════════════════════════ */}
      {variant === 'satellite' && (
        <>
          {/* Central planet */}
          <div className="absolute top-[45%] left-[55%] -translate-x-1/2 -translate-y-1/2">
            <div className="w-16 h-16 rounded-full opacity-60"
              style={{ background: 'radial-gradient(circle at 35% 35%, rgba(208,2,27,0.6), rgba(139,0,0,0.4), rgba(50,0,0,0.8))', boxShadow: '0 0 40px rgba(208,2,27,0.2), inset -4px -4px 8px rgba(0,0,0,0.5)' }} />
            {/* Planet ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-8 border border-white/15 rounded-full"
              style={{ transform: 'translate(-50%, -50%) rotateX(70deg)' }} />
          </div>

          {/* Orbital paths - visible */}
          <div className="absolute top-[45%] left-[55%] w-[500px] h-[250px] border border-white/10 rounded-full animate-orbit-path-1"
            style={{ transform: 'translate(-50%, -50%) rotateX(65deg)', transformOrigin: 'center' }} />
          <div className="absolute top-[45%] left-[55%] w-[380px] h-[190px] border border-brand-red/12 rounded-full"
            style={{ transform: 'translate(-50%, -50%) rotateX(65deg) rotateZ(25deg)' }} />
          <div className="absolute top-[45%] left-[55%] w-[620px] h-[310px] border border-white/[0.06] rounded-full"
            style={{ transform: 'translate(-50%, -50%) rotateX(65deg) rotateZ(-15deg)' }} />

          {/* Orbiting satellite with trail */}
          <div className="absolute animate-orbit-satellite">
            <div className="relative">
              <div className="w-3 h-3 bg-sky-400 rounded-full" style={{ boxShadow: '0 0 12px rgba(56,189,248,0.8), 0 0 24px rgba(56,189,248,0.4)' }} />
              {/* Solar panel wings */}
              <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-3 h-1.5 bg-sky-300/50" />
              <div className="absolute top-1/2 left-full -translate-y-1/2 w-3 h-1.5 bg-sky-300/50" />
              {/* Trail */}
              <div className="absolute top-1/2 right-full -translate-y-1/2 w-20 h-px bg-gradient-to-l from-sky-400/50 to-transparent" />
            </div>
          </div>

          {/* Second orbiting object */}
          <div className="absolute animate-orbit-satellite-2">
            <div className="w-2 h-2 bg-brand-red rounded-full" style={{ boxShadow: '0 0 8px rgba(208,2,27,0.6)' }} />
          </div>

          {/* Star cluster */}
          <div className="absolute top-[15%] left-[15%] w-48 h-48 bg-white/[0.03] rounded-full blur-[40px]" />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          LUNAR — Contact Page
          Large luminous moon + floating particles + moonlight
         ═══════════════════════════════════════════════════════════ */}
      {variant === 'lunar' && (
        <>
          {/* Large visible moon */}
          <div className="absolute top-8 right-[10%] w-40 h-40 rounded-full opacity-30"
            style={{
              background: 'radial-gradient(circle at 38% 38%, #ffffee 0%, #ddd 30%, #999 60%, #555 100%)',
              boxShadow: '0 0 80px rgba(255,255,240,0.15), 0 0 160px rgba(255,255,240,0.08)',
            }}>
            {/* Craters */}
            <div className="absolute top-6 left-8 w-8 h-8 rounded-full bg-black/15 blur-[1px]" />
            <div className="absolute top-16 right-6 w-6 h-6 rounded-full bg-black/12 blur-[1px]" />
            <div className="absolute bottom-6 left-12 w-10 h-10 rounded-full bg-black/10 blur-[1px]" />
            <div className="absolute top-10 left-[55%] w-4 h-4 rounded-full bg-black/8" />
            <div className="absolute bottom-14 right-10 w-5 h-5 rounded-full bg-black/10" />
          </div>

          {/* Moonlight glow */}
          <div className="absolute top-0 right-[5%] w-80 h-80 rounded-full blur-[100px]"
            style={{ background: 'radial-gradient(circle, rgba(255,255,240,0.08) 0%, transparent 70%)' }} />

          {/* Moon rays */}
          <div className="absolute top-12 right-[15%] w-[400px] h-[2px] opacity-[0.06] rotate-[20deg]"
            style={{ background: 'linear-gradient(to right, rgba(255,255,240,0.3), transparent)' }} />
          <div className="absolute top-20 right-[12%] w-[300px] h-[1px] opacity-[0.04] rotate-[35deg]"
            style={{ background: 'linear-gradient(to right, rgba(255,255,240,0.3), transparent)' }} />

          {/* Floating moon dust particles */}
          <div className="space-moon-dust" />

          {/* Ambient glow bottom */}
          <div className="absolute bottom-0 left-[20%] w-96 h-48 bg-brand-red/5 rounded-full blur-[80px]" />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PULSAR — Financial IQ Page
          Bold pulsing rings + bright streaming particles + energy waves
         ═══════════════════════════════════════════════════════════ */}
      {variant === 'pulsar' && (
        <>
          {/* Central pulsar — BRIGHT */}
          <div className="absolute top-[28%] left-[50%] -translate-x-1/2 -translate-y-1/2">
            {/* Core */}
            <div className="w-6 h-6 rounded-full animate-pulsar-core"
              style={{ background: 'radial-gradient(circle, #fff 0%, #D0021B 60%, transparent 100%)', boxShadow: '0 0 30px rgba(208,2,27,0.5), 0 0 60px rgba(208,2,27,0.2)' }} />
            {/* Expanding rings */}
            <div className="absolute -inset-4 rounded-full border-2 border-brand-red/40 animate-pulsar-ring-1" />
            <div className="absolute -inset-10 rounded-full border-2 border-brand-red/30 animate-pulsar-ring-2" />
            <div className="absolute -inset-20 rounded-full border border-brand-red/20 animate-pulsar-ring-3" />
            <div className="absolute -inset-32 rounded-full border border-brand-red/10 animate-pulsar-ring-4" />
            <div className="absolute -inset-48 rounded-full border border-white/5 animate-pulsar-ring-5" />
          </div>

          {/* Energy beams */}
          <div className="absolute top-[28%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[2px] h-[300px] animate-energy-beam"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(208,2,27,0.3), rgba(208,2,27,0.5), rgba(208,2,27,0.3), transparent)' }} />
          <div className="absolute top-[28%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[2px] animate-energy-beam-h"
            style={{ background: 'linear-gradient(to right, transparent, rgba(208,2,27,0.2), rgba(208,2,27,0.4), rgba(208,2,27,0.2), transparent)' }} />

          {/* Bright streaming particles */}
          <div className="space-particles-vivid" />
          <div className="space-particles-vivid-2" />

          {/* Ambient glow */}
          <div className="absolute top-[20%] left-[45%] w-80 h-80 bg-brand-red/10 rounded-full blur-[100px] animate-pulse-slow" />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          HUBBLE — Downloads Page
          Vivid spiral galaxies + cosmic dust + nebula colors
         ═══════════════════════════════════════════════════════════ */}
      {variant === 'hubble' && (
        <>
          {/* Deep space color wash */}
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 25% 35%, rgba(88,28,135,0.15) 0%, transparent 50%), radial-gradient(ellipse at 75% 55%, rgba(208,2,27,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(59,130,246,0.08) 0%, transparent 40%)' }} />

          {/* Main spiral galaxy */}
          <div className="absolute top-[20%] right-[22%] w-48 h-48 animate-slow-rotate" style={{ opacity: 0.2 }}>
            <div className="absolute inset-0 rounded-full"
              style={{ background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.5) 15%, transparent 30%, rgba(255,200,200,0.3) 45%, transparent 60%, rgba(255,255,255,0.4) 75%, transparent 90%)', filter: 'blur(3px)' }} />
            <div className="absolute inset-[35%] bg-white/40 rounded-full blur-sm" style={{ boxShadow: '0 0 20px rgba(255,255,255,0.3)' }} />
          </div>

          {/* Second galaxy */}
          <div className="absolute bottom-[25%] left-[12%] w-32 h-32 animate-slow-rotate-reverse" style={{ opacity: 0.15 }}>
            <div className="absolute inset-0 rounded-full"
              style={{ background: 'conic-gradient(from 90deg, transparent 0%, rgba(208,2,27,0.6) 15%, transparent 30%, rgba(208,2,27,0.4) 60%, transparent 80%)', filter: 'blur(2px)' }} />
            <div className="absolute inset-[40%] bg-brand-red/30 rounded-full blur-sm" />
          </div>

          {/* Distant galaxy cluster */}
          <div className="absolute top-[60%] right-[8%] w-20 h-20 animate-slow-rotate" style={{ opacity: 0.12 }}>
            <div className="absolute inset-0 rounded-full"
              style={{ background: 'conic-gradient(from 45deg, transparent 0%, rgba(139,92,246,0.5) 20%, transparent 40%, rgba(139,92,246,0.3) 70%, transparent 90%)', filter: 'blur(2px)' }} />
          </div>

          {/* Cosmic dust lanes */}
          <div className="space-cosmic-dust" />
          <div className="space-cosmic-dust-2" />

          {/* Star clusters */}
          <div className="absolute top-[35%] left-[40%] w-32 h-32 bg-white/[0.04] rounded-full blur-[30px]" />
          <div className="absolute top-[55%] right-[30%] w-24 h-24 bg-violet-500/[0.04] rounded-full blur-[25px]" />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          LIGHTNING — Disclaimer Page
          Bright lightning bolts + storm flashes + electric glow
         ═══════════════════════════════════════════════════════════ */}
      {variant === 'lightning' && (
        <>
          {/* Dark storm clouds */}
          <div className="absolute top-0 left-0 right-0 h-[60%]"
            style={{ background: 'radial-gradient(ellipse at 25% 0%, rgba(139,92,246,0.12) 0%, transparent 50%), radial-gradient(ellipse at 65% 0%, rgba(208,2,27,0.08) 0%, transparent 50%), radial-gradient(ellipse at 50% 20%, rgba(88,28,135,0.08) 0%, transparent 40%)' }} />

          {/* Lightning bolt SVG paths — much more visible */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Main bolt 1 */}
            <path d="M250,0 L245,80 L260,82 L240,160 L255,162 L230,280"
              fill="none" stroke="rgba(200,180,255,0.7)" strokeWidth="2" className="animate-lightning-bolt-1"
              style={{ filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.5))' }} />
            {/* Main bolt 2 */}
            <path d="M650,0 L660,60 L645,63 L665,130 L650,133 L670,220"
              fill="none" stroke="rgba(255,200,200,0.6)" strokeWidth="2" className="animate-lightning-bolt-2"
              style={{ filter: 'drop-shadow(0 0 6px rgba(208,2,27,0.4))' }} />
            {/* Branch bolt 1 */}
            <path d="M240,160 L210,200 L220,202 L200,240"
              fill="none" stroke="rgba(200,180,255,0.4)" strokeWidth="1.5" className="animate-lightning-bolt-1" />
            {/* Branch bolt 2 */}
            <path d="M665,130 L690,170 L680,172 L700,210"
              fill="none" stroke="rgba(255,200,200,0.35)" strokeWidth="1.5" className="animate-lightning-bolt-2" />
            {/* Small bolt 3 */}
            <path d="M450,20 L445,70 L455,72 L440,120"
              fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" className="animate-lightning-bolt-3" />
          </svg>

          {/* Lightning flash — full screen flash effect */}
          <div className="absolute inset-0 bg-violet-500/0 animate-lightning-screen-flash-1" />
          <div className="absolute inset-0 bg-brand-red/0 animate-lightning-screen-flash-2" />

          {/* Electric glow points */}
          <div className="absolute top-[0%] left-[25%] w-20 h-20 bg-violet-400/20 rounded-full blur-xl animate-lightning-glow-1" />
          <div className="absolute top-[0%] left-[65%] w-16 h-16 bg-brand-red/15 rounded-full blur-xl animate-lightning-glow-2" />
          <div className="absolute top-[5%] left-[45%] w-12 h-12 bg-white/10 rounded-full blur-lg animate-lightning-glow-3" />

          {/* Rain effect */}
          <div className="space-rain" />
        </>
      )}
    </div>
  )
}
