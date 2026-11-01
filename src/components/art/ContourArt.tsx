import { cx } from '@/lib/cx'

/**
 * Topographic contour lines — the app's one piece of signature art. Nested rings read as growth rings,
 * which is the vault's own story: principal accumulates, and only the outermost gain leaves.
 *
 * All motion is pure CSS so the global `prefers-reduced-motion` block switches it off, and every keyframe
 * set resolves to the correct resting state at 100% so reduced-motion users land on the finished drawing.
 */

/** The five nested rings, outermost first. */
const RINGS = [
  'M60 210c-6-62 36-118 98-134s128 12 156 66 14 118-34 156-122 52-171 22S66 262 60 210Z',
  'M88 208c-4-48 28-92 76-104s98 10 120 52 10 92-26 122-94 40-133 17-33-40-37-87Z',
  'M118 206c-2-34 20-66 54-75s70 8 86 38 8 66-18 88-66 28-94 12-26-30-28-63Z',
  'M148 204c0-20 12-40 32-45s42 6 51 24 4 40-12 52-40 16-56 6-15-17-15-37Z',
  'M176 202c1-9 8-17 18-18s20 5 24 13 0 18-8 24-20 7-28 2-7-9-6-21Z',
]

export function ContourArt({
  className,
  stroke = '#91AD9D',
  animate = false,
}: {
  className?: string
  stroke?: string
  /** Draws the rings inward-out on mount, then breathes them slowly. */
  animate?: boolean
}) {
  return (
    <svg viewBox="0 0 400 400" fill="none" aria-hidden className={cx('pointer-events-none', className)}>
      <g stroke={stroke} strokeWidth="1.25" strokeLinecap="round" className={animate ? 'origin-center animate-contour-breathe' : undefined}>
        {RINGS.map((d, i) => (
          <path
            key={d}
            d={d}
            pathLength={1}
            className={animate ? 'animate-contour-draw' : undefined}
            // Innermost ring draws first, so the figure grows outward like a ring of accumulation.
            style={animate ? { animationDelay: `${(RINGS.length - 1 - i) * 140}ms` } : undefined}
          />
        ))}
      </g>
    </svg>
  )
}

/** Soft sage-and-gold glow behind hero content. The two washes drift on slightly different cycles. */
export function HeroGlow({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cx('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}>
      <div className="absolute -right-[10%] -top-[40%] h-[120%] w-[70%] animate-wash-a rounded-full bg-[radial-gradient(closest-side,rgba(145,173,157,0.5),transparent)]" />
      <div className="absolute -bottom-[50%] -left-[15%] h-[110%] w-[60%] animate-wash-b rounded-full bg-[radial-gradient(closest-side,rgba(215,179,107,0.34),transparent)]" />
    </div>
  )
}

/**
 * The site-wide backdrop: two contour clusters drifting in opposite directions at different speeds, so the
 * page has depth without anything competing with the content. Kept far below text contrast — a wash this
 * faint moves body text from 12.37:1 to 11.85:1, which is still well clear of AA.
 */
export function ContourField({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cx('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)}>
      <div className="absolute -left-[18%] top-[-12%] h-[70vmax] w-[70vmax] animate-field-slow will-change-transform opacity-[0.5]">
        <ContourArt className="h-full w-full" />
      </div>
      <div className="absolute -right-[22%] bottom-[-18%] h-[80vmax] w-[80vmax] animate-field-fast will-change-transform opacity-[0.35]">
        <ContourArt className="h-full w-full" stroke="#D7B36B" />
      </div>
      {/* Keeps the field from reading as texture over the content column. */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_40%,rgba(248,248,243,0.82),rgba(248,248,243,0.35))]" />
    </div>
  )
}
