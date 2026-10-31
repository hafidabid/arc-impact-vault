import { cx } from '@/lib/cx'

/** Quiet topographic contour lines. Decorative only. */
export function ContourArt({ className, stroke = '#91AD9D' }: { className?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 400 400" fill="none" aria-hidden className={cx('pointer-events-none', className)}>
      <g stroke={stroke} strokeWidth="1.25" strokeLinecap="round">
        <path d="M60 210c-6-62 36-118 98-134s128 12 156 66 14 118-34 156-122 52-171 22S66 262 60 210Z" />
        <path d="M88 208c-4-48 28-92 76-104s98 10 120 52 10 92-26 122-94 40-133 17-33-40-37-87Z" />
        <path d="M118 206c-2-34 20-66 54-75s70 8 86 38 8 66-18 88-66 28-94 12-26-30-28-63Z" />
        <path d="M148 204c0-20 12-40 32-45s42 6 51 24 4 40-12 52-40 16-56 6-15-17-15-37Z" />
        <path d="M176 202c1-9 8-17 18-18s20 5 24 13 0 18-8 24-20 7-28 2-7-9-6-21Z" />
      </g>
    </svg>
  )
}

/** Soft sage-and-gold glow used behind hero content. */
export function HeroGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx(
        'pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_85%_0%,rgba(145,173,157,0.45),transparent),radial-gradient(40%_40%_at_0%_100%,rgba(215,179,107,0.28),transparent)]',
        className,
      )}
    />
  )
}
