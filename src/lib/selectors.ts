import { DEMO_WALLET_START } from '@/data/seed'
import { computeBalances, hasAttributedLot, hasFundedLot } from './ledger'
import type { Balances, Operation, VaultState } from './types'

/** Demo wallet balance: starting amount, less deposits that left the wallet, plus confirmed withdrawals. */
export function walletBalance(operations: readonly Operation[]): bigint {
  let balance = DEMO_WALLET_START
  for (const op of operations) {
    if (op.type === 'deposit' && op.status !== 'failed') balance -= op.amount
    if (op.type === 'withdrawal' && op.status === 'confirmed') balance += op.amount
  }
  return balance
}

export interface Overview {
  balances: Balances
  walletUsdc: bigint
  connected: boolean
  wrongNetwork: boolean
  dataStatus: VaultState['scenario']['data']
  /** True when the ledger has any record at all for this position. */
  hasPosition: boolean
  lotFunded: boolean
  lotAttributed: boolean
  recent: Operation[]
  inFlight: Operation[]
}

export function buildOverview(state: VaultState): Overview {
  const operations = state.operations
  const balances = computeBalances(operations)
  const sorted = [...operations].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.operationId.localeCompare(a.operationId))
  return {
    balances,
    walletUsdc: walletBalance(operations),
    connected: state.session.status === 'connected',
    wrongNetwork: state.session.status === 'connected' && state.session.network === 'wrong',
    dataStatus: state.scenario.data,
    hasPosition: operations.some((op) => op.type === 'deposit' && op.status === 'confirmed'),
    lotFunded: hasFundedLot(operations),
    lotAttributed: hasAttributedLot(operations),
    recent: sorted.slice(0, 4),
    inFlight: sorted.filter((op) => op.status === 'submitted' || op.status === 'needs-reconciliation'),
  }
}
