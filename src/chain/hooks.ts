import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Address, Hash } from 'viem'
import { useAccount, useBalance, useChainId, usePublicClient, useReadContracts, useSwitchChain, useWriteContract } from 'wagmi'
import { erc20Abi, strategyAbi, vaultAbi } from './abi'
import { CHAIN, CONFIRMATIONS, STRATEGY_ADDRESS, USDC_ADDRESS, VAULT_ADDRESS } from './config'
import { classifyTxError, gasWeiToUsdcUnits, vaultPhase } from './derive'
import type { TxFailure, VaultPhase, VaultSnapshot } from './derive'
import { fetchVaultLogs } from './logs'
import type { LedgerEntry } from './logs'

const REFRESH_MS = 15_000

const vault = { address: VAULT_ADDRESS, abi: vaultAbi, chainId: CHAIN.id } as const

/** Wall-clock time in unix seconds, ticking once a minute so deadline-driven UI stays current. */
export function useNow(): bigint {
  const [now, setNow] = useState(() => BigInt(Math.floor(Date.now() / 1000)))
  useEffect(() => {
    const id = window.setInterval(() => setNow(BigInt(Math.floor(Date.now() / 1000))), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

export type Loadable<T> = { status: 'loading' } | { status: 'error'; refetch: () => void } | { status: 'ready'; data: T; refetch: () => void }

/**
 * Live vault snapshot. While loading or on error no figures are returned, so the interface can never show
 * an unknown balance as zero.
 */
export function useVaultSnapshot(): Loadable<VaultSnapshot> {
  const result = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...vault, functionName: 'owner' },
      { ...vault, functionName: 'paused' },
      { ...vault, functionName: 'emergency' },
      { ...vault, functionName: 'inKindExit' },
      { ...vault, functionName: 'isSettled' },
      { ...vault, functionName: 'depositDeadline' },
      { ...vault, functionName: 'maturity' },
      { ...vault, functionName: 'claimGracePeriod' },
      { ...vault, functionName: 'settledAt' },
      { ...vault, functionName: 'totalPrincipal' },
      { ...vault, functionName: 'depositCap' },
      { ...vault, functionName: 'settledAssets' },
      { ...vault, functionName: 'yieldPool' },
      { ...vault, functionName: 'yieldRemaining' },
      { ...vault, functionName: 'principalOwed' },
      { ...vault, functionName: 'unclaimedPrincipal' },
      { ...vault, functionName: 'projectedYield' },
      { ...vault, functionName: 'inKindShares' },
      { ...vault, functionName: 'inKindPrincipal' },
      { ...vault, functionName: 'fallbackCause' },
      { ...vault, functionName: 'approvedCauses' },
      { address: USDC_ADDRESS, abi: erc20Abi, functionName: 'balanceOf', args: [VAULT_ADDRESS], chainId: CHAIN.id },
    ],
    query: { refetchInterval: REFRESH_MS },
  })

  return useMemo<Loadable<VaultSnapshot>>(() => {
    const rows = result.data
    if (!rows) return result.isError ? { status: 'error', refetch: () => void result.refetch() } : { status: 'loading' }
    // projectedYield (index 16) reads the external strategy and may revert; every other call must succeed.
    const failed = rows.some((row, index) => row.status === 'failure' && index !== 16)
    if (failed) return { status: 'error', refetch: () => void result.refetch() }
    const v = rows.map((row) => (row.status === 'success' ? row.result : undefined))
    const data: VaultSnapshot = {
      owner: v[0] as Address,
      paused: v[1] as boolean,
      emergency: v[2] as boolean,
      inKindExit: v[3] as boolean,
      isSettled: v[4] as boolean,
      depositDeadline: v[5] as bigint,
      maturity: v[6] as bigint,
      claimGracePeriod: v[7] as bigint,
      settledAt: v[8] as bigint,
      totalPrincipal: v[9] as bigint,
      depositCap: v[10] as bigint,
      settledAssets: v[11] as bigint,
      yieldPool: v[12] as bigint,
      yieldRemaining: v[13] as bigint,
      principalOwed: v[14] as bigint,
      unclaimedPrincipal: v[15] as bigint,
      projectedYield: (v[16] as bigint | undefined) ?? 0n,
      inKindShares: v[17] as bigint,
      inKindPrincipal: v[18] as bigint,
      fallbackCause: v[19] as Address,
      approvedCauses: v[20] as readonly Address[],
      vaultUsdc: v[21] as bigint,
    }
    return { status: 'ready', data, refetch: () => void result.refetch() }
  }, [result])
}

export function useVaultPhase(snapshot: VaultSnapshot | undefined): VaultPhase | undefined {
  const now = useNow()
  return snapshot ? vaultPhase(snapshot, now) : undefined
}

export interface AccountData {
  principal: bigint
  usdcBalance: bigint
  allowance: bigint
}

export function useAccountData(): Loadable<AccountData> | { status: 'disconnected' } {
  const { address, isConnected } = useAccount()
  const result = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...vault, functionName: 'principalOf', args: [address ?? '0x0000000000000000000000000000000000000000'] },
      { address: USDC_ADDRESS, abi: erc20Abi, functionName: 'balanceOf', args: [address ?? '0x0000000000000000000000000000000000000000'], chainId: CHAIN.id },
      { address: USDC_ADDRESS, abi: erc20Abi, functionName: 'allowance', args: [address ?? '0x0000000000000000000000000000000000000000', VAULT_ADDRESS], chainId: CHAIN.id },
    ],
    query: { enabled: isConnected && Boolean(address), refetchInterval: REFRESH_MS },
  })
  return useMemo(() => {
    if (!isConnected) return { status: 'disconnected' as const }
    if (!result.data) return result.isError ? { status: 'error' as const, refetch: () => void result.refetch() } : { status: 'loading' as const }
    const [principal, usdcBalance, allowance] = result.data
    return { status: 'ready' as const, data: { principal, usdcBalance, allowance }, refetch: () => void result.refetch() }
  }, [isConnected, result])
}

/** Native gas balance, which on Arc is the same USDC pool shown at 18 decimals. */
export function useGasBalance(): bigint | undefined {
  const { address } = useAccount()
  const { data } = useBalance({ address, chainId: CHAIN.id, query: { enabled: Boolean(address), refetchInterval: REFRESH_MS } })
  return data?.value
}

export function useVaultLedger(): Loadable<LedgerEntry[]> {
  const client = usePublicClient({ chainId: CHAIN.id })
  const query = useQuery({
    queryKey: ['vault-ledger', VAULT_ADDRESS],
    enabled: Boolean(client),
    refetchInterval: REFRESH_MS * 2,
    queryFn: () => {
      if (!client) throw new Error('No RPC client')
      return fetchVaultLogs(client)
    },
  })
  return useMemo<Loadable<LedgerEntry[]>>(() => {
    if (query.data) return { status: 'ready', data: query.data, refetch: () => void query.refetch() }
    if (query.isError) return { status: 'error', refetch: () => void query.refetch() }
    return { status: 'loading' }
  }, [query])
}

/** Previewed strategy shares for a deposit, used as the basis for the minimum-shares guard. */
export function usePreviewShares(amount: bigint | undefined): bigint | undefined {
  const result = useReadContracts({
    allowFailure: false,
    contracts: [{ address: STRATEGY_ADDRESS, abi: strategyAbi, functionName: 'previewDeposit', args: [amount ?? 0n], chainId: CHAIN.id }],
    query: { enabled: amount !== undefined && amount > 0n },
  })
  return result.data?.[0]
}

/** Wallet/network state in the shape the interface needs. */
export function useSession() {
  const { address, isConnected, isConnecting, isReconnecting, connector } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync, isPending: switching } = useSwitchChain()
  const walletChainId = useAccount().chainId
  const wrongNetwork = isConnected && walletChainId !== CHAIN.id
  return {
    address,
    isConnected,
    connecting: isConnecting || isReconnecting,
    connectorName: connector?.name,
    wrongNetwork,
    switching,
    configuredChainId: chainId,
    switchNetwork: () => switchChainAsync({ chainId: CHAIN.id }),
  }
}

export type TxStage =
  | { stage: 'idle' }
  | { stage: 'awaiting-signature'; label: string }
  | { stage: 'submitted'; label: string; hash: Hash }
  | { stage: 'confirmed'; label: string; hash: Hash }
  | { stage: 'failed'; label: string; hash?: Hash; failure: TxFailure }
  /** The wallet returned a hash but the receipt could not be fetched. Never offer a fresh payment from here. */
  | { stage: 'checking'; label: string; hash: Hash }

const pendingKey = (scope: string) => `impactvault:pending-tx:${scope}`

interface PendingRecord {
  hash: Hash
  label: string
  account: string
}

/** Pending hashes survive refresh so a reload recovers the transaction instead of inviting a second payment. */
function loadPending(scope: string, account: string | undefined): PendingRecord | undefined {
  if (!account) return undefined
  try {
    const raw = window.localStorage.getItem(pendingKey(scope))
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as PendingRecord
    return parsed.account.toLowerCase() === account.toLowerCase() ? parsed : undefined
  } catch {
    return undefined
  }
}

const savePending = (scope: string, record: PendingRecord | undefined) => {
  if (record) window.localStorage.setItem(pendingKey(scope), JSON.stringify(record))
  else window.localStorage.removeItem(pendingKey(scope))
}

type WriteArgs = Parameters<ReturnType<typeof useWriteContract>['writeContractAsync']>[0]

/**
 * Runs one contract write through the full lifecycle: signature → submitted → confirmed. Balances are
 * refreshed only after a confirmed receipt. A page reload resumes a pending hash.
 */
export function useTransaction(scope: string) {
  const { address } = useAccount()
  const client = usePublicClient({ chainId: CHAIN.id })
  const queryClient = useQueryClient()
  const { writeContractAsync } = useWriteContract()
  const [tx, setTx] = useState<TxStage>({ stage: 'idle' })

  const settle = useCallback(
    async (hash: Hash, label: string) => {
      if (!client) return
      setTx({ stage: 'submitted', label, hash })
      savePending(scope, { hash, label, account: address ?? '' })
      try {
        const receipt = await client.waitForTransactionReceipt({ hash, confirmations: CONFIRMATIONS, timeout: 120_000 })
        savePending(scope, undefined)
        if (receipt.status === 'success') {
          setTx({ stage: 'confirmed', label, hash })
          await queryClient.invalidateQueries()
          // Public RPC log indexes can trail the receipt by a few seconds; look again so the ledger catches up.
          window.setTimeout(() => void queryClient.invalidateQueries({ queryKey: ['vault-ledger'] }), 5_000)
        } else {
          setTx({ stage: 'failed', label, hash, failure: { kind: 'reverted', message: 'The transaction was included but reverted on-chain.' } })
        }
      } catch {
        // Timeout or RPC trouble: the status is unknown, not failed.
        setTx({ stage: 'checking', label, hash })
      }
    },
    [address, client, queryClient, scope],
  )

  // Resume a pending transaction after a refresh or reconnect.
  useEffect(() => {
    const pending = loadPending(scope, address)
    if (pending && tx.stage === 'idle') void settle(pending.hash, pending.label)
    // Only on account change/mount.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [address])

  const send = useCallback(
    async (label: string, args: WriteArgs): Promise<Hash | undefined> => {
      setTx({ stage: 'awaiting-signature', label })
      let hash: Hash
      try {
        hash = await writeContractAsync(args)
      } catch (error) {
        setTx({ stage: 'failed', label, failure: classifyTxError(error) })
        return undefined
      }
      await settle(hash, label)
      return hash
    },
    [settle, writeContractAsync],
  )

  const recheck = useCallback(() => {
    if (tx.stage === 'checking') void settle(tx.hash, tx.label)
  }, [settle, tx])

  const reset = useCallback(() => {
    savePending(scope, undefined)
    setTx({ stage: 'idle' })
  }, [scope])

  const busy = tx.stage === 'awaiting-signature' || tx.stage === 'submitted' || tx.stage === 'checking'
  return { tx, send, recheck, reset, busy }
}

/**
 * Estimated network fee in USDC base units for a transaction of roughly `gasUnits` gas. Arc charges fees in
 * its USDC gas token, which draws on the same balance as deposits, so the interface reserves it.
 */
export function useFeeEstimate(gasUnits: bigint): bigint | undefined {
  const client = usePublicClient({ chainId: CHAIN.id })
  const query = useQuery({
    queryKey: ['fee-estimate', gasUnits.toString()],
    enabled: Boolean(client),
    refetchInterval: REFRESH_MS * 2,
    queryFn: async () => {
      if (!client) throw new Error('No RPC client')
      const fees = await client.estimateFeesPerGas()
      return gasWeiToUsdcUnits(fees.maxFeePerGas * gasUnits)
    },
  })
  return query.data
}
