import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from 'viem'
import { describe, expect, it } from 'vitest'
import { canClaim, canDeposit, capacityLeft, classifyTxError, gasWeiToUsdcUnits, isUnlimited, MAX_UINT256, maxDepositable, minSharesFor, settledPayout, sweepOpensAt, vaultPhase } from '@/chain/derive'

const base = { paused: false, emergency: false, inKindExit: false, isSettled: false, depositDeadline: 1000n, maturity: 2000n }

describe('vaultPhase', () => {
  it('is open before the deposit deadline', () => expect(vaultPhase(base, 999n)).toBe('open'))
  it('is paused only while deposits would otherwise be open', () => {
    expect(vaultPhase({ ...base, paused: true }, 999n)).toBe('paused')
    expect(vaultPhase({ ...base, paused: true }, 1500n)).toBe('locked')
  })
  it('locks exactly at the deadline (deposits are accepted strictly before it)', () => {
    expect(vaultPhase(base, 1000n)).toBe('locked')
    expect(vaultPhase(base, 1999n)).toBe('locked')
  })
  it('matures exactly at maturity', () => expect(vaultPhase(base, 2000n)).toBe('matured'))
  it('emergency overrides the schedule', () => expect(vaultPhase({ ...base, emergency: true }, 10n)).toBe('emergency'))
  it('in-kind exit overrides emergency', () => expect(vaultPhase({ ...base, emergency: true, inKindExit: true }, 10n)).toBe('in-kind'))
  it('settled wins over everything', () => expect(vaultPhase({ ...base, emergency: true, isSettled: true }, 10n)).toBe('settled'))
})

describe('permissions by phase', () => {
  it('only allows deposits when open', () => {
    expect(canDeposit('open')).toBe(true)
    for (const phase of ['paused', 'locked', 'matured', 'emergency', 'in-kind', 'settled'] as const) expect(canDeposit(phase)).toBe(false)
  })
  it('allows claims once matured, in emergency or settled, never while locked', () => {
    for (const phase of ['matured', 'emergency', 'settled'] as const) expect(canClaim(phase)).toBe(true)
    for (const phase of ['open', 'paused', 'locked', 'in-kind'] as const) expect(canClaim(phase)).toBe(false)
  })
})

describe('settledPayout (mirrors ImpactVault.withdraw)', () => {
  it('pays full principal when the strategy returned at least the total', () => {
    expect(settledPayout(3_000_000n, 3_200_000n, 3_000_000n)).toBe(3_000_000n)
    expect(settledPayout(3_000_000n, 3_000_000n, 3_000_000n)).toBe(3_000_000n)
  })
  it('pays pro rata and rounds down on a loss', () => {
    expect(settledPayout(1_000_000n, 2_999_999n, 3_000_000n)).toBe(999_999n)
    expect(settledPayout(1n, 2n, 3n)).toBe(0n)
  })
  it('never exceeds the nominal principal', () => expect(settledPayout(5n, 10n ** 12n, 10n)).toBe(5n))
  it('is zero for an empty vault', () => expect(settledPayout(0n, 0n, 0n)).toBe(0n))
})

describe('money helpers', () => {
  it('capacityLeft respects the cap and never goes negative', () => {
    expect(capacityLeft({ depositCap: 10n, totalPrincipal: 4n })).toBe(6n)
    expect(capacityLeft({ depositCap: 4n, totalPrincipal: 10n })).toBe(0n)
  })
  it('treats max uint as unlimited', () => {
    expect(isUnlimited(MAX_UINT256)).toBe(true)
    expect(isUnlimited(1_000_000n)).toBe(false)
  })
  it('maxDepositable reserves fees from the same balance', () => {
    expect(maxDepositable(10_000_000n, 150_000n, MAX_UINT256)).toBe(9_850_000n)
    expect(maxDepositable(100n, 150_000n, MAX_UINT256)).toBe(0n)
    expect(maxDepositable(10_000_000n, 0n, 3_000_000n)).toBe(3_000_000n)
  })
  it('converts 18-decimal gas wei to 6-decimal USDC, rounding up', () => {
    expect(gasWeiToUsdcUnits(10n ** 12n)).toBe(1n)
    expect(gasWeiToUsdcUnits(10n ** 12n + 1n)).toBe(2n)
    expect(gasWeiToUsdcUnits(0n)).toBe(0n)
  })
  it('minSharesFor applies slippage tolerance and never returns zero', () => {
    expect(minSharesFor(10_000n)).toBe(9_950n)
    expect(minSharesFor(1n)).toBe(1n)
  })
  it('sweepOpensAt is null before settlement', () => {
    expect(sweepOpensAt({ isSettled: false, settledAt: 0n, claimGracePeriod: 7n })).toBeNull()
    expect(sweepOpensAt({ isSettled: true, settledAt: 100n, claimGracePeriod: 7n })).toBe(107n)
  })
})

describe('classifyTxError', () => {
  it('recognises a wallet rejection', () => {
    expect(classifyTxError(new BaseError('x', { cause: new UserRejectedRequestError(new Error('no')) })).kind).toBe('rejected')
  })
  it('recognises rejection by message', () => {
    expect(classifyTxError(new Error('User rejected the request.')).kind).toBe('rejected')
  })
  it('maps contract errors to plain language', () => {
    const revert = new ContractFunctionRevertedError({ abi: [{ type: 'error', name: 'NotMature', inputs: [] }], data: '0x' as `0x${string}`, functionName: 'withdraw' })
    const result = classifyTxError(new BaseError('x', { cause: revert }))
    expect(result.kind).toBe('reverted')
  })
  it('falls back to unknown', () => expect(classifyTxError(new Error('boom'))).toEqual({ kind: 'unknown', message: 'boom' }))
})
