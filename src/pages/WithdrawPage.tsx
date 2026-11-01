import { Lock } from 'lucide-react'
import { vaultAbi } from '@/chain/abi'
import { CHAIN, VAULT_ADDRESS } from '@/chain/config'
import { canClaim, PHASE_LABEL, settledPayout, vaultPhase } from '@/chain/derive'
import { useAccountData, useFeeEstimate, useGasBalance, useNow, useSession, useTransaction, useVaultSnapshot } from '@/chain/hooks'
import { AddressLink } from '@/components/chain/AddressLink'
import { TxPanel } from '@/components/chain/TxPanel'
import { ConnectGate, EmptyState, PageHeader, SessionNotices, SyncError, usePageTitle } from '@/components/layout/PageParts'
import { Callout } from '@/components/ui/Callout'
import { Definition, Skeleton } from '@/components/ui/Misc'
import { Timeline } from '@/components/vault/Timeline'
import { BalanceCard } from '@/components/vault/BalanceCard'
import { fmtDuration, fmtUnixDateTime } from '@/lib/format'
import { fmtUsdc } from '@/lib/units'

const CLAIM_GAS = 700_000n

function WithdrawForm() {
  const session = useSession()
  const account = useAccountData()
  const snapshot = useVaultSnapshot()
  const now = useNow()
  const gas = useGasBalance()
  const fee = useFeeEstimate(CLAIM_GAS)
  const claim = useTransaction('claim')

  if (snapshot.status === 'error') return <SyncError onRetry={snapshot.refetch} />
  if (account.status === 'error') return <SyncError onRetry={account.refetch} />
  if (snapshot.status !== 'ready' || account.status !== 'ready') return <Skeleton className="h-64" />

  const vault = snapshot.data
  const { principal } = account.data
  const phase = vaultPhase(vault, now)
  const inKind = phase === 'in-kind'
  const claimable = canClaim(phase) || inKind
  const expected = vault.isSettled ? settledPayout(principal, vault.settledAssets, vault.totalPrincipal) : undefined
  const shortfall = expected !== undefined && expected < principal
  const feeShort = gas !== undefined && fee !== undefined && gas < fee
  const justClaimed = claim.tx.stage === 'confirmed'

  if (principal === 0n && !justClaimed) {
    return (
      <EmptyState title="No principal to withdraw">
        This wallet has no principal in the vault. If you have already withdrawn, the transaction is listed in your activity.
      </EmptyState>
    )
  }

  const submit = () =>
    claim.send(inKind ? 'In-kind withdrawal' : 'Principal withdrawal', {
      address: VAULT_ADDRESS,
      abi: vaultAbi,
      functionName: inKind ? 'emergencyWithdrawInKind' : 'withdraw',
      chainId: CHAIN.id,
    })

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-4">
        <BalanceCard label="Your deposited principal" value={principal} />
        {!claimable ? (
          <Callout live tone="info" title={`${PHASE_LABEL[phase]}: not claimable yet`}>
            <span className="inline-flex items-center gap-2">
              <Lock aria-hidden className="h-4 w-4" />
              {phase === 'open' || phase === 'paused' || phase === 'locked'
                ? `Principal unlocks at maturity, ${fmtUnixDateTime(vault.maturity)} (in ${fmtDuration(vault.maturity - now)}).`
                : 'Principal is not claimable right now.'}
            </span>
          </Callout>
        ) : (
          <section className="card space-y-4" aria-label="Withdraw principal">
            <dl className="space-y-3">
              <Definition term={inKind ? 'You receive' : 'You can claim'}>
                {inKind ? 'A pro rata share of the vault’s strategy shares' : expected !== undefined ? `${fmtUsdc(expected)} USDC` : `Up to ${fmtUsdc(principal)} USDC`}
              </Definition>
              <Definition term="Destination">
                {session.address ? <AddressLink address={session.address} full /> : null} (your connected wallet)
              </Definition>
              <Definition term="Network">{CHAIN.name}</Definition>
              <Definition term="Estimated network fee">{fee === undefined ? 'Estimating…' : `about ${fmtUsdc(fee)} USDC, paid separately`}</Definition>
            </dl>
            {!vault.isSettled && !inKind ? (
              <Callout tone="info">
                The vault has not settled yet. Your withdrawal will settle it first, at a slightly higher network fee. The final amount depends on what the strategy returns.
              </Callout>
            ) : null}
            {shortfall ? (
              <Callout live tone="warn" title="Strategy returned less than total deposits">
                Every depositor is paid pro rata, so you receive {fmtUsdc(expected)} USDC for {fmtUsdc(principal)} USDC deposited.
              </Callout>
            ) : null}
            {inKind ? (
              <Callout live tone="warn" title="In-kind exit">
                The strategy could not pay out in USDC, so the owner enabled in-kind exits. You receive strategy shares and must redeem them from the strategy yourself.
              </Callout>
            ) : null}
            {feeShort ? <Callout tone="error" title="Not enough for network fees">Your balance does not cover the estimated network fee.</Callout> : null}
            {claim.tx.stage !== 'confirmed' ? (
              <button type="button" className="btn btn-primary w-full sm:w-auto" disabled={claim.busy || session.wrongNetwork || feeShort} onClick={() => void submit()}>
                {inKind ? 'Claim strategy shares' : `Withdraw ${expected !== undefined ? fmtUsdc(expected) : fmtUsdc(principal)} USDC`}
              </button>
            ) : null}
          </section>
        )}
        <TxPanel tx={claim.tx} onRecheck={claim.recheck} onDismiss={claim.reset} success="Withdrawal confirmed. Your principal has been returned to your wallet." />
      </div>
      <div className="card h-fit">
        <h2 className="t-section mb-4">Vault timeline</h2>
        <Timeline vault={vault} now={now} />
        <p className="t-small mt-4 text-ink/80">Your full principal is returned in a single withdrawal. Nothing is deducted for donations; only the vault&apos;s yield is given.</p>
      </div>
    </div>
  )
}

export default function WithdrawPage() {
  usePageTitle('Withdraw')
  return (
    <>
      <PageHeader title="Withdraw principal" description="Claim your deposited principal once the vault has matured." />
      <div className="mb-6">
        <SessionNotices />
      </div>
      <ConnectGate purpose="Connect a wallet to withdraw.">
        <WithdrawForm />
      </ConnectGate>
    </>
  )
}
