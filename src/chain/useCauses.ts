import { useMemo } from 'react'
import { describeCause } from '@/data/causes'
import type { CauseInfo } from '@/data/causes'
import { distributedByCause } from './logs'
import { useVaultLedger, useVaultSnapshot } from './hooks'

export interface CauseRow {
  info: CauseInfo
  /** Undefined until the event log has loaded, so a missing total is never shown as zero. */
  distributed: bigint | undefined
}

/** Approved causes straight from the contract, joined with optional labels and event-derived totals. */
export function useCauses() {
  const snapshot = useVaultSnapshot()
  const ledger = useVaultLedger()
  const rows = useMemo<CauseRow[] | undefined>(() => {
    if (snapshot.status !== 'ready') return undefined
    const totals = ledger.status === 'ready' ? distributedByCause(ledger.data) : undefined
    return snapshot.data.approvedCauses.map((address) => ({
      info: describeCause(address, snapshot.data.fallbackCause),
      distributed: totals ? (totals.get(address.toLowerCase()) ?? 0n) : undefined,
    }))
  }, [snapshot, ledger])
  return { snapshot, ledger, rows }
}
