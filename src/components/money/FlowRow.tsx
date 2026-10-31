import { ArrowRight, BookOpen, Landmark } from 'lucide-react'
import { cx } from '@/lib/cx'
import { fmtUsdcUnit } from '@/lib/units'

interface FlowRowProps {
  from: string
  to: string
  amount?: bigint
  /** "ledger" is an internal ledger allocation. It must never look like a second onchain deposit. */
  layer?: 'onchain' | 'ledger'
  fromHint?: string
  toHint?: string
  className?: string
}

function Node({ title, hint, ledger }: { title: string; hint?: string; ledger: boolean }) {
  const Icon = ledger ? BookOpen : Landmark
  return (
    <div
      className={cx(
        'flex min-w-0 flex-1 items-start gap-2.5 rounded-control border px-3 py-2.5',
        ledger ? 'border-dashed border-ink/40 bg-ivory' : 'border-ink/20 bg-sage/15',
      )}
    >
      <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
      <div className="min-w-0">
        <p className="break-words text-[15px] font-medium leading-snug">{title}</p>
        {hint ? <p className="t-small text-ink/75">{hint}</p> : null}
      </div>
    </div>
  )
}

/** Source-to-destination row with an explicit layer label. */
export function FlowRow({ from, to, amount, layer = 'onchain', fromHint, toHint, className }: FlowRowProps) {
  const ledger = layer === 'ledger'
  return (
    <div className={cx('rounded-card border border-ink/10 bg-ivory p-3', className)}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="t-small font-medium text-ink/80">{ledger ? 'Ledger allocation (internal record)' : 'Token transfer (onchain)'}</span>
        {amount !== undefined ? <span className="num text-[15px] font-semibold">{fmtUsdcUnit(amount)}</span> : null}
      </div>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <Node title={from} hint={fromHint} ledger={ledger} />
        <ArrowRight aria-hidden className="mx-auto h-5 w-5 shrink-0 rotate-90 text-forest sm:rotate-0" />
        <Node title={to} hint={toHint} ledger={ledger} />
      </div>
    </div>
  )
}
