import { CloudOff } from 'lucide-react'
import { Skeleton } from '@/components/ui/Misc'
import { fmtUsdc } from '@/lib/units'
import type { PoolId } from '@/lib/types'
import { useVault } from '@/state/VaultProvider'

interface BucketProps {
  label: string
  definition: string
  children: React.ReactNode
}

function Bucket({ label, definition, children }: BucketProps) {
  return (
    <div className="min-w-0 rounded-control border border-ink/10 bg-ivory p-3.5">
      <dt className="t-label text-ink">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tracking-tight">{children}</dd>
      <p className="t-small mt-1 text-ink/75">{definition}</p>
    </div>
  )
}

/** Four buckets. "Evidence reviewed" is a status count and never a money balance. */
export function PoolFunding({ poolId }: { poolId: PoolId }) {
  const { overview } = useVault()
  const { balances, dataStatus, connected } = overview

  const money = (value: bigint) => {
    if (dataStatus === 'loading') return <Skeleton className="h-7 w-24" />
    if (dataStatus === 'sync-error') {
      return (
        <span className="flex items-center gap-1.5 text-base">
          <CloudOff aria-hidden className="h-4 w-4" /> Unavailable
        </span>
      )
    }
    return (
      <span className="num">
        {fmtUsdc(value)} <span className="text-sm font-medium text-ink/75">USDC</span>
      </span>
    )
  }

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      <Bucket label="Available to allocate" definition="Your eligible sponsor-funded demo proceeds. Shared across both pools, not per pool.">
        {connected ? money(balances.availableProceeds) : <span className="text-base font-medium text-ink/75">Connect to see yours</span>}
      </Bucket>
      <Bucket label="Allocated awaiting transfer" definition="Reserved for this pool. A transfer has not been confirmed yet.">
        {money(balances.allocatedAwaitingTransfer[poolId])}
      </Bucket>
      <Bucket label="Transferred" definition="Confirmed token transfers to this pool's configured recipient. Counted once.">
        {money(balances.confirmedDonations[poolId])}
      </Bucket>
      <Bucket label="Evidence reviewed" definition="A count of submissions a reviewer accepted for display. It is a status, not a balance.">
        <span className="num">0 accepted</span> <span className="text-sm font-medium text-ink/75">of 0 submitted</span>
      </Bucket>
    </dl>
  )
}
