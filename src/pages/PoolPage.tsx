import { FileSearch, HandHeart, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader, SessionNotices, usePageTitle } from '@/components/layout/PageParts'
import { FlowRow } from '@/components/money/FlowRow'
import { AllocateSheet } from '@/components/money/AllocateSheet'
import { PoolFunding } from '@/components/pools/PoolFunding'
import { PoolGlyph } from '@/components/pools/PoolGlyph'
import { Callout } from '@/components/ui/Callout'
import { Chip, StatusChip, SyntheticChip } from '@/components/ui/StatusChip'
import { SectionHeading } from '@/components/ui/Misc'
import { COPY } from '@/data/copy'
import { EVIDENCE_STATES, POOL_BY_ID, isPoolId } from '@/data/pools'
import { fmtDateTime } from '@/lib/format'
import { fmtUsdc } from '@/lib/units'
import { useVault } from '@/state/VaultProvider'
import NotFoundPage from './NotFoundPage'

export default function PoolPage() {
  const { poolId } = useParams()
  if (!isPoolId(poolId)) return <NotFoundPage />
  return <PoolDetail poolId={poolId} />
}

function PoolDetail({ poolId }: { poolId: keyof typeof POOL_BY_ID }) {
  const pool = POOL_BY_ID[poolId]
  usePageTitle(pool.name)
  const { state, overview } = useVault()
  const [open, setOpen] = useState(false)
  const transfers = state.operations
    .filter((op) => op.type === 'settlement' && op.poolId === poolId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const eligible = overview.connected && overview.balances.availableProceeds > 0n && overview.dataStatus === 'ready' && !overview.wrongNetwork && !pool.paused

  return (
    <>
      <PageHeader
        back={{ to: '/impact', label: 'Impact explorer' }}
        title={pool.name}
        description={pool.purpose}
        actions={
          <button type="button" className="btn btn-primary" disabled={!eligible} onClick={() => setOpen(true)}>
            <HandHeart aria-hidden className="h-4 w-4" />
            Allocate to this pool
          </button>
        }
      />
      <div className="space-y-10">
        <SessionNotices />
        {!eligible ? (
          <Callout tone="info" title="Allocation is unavailable right now">
            {!overview.connected
              ? 'Connect a wallet to see whether you have eligible proceeds.'
              : 'No eligible sponsor-funded demo proceeds are credited to you at the moment.'}{' '}
            <Link to="/activity" className="font-medium underline underline-offset-4">
              See activity
            </Link>
          </Callout>
        ) : null}

        <section aria-labelledby="source-heading" className="grid gap-4 lg:grid-cols-2">
          <div className="card">
            <div className="mb-3 flex items-center gap-3">
              <PoolGlyph id={poolId} className="h-11 w-11" />
              <h2 id="source-heading" className="t-section">
                Source of funds
              </h2>
            </div>
            <p className="prose-reading text-ink/90">{pool.sourceOfFunds}</p>
            <p className="t-small mt-3 text-ink/80">{COPY.donationNote}</p>
          </div>
          <div className="card">
            <h2 className="t-section mb-3 flex items-center gap-2">
              <Settings2 aria-hidden className="h-5 w-5" />
              Recipient disclosure
            </h2>
            <div className="mb-3 flex flex-wrap gap-2">
              <Chip tone="neutral" icon={Settings2}>
                {pool.recipientStatus === 'configured-demo' ? 'Demo configuration' : 'Not configured'}
              </Chip>
              <Chip tone="neutral">{pool.recipientVersion}</Chip>
              <SyntheticChip />
            </div>
            <p className="t-small prose-reading text-ink/90">
              The recipient is a synthetic demo configuration. No real organization, partner logo, beneficiary count or endorsement is
              represented. If a recipient is not configured, approved and unpaused, settlement is disabled.
            </p>
          </div>
        </section>

        <section aria-labelledby="totals-heading">
          <SectionHeading id="totals-heading" title="Ledger totals" description="Four separate measures. Evidence is a status, not another balance." />
          <PoolFunding poolId={poolId} />
        </section>

        <section aria-labelledby="history-heading">
          <SectionHeading id="history-heading" title="Transfer history" />
          {transfers.length === 0 ? (
            <div className="rounded-card border border-dashed border-ink/30 bg-sage/10 p-6 text-center">
              <p className="font-semibold">No transfers to this pool yet</p>
              <p className="t-small mx-auto mt-1 max-w-md text-ink/80">Confirmed transfers appear here with their receipts.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {transfers.map((transfer) => (
                <li key={transfer.operationId} className="card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="num text-lg font-semibold">{fmtUsdc(transfer.amount)} USDC</p>
                    <div className="flex gap-1.5">
                      <SyntheticChip />
                      <StatusChip status={transfer.status} />
                    </div>
                  </div>
                  <p className="t-small text-ink/75">
                    {transfer.operationId} · {fmtDateTime(transfer.updatedAt)}
                  </p>
                  <FlowRow className="mt-3" from={transfer.from} to={transfer.to} />
                  {transfer.status === 'confirmed' ? <p className="t-small prose-reading mt-3 text-ink/90">{COPY.transferConfirmed}</p> : null}
                  <Link to={`/activity?op=${transfer.operationId}`} className="btn btn-secondary mt-3">
                    View details
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="evidence-heading">
          <SectionHeading id="evidence-heading" title="Evidence timeline" />
          <div className="card">
            <div className="flex items-center gap-3">
              <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/35">
                <FileSearch className="h-5 w-5 text-forest" />
              </span>
              <div>
                <p className="font-semibold">No evidence submitted yet</p>
                <p className="t-small text-ink/80">
                  A confirmed transfer proves a token movement to an address. It does not prove delivery of food or relief.
                </p>
              </div>
            </div>
            <h3 className="t-label mt-5">How evidence moves through review</h3>
            <ol className="mt-2 grid gap-2 md:grid-cols-2">
              {EVIDENCE_STATES.map((item) => (
                <li key={item.label} className="rounded-control border border-ink/10 bg-ivory px-3 py-2.5">
                  <p className="text-[15px] font-semibold">{item.label}</p>
                  <p className="t-small text-ink/80">{item.meaning}</p>
                </li>
              ))}
            </ol>
            <p className="t-small mt-4 text-ink/80">{COPY.evidenceAccepted}</p>
          </div>
        </section>

        <section aria-labelledby="limits-heading" className="card-soft">
          <SectionHeading id="limits-heading" title="Limitations" />
          <ul className="t-small grid max-w-reading list-disc gap-2 pl-5 text-ink/90">
            {pool.limitations.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
            <li>{COPY.riskLine}</li>
          </ul>
        </section>
      </div>
      <AllocateSheet open={open} onClose={() => setOpen(false)} initialPool={poolId} />
    </>
  )
}
