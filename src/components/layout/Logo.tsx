import { Link } from 'react-router-dom'
import { cx } from '@/lib/cx'

/** Mark: a ring (the vault) holding a sprout (the impact). Drawn in SVG, no stock imagery. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cx('h-9 w-9', className)} aria-hidden fill="none">
      <rect width="40" height="40" rx="12" fill="#164D42" />
      <circle cx="20" cy="20" r="11.5" stroke="#F8F8F3" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M20 27.5V19.5" stroke="#F8F8F3" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 20c0-3.6-2.4-5.8-6-6 0 3.6 2.4 6 6 6Z" fill="#91AD9D" />
      <path d="M20 18.2c0-3.2 2.1-5.4 5.8-5.6 0 3.4-2.2 5.6-5.8 5.6Z" fill="#D7B36B" />
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
