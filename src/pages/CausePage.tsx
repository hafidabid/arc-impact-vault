import { isAddress } from 'viem'
import { useParams } from 'react-router-dom'
import type { LedgerEntry } from '@/chain/logs'
import { useCauses } from '@/chain/useCauses'
import { AddressLink } from '@/components/chain/AddressLink'
import { EmptyState, PageHeader, SyncError, usePageTitle } from '@/components/layout/PageParts'
import { Callout } from '@/components/ui/Callout'
import { Definition, SectionHeading, Skeleton } from '@/components/ui/Misc'
import { Chip } from '@/components/ui/StatusChip'
import { ActivityList, EntryDetail } from '@/components/vault/ActivityList'
import { COPY } from '@/data/copy'
import { fmtUsdc } from '@/lib/units'
import { useState } from 'react'
import NotFoundPage from './NotFoundPage'

export default function CausePage() {
  const { causeAddress = '' } = useParams()
  const { snapshot, ledger, rows } = useCauses()
  const row = rows?.find((item) => item.info.address.toLowerCase() === causeAddress.toLowerCase())
  usePageTitle(row?.info.name ?? 'Cause')
  const [selected, setSelected] = useState<LedgerEntry | null>(null)

  if (!isAddress(causeAddress)) return <NotFoundPage />
  if (snapshot.status === 'error') return <SyncError onRetry={snapshot.refetch} />
  if (!rows) return <Skeleton className="h-64" />
  if (!row) {
    return (
      <EmptyState title="This address is not an approved cause">
        It has not been approved by the vault owner, or its approval has been withdrawn. Past donations remain on record.
      </EmptyState>
    )
  }

  const history: LedgerEntry[] =
    ledger.status === 'ready'
      ? ledger.data.filter((entry) => entry.cause?.toLowerCase() === row.info.address.toLowerCase() && (entry.kind === 'yield-distribution' || entry.kind === 'cause-added' || entry.kind === 'cause-removed'))
      : []

  return (
    <>
      <PageHeader title={row.info.name} back={{ to: '/impact', label: 'All causes' }} description={row.info.purpose} actions={row.info.isFallback ? <Chip tone="accent">Default cause</Chip> : null} />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="card" aria-labelledby="totals">
          <h2 id="totals" className="t-section">
            Total yield received
          </h2>
          <p className="t-balance mt-3">
            {row.distributed === undefined ? <Skeleton className="h-10 w-40" /> : <>{fmtUsdc(row.distributed)} <span className="text-lg font-medium text-ink/75">USDC</span></>}
          </p>
          <p className="t-small mt-2 text-ink/80">The total of every donation from the vault to this cause, as recorded on-chain.</p>
          <dl className="mt-5 space-y-3 border-t border-ink/10 pt-4">
            <Definition term="Recipient address">
              <AddressLink address={row.info.address} full />
            </Definition>
            <Definition term="Funded by">Yield earned by the vault. Depositor principal is never used.</Definition>
            <Definition term="Status">{row.info.labelled ? 'Approved cause' : 'Approved cause · profile pending'}</Definition>
          </dl>
        </section>
        <Callout tone="info" title="Accountability">
          {COPY.transferNote} Approval reflects the vault owner’s on-chain decision and is not a third-party accreditation.
        </Callout>
      </div>
      <section className="mt-10" aria-labelledby="history">
        <SectionHeading id="history" title="Donation history" description="Donations to this cause and changes to its approval." />
        {ledger.status === 'loading' ? <Skeleton className="h-32" /> : null}
        {ledger.status === 'error' ? <SyncError onRetry={ledger.refetch} /> : null}
        {ledger.status === 'ready' && history.length === 0 ? <EmptyState title="No donations yet">This cause has not received a donation from the vault yet.</EmptyState> : null}
        {history.length > 0 ? <ActivityList entries={history} onSelect={setSelected} /> : null}
      </section>
      <EntryDetail entry={selected} onClose={() => setSelected(null)} />
    </>
  )
}
