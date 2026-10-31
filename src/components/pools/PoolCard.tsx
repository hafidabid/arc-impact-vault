import { ArrowRight, FileSearch, HandHeart, Settings2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Chip } from '@/components/ui/StatusChip'
import { POOL_BY_ID } from '@/data/pools'
import { fmtUsdc } from '@/lib/units'
import type { PoolId } from '@/lib/types'
import { useVault } from '@/state/VaultProvider'
import { PoolGlyph } from './PoolGlyph'

interface PoolCardProps {
  poolId: PoolId
  onAllocate?: (poolId: PoolId) => void
}

export function PoolCard({ poolId, onAllocate }: PoolCardProps) {
  const pool = POOL_BY_ID[poolId]
  const { overview } = useVault()
  const { balances, connected, dataStatus } = overview
  const eligible = connected && balances.availableProceeds > 0n && dataStatus === 'ready' && !pool.paused && !overview.wrongNetwork
  const ready = dataStatus === 'ready'

  return (
    <article className="card flex h-full flex-col" aria-labelledby={`pool-${poolId}`}>
      <div className="flex items-start gap-3">
        <PoolGlyph id={poolId} className="h-12 w-12 shrink-0" />
        <div className="min-w-0">
          <h3 id={`pool-${poolId}`} className="text-xl font-semibold leading-tight tracking-[-0.01em] text-forest">
            {pool.name}
          </h3>
          <p className="t-small prose-reading mt-1 text-ink/85">{pool.purpose}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-ink/10 pt-4">
        <div>
          <dt className="t-small text-ink/75">Allocated, awaiting transfer</dt>
          <dd className="num mt-0.5 font-semibold">{ready ? `${fmtUsdc(balances.allocatedAwaitingTransfer[poolId])} USDC` : 'Unavailable'}</dd>
        </div>
        <div>
          <dt className="t-small text-ink/75">Transferred</dt>
          <dd className="num mt-0.5 font-semibold">{ready ? `${fmtUsdc(balances.confirmedDonations[poolId])} USDC` : 'Unavailable'}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip tone="neutral" icon={Settings2}>
          {pool.recipientStatus === 'configured-demo' ? 'Recipient: demo configuration' : 'Recipient not configured'}
        </Chip>
        <Chip tone="neutral" icon={FileSearch}>
          Evidence: none submitted yet
        </Chip>
      </div>

      <div className="mt-5 flex flex-1 flex-wrap items-end gap-2">
        <Link to={`/impact/${poolId}`} className="btn btn-secondary">
          View pool
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
        {onAllocate ? (
          <button type="button" className="btn btn-primary" disabled={!eligible} onClick={() => onAllocate(poolId)}>
            <HandHeart aria-hidden className="h-4 w-4" />
            Allocate here
          </button>
        ) : null}
      </div>
      {onAllocate && !eligible ? (
        <p className="t-small mt-3 text-ink/75">
          {!connected
            ? 'Connect a wallet to see whether you have eligible proceeds.'
            : 'Allocation is unavailable because no eligible proceeds are credited right now.'}{' '}
          {connected ? (
            <Link to="/activity" className="font-medium text-forest underline underline-offset-4">
              See activity
            </Link>
          ) : null}
        </p>
      ) : null}
    </article>
  )
}
