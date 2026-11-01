import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { KIND_LABEL } from '@/chain/logs'
import type { LedgerEntry, LedgerKind } from '@/chain/logs'
import { useVaultLedger } from '@/chain/hooks'
import { AddressLink, TxLink } from '@/components/chain/AddressLink'
import { AdminGate } from '@/components/layout/AdminGate'
import { EmptyState, PageHeader, SyncError, usePageTitle } from '@/components/layout/PageParts'
import { Skeleton } from '@/components/ui/Misc'
import { ConfirmationChip } from '@/components/ui/StatusChip'
import { ActivityList, EntryDetail } from '@/components/vault/ActivityList'
import { ledgerToCsv } from '@/lib/csv'
import { fmtUnixDateTime } from '@/lib/format'
import { fmtUsdc } from '@/lib/units'

function Ledger() {
  const ledger = useVaultLedger()
  const [type, setType] = useState<'all' | LedgerKind>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<LedgerEntry | null>(null)

  const entries = useMemo(() => {
    if (ledger.status !== 'ready') return []
    const q = query.trim().toLowerCase()
    return ledger.data.filter((entry) => {
      if (type !== 'all' && entry.kind !== type) return false
      if (!q) return true
      return [entry.id, entry.txHash, entry.account, entry.cause].some((field) => field?.toLowerCase().includes(q))
    })
  }, [ledger, type, query])

  const exportCsv = () => {
    const blob = new Blob([ledgerToCsv(entries)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'impactvault-ledger.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <form className="card mb-6 grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end" onSubmit={(event) => event.preventDefault()} aria-label="Filter ledger">
        <div>
          <label className="field-label" htmlFor="l-type">
            Event type
          </label>
          <select id="l-type" className="input" value={type} onChange={(event) => setType(event.target.value as 'all' | LedgerKind)}>
            <option value="all">All events</option>
            {(Object.keys(KIND_LABEL) as LedgerKind[]).map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABEL[kind]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="l-q">
            Wallet, cause, operation ID or transaction
          </label>
          <input id="l-q" className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="0x…" autoComplete="off" />
        </div>
        <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={entries.length === 0}>
          <Download aria-hidden className="h-4 w-4" />
          Export CSV
        </button>
      </form>

      {ledger.status === 'loading' ? <Skeleton className="h-48" /> : null}
      {ledger.status === 'error' ? <SyncError onRetry={ledger.refetch} /> : null}
      {ledger.status === 'ready' && entries.length === 0 ? <EmptyState title="No matching events">Nothing in the vault&apos;s event log matches these filters.</EmptyState> : null}

      {entries.length > 0 ? (
        <>
          <p className="t-small mb-2 text-ink/80" aria-live="polite">
            {entries.length} {entries.length === 1 ? 'event' : 'events'}. CSV export includes network and unit labels.
          </p>
          <div className="md:hidden">
            <ActivityList entries={entries} onSelect={setSelected} />
          </div>
          <div className="hidden overflow-x-auto rounded-card border border-ink/15 md:block">
            <table className="w-full min-w-[900px] text-left text-[15px]">
              <caption className="sr-only">Vault fund-flow ledger, newest first</caption>
              <thead className="bg-sage/20 text-sm">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Time (UTC)</th>
                  <th scope="col" className="px-4 py-3 font-medium">Type</th>
                  <th scope="col" className="px-4 py-3 font-medium">Wallet / cause</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Amount (USDC)</th>
                  <th scope="col" className="px-4 py-3 font-medium">State</th>
                  <th scope="col" className="px-4 py-3 font-medium">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {entries.map((entry) => (
                  <tr key={entry.id} className="align-top hover:bg-sage/10">
                    <td className="num px-4 py-3">
                      <button type="button" className="min-h-[44px] text-left font-medium text-forest underline underline-offset-4" onClick={() => setSelected(entry)}>
                        {fmtUnixDateTime(entry.timestamp)}
                        <span className="sr-only"> open details</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">{KIND_LABEL[entry.kind]}</td>
                    <td className="px-4 py-3">{entry.cause ?? entry.account ? <AddressLink address={(entry.cause ?? entry.account) as string} /> : '—'}</td>
                    <td className="num px-4 py-3 text-right">{entry.amount !== undefined ? fmtUsdc(entry.amount) : '—'}</td>
                    <td className="px-4 py-3">
                      <ConfirmationChip state="confirmed" />
                    </td>
                    <td className="px-4 py-3">
                      <TxLink hash={entry.txHash} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
      <EntryDetail entry={selected} onClose={() => setSelected(null)} />
    </>
  )
}

export default function AdminLedgerPage() {
  usePageTitle('Admin ledger')
  return (
    <>
      <PageHeader eyebrow="Admin" title="Fund-flow ledger" description="Every event emitted by the vault contract. Entries are append-only on-chain and cannot be edited." />
      <AdminGate>{() => <Ledger />}</AdminGate>
    </>
  )
}
