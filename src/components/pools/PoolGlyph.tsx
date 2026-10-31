import { cx } from '@/lib/cx'
import type { PoolId } from '@/lib/types'

/** Abstract pool marks: a bowl for food assistance, a flame-shaped leaf for forest fire relief. Not partner logos. */
export function PoolGlyph({ id, className }: { id: PoolId; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden className={cx('rounded-control', className)}>
      <rect width="48" height="48" rx="12" fill="#91AD9D" fillOpacity="0.32" />
      {id === 'hunger-relief' ? (
        <g stroke="#164D42" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 22h28c0 8-5.5 13-14 13S10 30 10 22Z" fill="#D7B36B" fillOpacity="0.55" />
          <path d="M17 17c0-2 1.6-2.8 1.6-4.6M24 17c0-2 1.6-2.8 1.6-4.6M31 17c0-2 1.6-2.8 1.6-4.6" />
          <path d="M18 38h12" />
        </g>
      ) : (
        <g stroke="#164D42" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 9c2 5 8 8 8 15a8 8 0 0 1-16 0c0-3 1.5-5 3-6.5 .6 2 1.8 3 3 3.5C22 17 22 12.5 24 9Z" fill="#D7B36B" fillOpacity="0.55" />
          <path d="M12 38c4-1.4 7-.6 12 0s8 1.4 12 0" />
        </g>
      )}
    </svg>
  )
}
