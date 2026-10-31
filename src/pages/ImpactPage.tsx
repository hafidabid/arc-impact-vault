import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AllocateSheet } from '@/components/money/AllocateSheet'
import { PageHeader, SessionNotices, usePageTitle } from '@/components/layout/PageParts'
import { PoolCard } from '@/components/pools/PoolCard'
import { SectionHeading } from '@/components/ui/Misc'
import { POOLS } from '@/data/pools'
import type { PoolId } from '@/lib/types'

const DEFINITIONS = [
  ['Available to allocate', 'Eligible sponsor-funded demo proceeds credited to you that you have not yet directed to a pool.'],
  ['Allocated awaiting transfer', 'Proceeds reserved for a pool whose transfer is not yet confirmed. They cannot be allocated again.'],
  ['Transferred', 'Confirmed token transfers to a pool recipient. A transfer proves a token movement to an address, not delivery of relief.'],
  ['Evidence reviewed', 'A count of evidence submissions accepted for display. It is a status, never a balance.'],
] as const

export default function ImpactPage() {
  usePageTitle('Impact explorer')
  const [allocatePool, setAllocatePool] = useState<PoolId | null>(null)
  const [open, setOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="Impact explorer"
        description="Two pools receive sponsor-funded demo proceeds. Pool names describe intended purposes; they do not establish charity verification, actual beneficiaries or completed impact."
      />
      <div className="space-y-6">
        <SessionNotices />
        <div className="grid gap-4 md:grid-cols-2">
          {POOLS.map((pool) => (
            <PoolCard
              key={pool.id}
              poolId={pool.id}
              onAllocate={(id) => {
                setAllocatePool(id)
                setOpen(true)
              }}
            />
          ))}
        </div>

        <section aria-labelledby="definitions-heading" className="card-soft">
          <SectionHeading id="definitions-heading" title="What the totals mean" />
          <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            {DEFINITIONS.map(([term, meaning]) => (
              <div key={term}>
                <dt className="font-semibold text-forest">{term}</dt>
                <dd className="t-small prose-reading mt-0.5 text-ink/85">{meaning}</dd>
              </div>
            ))}
          </dl>
          <p className="t-small mt-5 text-ink/80">
            Totals come from a synthetic demo ledger. Your own movements are listed in{' '}
            <Link to="/activity" className="font-medium text-forest underline underline-offset-4">
              activity
            </Link>
            .
          </p>
        </section>
      </div>
      <AllocateSheet open={open} onClose={() => setOpen(false)} initialPool={allocatePool} />
    </>
  )
}
