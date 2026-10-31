import { ArrowDownToLine, ArrowUpFromLine, FileSearch, FlaskConical, Heart, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { OperationDetail } from '@/components/activity/OperationDetail'
import { OperationRow } from '@/components/activity/OperationRow'
import { ConnectGate, PageHeader, SessionNotices, usePageTitle } from '@/components/layout/PageParts'
import { AllocateSheet } from '@/components/money/AllocateSheet'
import { DonationTotals, PrincipalCard, ProceedsCard } from '@/components/money/BalanceCards'
import { Callout } from '@/components/ui/Callout'
import { SectionHeading, Skeleton } from '@/components/ui/Misc'
import { COPY } from '@/data/copy'
import { poolName } from '@/data/pools'
import { useVault } from '@/state/VaultProvider'

function DemoSponsorStep() {
  const { overview, client } = useVault()
  const [busy, setBusy] = useState<'fund' | 'attribute' | null>(null)
  if (!overview.hasPosition || overview.lotAttributed) return null
  return (
    <section aria-labelledby="demo-sponsor-heading" className="rounded-card border border-dashed border-ink/40 bg-gold/20 p-4 md:p-5">
      <h2 id="demo-sponsor-heading" className="flex items-center gap-2 font-semibold">
        <FlaskConical aria-hidden className="h-5 w-5" />
        Demo step: sponsor funding and attribution
      </h2>
      <p className="t-small prose-reading mt-1 text-ink/90">
        Your deposit is confirmed and creates no sponsor credit by itself. In a live setup an operator records these two separate events. Run
        them here to continue the worked example.
      </p>
      <ol className="mt-3 flex flex-col gap-2 sm:flex-row">
        <li>
          <button
            type="button"
            className="btn btn-secondary w-full"
            disabled={overview.lotFunded || busy !== null}
            onClick={() => {
              setBusy('fund')
              void client.fundDemoSponsorLot().then(() => setBusy(null))
            }}
          >
            {busy === 'fund' ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
            1. Sponsor funds a 0.20 USDC lot
          </button>
        </li>
        <li>
          <button
            type="button"
            className="btn btn-secondary w-full"
            disabled={!overview.lotFunded || busy !== null}
            onClick={() => {
              setBusy('attribute')
              void client.attributeDemoSponsorLot().then(() => setBusy(null))
            }}
          >
            {busy === 'attribute' ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
            2. Assign the lot to your position
          </button>
        </li>
      </ol>
    </section>
  )
}

export default function DashboardPage() {
  usePageTitle('Dashboard')
  const { state, overview } = useVault()
  const [allocateOpen, setAllocateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const detail = state.operations.find((op) => op.operationId === detailId) ?? null
  const preference = state.poolPreference

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your principal, sponsor-funded proceeds and donations, each shown on its own."
        actions={
          <>
            <Link to="/deposit" className="btn btn-primary">
              <ArrowDownToLine aria-hidden className="h-4 w-4" />
              Deposit
            </Link>
            <Link to="/withdraw" className="btn btn-secondary">
              <ArrowUpFromLine aria-hidden className="h-4 w-4" />
              Withdraw
            </Link>
          </>
        }
      />
      <ConnectGate purpose="Your dashboard shows your own principal, proceeds and receipts.">
        <div className="space-y-6">
          <SessionNotices />
          {overview.inFlight.length > 0 ? (
            <Callout
              tone="info"
              title={`${overview.inFlight.length} operation${overview.inFlight.length > 1 ? 's' : ''} pending`}
              action={
                <Link to="/activity?status=pending" className="btn btn-secondary">
                  Review pending activity
                </Link>
              }
            >
              Pending amounts are reserved and cannot be spent twice. Balances update only after confirmation.
            </Callout>
          ) : null}

          {overview.dataStatus === 'ready' && !overview.hasPosition && overview.recent.length === 0 ? (
            <Callout
              tone="info"
              title="No deposit yet"
              action={
                <Link to="/deposit" className="btn btn-primary">
                  Make a deposit
                </Link>
              }
            >
              Your principal appears here after a deposit is confirmed. Sponsor proceeds are never created by a deposit.
            </Callout>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
            <div className="space-y-6">
              <PrincipalCard />
              <ProceedsCard onAllocate={() => setAllocateOpen(true)} />
              <DonationTotals />
              <DemoSponsorStep />
            </div>

            <div className="space-y-6">
              <section aria-labelledby="pref-heading" className="card">
                <h2 id="pref-heading" className="t-label flex items-center gap-2">
                  <Heart aria-hidden className="h-4 w-4 text-forest" />
                  Pool preference
                </h2>
                <p className="mt-2 text-lg font-semibold">{preference ? poolName(preference) : 'No preference set'}</p>
                <p className="t-small mt-1 text-ink/80">A preference does not authorize a transfer. Each allocation is reviewed separately.</p>
                <Link to="/account#preferences" className="btn btn-secondary mt-3">
                  Change preference
                </Link>
              </section>

              <section aria-labelledby="recent-heading" className="card !p-3 md:!p-4">
                <div className="px-2 pt-1">
                  <SectionHeading
                    id="recent-heading"
                    title="Recent activity"
                    action={
                      <Link to="/activity" className="t-small min-h-[44px] content-center font-medium text-forest underline underline-offset-4">
                        View all
                      </Link>
                    }
                  />
                </div>
                {overview.dataStatus === 'loading' ? (
                  <div className="space-y-3 p-2">
                    <Skeleton className="h-14" />
                    <Skeleton className="h-14" />
                  </div>
                ) : overview.dataStatus === 'sync-error' ? (
                  <p className="t-small px-3 pb-3 text-ink/80">Recent activity could not be loaded. It is not empty: it simply has not synced.</p>
                ) : overview.recent.length === 0 ? (
                  <p className="t-small px-3 pb-3 text-ink/80">Connected-wallet activity appears here.</p>
                ) : (
                  <ul className="divide-y divide-ink/10">
                    {overview.recent.map((op) => (
                      <OperationRow key={op.operationId} operation={op} onOpen={(op) => setDetailId(op.operationId)} />
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="evidence-updates" className="card">
                <h2 id="evidence-updates" className="t-label flex items-center gap-2">
                  <FileSearch aria-hidden className="h-4 w-4 text-forest" />
                  Evidence updates
                </h2>
                <p className="mt-2 font-semibold">No evidence submitted yet</p>
                <p className="t-small mt-1 text-ink/80">{COPY.evidenceAccepted}</p>
              </section>
            </div>
          </div>
          <p className="t-small max-w-reading text-ink/75">{COPY.riskLine}</p>
        </div>
      </ConnectGate>
      <AllocateSheet open={allocateOpen} onClose={() => setAllocateOpen(false)} />
      <OperationDetail operation={detail} onClose={() => setDetailId(null)} />
    </>
  )
}
