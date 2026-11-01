import { Link } from 'react-router-dom'
import { cx } from '@/lib/cx'

/** Mark: a closed ring (the vault) with a sprout breaking through it (the impact). Mirrors public/logo-mark.svg. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cx('h-9 w-9', className)} aria-hidden fill="none">
      <rect width="64" height="64" rx="18" fill="#164D42" />
      <circle cx="32" cy="34" r="18" stroke="#F8F8F3" strokeWidth="4" />
      <path d="M32 49V33" stroke="#F8F8F3" strokeWidth="3" strokeLinecap="round" />
      <g stroke="#164D42" strokeWidth="3" strokeLinejoin="round" paintOrder="stroke">
        <path d="M32 41C31 34 28 28.5 22.5 26.5C22 33.5 26 40 32 41Z" fill="#91AD9D" />
        <path d="M32 33C31 23 35 15 43 12C45 22 40 31 32 33Z" fill="#D7B36B" />
      </g>
    </svg>
  )
}

export function Logo({ to = '/', compact = false, className }: { to?: string; compact?: boolean; className?: string }) {
  return (
    <Link to={to} className={cx('inline-flex min-h-[44px] items-center gap-2.5 rounded-control', className)} aria-label="ImpactVault home">
      <LogoMark />
      {compact ? null : <span className="text-[19px] font-semibold tracking-[-0.02em] text-forest">ImpactVault</span>}
    </Link>
  )
}
