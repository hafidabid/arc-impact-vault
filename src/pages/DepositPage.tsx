import { ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import { erc20Abi, vaultAbi } from '@/chain/abi'
import { CHAIN, STRATEGY_ADDRESS, USDC_ADDRESS, VAULT_ADDRESS } from '@/chain/config'
import { canDeposit, capacityLeft, maxDepositable, minSharesFor, PHASE_LABEL, vaultPhase } from '@/chain/derive'
import { useAccountData, useFeeEstimate, useGasBalance, useNow, usePreviewShares, useSession, useTransaction, useVaultSnapshot } from '@/chain/hooks'
import { AddressLink } from '@/components/chain/AddressLink'
import { TxPanel } from '@/components/chain/TxPanel'
import { ConnectGate, PageHeader, SessionNotices, SyncError, usePageTitle } from '@/components/layout/PageParts'
import { Callout } from '@/components/ui/Callout'
import { Definition, Skeleton } from '@/components/ui/Misc'
import { Sheet } from '@/components/ui/Sheet'
import { AmountField } from '@/components/ui/AmountField'
import { COPY } from '@/data/copy'
import { fmtUsdc, parseAmountInput } from '@/lib/units'

/** Gas ceilings used only for the fee estimate shown to the user and the amount reserved by "Max". */
const APPROVE_GAS = 100_000n
const DEPOSIT_GAS = 600_000n

function DepositForm() {
  const session = useSession()
  const account = useAccountData()
  const snapshot = useVaultSnapshot()
  const now = useNow()
  const gas = useGasBalance()
  const fee = useFeeEstimate(APPROVE_GAS + DEPOSIT_GAS)
  const [text, setText] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const approval = useTransaction('approve')
  const deposit = useTransaction('deposit')

  const parsed = text === '' ? null : parseAmountInput(text)
  const amount = parsed?.ok ? parsed.value : undefined
  const preview = usePreviewShares(amount)

  if (snapshot.status === 'error') return <SyncError onRetry={snapshot.refetch} />
  if (account.status === 'error') return <SyncError onRetry={account.refetch} />
  if (snapshot.status !== 'ready' || account.status !== 'ready') return <Skeleton className="h-72" />

  const vault = snapshot.data
  const { usdcBalance, allowance, principal } = account.data
  const phase = vaultPhase(vault, now)
  const room = capacityLeft(vault)
  const feeReserve = fee ?? 0n
  const max = maxDepositable(usdcBalance, feeReserve, room)
  const needsApproval = amount !== undefined && allowance < amount

  let error: string | null = null
  if (parsed && !parsed.ok) error = parsed.error
  else if (amount !== undefined) {
    if (amount > room) error = `The vault accepts at most ${fmtUsdc(room)} USDC more.`
    else if (amount > usdcBalance) error = 'This is more than your USDC balance.'
    else if (amount > max) error = `Keep about ${fmtUsdc(feeReserve)} USDC for network fees. Network fees on Arc are paid in USDC from the same balance.`
    else if (gas !== undefined && fee !== undefined && gas < fee) error = 'Your balance does not cover the network fee.'
  }
  const blocked = !canDeposit(phase) || session.wrongNetwork

  const busy = approval.busy || deposit.busy
  const approveReady = approval.tx.stage === 'confirmed' || !needsApproval

  const runApprove = async () => {
    if (amount === undefined) return
    await approval.send('Approval of exactly this deposit amount', { address: USDC_ADDRESS, abi: erc20Abi, functionName: 'approve', args: [VAULT_ADDRESS, amount], chainId: CHAIN.id })
  }
  const runDeposit = async () => {
    if (amount === undefined || preview === undefined) return
    await deposit.send('Deposit', { address: VAULT_ADDRESS, abi: vaultAbi, functionName: 'deposit', args: [amount, minSharesFor(preview)], chainId: CHAIN.id })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <form
        className="card space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          if (!error && amount !== undefined && !blocked) setReviewOpen(true)
        }}
        noValidate
      >
        {!canDeposit(phase) ? (
          <Callout live tone="warn" title={PHASE_LABEL[phase]}>
            {phase === 'paused' ? 'The vault owner has paused new deposits. Withdrawals and settlement are unaffected.' : 'New deposits are no longer accepted by this vault.'}
          </Callout>
        ) : null}
        <AmountField label="Amount to deposit" value={text} onChange={setText} error={error} balance={max} disabled={blocked || busy} balanceLabel="USDC balance" help={`Wallet balance ${fmtUsdc(usdcBalance)} USDC. Deposit limit ${fmtUsdc(room)} USDC.`} />
        <dl className="space-y-2 rounded-control bg-sage/15 p-4">
          <Definition term="Network">{CHAIN.name}</Definition>
          <Definition term="Token">USDC · 6 decimals</Definition>
          <Definition term="Estimated network fee">{fee === undefined ? 'Estimating…' : `about ${fmtUsdc(fee)} USDC`}</Definition>
        </dl>
        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={blocked || amount === undefined || Boolean(error) || busy}>
          Review deposit
          <ArrowRight aria-hidden className="h-4 w-4" />
        </button>
        {principal > 0n ? <p className="t-small text-ink/80">You already have {fmtUsdc(principal)} USDC deposited. A new deposit adds to it.</p> : null}
      </form>

      <aside className="space-y-4">
        <Callout tone="info" title="What happens to your deposit">
          Your USDC is invested through the vault&apos;s yield strategy and returned to you as principal after maturity. The yield is not credited to you; it is donated to approved causes.
        </Callout>
        <Callout tone="warn" title="Risks">
          {COPY.riskLine} Deposits cannot be withdrawn before maturity unless the vault owner initiates an emergency shutdown.
        </Callout>
      </aside>

      <Sheet open={reviewOpen} onClose={() => (busy ? undefined : setReviewOpen(false))} title="Review deposit" description="Nothing is sent until you confirm in your wallet.">
        {amount !== undefined ? (
          <div className="space-y-5">
            <dl className="space-y-3">
              <Definition term="Deposit principal">
                <span className="text-lg font-semibold">{fmtUsdc(amount)} USDC</span>
              </Definition>
              <Definition term="Network">{CHAIN.name}</Definition>
              <Definition term="Token">USDC · 6 decimals</Definition>
              <Definition term="Vault contract">
                <AddressLink address={VAULT_ADDRESS} />
              </Definition>
              <Definition term="Yield strategy">
                <AddressLink address={STRATEGY_ADDRESS} />
              </Definition>
              <Definition term="Estimated network fee">{fee === undefined ? 'Estimating…' : `about ${fmtUsdc(fee)} USDC, paid separately`}</Definition>
              <Definition term="Minimum strategy shares">{preview === undefined ? 'Checking…' : minSharesFor(preview).toString()}</Definition>
            </dl>
            <Callout tone="info">
              Yield is not credited to you. At maturity you can withdraw {fmtUsdc(amount)} USDC, provided the strategy returns at least the total deposited.
            </Callout>

            <ol className="space-y-3">
              <li className="rounded-card border border-ink/15 p-4">
                <p className="flex items-center gap-2 font-medium">
                  {approveReady ? <Check aria-hidden className="h-4 w-4 text-forest" /> : null}1. Approve exactly {fmtUsdc(amount)} USDC
                </p>
                <p className="t-small text-ink/80">
                  {approveReady && !needsApproval && approval.tx.stage !== 'confirmed' ? 'Already approved for this amount.' : 'Authorises the vault to collect this deposit and nothing more.'}
                </p>
                {needsApproval && approval.tx.stage !== 'confirmed' ? (
                  <button type="button" className="btn btn-primary mt-3" disabled={busy || session.wrongNetwork} onClick={() => void runApprove()}>
                    Approve
                  </button>
                ) : null}
                <div className="mt-3">
                  <TxPanel tx={approval.tx} onRecheck={approval.recheck} onDismiss={approval.reset} />
                </div>
              </li>
              <li className="rounded-card border border-ink/15 p-4">
                <p className="font-medium">2. Deposit</p>
                {deposit.tx.stage !== 'confirmed' ? (
                  <button type="button" className="btn btn-primary mt-3" disabled={busy || !approveReady || preview === undefined || session.wrongNetwork} onClick={() => void runDeposit()}>
                    Deposit {fmtUsdc(amount)} USDC
                  </button>
                ) : null}
                <div className="mt-3">
                  <TxPanel tx={deposit.tx} onRecheck={deposit.recheck} onDismiss={deposit.reset} success="Deposit confirmed. Your principal is now recorded in the vault." />
                </div>
              </li>
            </ol>
          </div>
        ) : null}
      </Sheet>
    </div>
  )
}

export default function DepositPage() {
  usePageTitle('Deposit')
  return (
    <>
      <PageHeader title="Deposit USDC" description="Deposit before the deadline. Your principal can be withdrawn after maturity." />
      <div className="mb-6">
        <SessionNotices />
      </div>
      <ConnectGate purpose="Connect a wallet to deposit.">
        <DepositForm />
      </ConnectGate>
    </>
  )
}
