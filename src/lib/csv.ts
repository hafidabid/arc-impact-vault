import { CHAIN } from '@/chain/config'
import { KIND_LABEL } from '@/chain/logs'
import type { LedgerEntry } from '@/chain/logs'
import { formatUnitsFixed } from '@/onchain-money'

/** Neutralises spreadsheet formula injection and quotes fields that need it. */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

const HEADER = ['network', 'chain_id', 'operation_id', 'timestamp_utc', 'type', 'wallet', 'cause', 'amount_usdc', 'amount_base_units', 'detail', 'transaction_hash', 'block']

/** Ledger export. Every row carries the network and unit labels so a file is self-describing. */
export function ledgerToCsv(entries: readonly LedgerEntry[]): string {
  const rows = entries.map((entry) =>
    [
      CHAIN.name,
      String(CHAIN.id),
      entry.id,
      new Date(entry.timestamp * 1000).toISOString(),
      KIND_LABEL[entry.kind],
      entry.account ?? '',
      entry.cause ?? '',
      entry.amount !== undefined ? formatUnitsFixed(entry.amount, 6, 6) : '',
      entry.amount !== undefined ? entry.amount.toString() : '',
      entry.detail ?? '',
      entry.txHash,
      entry.blockNumber.toString(),
    ].map(csvCell),
  )
  return [HEADER, ...rows.map((row) => row)].map((row) => row.join(',')).join('\r\n')
}
