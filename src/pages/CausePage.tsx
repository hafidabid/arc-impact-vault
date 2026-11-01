import { isAddress } from 'viem'
import { useParams } from 'react-router-dom'
import { KIND_LABEL } from '@/chain/logs'
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
        It is either not approved by the vault owner, or it has been removed. Removing a cause does not change past transfers.
      </EmptyState>
    )
  }

  const history: LedgerEntry[] =
    ledger.status === 'ready'
      ? ledger.data.filter((entry) => entry.cause?.toLowerCase() === row.info.address.toLowerCase() && (entry.kind === 'yield-distribution' || entry.kind === 'cause-added' || entry.kind === 'cause-removed'))
      : []

  return (
    <>
      <PageHeader title={row.info.name} back={{ to: '/impact', label: 'All causes' }} description={row.info.purpose} actions={row.info.isFallback ? <Chip tone="accent">Fallback cause</Chip> : null} />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="card" aria-labelledby="totals">
          <h2 id="totals" className="t-section">
            Yield transferred
          </h2>
          <p className="t-balance mt-3">
            {row.distributed === undefined ? <Skeleton className="h-10 w-40" /> : <>{fmtUsdc(row.distributed)} <span className="text-lg font-medium text-ink/75">USDC</span></>}
          </p>
          <p className="t-small mt-2 text-ink/80">Sum of YieldDistributed events to this address. It records token movement only.</p>
          <dl className="mt-5 space-y-3 border-t border-ink/10 pt-4">
            <Definition term="Recipient address">
              <AddressLink address={row.info.address} full />
            </Definition>
            <Definition term="Source of funds">Realised vault yield, never depositor principal</Definition>
            <Definition term="Label status">{row.info.labelled ? 'Name and purpose published by ImpactVault' : 'No name published for this address'}</Definition>
          </dl>
        </section>
        <Callout tone="info" title="What this page does and does not show">
          {COPY.transferNote} ImpactVault does not verify the recipient, its beneficiaries or its delivery of relief, and a cause name is not an accreditation.
        </Callout>
      </div>
      <section className="mt-10" aria-labelledby="history">
        <SectionHeading id="history" title="Transfer history" description={`${KIND_LABEL['yield-distribution']}s and approval changes for this address.`} />
        {ledger.status === 'loading' ? <Skeleton className="h-32" /> : null}
        {ledger.status === 'error' ? <SyncError onRetry={ledger.refetch} /> : null}
        {ledger.status === 'ready' && history.length === 0 ? <EmptyState title="No transfers yet">Yield has not been sent to this cause.</EmptyState> : null}
        {history.length > 0 ? <ActivityList entries={history} onSelect={setSelected} /> : null}
      </section>
      <EntryDetail entry={selected} onClose={() => setSelected(null)} />
    </>
  )
}
