import { SyncError, PageHeader, usePageTitle, EmptyState } from '@/components/layout/PageParts'
import { Skeleton } from '@/components/ui/Misc'
import { CauseCard } from '@/components/vault/CauseCard'
import { useCauses } from '@/chain/useCauses'
import { COPY } from '@/data/copy'
import { HeartHandshake } from 'lucide-react'

export default function ImpactPage() {
  usePageTitle('Impact explorer')
  const { snapshot, rows, ledger } = useCauses()
  return (
    <>
      <PageHeader
        title="Impact explorer"
        description="Every cause below is an address the vault owner has approved on-chain. Yield can only be sent to these addresses."
      />
      {snapshot.status === 'error' ? <SyncError onRetry={snapshot.refetch} /> : null}
      {ledger.status === 'error' ? (
        <div className="mb-4">
          <SyncError onRetry={ledger.refetch} />
        </div>
      ) : null}
      {rows && rows.length === 0 ? (
        <EmptyState icon={<HeartHandshake className="h-6 w-6" />} title="No causes are approved yet">
          The vault owner has not approved a cause to receive yield.
        </EmptyState>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {rows ? rows.map((row) => <CauseCard key={row.info.address} cause={row.info} distributed={row.distributed} />) : [0, 1].map((n) => <Skeleton key={n} className="h-56" />)}
      </div>
      <p className="t-small prose-reading mt-6 text-ink/80">{COPY.transferNote}</p>
    </>
  )
}
