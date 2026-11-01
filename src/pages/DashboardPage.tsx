import { ArrowDownToLine, ArrowUpFromLine, ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'
import { canClaim, canDeposit, PHASE_LABEL, vaultPhase } from '@/chain/derive'
import { useAccountData, useNow, useSession, useVaultLedger, useVaultSnapshot } from '@/chain/hooks'
import { ConnectGate, EmptyState, PageHeader, SessionNotices, SyncError, usePageTitle } from '@/components/layout/PageParts'
import { Callout } from '@/components/ui/Callout'
import { SectionHeading, Skeleton } from '@/components/ui/Misc'
import { PhaseChip } from '@/components/ui/StatusChip'
import { ActivityList, EntryDetail } from '@/components/vault/ActivityList'
import { BalanceCard } from '@/components/vault/BalanceCard'
import { Timeline } from '@/components/vault/Timeline'
import { COPY } from '@/data/copy'
import { fmtUsdc } from '@/lib/units'
import type { LedgerEntry } from '@/chain/logs'
import { useState } from 'react'

/** Share of vault principal in percent with two decimals, using integer maths only. */
function shareOfVault(principal: bigint, total: bigint): string {
  if (total === 0n) return '0.00'
  const hundredths = (principal * 10_000n) / total
  return `${hundredths / 100n}.${(hundredths % 100n).toString().padStart(2, '0')}`
}

function Dashboard() {
  const account = useAccountData()
  const snapshot = useVaultSnapshot()
  const ledger = useVaultLedger()
  const session = useSession()
  const now = useNow()
  const [selected, setSelected] = useState<LedgerEntry | null>(null)

  const vault = snapshot.status === 'ready' ? snapshot.data : undefined
  const phase = vault ? vaultPhase(vault, now) : undefined
  const principal = account.status === 'ready' ? account.data.principal : undefined
  const mine = ledger.status === 'ready' ? ledger.data.filter((entry) => entry.account?.toLowerCase() === session.address?.toLowerCase() && (entry.kind === 'deposit' || entry.kind === 'withdrawal' || entry.kind === 'in-kind-withdrawal')) : []

  return (
    <>
      <PageHeader title="Your vault" description="Your principal and the vault it sits in, read live from the contract." />
      <div className="mb-6 space-y-3">
        <SessionNotices />
        {account.status === 'error' ? <SyncError onRetry={account.refetch} /> : null}
        {snapshot.status === 'error' ? <SyncError onRetry={snapshot.refetch} /> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BalanceCard
          tone="primary"
          label="Deposited principal"
          value={principal}
          note={principal !== undefined && vault ? `${shareOfVault(principal, vault.totalPrincipal)}% of the vault's principal. Not insured or guaranteed.` : undefined}
        />
        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <p className="t-label text-ink/80">Vault status</p>
            {phase ? <PhaseChip phase={phase} /> : null}
          </div>
          <div className="mt-3">{vault ? <Timeline vault={vault} now={now} /> : <Skeleton className="h-40" />}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <BalanceCard
          label={vault?.isSettled ? 'Vault yield realised' : 'Vault yield so far (estimate)'}
          value={vault ? (vault.isSettled ? vault.yieldPool : vault.projectedYield) : undefined}
          note={COPY.yieldNote}
        />
        <section className="card" aria-label="Actions">
          <p className="t-label text-ink/80">Actions</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {phase && !canDeposit(phase) ? (
              // A real disabled button, so the announced state, the visual state and the behaviour agree.
              <button type="button" className="btn btn-primary" disabled>
                <ArrowDownToLine aria-hidden className="h-4 w-4" />
                Deposit
              </button>
            ) : (
              <Link to="/deposit" className="btn btn-primary">
                <ArrowDownToLine aria-hidden className="h-4 w-4" />
                Deposit
              </Link>
            )}
            <Link to="/withdraw" className="btn btn-secondary">
              <ArrowUpFromLine aria-hidden className="h-4 w-4" />
              Withdraw
            </Link>
          </div>
          <p className="t-small mt-3 text-ink/80">
            {!phase
              ? ''
              : canDeposit(phase)
                ? 'Deposits are open.'
                : canClaim(phase)
                  ? 'You can claim your principal.'
                  : `${PHASE_LABEL[phase]}. See the status for dates.`}
          </p>
        </section>
      </div>

      {principal === 0n && vault && phase && canDeposit(phase) ? (
        <div className="mt-6">
          <Callout tone="info" title="You have not deposited yet">
            Deposit USDC to start. Your principal comes back at maturity; the yield the vault earns goes to approved causes.
          </Callout>
        </div>
      ) : null}

      <section className="mt-10" aria-labelledby="recent">
        <SectionHeading
          id="recent"
          title="Recent activity"
          action={
            <Link to="/activity" className="btn btn-ghost">
              <ListChecks aria-hidden className="h-4 w-4" />
              All activity
            </Link>
          }
        />
        {ledger.status === 'loading' ? <Skeleton className="h-24" /> : null}
        {ledger.status === 'error' ? <SyncError onRetry={ledger.refetch} /> : null}
        {ledger.status === 'ready' && mine.length === 0 ? <EmptyState title="No activity yet">Deposits and withdrawals from this wallet appear here.</EmptyState> : null}
        {mine.length > 0 ? <ActivityList entries={mine.slice(0, 5)} onSelect={setSelected} /> : null}
      </section>
      <EntryDetail entry={selected} onClose={() => setSelected(null)} />
      <span className="sr-only">{principal !== undefined ? `Principal ${fmtUsdc(principal)} USDC` : ''}</span>
    </>
  )
}

export default function DashboardPage() {
  usePageTitle('Dashboard')
  return (
    <ConnectGate purpose="Connect a wallet to see your deposited principal and activity.">
      <Dashboard />
    </ConnectGate>
  )
}
