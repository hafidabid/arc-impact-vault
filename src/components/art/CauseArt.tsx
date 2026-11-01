import { cx } from '@/lib/cx'

/** Original illustrations for the example causes on the home page. Decorative: the card text carries the meaning. */

export function HungerArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 180" fill="none" aria-hidden className={cx('block w-full', className)}>
      <rect width="320" height="180" fill="#91AD9D" fillOpacity="0.35" />
      <circle cx="238" cy="52" r="30" fill="#D7B36B" fillOpacity="0.85" />
      <path d="M0 150c60-18 120-18 180-6s90 8 140-8v44H0Z" fill="#164D42" fillOpacity="0.14" />
      {/* steam */}
      <g stroke="#164D42" strokeWidth="3" strokeLinecap="round" opacity="0.55">
        <path d="M128 64c-8 10 8 16 0 28" />
        <path d="M156 56c-8 10 8 16 0 28" />
        <path d="M184 64c-8 10 8 16 0 28" />
      </g>
      {/* bowl and meal */}
      <path d="M96 104h128c0 34-26 58-64 58s-64-24-64-58Z" fill="#164D42" />
      <ellipse cx="160" cy="104" rx="64" ry="9" fill="#F8F8F3" />
      <g fill="#D7B36B">
        <circle cx="136" cy="100" r="5" />
        <circle cx="152" cy="97" r="5" />
        <circle cx="170" cy="100" r="5" />
        <circle cx="186" cy="97" r="5" />
      </g>
      {/* wheat */}
      <g stroke="#164D42" strokeWidth="3" strokeLinecap="round">
        <path d="M54 164V86" />
        <path d="M268 164V98" />
      </g>
      <g fill="#D7B36B">
        <path d="M54 92c-10-4-12-14-10-22 10 2 14 12 10 22Z" />
        <path d="M54 92c10-4 12-14 10-22-10 2-14 12-10 22Z" />
        <path d="M54 76c-9-4-11-13-9-21 9 2 13 11 9 21Z" />
        <path d="M54 76c9-4 11-13 9-21-9 2-13 11-9 21Z" />
        <path d="M268 104c-9-4-11-13-9-21 9 2 13 11 9 21Z" />
        <path d="M268 104c9-4 11-13 9-21-9 2-13 11-9 21Z" />
      </g>
    </svg>
  )
}

export function ForestArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 180" fill="none" aria-hidden className={cx('block w-full', className)}>
      <rect width="320" height="180" fill="#D7B36B" fillOpacity="0.28" />
      <circle cx="80" cy="56" r="28" fill="#D7B36B" fillOpacity="0.9" />
      {/* far hills and trees */}
      <path d="M0 118c50-30 100-30 150-8s110 20 170-6v76H0Z" fill="#91AD9D" fillOpacity="0.7" />
      <g fill="#164D42" fillOpacity="0.55">
        <path d="M200 124l22-52 22 52Z" />
        <path d="M236 124l18-42 18 42Z" />
        <path d="M268 124l16-36 16 36Z" />
      </g>
      {/* near ground */}
      <path d="M0 140c70-14 140-14 210-2s80 6 110-4v46H0Z" fill="#164D42" />
      {/* tall tree */}
      <path d="M118 140l32-84 32 84Z" fill="#F8F8F3" fillOpacity="0.16" />
      <path d="M126 132l24-60 24 60Z" fill="#91AD9D" />
      <path d="M150 132v22" stroke="#F8F8F3" strokeWidth="5" strokeLinecap="round" />
      {/* new growth */}
      <g transform="translate(60 118)">
        <path d="M20 40V18" stroke="#F8F8F3" strokeWidth="3" strokeLinecap="round" />
        <path d="M20 22c-1-9-7-14-16-15 0 9 6 15 16 15Z" fill="#91AD9D" />
        <path d="M20 16c1-9 8-14 17-14 0 9-7 14-17 14Z" fill="#D7B36B" />
      </g>
      <g transform="translate(236 128)">
        <path d="M14 26V12" stroke="#F8F8F3" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 15c-1-7-5-10-11-10 0 6 4 10 11 10Z" fill="#91AD9D" />
        <path d="M14 11c1-6 6-9 12-9 0 6-5 9-12 9Z" fill="#D7B36B" />
      </g>
    </svg>
  )
}
