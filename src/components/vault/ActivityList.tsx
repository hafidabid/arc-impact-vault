import { ChevronRight } from 'lucide-react'
import { KIND_LABEL } from '@/chain/logs'
import type { LedgerEntry } from '@/chain/logs'
import { TxLink } from '@/components/chain/AddressLink'
import { AddressLink } from '@/components/chain/AddressLink'
import { Sheet } from '@/components/ui/Sheet'
import { Definition } from '@/components/ui/Misc'
import { ConfirmationChip } from '@/components/ui/StatusChip'
import { CHAIN } from '@/chain/config'
import { fmtUnixDateTime } from '@/lib/format'
import { fmtUsdc } from '@/lib/units'

/** Stacked labelled records: readable on mobile where a table would scroll sideways. */
export function ActivityList({ entries, onSelect }: { entries: readonly LedgerEntry[]; onSelect: (entry: LedgerEntry) => void }) {
  return (
    <ul className="divide-y divide-ink/10 rounded-card border border-ink/15 bg-ivory">
      {entries.map((entry) => (
        <li key={entry.id}>
          <button type="button" className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-sage/15" onClick={() => onSelect(entry)}>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{KIND_LABEL[entry.kind]}</span>
              <span className="t-small block text-ink/80">{fmtUnixDateTime(entry.timestamp)}</span>
            </span>
            {entry.amount !== undefined ? <span className="num font-semibold">{fmtUsdc(entry.amount)} USDC</span> : null}
            <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-ink/50" />
            <span className="sr-only">Open details</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function EntryDetail({ entry, onClose }: { entry: LedgerEntry | null; onClose: () => void }) {
  return (
    <Sheet open={entry !== null} onClose={onClose} title={entry ? KIND_LABEL[entry.kind] : ''} description="Recorded by the vault contract. This is an on-chain record.">
      {entry ? (
        <dl className="space-y-3">
          <Definition term="Operation ID">
            <span className="break-all">{entry.id}</span>
          </Definition>
          <Definition term="Time">{fmtUnixDateTime(entry.timestamp)}</Definition>
          {entry.amount !== undefined ? <Definition term="Amount">{fmtUsdc(entry.amount)} USDC</Definition> : null}
          {entry.account ? (
            <Definition term="Wallet">
              <AddressLink address={entry.account} full />
            </Definition>
          ) : null}
          {entry.cause ? (
            <Definition term="Cause / recipient">
              <AddressLink address={entry.cause} full />
            </Definition>
          ) : null}
          {entry.detail ? <Definition term="Detail">{entry.detail}</Definition> : null}
          <Definition term="Network">{CHAIN.name}</Definition>
          <Definition term="Block">{entry.blockNumber.toString()}</Definition>
          <Definition term="Transaction">
            <TxLink hash={entry.txHash} full />
          </Definition>
          <Definition term="Status">
            <ConfirmationChip state="confirmed" />
          </Definition>
        </dl>
      ) : null}
    </Sheet>
  )
}
