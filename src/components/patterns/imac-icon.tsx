'use client'

import { useId } from 'react'

export type IMacColorway = 'pink' | 'orange' | 'blue' | 'yellow' | 'purple' | 'green'

// Frame/chin colors sit in the same oklch family as --wave-* in globals.css;
// glowA/glowB are lighter tints of the same hues, used as the "wallpaper"
// inside the screen. That wallpaper is this site's own blurred-blob motif
// (see wave-field.tsx / glass-orb-field.tsx), not a recreation of Apple's
// actual ribbon wallpaper — same "reinvented, not reproduced" reasoning as
// the rest of this pattern set.
const COLORWAYS: Record<IMacColorway, { frame: string; glowA: string; glowB: string }> = {
  pink: { frame: 'oklch(78% 0.13 12)', glowA: 'oklch(88% 0.09 10)', glowB: 'oklch(93% 0.05 350)' },
  orange: { frame: 'oklch(78% 0.14 48)', glowA: 'oklch(88% 0.1 50)', glowB: 'oklch(93% 0.06 70)' },
  blue: { frame: 'oklch(76% 0.1 235)', glowA: 'oklch(87% 0.07 230)', glowB: 'oklch(93% 0.04 210)' },
  yellow: { frame: 'oklch(85% 0.12 95)', glowA: 'oklch(92% 0.09 95)', glowB: 'oklch(95% 0.05 105)' },
  purple: { frame: 'oklch(78% 0.09 300)', glowA: 'oklch(88% 0.06 300)', glowB: 'oklch(93% 0.04 320)' },
  green: { frame: 'oklch(80% 0.1 150)', glowA: 'oklch(89% 0.08 150)', glowB: 'oklch(94% 0.05 165)' },
}

export function IMacIcon({
  colorway,
  className,
}: {
  colorway: IMacColorway
  className?: string
}) {
  const uid = useId()
  const { frame, glowA, glowB } = COLORWAYS[colorway]
  const screenGrad = `imac-screen-${uid}`
  const clip = `imac-clip-${uid}`
  const shadow = `imac-shadow-${uid}`

  return (
    <svg viewBox="0 0 240 224" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={screenGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={glowA} />
          <stop offset="100%" stopColor={glowB} />
        </linearGradient>
        <clipPath id={clip}>
          <rect x="30" y="20" width="180" height="118" rx="6" />
        </clipPath>
        <filter id={shadow} x="-30%" y="-10%" width="160%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#0b0b0f" floodOpacity="0.16" />
        </filter>
      </defs>

      <g filter={`url(#${shadow})`}>
        {/* bezel */}
        <rect x="18" y="8" width="204" height="146" rx="16" fill="#f5f5f7" stroke="rgba(11,11,15,0.08)" />

        {/* screen */}
        <rect x="30" y="20" width="180" height="118" rx="6" fill={`url(#${screenGrad})`} />
        <g clipPath={`url(#${clip})`} opacity="0.6">
          <circle cx="72" cy="48" r="46" fill={glowB} opacity="0.55" style={{ filter: 'blur(14px)' }} />
          <circle cx="168" cy="102" r="38" fill={glowA} opacity="0.55" style={{ filter: 'blur(14px)' }} />
        </g>
        {/* glass sheen */}
        <rect x="30" y="20" width="180" height="38" rx="6" fill="white" opacity="0.14" />

        {/* camera notch */}
        <circle cx="120" cy="14" r="2.2" fill="rgba(11,11,15,0.35)" />

        {/* chin / neck / foot */}
        <rect x="18" y="140" width="204" height="14" rx="7" fill={frame} />
        <rect x="108" y="154" width="24" height="28" fill={frame} />
        <rect x="58" y="180" width="124" height="14" rx="7" fill={frame} />
      </g>
    </svg>
  )
}
