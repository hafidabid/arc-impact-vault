import { useMemo, useState } from 'react'
import { KIND_LABEL } from '@/chain/logs'
import type { LedgerEntry, LedgerKind } from '@/chain/logs'
import { useSession, useVaultLedger } from '@/chain/hooks'
import { ConnectGate, EmptyState, PageHeader, SyncError, usePageTitle } from '@/components/layout/PageParts'
import { Skeleton } from '@/components/ui/Misc'
import { ActivityList, EntryDetail } from '@/components/vault/ActivityList'

const PERSONAL: LedgerKind[] = ['deposit', 'withdrawal', 'in-kind-withdrawal']
const ALL_TYPES = [...PERSONAL, 'yield-distribution'] as const

function dayStartSeconds(value: string, endOfDay: boolean): number | undefined {
  if (!value) return undefined
  const base = Date.parse(`${value}T00:00:00Z`) / 1000
  return endOfDay ? base + 86_399 : base
}

function ActivityView() {
  const session = useSession()
  const ledger = useVaultLedger()
  const [type, setType] = useState<'all' | LedgerKind>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selected, setSelected] = useState<LedgerEntry | null>(null)

  const entries = useMemo(() => {
    if (ledger.status !== 'ready') return []
    const start = dayStartSeconds(from, false)
    const end = dayStartSeconds(to, true)
    return ledger.data.filter((entry) => {
      const mine = entry.account?.toLowerCase() === session.address?.toLowerCase() && PERSONAL.includes(entry.kind)
      const vaultWide = entry.kind === 'yield-distribution'
      if (!mine && !vaultWide) return false
      if (type !== 'all' && entry.kind !== type) return false
      if (start !== undefined && entry.timestamp < start) return false
      if (end !== undefined && entry.timestamp > end) return false
      return true
    })
  }, [ledger, session.address, type, from, to])

  return (
    <>
      <form className="card mb-6 grid gap-4 sm:grid-cols-3" onSubmit={(event) => event.preventDefault()} aria-label="Filter activity">
        <div>
          <label htmlFor="f-type" className="field-label">
            Event type
          </label>
          <select id="f-type" className="input" value={type} onChange={(event) => setType(event.target.value as 'all' | LedgerKind)}>
            <option value="all">All events</option>
            {ALL_TYPES.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABEL[kind]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-from" className="field-label">
            From (UTC)
          </label>
          <input id="f-from" type="date" className="input" value={from} onChange={(event) => setFrom(event.target.value)} />
        </div>
        <div>
          <label htmlFor="f-to" className="field-label">
            To (UTC)
          </label>
          <input id="f-to" type="date" className="input" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
      </form>

      {ledger.status === 'loading' ? <Skeleton className="h-40" /> : null}
      {ledger.status === 'error' ? <SyncError onRetry={ledger.refetch} /> : null}
      {ledger.status === 'ready' && entries.length === 0 ? (
        <EmptyState title="No activity to show">
          Deposits and withdrawals from your connected wallet appear here, along with the vault&apos;s yield transfers to causes.
        </EmptyState>
      ) : null}
      {entries.length > 0 ? (
        <>
          <p className="t-small mb-2 text-ink/80" aria-live="polite">
            {entries.length} {entries.length === 1 ? 'event' : 'events'}. On-chain records, newest first.
          </p>
          <ActivityList entries={entries} onSelect={setSelected} />
        </>
      ) : null}
      <EntryDetail entry={selected} onClose={() => setSelected(null)} />
    </>
  )
}

export default function ActivityPage() {
  usePageTitle('Activity')
  return (
    <>
      <PageHeader title="Activity" description="Your deposits and withdrawals, and the yield the vault has sent to causes." />
      <ConnectGate purpose="Connect a wallet to see your activity.">
        <ActivityView />
      </ConnectGate>
    </>
  )
}
