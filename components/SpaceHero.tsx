'use client'

/**
 * SpaceHero — Jaw-dropping, vivid celestial animated backgrounds.
 * Each variant is visually SPECTACULAR with dramatic effects people will wonder about.
 * Pure CSS animations + SVG for performance.
 *
 * Variants:
 *   constellation — About page: bold constellation lines + twinkling stars
 *   nebula        — Fund page: vivid nebula clouds + bright pulsars
 *   rocket        — Blog page: bright shooting stars + rocket with fire trail
 *   satellite     — Portfolio page: visible orbits + glowing satellite + planet
 *   lunar         — Contact page: large luminous moon + floating particles
 *   pulsar        — Financial IQ page: bold pulsing rings + streaming particles
 *   hubble        — Downloads page: vivid galaxies + cosmic dust
 *   lightning     — Disclaimer page: bright lightning + storm flashes
 *   aurora        — Home hero: northern lights aurora borealis + meteor shower
 *   blackhole     — Fund/Direct AIF: gravitational lensing black hole + accretion disk
 *   supernova     — Fund/SEBI Co-Invest: expanding supernova explosion + shockwave
 *   wormhole      — Tools page: spinning wormhole tunnel + time-space distortion
 *   city          — Why AIFs page: urban skyline silhouette + financial district + metro glow
 *   comet         — FAQs page: bright comet with ion + dust tails
 *   meteor        — Refer an Investor page: dramatic meteor shower with fireballs
 *   galaxy        — Startup Application page: spiral galaxy with companion
 *   eclipse       — Grievance Redressal page: total solar eclipse with corona
 *   mars          — Careers page: Martian terrain with red dunes + moons
 *   knowledge-rain — Education page: silver light drops from heavens + divine glow + starry sky
 *   nri-flight    — NRI Invest page: 10 passenger airplanes with red/green flashing nav lights
 *   datastream    — Education Insights: flowing data nodes with connected lines + pulsing particles
 */

type SpaceVariant =
  | 'constellation'
  | 'nebula'
  | 'rocket'
  | 'satellite'
  | 'lunar'
  | 'pulsar'
  | 'hubble'
  | 'lightning'
  | 'aurora'
  | 'blackhole'
  | 'supernova'
  | 'wormhole'
  | 'city'
  | 'comet'
  | 'meteor'
  | 'galaxy'
  | 'eclipse'
  | 'mars'
  | 'knowledge-rain'
  | 'nri-flight'
  | 'datastream'

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

      {/* ═══════════════════════════════════════════════════════════
          ★ AURORA — Home Page Hero ★
          Cinematic space view: Earth arc, moon, stars, planets, ISS,
          airplanes, market-lightning horizon, comet, subtle borealis,
          celestial wonders. Premium & refined.
         ═══════════════════════════════════════════════════════════ */}
      {variant === 'aurora' && (
        <>
          {/* ── Subtle Aurora Borealis — faint, ethereal, not overpowering ── */}
          <div className="aurora-subtle-1" />
          <div className="aurora-subtle-2" />

          {/* ── Full Moon — luminous with realistic craters & dark maria ── */}
          <div className="absolute top-[8%] right-[10%]" style={{ opacity: 0.95 }}>
            <div className="w-14 h-14 rounded-full relative overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 50% 50%, #fffff8 0%, #f5eed8 15%, #e8dcc4 30%, #d8ccb0 50%, #c8b898 70%, #b8a888 90%)',
                boxShadow: '0 0 30px rgba(255,255,240,0.4), 0 0 60px rgba(255,255,240,0.25), 0 0 120px rgba(255,250,230,0.15), 0 0 200px rgba(255,245,220,0.08)',
              }}>
              {/* Subtle full-moon limb darkening */}
              <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 50% 50%, transparent 50%, rgba(0,0,0,0.08) 70%, rgba(0,0,0,0.2) 90%, rgba(0,0,0,0.35) 100%)' }} />

              {/* ── Dark Maria (lunar seas) ── */}
              {/* Mare Imbrium — large dark area upper-left */}
              <div className="absolute rounded-full" style={{ top: '14%', left: '18%', width: '38%', height: '32%', background: 'radial-gradient(ellipse, rgba(80,70,55,0.35) 0%, rgba(90,80,65,0.2) 60%, transparent 100%)', filter: 'blur(1px)' }} />
              {/* Mare Serenitatis — dark patch upper-right of center */}
              <div className="absolute rounded-full" style={{ top: '20%', left: '50%', width: '28%', height: '24%', background: 'radial-gradient(ellipse, rgba(75,65,50,0.3) 0%, rgba(85,75,60,0.15) 60%, transparent 100%)', filter: 'blur(0.8px)' }} />
              {/* Mare Tranquillitatis — dark region center-right */}
              <div className="absolute rounded-full" style={{ top: '38%', left: '52%', width: '30%', height: '26%', background: 'radial-gradient(ellipse, rgba(70,60,48,0.32) 0%, rgba(80,70,55,0.18) 60%, transparent 100%)', filter: 'blur(1px)' }} />
              {/* Mare Crisium — isolated dark spot right side */}
              <div className="absolute rounded-full" style={{ top: '28%', left: '70%', width: '16%', height: '14%', background: 'radial-gradient(circle, rgba(65,55,42,0.35) 0%, rgba(75,65,50,0.15) 70%, transparent 100%)', filter: 'blur(0.5px)' }} />
              {/* Oceanus Procellarum — large dark area left side */}
              <div className="absolute rounded-full" style={{ top: '30%', left: '8%', width: '35%', height: '40%', background: 'radial-gradient(ellipse, rgba(85,75,58,0.28) 0%, rgba(95,85,68,0.12) 60%, transparent 100%)', filter: 'blur(1.2px)' }} />
              {/* Mare Nubium — lower dark patch */}
              <div className="absolute rounded-full" style={{ top: '58%', left: '30%', width: '25%', height: '20%', background: 'radial-gradient(ellipse, rgba(78,68,52,0.25) 0%, rgba(88,78,62,0.1) 65%, transparent 100%)', filter: 'blur(0.8px)' }} />
              {/* Mare Fecunditatis — lower right */}
              <div className="absolute rounded-full" style={{ top: '50%', left: '60%', width: '22%', height: '18%', background: 'radial-gradient(ellipse, rgba(72,62,48,0.28) 0%, rgba(82,72,55,0.12) 65%, transparent 100%)', filter: 'blur(0.7px)' }} />

              {/* ── Prominent Craters ── */}
              {/* Tycho — bright crater bottom with ray system */}
              <div className="absolute rounded-full" style={{ top: '72%', left: '42%', width: '10%', height: '10%', background: 'radial-gradient(circle, rgba(255,255,245,0.5) 0%, rgba(200,190,170,0.3) 50%, rgba(120,110,90,0.2) 80%, transparent 100%)', boxShadow: '0 0 3px rgba(255,255,240,0.3)' }} />
              {/* Tycho rays — bright streaks radiating outward */}
              <div className="absolute" style={{ top: '68%', left: '44%', width: '1px', height: '12px', background: 'linear-gradient(to top, rgba(255,255,240,0.15), transparent)', transform: 'rotate(-15deg)' }} />
              <div className="absolute" style={{ top: '70%', left: '48%', width: '1px', height: '10px', background: 'linear-gradient(to top, rgba(255,255,240,0.12), transparent)', transform: 'rotate(20deg)' }} />
              <div className="absolute" style={{ top: '76%', left: '40%', width: '1px', height: '8px', background: 'linear-gradient(to bottom, rgba(255,255,240,0.1), transparent)', transform: 'rotate(-30deg)' }} />

              {/* Copernicus — prominent crater center-left */}
              <div className="absolute rounded-full" style={{ top: '42%', left: '32%', width: '9%', height: '9%', background: 'radial-gradient(circle, rgba(180,170,150,0.4) 0%, rgba(100,90,70,0.3) 60%, transparent 100%)', boxShadow: 'inset 0 1px 1px rgba(255,255,240,0.2), inset 0 -1px 1px rgba(0,0,0,0.15)' }} />
              {/* Copernicus rays */}
              <div className="absolute" style={{ top: '39%', left: '34%', width: '1px', height: '6px', background: 'linear-gradient(to top, rgba(255,255,240,0.1), transparent)', transform: 'rotate(10deg)' }} />

              {/* Kepler — small bright crater */}
              <div className="absolute rounded-full" style={{ top: '40%', left: '20%', width: '6%', height: '6%', background: 'radial-gradient(circle, rgba(220,210,190,0.35) 0%, rgba(140,130,110,0.2) 70%, transparent 100%)', boxShadow: 'inset 0 0.5px 0.5px rgba(255,255,240,0.2)' }} />

              {/* Plato — dark-floored crater at top */}
              <div className="absolute rounded-full" style={{ top: '12%', left: '38%', width: '12%', height: '8%', background: 'radial-gradient(ellipse, rgba(60,52,40,0.4) 0%, rgba(80,70,55,0.2) 70%, transparent 100%)', boxShadow: 'inset 0 0.5px 0.5px rgba(255,255,240,0.1)' }} />

              {/* Aristarchus — very bright small crater */}
              <div className="absolute rounded-full" style={{ top: '30%', left: '14%', width: '5%', height: '5%', background: 'radial-gradient(circle, rgba(255,255,240,0.6) 0%, rgba(220,210,190,0.3) 60%, transparent 100%)', boxShadow: '0 0 2px rgba(255,255,240,0.3)' }} />

              {/* Grimaldi — dark-floored crater left edge */}
              <div className="absolute rounded-full" style={{ top: '48%', left: '5%', width: '8%', height: '10%', background: 'radial-gradient(ellipse, rgba(55,48,38,0.4) 0%, rgba(75,65,52,0.15) 70%, transparent 100%)' }} />

              {/* Small scattered craters for texture */}
              <div className="absolute rounded-full" style={{ top: '55%', left: '45%', width: '4%', height: '4%', background: 'radial-gradient(circle, rgba(160,150,130,0.3) 0%, transparent 80%)', boxShadow: 'inset 0 0.5px 0.5px rgba(255,255,240,0.15)' }} />
              <div className="absolute rounded-full" style={{ top: '24%', left: '42%', width: '5%', height: '5%', background: 'radial-gradient(circle, rgba(150,140,120,0.25) 0%, transparent 75%)', boxShadow: 'inset 0 0.5px 0.5px rgba(255,255,240,0.1)' }} />
              <div className="absolute rounded-full" style={{ top: '65%', left: '55%', width: '5%', height: '5%', background: 'radial-gradient(circle, rgba(170,160,140,0.2) 0%, transparent 80%)', boxShadow: 'inset 0 0.5px 0.5px rgba(255,255,240,0.1)' }} />
              <div className="absolute rounded-full" style={{ top: '80%', left: '28%', width: '6%', height: '6%', background: 'radial-gradient(circle, rgba(145,135,115,0.25) 0%, transparent 75%)', boxShadow: 'inset 0 0.5px 0.5px rgba(255,255,240,0.12)' }} />
              <div className="absolute rounded-full" style={{ top: '15%', left: '62%', width: '4%', height: '4%', background: 'radial-gradient(circle, rgba(155,145,125,0.2) 0%, transparent 80%)' }} />
              <div className="absolute rounded-full" style={{ top: '60%', left: '18%', width: '5%', height: '5%', background: 'radial-gradient(circle, rgba(140,130,110,0.22) 0%, transparent 75%)', boxShadow: 'inset 0 0.5px 0.5px rgba(255,255,240,0.08)' }} />

              {/* Surface texture overlay — subtle noise effect */}
              <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,255,240,0.06) 0%, transparent 20%), radial-gradient(circle at 70% 60%, rgba(255,255,240,0.04) 0%, transparent 15%), radial-gradient(circle at 45% 75%, rgba(0,0,0,0.04) 0%, transparent 18%)' }} />
            </div>
            {/* Bright full-moon halo */}
            <div className="absolute -inset-16 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,240,0.1) 0%, rgba(255,255,240,0.04) 40%, transparent 70%)' }} />
            {/* Subtle cross-flare on full moon */}
            <div className="absolute top-1/2 left-[30%] -translate-y-1/2 w-[50px] h-[1px] animate-star-flare"
              style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,240,0.3), transparent)' }} />
            <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-[1px] h-[40px] animate-star-flare"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,240,0.2), transparent)' }} />
          </div>

          {/* ── Distant Planets ── */}
          {/* Saturn — upper left area */}
          <div className="absolute top-[15%] left-[18%]" style={{ opacity: 0.4 }}>
            <div className="w-6 h-6 rounded-full"
              style={{ background: 'radial-gradient(circle at 40% 35%, #ffe0a0 0%, #d4a060 40%, #8a6040 80%, #504030 100%)' }} />
            {/* Ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-3 rounded-full"
              style={{ border: '1px solid rgba(255,220,160,0.4)', transform: 'translate(-50%, -50%) rotateX(70deg)' }} />
          </div>

          {/* Mars — small reddish dot */}
          <div className="absolute top-[22%] right-[30%] w-3 h-3 rounded-full" style={{ opacity: 0.5, background: 'radial-gradient(circle at 40% 40%, #ff8060, #c04020, #801000)', boxShadow: '0 0 8px rgba(255,80,40,0.3)' }} />

          {/* Jupiter — larger, banded */}
          <div className="absolute top-[32%] left-[6%]" style={{ opacity: 0.25 }}>
            <div className="w-10 h-10 rounded-full overflow-hidden"
              style={{ background: 'radial-gradient(circle at 38% 38%, #f0d0a0 0%, #d4a870 30%, #b08050 60%, #806040 100%)' }}>
              <div className="absolute top-[30%] left-0 right-0 h-[2px] bg-white/15" />
              <div className="absolute top-[45%] left-0 right-0 h-[3px] bg-black/10" />
              <div className="absolute top-[60%] left-0 right-0 h-[1.5px] bg-white/10" />
            </div>
          </div>

          {/* Neptune — distant blue planet, subtle */}
          <div className="absolute top-[12%] right-[45%] w-4 h-4 rounded-full" style={{ opacity: 0.3, background: 'radial-gradient(circle at 40% 40%, #80c0ff, #4080d0, #204080)', boxShadow: '0 0 10px rgba(80,140,255,0.2)' }} />

          {/* ── Moonlit Cloud Wisps — just above Earth's arc ── */}
          <div className="cloud-wisp cloud-wisp-1" />
          <div className="cloud-wisp cloud-wisp-2" />
          <div className="cloud-wisp cloud-wisp-3" />

          {/* ── Celestial Wonders ── */}

          {/* Nebula Whisper — very faint distant nebula color wash */}
          <div className="absolute top-[8%] left-[30%] w-[500px] h-[300px] rounded-full blur-[120px] animate-nebula-drift"
            style={{ background: 'radial-gradient(circle, rgba(100,50,200,0.06) 0%, rgba(200,100,255,0.03) 50%, transparent 70%)' }} />
          <div className="absolute top-[5%] right-[20%] w-[400px] h-[250px] rounded-full blur-[100px] animate-nebula-drift-2"
            style={{ background: 'radial-gradient(circle, rgba(0,100,200,0.05) 0%, rgba(0,200,150,0.03) 50%, transparent 70%)' }} />

          {/* Milky Way Band — very subtle diagonal band across the sky */}
          <div className="milky-way-band" />

          {/* Zodiacal Light — very faint triangular glow near horizon */}
          <div className="absolute bottom-[20%] left-[35%] w-[200px] h-[300px] pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(255,240,200,0.04) 0%, rgba(255,230,180,0.02) 40%, transparent 100%)',
              clipPath: 'polygon(30% 100%, 50% 0%, 70% 100%)',
              filter: 'blur(15px)',
            }} />

          {/* Bright Venus-like star with diffraction spikes */}
          <div className="absolute top-[10%] left-[42%]">
            <div className="w-4 h-4 rounded-full animate-pulsar-core"
              style={{ background: 'radial-gradient(circle, #fff 0%, rgba(255,220,150,0.8) 40%, transparent 70%)', boxShadow: '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,200,100,0.4), 0 0 80px rgba(255,150,50,0.2)' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[1px] animate-star-flare"
              style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.6), transparent)' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-[60px] animate-star-flare"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.6), transparent)' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40px] h-[1px] rotate-45 animate-star-flare-2"
              style={{ background: 'linear-gradient(to right, transparent, rgba(255,200,100,0.4), transparent)' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40px] h-[1px] -rotate-45 animate-star-flare-2"
              style={{ background: 'linear-gradient(to right, transparent, rgba(255,200,100,0.4), transparent)' }} />
          </div>

          {/* Sirius — bright blue-white star */}
          <div className="absolute top-[28%] right-[8%]">
            <div className="w-3 h-3 rounded-full"
              style={{ background: 'radial-gradient(circle, #fff 0%, rgba(150,200,255,0.7) 50%, transparent 70%)', boxShadow: '0 0 12px rgba(150,200,255,0.6), 0 0 25px rgba(100,150,255,0.3)' }} />
          </div>

          {/* Orion's Belt — three aligned stars */}
          <div className="absolute top-[25%] left-[32%]" style={{ opacity: 0.55 }}>
            <div className="w-2 h-2 rounded-full bg-white/70" style={{ boxShadow: '0 0 6px rgba(200,220,255,0.5)' }} />
            <div className="absolute top-[6px] left-[10px] w-2 h-2 rounded-full bg-white/65" style={{ boxShadow: '0 0 5px rgba(200,220,255,0.4)' }} />
            <div className="absolute top-[12px] left-[20px] w-1.5 h-1.5 rounded-full bg-white/60" style={{ boxShadow: '0 0 5px rgba(200,220,255,0.4)' }} />
            {/* Betelgeuse — reddish bright star above belt */}
            <div className="absolute -top-[16px] -left-[4px] w-2.5 h-2.5 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,180,120,0.9), rgba(255,100,50,0.4), transparent)', boxShadow: '0 0 8px rgba(255,120,60,0.4)' }} />
            {/* Rigel — blue-white below belt */}
            <div className="absolute top-[24px] left-[24px] w-2 h-2 rounded-full" style={{ background: 'radial-gradient(circle, #fff, rgba(160,200,255,0.5), transparent)', boxShadow: '0 0 6px rgba(160,200,255,0.5)' }} />
          </div>

          {/* Star Cluster (Pleiades) — tiny group of stars */}
          <div className="absolute top-[18%] left-[60%]" style={{ opacity: 0.6 }}>
            <div className="w-1.5 h-1.5 rounded-full bg-white/80" style={{ boxShadow: '0 0 4px white' }} />
            <div className="absolute top-1 left-2 w-1 h-1 rounded-full bg-white/60" style={{ boxShadow: '0 0 3px white' }} />
            <div className="absolute -top-1 left-3 w-1 h-1 rounded-full bg-white/50" style={{ boxShadow: '0 0 3px white' }} />
            <div className="absolute top-2 left-1 w-0.5 h-0.5 rounded-full bg-white/40" />
            <div className="absolute top-0 left-4 w-0.5 h-0.5 rounded-full bg-white/45" />
            <div className="absolute top-1.5 left-5 w-0.5 h-0.5 rounded-full bg-white/35" />
            <div className="absolute -top-0.5 left-5.5 w-0.5 h-0.5 rounded-full bg-white/30" />
            {/* Faint nebula haze around Pleiades */}
            <div className="absolute -inset-3 rounded-full" style={{ background: 'radial-gradient(circle, rgba(150,180,255,0.04) 0%, transparent 70%)', filter: 'blur(5px)' }} />
          </div>

          {/* Second Star Cluster — upper right */}
          <div className="absolute top-[8%] right-[25%]" style={{ opacity: 0.45 }}>
            <div className="w-1 h-1 rounded-full bg-white/60" style={{ boxShadow: '0 0 3px white' }} />
            <div className="absolute top-1 left-1.5 w-0.5 h-0.5 rounded-full bg-white/45" />
            <div className="absolute -top-0.5 left-2 w-1 h-1 rounded-full bg-white/50" style={{ boxShadow: '0 0 2px white' }} />
            <div className="absolute top-1.5 left-3 w-0.5 h-0.5 rounded-full bg-white/40" />
          </div>

          {/* Distant Galaxy Smudge — very faint elliptical */}
          <div className="absolute top-[35%] right-[18%] w-8 h-3 rounded-full animate-slow-rotate" style={{ opacity: 0.12, background: 'radial-gradient(ellipse, rgba(255,255,255,0.5) 0%, rgba(200,210,230,0.2) 50%, transparent 80%)', filter: 'blur(1.5px)' }} />

          {/* Binary Star System — two close stars with gentle color contrast */}
          <div className="absolute top-[40%] right-[35%]" style={{ opacity: 0.5 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'radial-gradient(circle, #fff, rgba(255,200,120,0.6), transparent)', boxShadow: '0 0 6px rgba(255,220,150,0.4)' }} />
            <div className="absolute top-[3px] left-[5px] w-1 h-1 rounded-full" style={{ background: 'radial-gradient(circle, #fff, rgba(150,180,255,0.6), transparent)', boxShadow: '0 0 4px rgba(150,180,255,0.3)' }} />
          </div>

          {/* ── Ambient cosmic depth ── */}
          <div className="absolute top-[30%] right-[15%] w-80 h-80 bg-brand-red/4 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-[15%] left-[25%] w-64 h-64 bg-blue-500/3 rounded-full blur-[80px] animate-pulse-slow-2" />
          <div className="absolute top-[50%] left-[50%] w-96 h-96 -translate-x-1/2 -translate-y-1/2 bg-indigo-900/3 rounded-full blur-[120px] animate-pulse-slow" />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ★ BLACK HOLE — Fund/Direct AIF ★
          Gravitational lensing black hole + accretion disk + matter jets
         ═══════════════════════════════════════════════════════════ */}
      {variant === 'blackhole' && (
        <>
          {/* Gravitational lensing light bend — warped light ring */}
          <div className="absolute top-[38%] right-[20%] -translate-y-1/2">
            {/* Event horizon — pitch black core */}
            <div className="w-24 h-24 rounded-full bg-black relative"
              style={{ boxShadow: '0 0 0 3px rgba(255,150,50,0.15), 0 0 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,1)' }}>
              {/* Photon ring — bright orange ring around the event horizon */}
              <div className="absolute -inset-1 rounded-full border-2 border-orange-400/50 animate-blackhole-photon-ring"
                style={{ boxShadow: '0 0 15px rgba(255,165,0,0.3), 0 0 30px rgba(255,100,0,0.15), inset 0 0 15px rgba(255,165,0,0.2)' }} />
            </div>

            {/* Accretion disk — tilted elliptical ring of superheated matter */}
            <div className="absolute top-1/2 left-1/2 w-[280px] h-[80px] -translate-x-1/2 -translate-y-1/2 animate-accretion-spin"
              style={{ transform: 'translate(-50%, -50%) rotateX(75deg)' }}>
              <div className="absolute inset-0 rounded-full"
                style={{ background: 'conic-gradient(from 0deg, rgba(255,100,0,0.5) 0%, rgba(255,200,50,0.7) 25%, rgba(255,255,200,0.4) 50%, rgba(255,100,0,0.6) 75%, rgba(255,100,0,0.5) 100%)', filter: 'blur(3px)' }} />
              <div className="absolute inset-[30%] rounded-full bg-black" />
            </div>

            {/* Second inner accretion ring */}
            <div className="absolute top-1/2 left-1/2 w-[180px] h-[50px] -translate-x-1/2 -translate-y-1/2 animate-accretion-spin-reverse"
              style={{ transform: 'translate(-50%, -50%) rotateX(70deg) rotateZ(10deg)' }}>
              <div className="absolute inset-0 rounded-full"
                style={{ background: 'conic-gradient(from 90deg, rgba(255,200,100,0.3) 0%, rgba(255,255,200,0.5) 30%, rgba(255,150,50,0.2) 60%, rgba(255,200,100,0.4) 100%)', filter: 'blur(2px)' }} />
              <div className="absolute inset-[35%] rounded-full bg-black" />
            </div>

            {/* Relativistic jet — matter beam shooting from poles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[3px] h-[200px] -translate-y-full animate-blackhole-jet"
              style={{ background: 'linear-gradient(to top, rgba(100,150,255,0.6), rgba(150,200,255,0.4), rgba(200,220,255,0.2), transparent)', filter: 'blur(1px)' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[3px] h-[200px] animate-blackhole-jet-bottom"
              style={{ background: 'linear-gradient(to bottom, rgba(100,150,255,0.6), rgba(150,200,255,0.4), rgba(200,220,255,0.2), transparent)', filter: 'blur(1px)' }} />

            {/* Jet glow cones */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full w-[40px] h-[150px] animate-blackhole-jet"
              style={{ background: 'linear-gradient(to top, rgba(100,150,255,0.08), transparent)', clipPath: 'polygon(40% 100%, 60% 100%, 100% 0%, 0% 0%)', filter: 'blur(4px)' }} />
          </div>

          {/* Gravitational lensing arcs */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="78%" cy="38%" rx="180" ry="100" fill="none" stroke="rgba(255,200,100,0.06)" strokeWidth="40" className="animate-pulse-slow"
              style={{ filter: 'blur(15px)' }} />
          </svg>

          {/* Infalling matter streaks */}
          <div className="blackhole-matter-streak-1" />
          <div className="blackhole-matter-streak-2" />
          <div className="blackhole-matter-streak-3" />

          {/* Ambient glow */}
          <div className="absolute top-[30%] right-[15%] w-80 h-80 bg-orange-500/8 rounded-full blur-[100px] animate-pulse-slow" />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ★ SUPERNOVA — Fund/SEBI Co-Invest Framework ★
          Expanding supernova explosion + shockwave rings + debris
         ═══════════════════════════════════════════════════════════ */}
      {variant === 'supernova' && (
        <>
          {/* Central supernova core — white-hot center */}
          <div className="absolute top-[35%] left-[45%] -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 rounded-full animate-supernova-core"
              style={{ background: 'radial-gradient(circle, #fff 0%, #ffe4b5 30%, #ff6b00 60%, rgba(208,2,27,0.8) 80%, transparent 100%)', boxShadow: '0 0 40px rgba(255,255,255,0.7), 0 0 80px rgba(255,165,0,0.4), 0 0 120px rgba(208,2,27,0.2)' }} />

            {/* Expanding shockwave rings */}
            <div className="absolute -inset-4 rounded-full border-2 border-white/50 animate-supernova-ring-1" />
            <div className="absolute -inset-8 rounded-full border-2 border-orange-400/40 animate-supernova-ring-2" />
            <div className="absolute -inset-16 rounded-full border border-red-500/30 animate-supernova-ring-3" />
            <div className="absolute -inset-28 rounded-full border border-brand-red/20 animate-supernova-ring-4" />
            <div className="absolute -inset-44 rounded-full border border-violet-500/10 animate-supernova-ring-5" />
          </div>

          {/* Supernova gas ejecta — vivid color clouds expanding */}
          <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] animate-supernova-ejecta-1"
            style={{ background: 'radial-gradient(circle, rgba(255,100,0,0.15) 0%, rgba(208,2,27,0.08) 40%, transparent 70%)', filter: 'blur(30px)' }} />
          <div className="absolute top-[25%] left-[50%] w-[350px] h-[350px] animate-supernova-ejecta-2"
            style={{ background: 'radial-gradient(circle, rgba(100,150,255,0.12) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)', filter: 'blur(25px)' }} />
          <div className="absolute top-[40%] left-[35%] w-[300px] h-[300px] animate-supernova-ejecta-3"
            style={{ background: 'radial-gradient(circle, rgba(255,200,50,0.1) 0%, rgba(255,100,0,0.05) 50%, transparent 70%)', filter: 'blur(20px)' }} />

          {/* Flying debris / stellar remnants */}
          <div className="supernova-debris supernova-debris-1" />
          <div className="supernova-debris supernova-debris-2" />
          <div className="supernova-debris supernova-debris-3" />
          <div className="supernova-debris supernova-debris-4" />
          <div className="supernova-debris supernova-debris-5" />
          <div className="supernova-debris supernova-debris-6" />

          {/* Light echo ripple */}
          <div className="absolute top-[35%] left-[45%] w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full animate-supernova-light-echo"
            style={{ boxShadow: '0 0 0 0 rgba(255,200,100,0.3)' }} />

          {/* Ambient supernova glow */}
          <div className="absolute top-[25%] left-[35%] w-96 h-96 bg-orange-500/6 rounded-full blur-[120px] animate-pulse-slow" />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ★ WORMHOLE — Tools Page ★
          Spinning wormhole tunnel + time-space distortion + energy rings
         ═══════════════════════════════════════════════════════════ */}
      {variant === 'wormhole' && (
        <>
          {/* Wormhole tunnel — concentric spinning rings creating depth illusion */}
          <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2">
            {/* Outermost ring */}
            <div className="absolute -inset-[120px] rounded-full border border-violet-500/10 animate-wormhole-ring-1"
              style={{ transform: 'rotateX(70deg)' }} />
            <div className="absolute -inset-[100px] rounded-full border border-brand-red/15 animate-wormhole-ring-2"
              style={{ transform: 'rotateX(70deg)' }} />
            <div className="absolute -inset-[80px] rounded-full border-2 border-violet-400/20 animate-wormhole-ring-3"
              style={{ transform: 'rotateX(70deg)' }} />
            <div className="absolute -inset-[60px] rounded-full border-2 border-blue-400/25 animate-wormhole-ring-4"
              style={{ transform: 'rotateX(70deg)' }} />
            <div className="absolute -inset-[40px] rounded-full border-2 border-cyan-400/30 animate-wormhole-ring-5"
              style={{ transform: 'rotateX(70deg)' }} />
            <div className="absolute -inset-[20px] rounded-full border-2 border-white/35 animate-wormhole-ring-6"
              style={{ transform: 'rotateX(70deg)' }} />

            {/* Wormhole center — bright core opening */}
            <div className="w-10 h-10 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(100,200,255,0.5) 30%, rgba(139,92,246,0.3) 60%, transparent 100%)', boxShadow: '0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(100,200,255,0.3), 0 0 100px rgba(139,92,246,0.15)' }} />
          </div>

          {/* Time-space distortion grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
            {/* Horizontal distortion lines curving toward wormhole */}
            <path d="M0,20% Q50%,25% 100%,20%" fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="0.5" />
            <path d="M0,40% Q50%,48% 100%,40%" fill="none" stroke="rgba(139,92,246,0.4)" strokeWidth="0.5" />
            <path d="M0,60% Q50%,52% 100%,60%" fill="none" stroke="rgba(139,92,246,0.4)" strokeWidth="0.5" />
            <path d="M0,80% Q50%,75% 100%,80%" fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="0.5" />
          </svg>

          {/* Energy streams spiraling into the wormhole */}
          <div className="wormhole-energy-stream wormhole-stream-1" />
          <div className="wormhole-energy-stream wormhole-stream-2" />
          <div className="wormhole-energy-stream wormhole-stream-3" />

          {/* Space-time fabric distortion glow */}
          <div className="absolute top-[35%] left-[45%] w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full animate-wormhole-distortion"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.05) 30%, transparent 60%)', filter: 'blur(40px)' }} />

          {/* Floating time particles */}
          <div className="space-particles-vivid" />
          <div className="space-particles-vivid-2" />

          {/* Ambient glow */}
          <div className="absolute top-[30%] left-[40%] w-80 h-80 bg-violet-500/8 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-[20%] right-[20%] w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] animate-pulse-slow-2" />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          CITY — Why AIFs Page
          Urban skyline + laser beams + helicopters + drones
         ═══════════════════════════════════════════════════════════ */}
      {variant === 'city' && (
        <>
          {/* City skyline silhouette — buildings across the bottom */}
          <svg className="absolute bottom-0 left-0 right-0 w-full h-[55%]" viewBox="0 0 1440 500" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Laser beam gradients */}
              <linearGradient id="laser-red" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(208,2,27,0)" />
                <stop offset="15%" stopColor="rgba(208,2,27,0.7)" />
                <stop offset="50%" stopColor="rgba(208,2,27,0.15)" />
                <stop offset="100%" stopColor="rgba(208,2,27,0)" />
              </linearGradient>
              <linearGradient id="laser-blue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(60,130,255,0)" />
                <stop offset="15%" stopColor="rgba(60,130,255,0.6)" />
                <stop offset="50%" stopColor="rgba(60,130,255,0.12)" />
                <stop offset="100%" stopColor="rgba(60,130,255,0)" />
              </linearGradient>
              <linearGradient id="laser-white" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="15%" stopColor="rgba(255,255,255,0.5)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              {/* Diagonal laser gradients for angled beams */}
              <linearGradient id="laser-red-diag" x1="0" y1="1" x2="0.3" y2="0">
                <stop offset="0%" stopColor="rgba(208,2,27,0.6)" />
                <stop offset="40%" stopColor="rgba(208,2,27,0.15)" />
                <stop offset="100%" stopColor="rgba(208,2,27,0)" />
              </linearGradient>
              <linearGradient id="laser-blue-diag" x1="0" y1="1" x2="-0.3" y2="0">
                <stop offset="0%" stopColor="rgba(60,130,255,0.5)" />
                <stop offset="40%" stopColor="rgba(60,130,255,0.1)" />
                <stop offset="100%" stopColor="rgba(60,130,255,0)" />
              </linearGradient>
            </defs>

            {/* ── Buildings — varied heights, tighter spacing ── */}
            {/* Layer 1: Far background buildings */}
            <rect x="0" y="220" width="45" height="280" fill="rgba(12,12,22,0.85)" />
            <rect x="48" y="180" width="38" height="320" fill="rgba(10,10,18,0.9)" />
            <rect x="90" y="240" width="55" height="260" fill="rgba(16,16,26,0.85)" />
            <rect x="150" y="140" width="42" height="360" fill="rgba(8,8,15,0.95)" />
            <rect x="195" y="200" width="50" height="300" fill="rgba(14,14,24,0.88)" />
            <rect x="250" y="100" width="48" height="400" fill="rgba(6,6,12,0.95)" />
            <rect x="302" y="160" width="40" height="340" fill="rgba(12,12,22,0.9)" />
            <rect x="345" y="80" width="55" height="420" fill="rgba(5,5,10,0.97)" />
            <rect x="405" y="130" width="38" height="370" fill="rgba(10,10,18,0.92)" />
            <rect x="448" y="60" width="52" height="440" fill="rgba(4,4,8,0.97)" />
            <rect x="505" y="150" width="42" height="350" fill="rgba(12,12,22,0.88)" />
            <rect x="552" y="90" width="50" height="410" fill="rgba(6,6,12,0.95)" />
            <rect x="608" y="180" width="38" height="320" fill="rgba(14,14,24,0.87)" />
            <rect x="650" y="45" width="60" height="455" fill="rgba(3,3,7,0.97)" />
            <rect x="715" y="120" width="42" height="380" fill="rgba(10,10,18,0.92)" />
            <rect x="762" y="70" width="55" height="430" fill="rgba(5,5,10,0.96)" />
            <rect x="822" y="160" width="40" height="340" fill="rgba(12,12,22,0.88)" />
            <rect x="866" y="100" width="48" height="400" fill="rgba(7,7,14,0.95)" />
            <rect x="920" y="55" width="58" height="445" fill="rgba(4,4,8,0.97)" />
            <rect x="982" y="130" width="42" height="370" fill="rgba(11,11,20,0.9)" />
            <rect x="1030" y="80" width="50" height="420" fill="rgba(6,6,12,0.95)" />
            <rect x="1085" y="170" width="38" height="330" fill="rgba(14,14,24,0.87)" />
            <rect x="1128" y="50" width="55" height="450" fill="rgba(3,3,7,0.97)" />
            <rect x="1188" y="140" width="42" height="360" fill="rgba(10,10,18,0.92)" />
            <rect x="1235" y="90" width="50" height="410" fill="rgba(6,6,12,0.95)" />
            <rect x="1290" y="110" width="45" height="390" fill="rgba(8,8,15,0.93)" />
            <rect x="1340" y="70" width="52" height="430" fill="rgba(5,5,10,0.96)" />
            <rect x="1395" y="150" width="50" height="350" fill="rgba(12,12,22,0.88)" />

            {/* ── Antenna/spire details on tallest buildings ── */}
            <line x1="474" y1="60" x2="474" y2="20" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <circle cx="474" cy="18" r="2.5" fill="#D0021B" opacity="0.9" className="animate-twinkle-1" />
            <line x1="680" y1="45" x2="680" y2="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <circle cx="680" cy="3" r="2.5" fill="#D0021B" opacity="0.9" className="animate-twinkle-2" />
            <line x1="949" y1="55" x2="949" y2="12" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <circle cx="949" cy="10" r="3" fill="#D0021B" opacity="0.9" className="animate-twinkle-3" />
            <line x1="1155" y1="50" x2="1155" y2="8" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <circle cx="1155" cy="6" r="2.5" fill="#D0021B" opacity="0.9" className="animate-twinkle-1" />
            <line x1="345" y1="80" x2="345" y2="48" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <circle cx="345" cy="46" r="2" fill="#D0021B" opacity="0.8" className="animate-twinkle-2" />
            <line x1="1366" y1="70" x2="1366" y2="35" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <circle cx="1366" cy="33" r="2" fill="#D0021B" opacity="0.8" className="animate-twinkle-3" />

            {/* ── Laser Beams from building tops — vertical + angled ── */}
            {/* Laser 1 — red vertical from tallest */}
            <rect x="678" y="-200" width="3" height="250" fill="url(#laser-red)" className="city-laser city-laser-1" />
            {/* Laser 2 — blue vertical */}
            <rect x="947" y="-180" width="2.5" height="240" fill="url(#laser-blue)" className="city-laser city-laser-2" />
            {/* Laser 3 — white vertical */}
            <rect x="1153" y="-160" width="2" height="220" fill="url(#laser-white)" className="city-laser city-laser-3" />
            {/* Laser 4 — red vertical from left tower */}
            <rect x="472" y="-150" width="2.5" height="215" fill="url(#laser-red)" className="city-laser city-laser-4" />
            {/* Laser 5 — angled red beam from center-left tower */}
            <line x1="345" y1="48" x2="280" y2="-120" stroke="rgba(208,2,27,0.3)" strokeWidth="1.5" className="city-laser city-laser-5">
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
            </line>
            {/* Laser 6 — angled blue beam from right tower */}
            <line x1="1366" y1="33" x2="1430" y2="-100" stroke="rgba(60,130,255,0.25)" strokeWidth="1.5" className="city-laser city-laser-6">
              <animate attributeName="opacity" values="0.25;0.5;0.25" dur="4s" repeatCount="indefinite" />
            </line>
            {/* Laser 7 — crossing angled beam */}
            <line x1="680" y1="3" x2="600" y2="-150" stroke="rgba(208,2,27,0.2)" strokeWidth="1" className="city-laser city-laser-7">
              <animate attributeName="opacity" values="0.2;0.45;0.2" dur="3.5s" repeatCount="indefinite" />
            </line>
            {/* Laser 8 — blue angled from center tower */}
            <line x1="949" y1="10" x2="1020" y2="-140" stroke="rgba(60,130,255,0.2)" strokeWidth="1" className="city-laser city-laser-8">
              <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2.8s" repeatCount="indefinite" />
            </line>

            {/* Laser glow halos at source points */}
            <circle cx="680" cy="3" r="8" fill="rgba(208,2,27,0.15)" className="city-laser city-laser-1">
              <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="949" cy="10" r="7" fill="rgba(60,130,255,0.12)" className="city-laser city-laser-2">
              <animate attributeName="r" values="5;10;5" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="1155" cy="6" r="6" fill="rgba(255,255,255,0.1)" className="city-laser city-laser-3">
              <animate attributeName="r" values="4;9;4" dur="3s" repeatCount="indefinite" />
            </circle>

            {/* ── Building window lights — more dense ── */}
            {/* Building at x=250 */}
            <rect x="258" y="115" width="3" height="3" fill="rgba(255,220,100,0.6)" />
            <rect x="265" y="145" width="3" height="3" fill="rgba(255,220,100,0.4)" />
            <rect x="272" y="200" width="3" height="3" fill="rgba(255,255,200,0.5)" />
            <rect x="260" y="280" width="3" height="3" fill="rgba(255,220,100,0.3)" />
            {/* Building at x=345 */}
            <rect x="355" y="95" width="3" height="3" fill="rgba(255,220,100,0.6)" />
            <rect x="365" y="130" width="3" height="3" fill="rgba(255,255,200,0.5)" />
            <rect x="358" y="200" width="3" height="3" fill="rgba(255,220,100,0.4)" />
            <rect x="370" y="280" width="3" height="3" fill="rgba(255,220,100,0.3)" />
            {/* Building at x=448 */}
            <rect x="455" y="75" width="3" height="3" fill="rgba(255,220,100,0.7)" />
            <rect x="465" y="110" width="3" height="3" fill="rgba(255,255,200,0.5)" />
            <rect x="458" y="160" width="3" height="3" fill="rgba(255,220,100,0.4)" />
            <rect x="470" y="230" width="3" height="3" fill="rgba(255,255,200,0.4)" />
            <rect x="460" y="310" width="3" height="3" fill="rgba(255,220,100,0.3)" />
            {/* Building at x=650 (tallest) */}
            <rect x="658" y="60" width="3" height="3" fill="rgba(255,220,100,0.7)" />
            <rect x="670" y="95" width="3" height="3" fill="rgba(255,255,200,0.6)" />
            <rect x="662" y="150" width="3" height="3" fill="rgba(255,220,100,0.5)" />
            <rect x="685" y="200" width="3" height="3" fill="rgba(255,220,100,0.4)" />
            <rect x="668" y="270" width="3" height="3" fill="rgba(255,255,200,0.3)" />
            <rect x="690" y="340" width="3" height="3" fill="rgba(255,220,100,0.25)" />
            {/* Building at x=762 */}
            <rect x="772" y="85" width="3" height="3" fill="rgba(255,220,100,0.6)" />
            <rect x="782" y="130" width="3" height="3" fill="rgba(255,255,200,0.5)" />
            <rect x="775" y="200" width="3" height="3" fill="rgba(255,220,100,0.4)" />
            <rect x="790" y="280" width="3" height="3" fill="rgba(255,220,100,0.3)" />
            {/* Building at x=920 */}
            <rect x="930" y="70" width="3" height="3" fill="rgba(255,220,100,0.7)" />
            <rect x="942" y="110" width="3" height="3" fill="rgba(255,255,200,0.5)" />
            <rect x="935" y="170" width="3" height="3" fill="rgba(255,220,100,0.4)" />
            <rect x="950" y="240" width="3" height="3" fill="rgba(255,220,100,0.3)" />
            <rect x="938" y="330" width="3" height="3" fill="rgba(255,255,200,0.25)" />
            {/* Building at x=1128 */}
            <rect x="1138" y="65" width="3" height="3" fill="rgba(255,220,100,0.7)" />
            <rect x="1148" y="100" width="3" height="3" fill="rgba(255,255,200,0.5)" />
            <rect x="1140" y="160" width="3" height="3" fill="rgba(255,220,100,0.4)" />
            <rect x="1155" y="230" width="3" height="3" fill="rgba(255,220,100,0.3)" />
            {/* Building at x=1340 */}
            <rect x="1350" y="85" width="3" height="3" fill="rgba(255,220,100,0.6)" />
            <rect x="1362" y="130" width="3" height="3" fill="rgba(255,255,200,0.5)" />
            <rect x="1355" y="200" width="3" height="3" fill="rgba(255,220,100,0.4)" />
            <rect x="1368" y="290" width="3" height="3" fill="rgba(255,220,100,0.3)" />
          </svg>

          {/* ── Helicopter 1 — flying left to right, mid-altitude ── */}
          <div className="city-helicopter city-heli-1">
            <svg width="28" height="14" viewBox="0 0 28 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Body */}
              <ellipse cx="14" cy="9" rx="8" ry="4" fill="rgba(20,20,35,0.9)" />
              {/* Cockpit window */}
              <ellipse cx="19" cy="8" rx="3" ry="2.5" fill="rgba(60,130,255,0.3)" />
              {/* Tail boom */}
              <line x1="6" y1="9" x2="1" y2="7" stroke="rgba(20,20,35,0.8)" strokeWidth="2" />
              {/* Tail rotor */}
              <line x1="0" y1="5" x2="2" y2="9" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
              {/* Main rotor — spinning blade */}
              <line x1="2" y1="5" x2="26" y2="5" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" className="city-rotor" />
              {/* Rotor hub */}
              <circle cx="14" cy="5" r="1" fill="rgba(255,255,255,0.3)" />
              {/* Skids */}
              <line x1="10" y1="13" x2="20" y2="13" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
              {/* Navigation light — red blinking */}
              <circle cx="22" cy="8" r="1" fill="#D0021B" opacity="0.9">
                <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1s" repeatCount="indefinite" />
              </circle>
              {/* Tail light — white blinking */}
              <circle cx="1" cy="7" r="0.8" fill="white" opacity="0.7">
                <animate attributeName="opacity" values="0.7;0.1;0.7" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          {/* ── Helicopter 2 — flying right to left, higher ── */}
          <div className="city-helicopter city-heli-2">
            <svg width="22" height="11" viewBox="0 0 28 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scaleX(-1)' }}>
              <ellipse cx="14" cy="9" rx="8" ry="4" fill="rgba(20,20,35,0.8)" />
              <ellipse cx="19" cy="8" rx="3" ry="2.5" fill="rgba(60,130,255,0.2)" />
              <line x1="6" y1="9" x2="1" y2="7" stroke="rgba(20,20,35,0.7)" strokeWidth="2" />
              <line x1="0" y1="5" x2="2" y2="9" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
              <line x1="2" y1="5" x2="26" y2="5" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" className="city-rotor" />
              <circle cx="14" cy="5" r="1" fill="rgba(255,255,255,0.25)" />
              <line x1="10" y1="13" x2="20" y2="13" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
              <circle cx="22" cy="8" r="1" fill="#D0021B" opacity="0.7">
                <animate attributeName="opacity" values="0.7;0.15;0.7" dur="1.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="1" cy="7" r="0.8" fill="white" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.8s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          {/* ── Drone 1 — small, hovering near buildings ── */}
          <div className="city-drone city-drone-1">
            <svg width="12" height="8" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Body */}
              <rect x="5" y="4" width="6" height="3" rx="1" fill="rgba(30,30,50,0.8)" />
              {/* Arms */}
              <line x1="5" y1="5" x2="1" y2="3" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
              <line x1="11" y1="5" x2="15" y2="3" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
              <line x1="5" y1="6" x2="1" y2="8" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
              <line x1="11" y1="6" x2="15" y2="8" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
              {/* Propeller discs */}
              <circle cx="1" cy="3" r="2" fill="rgba(255,255,255,0.06)" className="city-rotor" />
              <circle cx="15" cy="3" r="2" fill="rgba(255,255,255,0.06)" className="city-rotor" />
              <circle cx="1" cy="8" r="2" fill="rgba(255,255,255,0.06)" className="city-rotor" />
              <circle cx="15" cy="8" r="2" fill="rgba(255,255,255,0.06)" className="city-rotor" />
              {/* LEDs — green front, red back */}
              <circle cx="8" cy="4" r="0.7" fill="#34D399" opacity="0.9">
                <animate attributeName="opacity" values="0.9;0.3;0.9" dur="0.8s" repeatCount="indefinite" />
              </circle>
              <circle cx="8" cy="7" r="0.7" fill="#D0021B" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.8s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          {/* ── Drone 2 — slightly larger, different trajectory ── */}
          <div className="city-drone city-drone-2">
            <svg width="14" height="9" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="4" width="6" height="3" rx="1" fill="rgba(25,25,45,0.8)" />
              <line x1="5" y1="5" x2="1" y2="3" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
              <line x1="11" y1="5" x2="15" y2="3" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
              <line x1="5" y1="6" x2="1" y2="8" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
              <line x1="11" y1="6" x2="15" y2="8" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
              <circle cx="1" cy="3" r="2" fill="rgba(255,255,255,0.05)" className="city-rotor" />
              <circle cx="15" cy="3" r="2" fill="rgba(255,255,255,0.05)" className="city-rotor" />
              <circle cx="1" cy="8" r="2" fill="rgba(255,255,255,0.05)" className="city-rotor" />
              <circle cx="15" cy="8" r="2" fill="rgba(255,255,255,0.05)" className="city-rotor" />
              <circle cx="8" cy="4" r="0.7" fill="#34D399" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.7s" repeatCount="indefinite" />
              </circle>
              <circle cx="8" cy="7" r="0.7" fill="#D0021B" opacity="0.7">
                <animate attributeName="opacity" values="0.7;0.15;0.7" dur="0.7s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          {/* ── Drone 3 — small distant drone ── */}
          <div className="city-drone city-drone-3">
            <svg width="8" height="5" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="4" width="6" height="3" rx="1" fill="rgba(20,20,40,0.7)" />
              <line x1="5" y1="5" x2="2" y2="3" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
              <line x1="11" y1="5" x2="14" y2="3" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
              <circle cx="8" cy="4" r="0.8" fill="#34D399" opacity="0.7">
                <animate attributeName="opacity" values="0.7;0.2;0.7" dur="0.6s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          {/* City ground glow — warm amber light pollution */}
          <div className="absolute bottom-0 left-0 right-0 h-[35%]"
            style={{ background: 'linear-gradient(to top, rgba(208,2,27,0.1) 0%, rgba(255,140,50,0.05) 40%, transparent 100%)' }} />

          {/* Horizon glow line */}
          <div className="absolute bottom-[52%] left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(to right, transparent, rgba(208,2,27,0.2) 15%, rgba(255,180,80,0.15) 35%, rgba(60,130,255,0.12) 55%, rgba(208,2,27,0.2) 75%, transparent)', filter: 'blur(1px)' }} />

          {/* Laser scatter glow in sky */}
          <div className="absolute top-[5%] left-[45%] w-[200px] h-[200px] rounded-full animate-pulse-slow"
            style={{ background: 'radial-gradient(circle, rgba(208,2,27,0.04) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div className="absolute top-[10%] right-[30%] w-[180px] h-[180px] rounded-full animate-pulse-slow-2"
            style={{ background: 'radial-gradient(circle, rgba(60,130,255,0.03) 0%, transparent 70%)', filter: 'blur(35px)' }} />

          {/* Financial district ambient glow — warm metropolitan light */}
          <div className="absolute bottom-[10%] left-[30%] w-[500px] h-[200px] rounded-full animate-pulse-slow"
            style={{ background: 'radial-gradient(ellipse, rgba(255,180,80,0.06) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          <div className="absolute bottom-[15%] right-[20%] w-[400px] h-[180px] rounded-full animate-pulse-slow-2"
            style={{ background: 'radial-gradient(ellipse, rgba(208,2,27,0.05) 0%, transparent 70%)', filter: 'blur(40px)' }} />

          {/* Upper atmosphere glow */}
          <div className="absolute top-[15%] left-[20%] w-72 h-72 bg-brand-red/5 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute top-[25%] right-[15%] w-64 h-64 bg-blue-500/4 rounded-full blur-[80px] animate-pulse-slow-2" />
        </>
      )}

      {/* ── COMET — FAQs page ── */}
      {variant === 'comet' && (
        <>
          {/* Comet nucleus — bright white-blue core */}
          <div className="absolute top-[18%] right-[20%]">
            {/* Coma glow */}
            <div className="absolute -inset-8 rounded-full animate-pulse-slow"
              style={{ background: 'radial-gradient(circle, rgba(150,200,255,0.3) 0%, rgba(100,150,255,0.1) 50%, transparent 80%)', filter: 'blur(8px)' }} />
            {/* Nucleus core */}
            <div className="w-5 h-5 rounded-full"
              style={{ background: 'radial-gradient(circle, #fff 0%, rgba(180,220,255,0.9) 40%, rgba(100,150,255,0.5) 80%, transparent 100%)', boxShadow: '0 0 20px rgba(200,230,255,0.8), 0 0 40px rgba(150,200,255,0.4), 0 0 80px rgba(100,150,255,0.2)' }} />
          </div>

          {/* Dust tail — wide, faint yellow-white */}
          <div className="absolute top-[10%] right-[10%] w-[500px] h-[200px]"
            style={{
              background: 'linear-gradient(220deg, rgba(255,250,220,0.15) 0%, rgba(255,240,180,0.08) 30%, transparent 70%)',
              filter: 'blur(12px)',
              transformOrigin: 'right center',
              transform: 'rotate(-15deg)',
            }} />

          {/* Ion tail — narrower, blue */}
          <div className="absolute top-[18%] right-[22%] w-[400px] h-[60px]"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(100,180,255,0.2) 20%, rgba(80,150,255,0.1) 60%, transparent 100%)',
              filter: 'blur(8px)',
              transform: 'rotate(-10deg)',
              transformOrigin: 'right center',
            }} />

          {/* Comet trail particles */}
          <div className="absolute top-[22%] right-[30%] w-2 h-2 rounded-full bg-white/60 animate-twinkle-1"
            style={{ boxShadow: '0 0 6px rgba(200,230,255,0.6)' }} />
          <div className="absolute top-[26%] right-[38%] w-1.5 h-1.5 rounded-full bg-white/50 animate-twinkle-2"
            style={{ boxShadow: '0 0 4px rgba(200,230,255,0.4)' }} />
          <div className="absolute top-[29%] right-[46%] w-1 h-1 rounded-full bg-white/40 animate-twinkle-3" />
          <div className="absolute top-[31%] right-[54%] w-1 h-1 rounded-full bg-white/30 animate-twinkle-1" />
          <div className="absolute top-[24%] right-[35%] w-1 h-1 rounded-full bg-blue-200/40 animate-twinkle-2" />

          {/* Ambient glow */}
          <div className="absolute top-[10%] right-[15%] w-80 h-80 bg-blue-400/[0.06] rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-[20%] left-[20%] w-64 h-64 bg-brand-red/[0.04] rounded-full blur-[80px] animate-pulse-slow-2" />
        </>
      )}

      {/* ── METEOR — Refer an Investor page ── */}
      {variant === 'meteor' && (
        <>
          {/* Shooting stars reused with fire tones */}
          <div className="space-shooting-star-vivid animate-shoot-1" style={{ filter: 'hue-rotate(20deg)' }} />
          <div className="space-shooting-star-vivid animate-shoot-2" style={{ filter: 'hue-rotate(25deg)' }} />
          <div className="space-shooting-star-vivid animate-shoot-3" style={{ filter: 'hue-rotate(15deg)' }} />
          <div className="space-shooting-star-vivid animate-shoot-4" />
          <div className="space-shooting-star-vivid animate-shoot-5" style={{ filter: 'hue-rotate(30deg)' }} />

          {/* Large fireball meteor — upper-left */}
          <div className="absolute top-[12%] left-[25%]">
            {/* Fireball head */}
            <div className="w-4 h-4 rounded-full animate-twinkle-1"
              style={{ background: 'radial-gradient(circle, #fff 0%, rgba(255,180,50,0.9) 40%, rgba(255,80,0,0.6) 80%, transparent 100%)', boxShadow: '0 0 20px rgba(255,150,50,0.7), 0 0 40px rgba(255,80,0,0.3)' }} />
            {/* Fire trail */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-[120px] h-3"
              style={{ background: 'linear-gradient(to left, rgba(255,150,50,0.5), rgba(255,80,0,0.3), rgba(208,2,27,0.1), transparent)', filter: 'blur(3px)', borderRadius: '0 50% 50% 0' }} />
          </div>

          {/* Second fireball — right side */}
          <div className="absolute top-[30%] right-[18%]">
            <div className="w-3 h-3 rounded-full animate-twinkle-2"
              style={{ background: 'radial-gradient(circle, #fff 0%, rgba(255,200,80,0.9) 40%, rgba(255,100,0,0.5) 80%, transparent 100%)', boxShadow: '0 0 15px rgba(255,160,60,0.6), 0 0 30px rgba(255,80,0,0.2)' }} />
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-[80px] h-2"
              style={{ background: 'linear-gradient(to left, rgba(255,160,60,0.4), rgba(208,2,27,0.1), transparent)', filter: 'blur(2px)', borderRadius: '0 50% 50% 0' }} />
          </div>

          {/* Atmospheric glow from impacts */}
          <div className="absolute top-0 left-0 right-0 h-[40%]"
            style={{ background: 'radial-gradient(ellipse at 25% 0%, rgba(255,100,30,0.08) 0%, transparent 60%), radial-gradient(ellipse at 65% 0%, rgba(208,2,27,0.06) 0%, transparent 50%)' }} />

          {/* Ground flash glow */}
          <div className="absolute bottom-0 left-[30%] w-64 h-32 bg-orange-500/[0.05] rounded-full blur-[60px] animate-pulse-slow" />
          <div className="absolute bottom-0 right-[20%] w-48 h-24 bg-brand-red/[0.04] rounded-full blur-[50px] animate-pulse-slow-2" />
          <div className="absolute top-[30%] right-[20%] w-80 h-80 bg-orange-800/[0.04] rounded-full blur-[100px]" />
        </>
      )}

      {/* ── GALAXY — Startup Application page ── */}
      {variant === 'galaxy' && (
        <>
          {/* Deep space color wash */}
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 65% 40%, rgba(88,28,135,0.18) 0%, transparent 55%), radial-gradient(ellipse at 25% 70%, rgba(208,2,27,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 75%, rgba(59,130,246,0.06) 0%, transparent 40%)' }} />

          {/* Main spiral galaxy */}
          <div className="absolute top-[25%] right-[15%] w-[280px] h-[280px] animate-slow-rotate" style={{ opacity: 0.35 }}>
            {/* Outer spiral arms */}
            <div className="absolute inset-0 rounded-full"
              style={{ background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.6) 8%, transparent 18%, rgba(208,2,27,0.4) 26%, transparent 36%, rgba(255,255,255,0.5) 50%, transparent 60%, rgba(200,150,255,0.4) 68%, transparent 78%, rgba(255,255,255,0.4) 88%, transparent 98%)', filter: 'blur(4px)' }} />
            {/* Inner spiral density */}
            <div className="absolute inset-[20%] rounded-full"
              style={{ background: 'conic-gradient(from 45deg, transparent 0%, rgba(255,255,255,0.8) 15%, rgba(255,200,200,0.5) 30%, transparent 45%, rgba(255,255,255,0.6) 60%, transparent 75%)', filter: 'blur(3px)' }} />
            {/* Galactic core */}
            <div className="absolute inset-[42%] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(255,240,220,0.9) 0%, rgba(255,200,150,0.6) 50%, transparent 80%)', boxShadow: '0 0 30px rgba(255,220,180,0.5)', filter: 'blur(1px)' }} />
          </div>

          {/* Galaxy ambient glow */}
          <div className="absolute top-[20%] right-[10%] w-[320px] h-[320px] rounded-full animate-pulse-slow"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(88,28,135,0.06) 50%, transparent 70%)', filter: 'blur(40px)' }} />

          {/* Companion galaxy — smaller */}
          <div className="absolute bottom-[20%] left-[8%] w-[140px] h-[100px] animate-slow-rotate-reverse" style={{ opacity: 0.25 }}>
            <div className="absolute inset-0 rounded-full"
              style={{ background: 'conic-gradient(from 90deg, transparent 0%, rgba(208,2,27,0.7) 12%, transparent 25%, rgba(255,200,200,0.5) 50%, transparent 65%, rgba(208,2,27,0.5) 80%, transparent 95%)', filter: 'blur(3px)' }} />
            <div className="absolute inset-[35%] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(255,200,180,0.7) 0%, transparent 70%)', filter: 'blur(2px)' }} />
          </div>

          {/* Distant galaxy smudge */}
          <div className="absolute top-[12%] left-[45%] w-12 h-5 rounded-full animate-slow-rotate"
            style={{ opacity: 0.18, background: 'radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, rgba(200,200,255,0.3) 50%, transparent 80%)', filter: 'blur(2px)' }} />

          {/* Cosmic dust */}
          <div className="space-cosmic-dust" />

          {/* Bright star cluster near galactic core */}
          <div className="absolute top-[28%] right-[22%]">
            <div className="w-2 h-2 rounded-full bg-white/90 animate-twinkle-1"
              style={{ boxShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(200,180,255,0.4)' }} />
            <div className="absolute top-1 left-3 w-1.5 h-1.5 rounded-full bg-white/70 animate-twinkle-2"
              style={{ boxShadow: '0 0 6px rgba(255,255,255,0.5)' }} />
            <div className="absolute -top-1 left-5 w-1 h-1 rounded-full bg-white/60 animate-twinkle-3" />
          </div>

          {/* Ambient violet glow */}
          <div className="absolute top-[15%] right-[10%] w-96 h-96 bg-violet-600/[0.06] rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[25%] left-[15%] w-64 h-64 bg-brand-red/[0.04] rounded-full blur-[80px] animate-pulse-slow-2" />
        </>
      )}

      {/* ── ECLIPSE — Grievance Redressal page ── */}
      {variant === 'eclipse' && (
        <>
          {/* Eclipse system — upper-right */}
          <div className="absolute top-[8%] right-[12%]">
            {/* Solar corona — outermost glow */}
            <div className="absolute -inset-[80px] rounded-full animate-pulse-slow"
              style={{ background: 'radial-gradient(circle, rgba(255,250,230,0.15) 0%, rgba(255,220,150,0.08) 40%, rgba(255,180,80,0.04) 70%, transparent 100%)', filter: 'blur(20px)' }} />

            {/* Corona streamers */}
            <svg className="absolute -inset-[100px] w-[300px] h-[300px]" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
              <line x1="150" y1="150" x2="280" y2="60" stroke="rgba(255,240,200,0.12)" strokeWidth="1.5" />
              <line x1="150" y1="150" x2="290" y2="150" stroke="rgba(255,240,200,0.15)" strokeWidth="2" />
              <line x1="150" y1="150" x2="270" y2="240" stroke="rgba(255,240,200,0.10)" strokeWidth="1" />
              <line x1="150" y1="150" x2="60" y2="50" stroke="rgba(255,240,200,0.10)" strokeWidth="1.5" />
              <line x1="150" y1="150" x2="20" y2="150" stroke="rgba(255,240,200,0.12)" strokeWidth="1" />
              <line x1="150" y1="150" x2="80" y2="260" stroke="rgba(255,240,200,0.08)" strokeWidth="1" />
              <line x1="150" y1="150" x2="200" y2="20" stroke="rgba(255,240,200,0.09)" strokeWidth="1" />
              <line x1="150" y1="150" x2="200" y2="280" stroke="rgba(255,240,200,0.08)" strokeWidth="1" />
            </svg>

            {/* Solar prominences — red arcs behind the moon */}
            <svg className="absolute -inset-[40px] w-[180px] h-[180px]" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
              <path d="M90,90 Q130,30 100,10 Q70,30 90,90" fill="none" stroke="rgba(208,2,27,0.5)" strokeWidth="2" className="animate-twinkle-1" style={{ filter: 'drop-shadow(0 0 4px rgba(208,2,27,0.5))' }} />
              <path d="M90,90 Q40,20 70,5 Q60,40 90,90" fill="none" stroke="rgba(255,80,0,0.4)" strokeWidth="1.5" className="animate-twinkle-2" style={{ filter: 'drop-shadow(0 0 3px rgba(255,80,0,0.4))' }} />
              <path d="M90,90 Q150,60 165,80 Q145,100 90,90" fill="none" stroke="rgba(208,2,27,0.35)" strokeWidth="1.5" className="animate-twinkle-3" style={{ filter: 'drop-shadow(0 0 3px rgba(208,2,27,0.35))' }} />
            </svg>

            {/* Moon disc — pitch black */}
            <div className="w-[100px] h-[100px] rounded-full bg-black relative"
              style={{ boxShadow: '0 0 0 2px rgba(255,240,200,0.2), 0 0 30px rgba(255,240,200,0.1)' }} />
          </div>

          {/* Sky darkening — eclipse twilight */}
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(0,0,0,0) 20%, rgba(10,5,20,0.3) 60%, rgba(20,10,30,0.5) 100%)' }} />

          {/* Stars visible during eclipse */}
          <div className="absolute top-[15%] right-[35%] w-1.5 h-1.5 rounded-full bg-white/70 animate-twinkle-1"
            style={{ boxShadow: '0 0 4px rgba(255,255,255,0.5)' }} />
          <div className="absolute top-[5%] right-[30%] w-1 h-1 rounded-full bg-white/60 animate-twinkle-2" />
          <div className="absolute top-[20%] right-[40%] w-1 h-1 rounded-full bg-white/50 animate-twinkle-3" />
          <div className="absolute top-[8%] right-[22%] w-2 h-2 rounded-full bg-white/80 animate-twinkle-1"
            style={{ boxShadow: '0 0 6px rgba(255,255,255,0.6)' }} />

          {/* Horizon glow */}
          <div className="absolute bottom-0 left-0 right-0 h-[30%]"
            style={{ background: 'linear-gradient(to top, rgba(255,120,50,0.06) 0%, transparent 100%)' }} />
          <div className="absolute bottom-0 left-[20%] w-96 h-48 bg-orange-400/[0.04] rounded-full blur-[80px] animate-pulse-slow" />
        </>
      )}

      {/* ── MARS — Careers page ── */}
      {variant === 'mars' && (
        <>
          {/* Martian sky — red-orange atmosphere gradient */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(15,5,5,1) 0%, rgba(40,10,5,0.8) 40%, rgba(80,25,10,0.6) 70%, rgba(120,45,20,0.4) 85%, rgba(160,60,25,0.5) 100%)' }} />

          {/* Mars planet disc — partially visible */}
          <div className="absolute -top-[80px] right-[5%] w-[280px] h-[280px] rounded-full"
            style={{
              background: 'radial-gradient(circle at 38% 38%, rgba(200,100,50,0.7) 0%, rgba(160,60,20,0.6) 40%, rgba(100,30,10,0.5) 70%, rgba(50,10,5,0.4) 100%)',
              boxShadow: '0 0 60px rgba(180,80,30,0.2), 0 0 120px rgba(160,60,20,0.1)',
              opacity: 0.55,
            }}>
            {/* Dark basaltic plains */}
            <div className="absolute top-[30%] left-[20%] w-[40%] h-[20%] rounded-full opacity-30"
              style={{ background: 'rgba(40,10,5,0.5)', filter: 'blur(8px)' }} />
            {/* Polar ice cap */}
            <div className="absolute top-[5%] left-[35%] w-[30%] h-[12%] rounded-full opacity-50"
              style={{ background: 'rgba(255,240,230,0.4)', filter: 'blur(4px)' }} />
            {/* Valles Marineris */}
            <div className="absolute top-[55%] left-[15%] w-[60%] h-[8%] rounded-full opacity-25"
              style={{ background: 'rgba(20,5,2,0.6)', filter: 'blur(6px)', transform: 'rotate(-5deg)' }} />
          </div>

          {/* Phobos moon */}
          <div className="absolute top-[22%] right-[35%]">
            <div className="w-5 h-4 rounded-full opacity-60"
              style={{ background: 'radial-gradient(circle at 40% 40%, rgba(120,90,70,0.8), rgba(60,40,30,0.7))', boxShadow: '0 0 6px rgba(120,90,70,0.3)' }} />
          </div>

          {/* Deimos moon */}
          <div className="absolute top-[12%] left-[38%]">
            <div className="w-3 h-3 rounded-full opacity-45"
              style={{ background: 'radial-gradient(circle at 40% 35%, rgba(160,130,100,0.7), rgba(100,80,60,0.5))', boxShadow: '0 0 4px rgba(160,130,100,0.2)' }} />
          </div>

          {/* Martian terrain — dune silhouettes */}
          <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ height: '25%' }}>
            {/* Far background mountains */}
            <path d="M0,200 L0,120 Q180,80 360,100 Q540,120 720,90 Q900,60 1080,95 Q1260,130 1440,105 L1440,200 Z"
              fill="rgba(80,25,10,0.6)" />
            {/* Mid-ground dune ridges */}
            <path d="M0,200 L0,155 Q120,130 240,148 Q360,165 480,140 Q600,115 720,138 Q840,160 960,145 Q1080,130 1200,150 Q1320,168 1440,155 L1440,200 Z"
              fill="rgba(100,35,15,0.75)" />
            {/* Foreground dunes */}
            <path d="M0,200 L0,175 Q90,162 180,172 Q270,182 360,168 Q450,155 540,170 Q630,185 720,172 Q810,160 900,175 Q990,188 1080,175 Q1170,162 1260,178 Q1350,192 1440,180 L1440,200 Z"
              fill="rgba(130,50,20,0.85)" />
          </svg>

          {/* Dust storm wisps */}
          <div className="absolute bottom-[22%] left-[15%] w-64 h-16 rounded-full animate-nebula-drift"
            style={{ background: 'radial-gradient(ellipse, rgba(160,70,30,0.12) 0%, transparent 80%)', filter: 'blur(12px)' }} />
          <div className="absolute bottom-[28%] right-[25%] w-48 h-12 rounded-full animate-nebula-drift-2"
            style={{ background: 'radial-gradient(ellipse, rgba(180,80,35,0.10) 0%, transparent 80%)', filter: 'blur(10px)' }} />

          {/* Ambient glow */}
          <div className="absolute top-[30%] right-[20%] w-80 h-80 bg-orange-800/[0.06] rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute top-[40%] left-[10%] w-64 h-64 bg-red-900/[0.04] rounded-full blur-[80px] animate-pulse-slow-2" />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ★ NEURAL CONSTELLATION — Education/Insights Page ★
          An organic network of glowing knowledge-nodes connected by
          gossamer threads. Neurons firing, synapses lighting up,
          ideas interconnecting across a deep midnight canvas.
          Warm amber/gold primary nodes + cool blue secondary.
         ═══════════════════════════════════════════════════════════ */}
      {variant === 'knowledge-rain' && (() => {
        // 22 knowledge nodes spread across the viewport
        const nodes = [
          { x: 12, y: 18, r: 4, g: 'a', p: 4,   d: 0 },
          { x: 28, y: 12, r: 3, g: 'b', p: 5,   d: 0.6 },
          { x: 45, y: 22, r: 5, g: 'a', p: 3.5, d: 1.2 },
          { x: 62, y: 15, r: 3, g: 'b', p: 4.5, d: 0.3 },
          { x: 78, y: 20, r: 4, g: 'a', p: 4,   d: 0.9 },
          { x: 90, y: 10, r: 3, g: 'b', p: 5.5, d: 1.8 },
          { x: 8,  y: 45, r: 3, g: 'b', p: 4.8, d: 2.1 },
          { x: 22, y: 40, r: 5, g: 'a', p: 3.8, d: 0.4 },
          { x: 38, y: 50, r: 3, g: 'b', p: 5.2, d: 1.5 },
          { x: 55, y: 42, r: 6, g: 'a', p: 3,   d: 0 },
          { x: 72, y: 48, r: 3, g: 'b', p: 4.2, d: 0.8 },
          { x: 88, y: 38, r: 4, g: 'a', p: 3.6, d: 2.4 },
          { x: 15, y: 72, r: 3, g: 'a', p: 5,   d: 1.1 },
          { x: 32, y: 68, r: 4, g: 'b', p: 4.4, d: 0.7 },
          { x: 50, y: 75, r: 3, g: 'a', p: 3.2, d: 1.9 },
          { x: 68, y: 70, r: 5, g: 'b', p: 3.8, d: 0.2 },
          { x: 85, y: 65, r: 3, g: 'a', p: 4.6, d: 1.6 },
          { x: 5,  y: 88, r: 2, g: 'b', p: 5.4, d: 2.8 },
          { x: 42, y: 90, r: 3, g: 'a', p: 4,   d: 0.5 },
          { x: 65, y: 85, r: 4, g: 'b', p: 3.4, d: 1.3 },
          { x: 92, y: 82, r: 2, g: 'a', p: 5.6, d: 2.0 },
          { x: 20, y: 55, r: 2, g: 'b', p: 4.8, d: 3.0 },
        ]
        // Connections between nearby nodes (distance < 28 units)
        const conns: { x1: number; y1: number; x2: number; y2: number; i: number }[] = []
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dist = Math.sqrt((nodes[i].x - nodes[j].x) ** 2 + (nodes[i].y - nodes[j].y) ** 2)
            if (dist < 28) conns.push({ x1: nodes[i].x, y1: nodes[i].y, x2: nodes[j].x, y2: nodes[j].y, i: conns.length })
          }
        }
        const A = '245,180,50', B = '100,160,255'

        return (
          <>
            {/* Deep midnight canvas */}
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, rgba(3,3,18,1) 0%, rgba(6,6,28,1) 25%, rgba(10,8,32,1) 50%, rgba(5,5,22,1) 75%, rgba(3,3,15,1) 100%)' }} />

            {/* Soft ambient glow pools */}
            <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] animate-pulse-slow"
              style={{ background: `radial-gradient(ellipse, rgba(${A},0.04) 0%, transparent 70%)`, filter: 'blur(60px)' }} />
            <div className="absolute top-[40%] right-[15%] w-[350px] h-[350px] animate-pulse-slow-2"
              style={{ background: `radial-gradient(ellipse, rgba(${B},0.035) 0%, transparent 70%)`, filter: 'blur(50px)' }} />
            <div className="absolute bottom-[5%] left-[40%] w-[500px] h-[300px] animate-pulse-slow"
              style={{ background: `radial-gradient(ellipse, rgba(${A},0.03) 0%, transparent 70%)`, filter: 'blur(70px)' }} />

            {/* SVG constellation network — connection lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              {conns.map((c, i) => (
                <line key={`c-${i}`} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
                  stroke={`rgba(${i % 2 === 0 ? A : B},0.08)`} strokeWidth="0.15"
                  className="neural-conn" style={{ animationDelay: `${(i * 0.6) % 8}s` }} />
              ))}
            </svg>

            {/* Knowledge nodes — glowing orbs */}
            {nodes.map((n, i) => {
              const c = n.g === 'a' ? A : B
              return (
                <div key={`n-${i}`} className="absolute rounded-full neural-node" style={{
                  left: `${n.x}%`, top: `${n.y}%`,
                  width: `${n.r * 2}px`, height: `${n.r * 2}px`,
                  background: `rgba(${c},0.7)`,
                  boxShadow: `0 0 ${n.r * 3}px ${n.r}px rgba(${c},0.3), 0 0 ${n.r * 8}px ${n.r * 2}px rgba(${c},0.1)`,
                  animationDuration: `${n.p}s`, animationDelay: `${n.d}s`,
                  transform: 'translate(-50%, -50%)',
                }} />
              )
            })}

            {/* Travelling particles along every other connection */}
            {conns.filter((_, i) => i % 2 === 0).map((c, i) => (
              <div key={`p-${i}`} className="absolute rounded-full neural-particle" style={{
                width: '2px', height: '2px',
                background: `rgba(${i % 2 === 0 ? A : B},0.8)`,
                boxShadow: `0 0 4px rgba(${i % 2 === 0 ? A : B},0.5)`,
                left: `${c.x1}%`, top: `${c.y1}%`,
                ['--end-x' as string]: `${c.x2 - c.x1}cqw`,
                ['--end-y' as string]: `${c.y2 - c.y1}cqh`,
                animationDuration: `${3 + (i % 4)}s`, animationDelay: `${i * 0.7}s`,
              }} />
            ))}

            {/* Background micro-stars */}
            {Array.from({ length: 60 }, (_, i) => {
              const s = (i * 4937 + 1723) % 10000
              return (
                <div key={`s-${i}`} className="absolute rounded-full" style={{
                  top: `${(s % 94) + 3}%`, left: `${((s * 7) % 94) + 3}%`,
                  width: `${1 + (s % 2)}px`, height: `${1 + (s % 2)}px`,
                  background: `rgba(200,210,240,${0.08 + (s % 15) / 200})`,
                }} />
              )
            })}
          </>
        )
      })()}

      {/* ═══════════════════════════════════════════════════════════
          ★ NRI-FLIGHT — NRI Invest Page ★
          100s of passenger airplanes with red/green flashing navigation
          lights flying to and fro across a dark night sky.
          KEY: All planes STAY within 0-100% bounds (no off-screen starts)
          and use CSS transform: translateX() for smooth movement.
          Container has overflow:hidden so nothing can start off-screen.
         ═══════════════════════════════════════════════════════════ */}
      {variant === 'nri-flight' && (
        <>
          {/* Deep night sky gradient */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(1,2,12,1) 0%, rgba(3,6,22,1) 30%, rgba(6,10,32,0.98) 60%, rgba(10,14,38,0.95) 100%)' }} />

          {/* Subtle runway glow at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[200px]"
            style={{ background: 'linear-gradient(to top, rgba(255,153,51,0.04) 0%, transparent 100%)' }} />

          {/* Faint distant stars */}
          {Array.from({ length: 80 }, (_, i) => {
            const s = (i * 6337 + 2719) % 10000
            return (
              <div key={`star-${i}`} className="absolute rounded-full animate-pulse-slow" style={{
                top: `${(s % 90) + 3}%`,
                left: `${((s * 3) % 94) + 3}%`,
                width: `${1 + (s % 2)}px`,
                height: `${1 + (s % 2)}px`,
                background: `rgba(200,215,255,${0.15 + (s % 20) / 100})`,
                animationDelay: `${(s % 40) / 10}s`,
              }} />
            )
          })}

          {/* ── Earth Arc / Curvature — glowing horizon across bottom half ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Earth surface — dark curved mass at bottom */}
            <div
              className="absolute"
              style={{
                bottom: '-55%',
                left: '-15%',
                right: '-15%',
                height: '85%',
                borderRadius: '50% 50% 0 0',
                background: 'radial-gradient(ellipse at 50% 15%, rgba(8,18,38,0.98) 0%, rgba(3,6,18,1) 40%, rgba(1,2,8,1) 70%)',
              }}
            />
            {/* Atmosphere glow — primary blue-white edge */}
            <div
              className="absolute nri-earth-atmosphere"
              style={{
                bottom: '-55%',
                left: '-15%',
                right: '-15%',
                height: '85%',
                borderRadius: '50% 50% 0 0',
                background: 'transparent',
                boxShadow: '0 -2px 40px 8px rgba(60,140,255,0.15), 0 -1px 20px 4px rgba(100,180,255,0.2), 0 -4px 80px 15px rgba(40,100,220,0.08)',
              }}
            />
            {/* Inner atmosphere — warm hint near surface */}
            <div
              className="absolute nri-earth-inner-glow"
              style={{
                bottom: '-55.5%',
                left: '-14%',
                right: '-14%',
                height: '85%',
                borderRadius: '50% 50% 0 0',
                background: 'transparent',
                boxShadow: '0 -1px 15px 3px rgba(255,140,50,0.06), 0 -1px 8px 2px rgba(255,200,100,0.04)',
              }}
            />
            {/* Blue arc removed per request */}
            {/* City lights scattered on Earth surface */}
            {Array.from({ length: 25 }, (_, i) => {
              const s = (i * 3571 + 821) % 10000
              const angle = ((i / 25) * 120) - 60 // spread across visible arc
              const r = 42 + (s % 8) // distance from bottom
              const x = 50 + angle * 0.6 // horizontal spread
              const y = 100 - r // from bottom
              if (y > 55 || y < 30) return null // only on visible Earth surface
              return (
                <div
                  key={`earthlight-${i}`}
                  className="absolute rounded-full nri-earth-city"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${1.5 + (s % 2)}px`,
                    height: `${1.5 + (s % 2)}px`,
                    background: `rgba(255,200,${100 + (s % 80)},${0.3 + (s % 30) / 100})`,
                    animationDelay: `${(s % 30) / 10}s`,
                  }}
                />
              )
            })}
          </div>

          {/* === AIRPLANE FLEET — 35 tiny aircraft with red/green flashing nav lights === */}
          {Array.from({ length: 35 }, (_, i) => {
            const seed = (i * 7919 + 104729) % 100000
            const isReverse = i % 2 === 0
            const yPos = 4 + ((seed * 3) % 90) // random vertical spread 4-94%
            const duration = 20 + (seed % 25) // 20-45 seconds
            const negDelay = -1 * ((seed % (duration * 10)) / 10)
            const size = 3 + (seed % 5) // 3-7px fuselage (even tinier)
            const opacity = 0.25 + ((seed % 35) / 100) // 0.25-0.6
            const lightDelay = (seed % 15) / 10
            const lightSize = 2 + (size > 8 ? 1 : 0) // tiny lights

            return (
              <div
                key={`plane-${i}`}
                className="absolute pointer-events-none"
                style={{
                  top: `${yPos}%`,
                  left: '50%',
                  zIndex: 1,
                  animation: `${isReverse ? 'nri-plane-rtl' : 'nri-plane-ltr'} ${duration}s linear ${negDelay}s infinite`,
                }}
              >
                <div className="relative" style={{ opacity }}>
                  {/* Fuselage — tiny capsule */}
                  <div style={{
                    width: `${size}px`,
                    height: `${Math.max(2, Math.round(size * 0.3))}px`,
                    background: `rgba(200,215,240,${0.4 + (seed % 25) / 100})`,
                    borderRadius: '50%',
                    boxShadow: '0 0 2px rgba(200,215,240,0.2)',
                  }} />
                  {/* Wings — thin horizontal bar */}
                  <div style={{
                    position: 'absolute',
                    top: '30%',
                    left: '5%',
                    width: `${Math.round(size * 0.9)}px`,
                    height: '1px',
                    background: 'rgba(180,195,220,0.35)',
                  }} />
                  {/* RED port light */}
                  <div style={{
                    position: 'absolute',
                    top: '15%',
                    left: '-1px',
                    width: `${lightSize}px`,
                    height: `${lightSize}px`,
                    borderRadius: '50%',
                    background: '#ff2222',
                    boxShadow: `0 0 ${lightSize}px ${lightSize}px rgba(255,34,34,0.4)`,
                    animation: `nri-blink-red 1.2s ease-in-out ${lightDelay}s infinite`,
                  }} />
                  {/* GREEN starboard light */}
                  <div style={{
                    position: 'absolute',
                    top: '15%',
                    right: '-1px',
                    width: `${lightSize}px`,
                    height: `${lightSize}px`,
                    borderRadius: '50%',
                    background: '#22ff44',
                    boxShadow: `0 0 ${lightSize}px ${lightSize}px rgba(34,255,68,0.4)`,
                    animation: `nri-blink-green 1.4s ease-in-out ${lightDelay + 0.3}s infinite`,
                  }} />
                  {/* WHITE strobe */}
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '45%',
                    width: '2px',
                    height: '2px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 0 4px 1px #fff',
                    animation: `nri-strobe 2s ease-in-out ${lightDelay + 0.7}s infinite`,
                  }} />
                </div>
              </div>
            )
          })}

          {/* Ambient glow spots */}
          <div className="absolute top-[10%] left-[15%] w-72 h-72 bg-blue-700/[0.03] rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute top-[50%] right-[10%] w-80 h-80 bg-indigo-600/[0.03] rounded-full blur-[100px] animate-pulse-slow-2" />
          <div className="absolute bottom-[10%] left-[50%] w-96 h-96 bg-blue-500/[0.02] rounded-full blur-[120px] animate-pulse-slow" />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          DATASTREAM — Education Insights Page
          Flowing data nodes connected by lines + streaming particles
          Neural-network-inspired with pulsing nodes and data flow
         ═══════════════════════════════════════════════════════════ */}
      {variant === 'datastream' && (
        <>
          {/* Deep gradient background */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(2,4,15,1) 0%, rgba(8,12,35,1) 40%, rgba(15,5,25,0.98) 70%, rgba(5,8,22,1) 100%)' }} />

          {/* SVG Node Network — connected nodes with glowing lines */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Network connections — animated lines */}
            {[
              { x1: '12%', y1: '20%', x2: '28%', y2: '35%', delay: '0s' },
              { x1: '28%', y1: '35%', x2: '45%', y2: '18%', delay: '0.5s' },
              { x1: '45%', y1: '18%', x2: '62%', y2: '40%', delay: '1s' },
              { x1: '62%', y1: '40%', x2: '78%', y2: '25%', delay: '1.5s' },
              { x1: '78%', y1: '25%', x2: '92%', y2: '45%', delay: '2s' },
              { x1: '15%', y1: '60%', x2: '35%', y2: '70%', delay: '0.3s' },
              { x1: '35%', y1: '70%', x2: '55%', y2: '55%', delay: '0.8s' },
              { x1: '55%', y1: '55%', x2: '72%', y2: '65%', delay: '1.3s' },
              { x1: '72%', y1: '65%', x2: '88%', y2: '50%', delay: '1.8s' },
              { x1: '28%', y1: '35%', x2: '35%', y2: '70%', delay: '0.6s' },
              { x1: '45%', y1: '18%', x2: '55%', y2: '55%', delay: '1.1s' },
              { x1: '62%', y1: '40%', x2: '72%', y2: '65%', delay: '1.6s' },
              { x1: '20%', y1: '85%', x2: '45%', y2: '80%', delay: '0.4s' },
              { x1: '45%', y1: '80%', x2: '65%', y2: '85%', delay: '0.9s' },
              { x1: '65%', y1: '85%', x2: '85%', y2: '75%', delay: '1.4s' },
            ].map((line, i) => (
              <line
                key={`net-${i}`}
                x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                stroke="rgba(208,2,27,0.15)"
                strokeWidth="1"
                className="datastream-line"
                style={{ animationDelay: line.delay }}
              />
            ))}

            {/* Bright data-flow pulses traveling along lines */}
            {[
              { x1: '12%', y1: '20%', x2: '28%', y2: '35%', dur: '3s', delay: '0s' },
              { x1: '45%', y1: '18%', x2: '62%', y2: '40%', dur: '3.5s', delay: '1s' },
              { x1: '78%', y1: '25%', x2: '92%', y2: '45%', dur: '2.8s', delay: '2s' },
              { x1: '35%', y1: '70%', x2: '55%', y2: '55%', dur: '3.2s', delay: '1.5s' },
              { x1: '72%', y1: '65%', x2: '88%', y2: '50%', dur: '3s', delay: '0.5s' },
              { x1: '20%', y1: '85%', x2: '45%', y2: '80%', dur: '2.5s', delay: '2.5s' },
            ].map((pulse, i) => (
              <circle key={`pulse-${i}`} r="3" fill="#D0021B" opacity="0.8">
                <animateMotion
                  dur={pulse.dur}
                  begin={pulse.delay}
                  repeatCount="indefinite"
                  path={`M0,0 L100,100`}
                />
                <animate attributeName="opacity" values="0.3;1;0.3" dur={pulse.dur} begin={pulse.delay} repeatCount="indefinite" />
                <animate attributeName="r" values="2;4;2" dur={pulse.dur} begin={pulse.delay} repeatCount="indefinite" />
              </circle>
            ))}
          </svg>

          {/* Glowing data nodes */}
          {[
            { x: 12, y: 20, size: 8, color: '#D0021B', delay: 0 },
            { x: 28, y: 35, size: 10, color: '#D0021B', delay: 0.3 },
            { x: 45, y: 18, size: 12, color: '#fff', delay: 0.6 },
            { x: 62, y: 40, size: 9, color: '#D0021B', delay: 0.9 },
            { x: 78, y: 25, size: 11, color: '#fff', delay: 1.2 },
            { x: 92, y: 45, size: 8, color: '#D0021B', delay: 1.5 },
            { x: 15, y: 60, size: 7, color: '#fff', delay: 0.4 },
            { x: 35, y: 70, size: 10, color: '#D0021B', delay: 0.7 },
            { x: 55, y: 55, size: 13, color: '#fff', delay: 1.0 },
            { x: 72, y: 65, size: 9, color: '#D0021B', delay: 1.3 },
            { x: 88, y: 50, size: 8, color: '#fff', delay: 1.6 },
            { x: 20, y: 85, size: 7, color: '#D0021B', delay: 0.5 },
            { x: 45, y: 80, size: 9, color: '#fff', delay: 0.8 },
            { x: 65, y: 85, size: 8, color: '#D0021B', delay: 1.1 },
            { x: 85, y: 75, size: 10, color: '#fff', delay: 1.4 },
          ].map((node, i) => (
            <div
              key={`node-${i}`}
              className="absolute rounded-full datastream-node"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                width: `${node.size}px`,
                height: `${node.size}px`,
                background: node.color,
                boxShadow: `0 0 ${node.size * 2}px ${node.size}px ${node.color === '#fff' ? 'rgba(255,255,255,0.3)' : 'rgba(208,2,27,0.4)'}`,
                animationDelay: `${node.delay}s`,
              }}
            />
          ))}

          {/* Floating data particles — small dots streaming upward */}
          {Array.from({ length: 40 }, (_, i) => {
            const s = (i * 4231 + 1789) % 10000
            return (
              <div
                key={`dp-${i}`}
                className="absolute datastream-particle"
                style={{
                  left: `${(s % 96) + 2}%`,
                  bottom: `-${5 + (s % 10)}%`,
                  width: `${2 + (s % 3)}px`,
                  height: `${2 + (s % 3)}px`,
                  borderRadius: '50%',
                  background: s % 3 === 0 ? 'rgba(208,2,27,0.6)' : 'rgba(200,210,255,0.4)',
                  animationDuration: `${8 + (s % 12)}s`,
                  animationDelay: `${(s % 50) / 10}s`,
                }}
              />
            )
          })}

          {/* Ambient glow */}
          <div className="absolute top-[15%] left-[20%] w-80 h-80 bg-brand-red/[0.04] rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute top-[40%] right-[15%] w-96 h-96 bg-purple-600/[0.03] rounded-full blur-[120px] animate-pulse-slow-2" />
          <div className="absolute bottom-[10%] left-[40%] w-72 h-72 bg-blue-500/[0.03] rounded-full blur-[100px] animate-pulse-slow" />
        </>
      )}
    </div>
  )
}
