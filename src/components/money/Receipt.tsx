import { Receipt as ReceiptIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CopyButton } from '@/components/ui/Misc'
import { StatusChip, SyntheticChip } from '@/components/ui/StatusChip'
import { COPY } from '@/data/copy'
import { poolName } from '@/data/pools'
import { fmtDateTime } from '@/lib/format'
import { fmtUsdcUnit } from '@/lib/units'
import { DEMO_CONFIG } from '@/data/config'
import type { Operation, OperationType } from '@/lib/types'
import { FlowRow } from './FlowRow'

export const TYPE_LABEL: Record<OperationType, string> = {
  deposit: 'Deposit',
  sponsor_funding: 'Sponsor funding',
  attribution: 'Sponsor attribution',
  allocation: 'Allocation',
  settlement: 'Transfer to pool recipient',
  withdrawal: 'Withdrawal',
  reversal: 'Reservation released',
}

function receiptNote(op: Operation): string | null {
  if (op.type === 'settlement' && op.status === 'confirmed') return COPY.transferConfirmed
  if (op.type === 'allocation' || op.type === 'attribution') return COPY.donationNote
  if (op.type === 'deposit' && op.status === 'confirmed') return 'Your principal is accounted for separately from sponsor-funded proceeds.'
  if (op.type === 'withdrawal' && op.status === 'confirmed') return 'Only available principal was used. No donation or sponsor proceeds were deducted.'
  return null
}

export function Receipt({ operation, showActivityLink = true }: { operation: Operation; showActivityLink?: boolean }) {
  const note = receiptNote(operation)
  return (
    <article className="rounded-card border border-ink/20 bg-ivory p-4 shadow-card md:p-5" aria-label={`Receipt ${operation.operationId}`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-sage/35">
            <ReceiptIcon className="h-[18px] w-[18px] text-forest" />
          </span>
          <div>
            <h3 className="text-[17px] font-semibold leading-tight">{TYPE_LABEL[operation.type]} receipt</h3>
            <p className="t-small text-ink/75">{fmtDateTime(operation.updatedAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <SyntheticChip />
          <StatusChip status={operation.status} />
        </div>
      </header>

      <p className="num mt-4 text-3xl font-semibold tracking-tight">{fmtUsdcUnit(operation.amount)}</p>
      {operation.poolId ? <p className="t-small text-ink/80">Pool: {poolName(operation.poolId)}</p> : null}

      <FlowRow className="mt-4" from={operation.from} to={operation.to} layer={operation.layer} />

      <dl className="t-small mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        <dt className="text-ink/75">Operation ID</dt>
        <dd className="num break-all text-right font-medium">{operation.operationId}</dd>
        <dt className="text-ink/75">Reference</dt>
        <dd className="break-all text-right font-medium">{operation.reference}</dd>
        <dt className="text-ink/75">Network</dt>
        <dd className="text-right font-medium">{DEMO_CONFIG.networkLabel}</dd>
      </dl>

      <p className="t-small mt-3 rounded-control bg-gold/25 px-3 py-2 text-ink">{COPY.syntheticReceipt}</p>
      {note ? <p className="t-small prose-reading mt-3 text-ink/90">{note}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <CopyButton value={operation.operationId} label="operation ID" />
        {showActivityLink ? (
          <Link className="btn btn-secondary" to={`/activity?op=${operation.operationId}`}>
            View in activity
          </Link>
        ) : null}
      </div>
    </article>
  )
}
