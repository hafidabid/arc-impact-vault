import { arc, arcTestnet } from 'viem/chains'
import type { Address, Chain } from 'viem'
import { isAddress } from 'viem'

/**
 * Deployment configuration. Everything that changes between networks is read from Vite env vars so a
 * production deployment only needs new values, not code changes. Defaults point at the current deployment.
 */
const env = import.meta.env as Record<string, string | undefined>

function addressFromEnv(name: string, fallback: Address): Address {
  const value = env[name]?.trim()
  if (!value) return fallback
  if (!isAddress(value)) throw new Error(`${name} is not a valid address`)
  return value
}

function blockFromEnv(name: string, fallback: bigint): bigint {
  const value = env[name]?.trim()
  return value ? BigInt(value) : fallback
}

/** `VITE_CHAIN=arc` selects Arc mainnet; anything else (or unset) is Arc Testnet. */
export const CHAIN: Chain = env.VITE_CHAIN?.trim() === 'arc' ? arc : arcTestnet

export const VAULT_ADDRESS = addressFromEnv('VITE_VAULT_ADDRESS', '0xd56B2ba0c4082D74856e4f739DaF9174507eaA6b')
export const STRATEGY_ADDRESS = addressFromEnv('VITE_STRATEGY_ADDRESS', '0xb0bae8c07a5c738aa7eac07eccd0de0c4009bb71')
export const USDC_ADDRESS = addressFromEnv('VITE_USDC_ADDRESS', '0x3600000000000000000000000000000000000000')

/** First block to scan for vault events. Set to the block the vault was deployed in. */
export const VAULT_DEPLOY_BLOCK = blockFromEnv('VITE_VAULT_DEPLOY_BLOCK', 70101849n)

/** Confirmations to wait for before the interface treats a transaction as final. */
export const CONFIRMATIONS = 1

export interface CauseLabel {
  address: Address
  name: string
  purpose: string
}

/**
 * Optional display names for approved causes. The contract only knows addresses, so names and purposes
 * are supplied as JSON: `VITE_CAUSES='[{"address":"0x…","name":"Hunger Relief","purpose":"…"}]'`.
 * An approved cause without an entry is shown by address, never under an invented name.
 */
function parseCauses(raw: string | undefined): CauseLabel[] {
  if (!raw?.trim()) return []
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('VITE_CAUSES must be a JSON array')
  return parsed.map((item: unknown) => {
    const row = item as Partial<CauseLabel>
    if (!row.address || !isAddress(row.address) || !row.name || !row.purpose) {
      throw new Error('VITE_CAUSES entries need address, name and purpose')
    }
    return { address: row.address, name: row.name, purpose: row.purpose }
  })
}

export const CAUSE_LABELS: CauseLabel[] = parseCauses(env.VITE_CAUSES)

export const explorerUrl = (kind: 'tx' | 'address', value: string): string =>
  `${CHAIN.blockExplorers?.default.url ?? ''}/${kind}/${value}`
