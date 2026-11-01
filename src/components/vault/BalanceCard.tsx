import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/Misc'
import { fmtUsdc } from '@/lib/units'

/** A labelled USDC figure. While `value` is undefined a skeleton is shown, never a zero. */
export function BalanceCard({ label, value, note, tone = 'plain', children }: { label: string; value: bigint | undefined; note?: ReactNode; tone?: 'plain' | 'primary'; children?: ReactNode }) {
  const primary = tone === 'primary'
  return (
    <section aria-label={label} className={primary ? 'rounded-card border border-forest bg-forest p-4 text-ivory shadow-lift md:p-6' : 'card'}>
      <p className={primary ? 't-label text-ivory/85' : 't-label text-ink/80'}>{label}</p>
      <div className="mt-2">
        {value === undefined ? (
          <>
            <Skeleton className="h-10 w-40" />
            <span className="sr-only">Loading</span>
          </>
        ) : (
          <p className="t-balance">
            {fmtUsdc(value)} <span className={primary ? 'text-lg font-medium text-ivory/85' : 'text-lg font-medium text-ink/75'}>USDC</span>
          </p>
        )}
      </div>
      {note ? <p className={primary ? 't-small mt-2 text-ivory/90' : 't-small mt-2 text-ink/80'}>{note}</p> : null}
      {children}
    </section>
  )
}
