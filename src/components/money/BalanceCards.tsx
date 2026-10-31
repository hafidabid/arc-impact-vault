import { CloudOff, HandHeart, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ContourArt } from '@/components/art/ContourArt'
import { Chip, SponsorChip } from '@/components/ui/StatusChip'
import { Skeleton } from '@/components/ui/Misc'
import { SPONSOR_NOT_RETURN } from '@/data/copy'
import { fmtUsdc } from '@/lib/units'
import { useVault } from '@/state/VaultProvider'

/** Never shows zero for a balance that is still loading or failed to sync. */
function Figure({ value, tone = 'ink' }: { value: bigint; tone?: 'ink' | 'ivory' }) {
  const { overview } = useVault()
  if (overview.dataStatus === 'loading') {
    return <Skeleton className="mt-2 h-10 w-40" />
  }
  if (overview.dataStatus === 'sync-error') {
    return (
      <p className={`mt-1 flex items-center gap-2 text-lg font-semibold ${tone === 'ivory' ? 'text-ivory' : 'text-ink'}`}>
        <CloudOff aria-hidden className="h-5 w-5" /> Balance unavailable
      </p>
    )
  }
  return (
    <p className="t-balance mt-1">
      {fmtUsdc(value)} <span className="text-lg font-medium opacity-80 md:text-xl">USDC</span>
    </p>
  )
}

export function PrincipalCard() {
  const { overview } = useVault()
  const { balances } = overview
  const ready = overview.dataStatus === 'ready'
  return (
    <section
      aria-labelledby="principal-heading"
      className="relative overflow-hidden rounded-card bg-forest p-5 text-ivory shadow-lift md:p-6"
    >
      <ContourArt className="absolute -right-16 -top-16 h-72 w-72 opacity-40" stroke="#91AD9D" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="principal-heading" className="t-label text-ivory/90">
            Deposited principal
          </h2>
          <Chip tone="neutral" icon={Lock}>
            Your principal
          </Chip>
        </div>
        <Figure value={balances.principalPayable} tone="ivory" />
        {ready ? (
          <dl className="t-small mt-4 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-ivory/20 pt-3 text-ivory/90">
            <dt>Available to withdraw</dt>
            <dd className="num text-right font-medium text-ivory">{fmtUsdc(balances.availablePrincipal)} USDC</dd>
            <dt>Reserved for withdrawal</dt>
            <dd className="num text-right font-medium text-ivory">{fmtUsdc(balances.reservedWithdrawals)} USDC</dd>
            {balances.pendingDeposits > 0n ? (
              <>
                <dt>Deposit pending</dt>
                <dd className="num text-right font-medium text-ivory">{fmtUsdc(balances.pendingDeposits)} USDC</dd>
              </>
            ) : null}
          </dl>
        ) : null}
        <p className="t-small mt-3 text-ivory/80">Accounted for separately from sponsor-funded proceeds.</p>
      </div>
    </section>
  )
}

export function ProceedsCard({ onAllocate }: { onAllocate: () => void }) {
  const { overview } = useVault()
  const { balances, lotAttributed } = overview
  const canAllocate = overview.dataStatus === 'ready' && balances.availableProceeds > 0n && !overview.wrongNetwork

  return (
    <section aria-labelledby="proceeds-heading" className="card relative overflow-hidden pl-6 md:pl-8">
      <div aria-hidden className="pattern-sponsor absolute inset-y-0 left-0 w-3 bg-gold" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="proceeds-heading" className="t-label text-ink">
          Available sponsor-funded demo proceeds
        </h2>
        <SponsorChip />
      </div>

      {lotAttributed || overview.dataStatus !== 'ready' ? (
        <>
          <Figure value={balances.availableProceeds} />
          <p className="t-small mt-2 text-ink/85">{SPONSOR_NOT_RETURN}</p>
        </>
      ) : (
        <>
          <p className="mt-2 text-lg font-semibold">Not credited yet</p>
          <p className="t-small prose-reading mt-1 text-ink/85">
            A deposit does not create sponsor proceeds. They appear here only after a sponsor funds a lot and it is assigned to your
            position. Both are separate, confirmed events subject to eligibility.
          </p>
        </>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={onAllocate} disabled={!canAllocate}>
          <HandHeart aria-hidden className="h-4 w-4" />
          Allocate proceeds
        </button>
        {!canAllocate && overview.dataStatus === 'ready' ? (
          <p className="t-small min-w-0 flex-1 text-ink/80" id="allocate-why">
            {overview.wrongNetwork
              ? 'Switch to the configured network to allocate.'
              : 'Allocation is unavailable because no eligible proceeds are credited right now.'}{' '}
            <Link to="/activity" className="font-medium text-forest underline underline-offset-4">
              See activity
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  )
}

export function DonationTotals() {
  const { overview } = useVault()
  const { balances } = overview
  const awaiting = Object.values(balances.allocatedAwaitingTransfer).reduce((a, b) => a + b, 0n)
  const confirmed = Object.values(balances.confirmedDonations).reduce((a, b) => a + b, 0n)
  const ready = overview.dataStatus === 'ready'

  const stat = (label: string, value: bigint, help: string, pattern: boolean) => (
    <div className="min-w-0 flex-1 rounded-control border border-ink/10 bg-ivory p-4">
      <div className="flex items-center gap-2">
        <span aria-hidden className={`h-3 w-3 shrink-0 rounded-sm border border-ink/40 ${pattern ? 'pattern-sponsor bg-gold' : 'bg-forest'}`} />
        <h3 className="t-label">{label}</h3>
      </div>
      {ready ? (
        <p className="num mt-2 text-2xl font-semibold tracking-tight">
          {fmtUsdc(value)} <span className="text-base font-medium text-ink/75">USDC</span>
        </p>
      ) : overview.dataStatus === 'loading' ? (
        <Skeleton className="mt-3 h-7 w-28" />
      ) : (
        <p className="mt-2 flex items-center gap-2 font-semibold">
          <CloudOff aria-hidden className="h-4 w-4" /> Unavailable
        </p>
      )}
      <p className="t-small mt-1.5 text-ink/80">{help}</p>
    </div>
  )

  return (
    <section aria-labelledby="donations-heading" className="card">
      <h2 id="donations-heading" className="t-label text-ink">
        Donations from sponsor-funded proceeds
      </h2>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        {stat('Allocated, awaiting transfer', awaiting, 'Reserved for a pool. Not yet confirmed as transferred.', true)}
        {stat('Confirmed donated', confirmed, 'Counted once, from confirmed transfers only.', false)}
      </div>
    </section>
  )
}
