/** Domain types for the ImpactVault donor app. All money is integer USDC base units (6 decimals). */

export const POOL_IDS = ['hunger-relief', 'kalimantan-forest-fire-relief'] as const
export type PoolId = (typeof POOL_IDS)[number]

export type AccountId =
  | 'principal_custody_asset'
  | 'user_principal_payable'
  | 'sponsor_custody_asset'
  | 'unassigned_sponsor_funds'
  | 'user_attributed_donation_proceeds'
  | 'hunger_donation_payable'
  | 'kalimantan_donation_payable'

export type OperationType =
  | 'deposit'
  | 'sponsor_funding'
  | 'attribution'
  | 'allocation'
  | 'settlement'
  | 'withdrawal'
  | 'reversal'

/** Created -> Reserved -> Submitted -> Confirmed, with Rejected, Failed and Needs reconciliation branches. */
export type OperationStatus = 'submitted' | 'confirmed' | 'failed' | 'needs-reconciliation'

export interface JournalEntry {
  account: AccountId
  debit: bigint
  credit: bigint
}

export interface Operation {
  operationId: string
  type: OperationType
  status: OperationStatus
  amount: bigint
  poolId?: PoolId
  entries: JournalEntry[]
  createdAt: string
  updatedAt: string
  from: string
  to: string
  /** "onchain" is a token movement; "ledger" is an internal ledger entry. */
  layer: 'onchain' | 'ledger'
  /** Synthetic receipt reference. Never a real transaction hash. */
  reference: string
  linkedOperationId?: string
  lotId?: string
  positionId?: string
  lookupAttempts?: number
  note?: string
}

export interface Scenario {
  wallet: 'available' | 'missing'
  network: 'configured' | 'wrong'
  fees: 'funded' | 'insufficient'
  signature: 'approve' | 'reject-approval' | 'reject-signature'
  submission: 'confirm' | 'fail' | 'ambiguous'
  data: 'ready' | 'loading' | 'sync-error'
}

export interface Session {
  status: 'disconnected' | 'connecting' | 'connected'
  network: 'configured' | 'wrong'
}

export interface VaultState {
  version: 1
  session: Session
  scenario: Scenario
  operations: Operation[]
  poolPreference: PoolId | null
  onboardingComplete: boolean
}

export interface Balances {
  principalCustody: bigint
  principalPayable: bigint
  sponsorCustody: bigint
  unassignedSponsor: bigint
  availableProceeds: bigint
  allocatedAwaitingTransfer: Record<PoolId, bigint>
  confirmedDonations: Record<PoolId, bigint>
  reservedWithdrawals: bigint
  pendingDeposits: bigint
  availablePrincipal: bigint
  pendingTransfers: bigint
}

export type FlowPhase =
  | 'awaiting-approval'
  | 'awaiting-signature'
  | 'reserved'
  | 'submitted'
  | 'pending'

export type BlockReason =
  | 'no-wallet'
  | 'wrong-network'
  | 'insufficient-fees'
  | 'insufficient-balance'
  | 'insufficient-principal'
  | 'insufficient-proceeds'

export type FlowResult =
  | { status: 'confirmed'; operationId: string }
  | { status: 'rejected'; at: 'approval' | 'signature' }
  | { status: 'failed'; operationId: string; releasedReservation: boolean }
  | { status: 'unknown'; operationId: string }
  | { status: 'blocked'; reason: BlockReason }

export type LookupResult = 'confirmed' | 'still-checking' | 'not-found'

export interface PoolConfig {
  id: PoolId
  name: string
  short: string
  purpose: string
  sourceOfFunds: string
  recipientStatus: 'configured-demo' | 'unconfigured'
  recipientVersion: string
  paused: boolean
  limitations: string[]
}
