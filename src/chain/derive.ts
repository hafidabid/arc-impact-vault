import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from 'viem'

/** Raw, on-chain snapshot of the vault. All amounts are USDC base units (6 decimals). */
export interface VaultSnapshot {
  owner: `0x${string}`
  paused: boolean
  emergency: boolean
  inKindExit: boolean
  isSettled: boolean
  depositDeadline: bigint
  maturity: bigint
  claimGracePeriod: bigint
  settledAt: bigint
  totalPrincipal: bigint
  depositCap: bigint
  settledAssets: bigint
  yieldPool: bigint
  yieldRemaining: bigint
  principalOwed: bigint
  unclaimedPrincipal: bigint
  projectedYield: bigint
  inKindShares: bigint
  inKindPrincipal: bigint
  fallbackCause: `0x${string}`
  approvedCauses: readonly `0x${string}`[]
  /** USDC held directly by the vault contract. */
  vaultUsdc: bigint
}

export type VaultPhase = 'open' | 'paused' | 'locked' | 'matured' | 'emergency' | 'in-kind' | 'settled'

/** The single source of truth for what users may do right now. `now` is unix seconds. */
export function vaultPhase(v: Pick<VaultSnapshot, 'paused' | 'emergency' | 'inKindExit' | 'isSettled' | 'depositDeadline' | 'maturity'>, now: bigint): VaultPhase {
  if (v.isSettled) return 'settled'
  if (v.inKindExit) return 'in-kind'
  if (v.emergency) return 'emergency'
  if (now >= v.maturity) return 'matured'
  if (now >= v.depositDeadline) return 'locked'
  if (v.paused) return 'paused'
  return 'open'
}

export const PHASE_LABEL: Record<VaultPhase, string> = {
  open: 'Deposits open',
  paused: 'Deposits paused',
  locked: 'Locked until maturity',
  matured: 'Matured',
  emergency: 'Emergency exit',
  'in-kind': 'In-kind exit',
  settled: 'Settled',
}

export const canDeposit = (phase: VaultPhase): boolean => phase === 'open'

/** Principal can be claimed once the vault has matured, been shut down in an emergency, or settled. */
export const canClaim = (phase: VaultPhase): boolean => phase === 'matured' || phase === 'emergency' || phase === 'settled'

/** Remaining room under the lifetime deposit cap. */
export function capacityLeft(v: Pick<VaultSnapshot, 'depositCap' | 'totalPrincipal'>): bigint {
  return v.depositCap > v.totalPrincipal ? v.depositCap - v.totalPrincipal : 0n
}

export const MAX_UINT256 = (1n << 256n) - 1n
export const isUnlimited = (cap: bigint): boolean => cap >= MAX_UINT256

/** Mirrors the contract: floor(nominal * settledAssets / totalPrincipal), capped at nominal. */
export function settledPayout(nominal: bigint, settledAssets: bigint, totalPrincipal: bigint): bigint {
  if (totalPrincipal === 0n) return 0n
  if (settledAssets >= totalPrincipal) return nominal
  return (nominal * settledAssets) / totalPrincipal
}

/** Earliest time anyone may sweep leftover yield to the fallback cause. Null before settlement. */
export function sweepOpensAt(v: Pick<VaultSnapshot, 'isSettled' | 'settledAt' | 'claimGracePeriod'>): bigint | null {
  return v.isSettled ? v.settledAt + v.claimGracePeriod : null
}

/** Slippage guard for deposits: accept at least this share of the previewed strategy shares. */
export function minSharesFor(previewShares: bigint, toleranceBps = 50n): bigint {
  const min = (previewShares * (10_000n - toleranceBps)) / 10_000n
  return min > 0n ? min : 1n
}

/** Gas on Arc is paid in USDC with 18 decimals; the ERC-20 view has 6. Round up so a fee is never understated. */
export const gasWeiToUsdcUnits = (wei: bigint): bigint => (wei + 10n ** 12n - 1n) / 10n ** 12n

/** Largest deposit that still leaves `feeReserve` of the same USDC balance for network fees. */
export function maxDepositable(balance: bigint, feeReserve: bigint, capLeft: bigint): bigint {
  const afterFees = balance > feeReserve ? balance - feeReserve : 0n
  return afterFees < capLeft ? afterFees : capLeft
}

export type TxFailure = { kind: 'rejected' } | { kind: 'reverted'; message: string } | { kind: 'unknown'; message: string }

const REVERT_MESSAGES: Record<string, string> = {
  DepositsClosed: 'Deposits are closed for this vault.',
  EmergencyActive: 'The vault is in emergency shutdown, so deposits are permanently closed.',
  EmergencyNotActive: 'This action is only available during an emergency shutdown.',
  InKindExitActive: 'The vault is in in-kind exit mode. Claim your strategy shares instead.',
  InKindExitNotActive: 'In-kind exit has not been enabled.',
  NotMature: 'The vault has not reached maturity yet.',
  AlreadySettled: 'The vault is already settled.',
  NotSettled: 'The vault has not settled yet.',
  CapExceeded: 'This deposit would exceed the vault deposit cap.',
  CapCannotDecrease: 'The deposit cap cannot be lowered once deposits exist.',
  InsufficientShares: 'The strategy returned fewer shares than expected. Try again.',
  DepositSharesWorthLess: 'The strategy shares received are worth less than the deposit, so it was blocked.',
  NoPrincipal: 'This wallet has no principal in the vault.',
  CauseNotApproved: 'That cause is not approved.',
  CauseAlreadyApproved: 'That cause is already approved.',
  ProtectedFallback: 'The fallback cause cannot be removed.',
  InsufficientYield: 'That is more than the remaining yield.',
  GracePeriodActive: 'The grace period before sweeping has not ended.',
  ZeroAmount: 'Enter an amount greater than zero.',
  InvalidAddress: 'That address is not valid here.',
  EnforcedPause: 'Deposits are paused.',
  ExpectedPause: 'Deposits are not paused.',
  OwnableUnauthorizedAccount: 'Only the vault owner can do this.',
}

/** Turns a wagmi/viem error into something a person can act on. */
export function classifyTxError(error: unknown): TxFailure {
  if (error instanceof BaseError) {
    if (error.walk((e) => e instanceof UserRejectedRequestError)) return { kind: 'rejected' }
    const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError)
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName
      return { kind: 'reverted', message: (name && REVERT_MESSAGES[name]) || reverted.reason || 'The contract rejected this transaction.' }
    }
    if (/user rejected|user denied|rejected the request/i.test(error.shortMessage)) return { kind: 'rejected' }
    return { kind: 'unknown', message: error.shortMessage }
  }
  const message = error instanceof Error ? error.message : 'Something went wrong.'
  return /user rejected|user denied/i.test(message) ? { kind: 'rejected' } : { kind: 'unknown', message }
}

export const shortAddress = (address: string): string => `${address.slice(0, 6)}…${address.slice(-4)}`
export const shortHash = (hash: string): string => `${hash.slice(0, 10)}…${hash.slice(-6)}`
