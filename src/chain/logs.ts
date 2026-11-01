import type { Address, Hash, PublicClient } from 'viem'
import { parseEventLogs } from 'viem'
import { vaultAbi } from './abi'
import { VAULT_ADDRESS, VAULT_DEPLOY_BLOCK } from './config'

export type LedgerKind =
  | 'deposit'
  | 'withdrawal'
  | 'in-kind-withdrawal'
  | 'settlement'
  | 'yield-distribution'
  | 'yield-sweep'
  | 'cause-added'
  | 'cause-removed'
  | 'cap-updated'
  | 'paused'
  | 'unpaused'
  | 'emergency'
  | 'in-kind-enabled'
  | 'rescue'

export interface LedgerEntry {
  /** Stable operation ID: transaction hash plus log index. */
  id: string
  kind: LedgerKind
  txHash: Hash
  logIndex: number
  blockNumber: bigint
  timestamp: number
  /** Wallet the entry belongs to, when it is personal (deposits, withdrawals). */
  account?: Address
  /** Cause receiving funds, when applicable. */
  cause?: Address
  /** USDC base units, when the event moves USDC. */
  amount?: bigint
  /** Free-form detail such as shares or a cap change. */
  detail?: string
}

export const KIND_LABEL: Record<LedgerKind, string> = {
  deposit: 'Deposit',
  withdrawal: 'Principal withdrawal',
  'in-kind-withdrawal': 'In-kind withdrawal',
  settlement: 'Settlement',
  'yield-distribution': 'Yield distribution',
  'yield-sweep': 'Yield sweep to fallback cause',
  'cause-added': 'Cause approved',
  'cause-removed': 'Cause removed',
  'cap-updated': 'Deposit cap changed',
  paused: 'Deposits paused',
  unpaused: 'Deposits resumed',
  emergency: 'Emergency shutdown',
  'in-kind-enabled': 'In-kind exit enabled',
  rescue: 'Token rescue',
}

/** Arc's public RPCs cap eth_getLogs at 10,000 blocks and rate-limit bursts, so stay under both. */
const CHUNK = 9_000n
const MAX_ATTEMPTS = 5

type RawLog = Awaited<ReturnType<PublicClient['getLogs']>>[number]

const errorText = (error: unknown) => (error instanceof Error ? `${error.message} ${(error as { details?: string }).details ?? ''}` : String(error))
const isRateLimit = (error: unknown) => /rate limit|too many requests|429/i.test(errorText(error))
const isRangeTooLarge = (error: unknown) => /range too large|too large|exceed.*(block|range)|block range|query returned more than/i.test(errorText(error))
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** One bounded getLogs call: back off on rate limits, split the range in half if the node says it is too wide. */
export async function logsInRange(client: PublicClient, from: bigint, to: bigint, attempt = 0): Promise<RawLog[]> {
  try {
    return await client.getLogs({ address: VAULT_ADDRESS, fromBlock: from, toBlock: to })
  } catch (error) {
    if (isRateLimit(error) && attempt < MAX_ATTEMPTS) {
      await sleep(400 * 2 ** attempt)
      return logsInRange(client, from, to, attempt + 1)
    }
    if (isRangeTooLarge(error) && to > from) {
      const mid = from + (to - from) / 2n
      return [...(await logsInRange(client, from, mid)), ...(await logsInRange(client, mid + 1n, to))]
    }
    throw error
  }
}

/** Fetches every vault event since deployment, in block-range chunks so public RPC limits are respected. */
export async function fetchVaultLogs(client: PublicClient): Promise<LedgerEntry[]> {
  const latest = await client.getBlockNumber()
  const raw: RawLog[] = []
  for (let from = VAULT_DEPLOY_BLOCK; from <= latest; from += CHUNK) {
    const to = from + CHUNK - 1n < latest ? from + CHUNK - 1n : latest
    raw.push(...(await logsInRange(client, from, to)))
  }
  const parsed = parseEventLogs({ abi: vaultAbi, logs: raw })

  const blocks = [...new Set(parsed.map((log) => log.blockNumber))]
  const times = new Map<bigint, number>()
  await Promise.all(
    blocks.map(async (blockNumber) => {
      const block = await client.getBlock({ blockNumber })
      times.set(blockNumber, Number(block.timestamp))
    }),
  )

  const entries: LedgerEntry[] = []
  for (const log of parsed) {
    const base = {
      id: `${log.transactionHash}:${log.logIndex}`,
      txHash: log.transactionHash,
      logIndex: log.logIndex,
      blockNumber: log.blockNumber,
      timestamp: times.get(log.blockNumber) ?? 0,
    }
    switch (log.eventName) {
      case 'Deposited':
        entries.push({ ...base, kind: 'deposit', account: log.args.depositor, amount: log.args.amount, detail: `${log.args.shares} strategy shares` })
        break
      case 'Withdrawn':
        entries.push({ ...base, kind: 'withdrawal', account: log.args.depositor, amount: log.args.amount, detail: `Nominal principal ${log.args.nominalPrincipal}` })
        break
      case 'InKindWithdrawn':
        entries.push({ ...base, kind: 'in-kind-withdrawal', account: log.args.user, amount: log.args.principalCredited, detail: `${log.args.shares} strategy shares` })
        break
      case 'Settled':
        entries.push({ ...base, kind: 'settlement', amount: log.args.assets, detail: `Yield ${log.args.yield}` })
        break
      case 'YieldDistributed':
        entries.push({ ...base, kind: 'yield-distribution', cause: log.args.cause, amount: log.args.amount })
        break
      case 'YieldSwept':
        entries.push({ ...base, kind: 'yield-sweep', account: log.args.caller, detail: `Swept by caller; amount recorded in the matching yield distribution` })
        break
      case 'CauseAdded':
        entries.push({ ...base, kind: 'cause-added', cause: log.args.cause })
        break
      case 'CauseRemoved':
        entries.push({ ...base, kind: 'cause-removed', cause: log.args.cause })
        break
      case 'DepositCapUpdated':
        entries.push({ ...base, kind: 'cap-updated', detail: `${log.args.oldCap} → ${log.args.newCap}` })
        break
      case 'Paused':
        entries.push({ ...base, kind: 'paused', account: log.args.account })
        break
      case 'Unpaused':
        entries.push({ ...base, kind: 'unpaused', account: log.args.account })
        break
      case 'EmergencyShutdown':
        entries.push({ ...base, kind: 'emergency', detail: log.args.settled ? 'Settled immediately' : 'Settlement pending' })
        break
      case 'InKindExitEnabled':
        entries.push({ ...base, kind: 'in-kind-enabled', detail: `${log.args.shares} shares for ${log.args.principal} principal` })
        break
      case 'TokenRescued':
        entries.push({ ...base, kind: 'rescue', cause: log.args.to, amount: log.args.amount })
        break
      default:
        break
    }
  }
  return entries.sort((a, b) => (a.blockNumber === b.blockNumber ? b.logIndex - a.logIndex : a.blockNumber < b.blockNumber ? 1 : -1))
}

/** Totals derived from the event log, never edited by hand. */
export function distributedByCause(entries: readonly LedgerEntry[]): Map<string, bigint> {
  const totals = new Map<string, bigint>()
  for (const entry of entries) {
    if ((entry.kind === 'yield-distribution') && entry.cause && entry.amount !== undefined) {
      const key = entry.cause.toLowerCase()
      totals.set(key, (totals.get(key) ?? 0n) + entry.amount)
    }
  }
  return totals
}
