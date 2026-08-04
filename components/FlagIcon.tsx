/* ────────────────────────────────────────────────────────────────
   FlagIcon — inline SVG country flags.

   Why this exists: the NRI corridor cards used emoji flags (🇦🇪, 🇺🇸 …).
   Those are regional-indicator letter pairs, and Windows ships no font
   that composes them into a flag — Chrome on Windows renders the bare
   letters instead ("AE", "US"), which is what the cards were showing.

   These are hand-drawn simplifications sized for ~28px display, so fine
   heraldic detail is deliberately dropped. Everything is inline: no CDN,
   no icon package, nothing for the static export or a CSP to trip over.
   ──────────────────────────────────────────────────────────────── */

import type { ReactElement } from 'react'

type Props = {
  code: FlagCode
  title?: string
  className?: string
}

export type FlagCode =
  | 'AE' | 'US' | 'GB' | 'SG' | 'CA' | 'AU' | 'OM'
  | 'KW' | 'BH' | 'QA' | 'DE' | 'HK' | 'MY' | 'NZ'

/** 5-point star as a polygon point list. */
function star(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.4
    const a = (Math.PI / 5) * i - Math.PI / 2
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`)
  }
  return pts.join(' ')
}

/* The Union Jack, drawn at the full 24×16 box. Nested <svg> clips it
   automatically when it is used as a canton, so no clipPath ids are
   needed (ids would collide across multiple flags on one page). */
function UnionJack() {
  return (
    <>
      {/* fill="none" is load-bearing: these are open paths, and an SVG path
          fills its implied closed region by default — without it the last
          stroke's fill paints over the whole field (the flag went solid red). */}
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0 L24 16 M24 0 L0 16" fill="none" stroke="#FFF" strokeWidth="3.2" />
      <path d="M0 0 L24 16 M24 0 L0 16" fill="none" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M12 0 V16 M0 8 H24" fill="none" stroke="#FFF" strokeWidth="5.2" />
      <path d="M12 0 V16 M0 8 H24" fill="none" stroke="#C8102E" strokeWidth="3" />
    </>
  )
}

const FLAGS: Record<FlagCode, ReactElement> = {
  DE: (
    <>
      <rect width="24" height="5.34" fill="#000" />
      <rect y="5.34" width="24" height="5.33" fill="#DD0000" />
      <rect y="10.67" width="24" height="5.33" fill="#FFCE00" />
    </>
  ),

  AE: (
    <>
      <rect width="24" height="5.34" fill="#00732F" />
      <rect y="5.34" width="24" height="5.33" fill="#FFF" />
      <rect y="10.67" width="24" height="5.33" fill="#000" />
      <rect width="6.5" height="16" fill="#FF0000" />
    </>
  ),

  KW: (
    <>
      <rect width="24" height="5.34" fill="#007A3D" />
      <rect y="5.34" width="24" height="5.33" fill="#FFF" />
      <rect y="10.67" width="24" height="5.33" fill="#CE1126" />
      <polygon points="0,0 6.5,5.34 6.5,10.67 0,16" fill="#000" />
    </>
  ),

  OM: (
    <>
      <rect width="24" height="5.34" fill="#FFF" />
      <rect y="5.34" width="24" height="5.33" fill="#DB161B" />
      <rect y="10.67" width="24" height="5.33" fill="#008000" />
      <rect width="7" height="16" fill="#DB161B" />
      <path d="M3.5 4.2 v3.4 M2.2 5.6 h2.6" fill="none" stroke="#FFF" strokeWidth="0.9" strokeLinecap="round" />
    </>
  ),

  QA: (
    <>
      <rect width="24" height="16" fill="#8D1B3D" />
      <path d="M0 0 H7 L4.6 1.78 L7 3.56 L4.6 5.34 L7 7.11 L4.6 8.89 L7 10.67 L4.6 12.44 L7 14.22 L4.6 16 H0 Z" fill="#FFF" />
    </>
  ),

  BH: (
    <>
      <rect width="24" height="16" fill="#CE1126" />
      <path d="M0 0 H8 L5.4 1.6 L8 3.2 L5.4 4.8 L8 6.4 L5.4 8 L8 9.6 L5.4 11.2 L8 12.8 L5.4 14.4 L8 16 H0 Z" fill="#FFF" />
    </>
  ),

  US: (
    <>
      <rect width="24" height="16" fill="#FFF" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={(i * 16) / 13} width="24" height={16 / 13} fill="#B22234" />
      ))}
      <rect width="10.5" height={(16 / 13) * 7} fill="#3C3B6E" />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3, 4].map((c) => (
          <circle key={`${r}-${c}`} cx={1.3 + c * 2} cy={1.1 + r * 2} r="0.42" fill="#FFF" />
        )),
      )}
    </>
  ),

  GB: <UnionJack />,

  AU: (
    <>
      <rect width="24" height="16" fill="#00247D" />
      <svg x="0" y="0" width="12" height="8" viewBox="0 0 24 16">
        <UnionJack />
      </svg>
      <polygon points={star(6, 12.4, 2)} fill="#FFF" />
      <polygon points={star(17.5, 4.2, 1.15)} fill="#FFF" />
      <polygon points={star(20.4, 8, 1.15)} fill="#FFF" />
      <polygon points={star(17.5, 12.2, 1.15)} fill="#FFF" />
      <polygon points={star(15, 8.6, 0.85)} fill="#FFF" />
      <polygon points={star(19, 9.9, 0.6)} fill="#FFF" />
    </>
  ),

  NZ: (
    <>
      <rect width="24" height="16" fill="#00247D" />
      <svg x="0" y="0" width="12" height="8" viewBox="0 0 24 16">
        <UnionJack />
      </svg>
      <polygon points={star(19.6, 4.2, 1.3)} fill="#CC142B" stroke="#FFF" strokeWidth="0.35" />
      <polygon points={star(16.6, 7.6, 1.3)} fill="#CC142B" stroke="#FFF" strokeWidth="0.35" />
      <polygon points={star(21.4, 8.8, 1.3)} fill="#CC142B" stroke="#FFF" strokeWidth="0.35" />
      <polygon points={star(18.6, 12.4, 1.3)} fill="#CC142B" stroke="#FFF" strokeWidth="0.35" />
    </>
  ),

  CA: (
    <>
      <rect width="24" height="16" fill="#FFF" />
      <rect width="6" height="16" fill="#D80621" />
      <rect x="18" width="6" height="16" fill="#D80621" />
      <polygon
        fill="#D80621"
        points="12,3 12.9,5.1 14.9,4.6 14.3,6.7 16.3,7.6 14.4,8.9 14.9,10 12.9,9.7 12.5,13 11.5,13 11.1,9.7 9.1,10 9.6,8.9 7.7,7.6 9.7,6.7 9.1,4.6 11.1,5.1"
      />
    </>
  ),

  SG: (
    <>
      <rect width="24" height="8" fill="#ED2939" />
      <rect y="8" width="24" height="8" fill="#FFF" />
      <circle cx="5.6" cy="4" r="2.9" fill="#FFF" />
      <circle cx="7.1" cy="4" r="2.5" fill="#ED2939" />
      <polygon points={star(9.4, 2.5, 0.85)} fill="#FFF" />
      <polygon points={star(11.9, 2.5, 0.85)} fill="#FFF" />
      <polygon points={star(10.65, 4.3, 0.85)} fill="#FFF" />
      <polygon points={star(8.9, 5.7, 0.85)} fill="#FFF" />
      <polygon points={star(12.4, 5.7, 0.85)} fill="#FFF" />
    </>
  ),

  HK: (
    <>
      <rect width="24" height="16" fill="#DE2910" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2
        return (
          <ellipse
            key={i}
            cx={12 + 2.5 * Math.cos(a)}
            cy={8 + 2.5 * Math.sin(a)}
            rx="1.5"
            ry="0.95"
            fill="#FFF"
            transform={`rotate(${(a * 180) / Math.PI + 90} ${12 + 2.5 * Math.cos(a)} ${8 + 2.5 * Math.sin(a)})`}
          />
        )
      })}
    </>
  ),

  MY: (
    <>
      <rect width="24" height="16" fill="#FFF" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} y={(i * 16) / 7 + 16 / 14} width="24" height={16 / 14} fill="#CC0001" />
      ))}
      <rect width="12" height={(16 / 14) * 8} fill="#010066" />
      <circle cx="5.4" cy="4.6" r="2.6" fill="#FFCC00" />
      <circle cx="6.6" cy="4.6" r="2.2" fill="#010066" />
      <polygon points={star(9.4, 4.6, 1.7)} fill="#FFCC00" />
    </>
  ),
}

export default function FlagIcon({ code, title, className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      role="img"
      aria-label={title || code}
      preserveAspectRatio="xMidYMid meet"
    >
      {title ? <title>{title}</title> : null}
      {FLAGS[code]}
      {/* Hairline keeps white-edged flags (Canada, Singapore) from
          disappearing into a white card. */}
      <rect width="24" height="16" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="0.7" />
    </svg>
  )
}
