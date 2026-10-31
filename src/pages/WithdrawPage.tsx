import { ArrowUpFromLine } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConnectGate, PageHeader, SessionNotices, usePageTitle } from '@/components/layout/PageParts'
import { BlockCallout, blockReasonFor } from '@/components/money/Blockers'
import { FlowRow } from '@/components/money/FlowRow'
import { FlowOutcome, ProgressSteps } from '@/components/money/TxPanel'
import { AmountField } from '@/components/ui/AmountField'
import { Callout } from '@/components/ui/Callout'
import { Skeleton } from '@/components/ui/Misc'
import { DEMO_CONFIG } from '@/data/config'
import { COPY } from '@/data/copy'
import { fmtUsdc, parseAmountInput } from '@/lib/units'
import { useFlow, useVault } from '@/state/VaultProvider'

export default function WithdrawPage() {
  usePageTitle('Withdraw')
  const { state, overview, client } = useVault()
  const { balances } = overview
  const [text, setText] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const flow = useFlow()

  const parsed = useMemo(() => parseAmountInput(text), [text])
  const amount = parsed.ok ? parsed.value : null
  const ready = overview.dataStatus === 'ready'
  const overAvailable = amount !== null && ready && amount > balances.availablePrincipal
  const amountError = text === '' ? null : !parsed.ok ? parsed.error : overAvailable ? `You can withdraw up to ${fmtUsdc(balances.availablePrincipal)} USDC of available principal.` : null
  const block = blockReasonFor(state, overview, 'withdrawal', null)
  const valid = amount !== null && !overAvailable && !block && ready
  const showOutcome = flow.result !== null && flow.result.status !== 'blocked'

  const submit = async () => {
    if (!valid || amount === null) return
    await flow.run((onPhase) => client.withdraw(amount, onPhase))
  }

  return (
    <>
      <PageHeader
        back={{ to: '/dashboard', label: 'Dashboard' }}
        title="Withdraw"
        description="Withdraw available principal to your connected wallet. You are never required to donate to withdraw."
      />
      <ConnectGate purpose="Withdrawing needs a connected wallet on the configured network.">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <SessionNotices />
            {showOutcome && flow.result ? (
              <div className="space-y-4">
                <FlowOutcome kind="withdrawal" result={flow.result} onReset={() => { flow.reset(); setReviewing(true) }} />
                {flow.result.status === 'confirmed' ? (
                  <Link to="/dashboard" className="btn btn-primary">
                    Go to dashboard
                  </Link>
                ) : null}
              </div>
            ) : flow.busy ? (
              <div className="card space-y-4">
                <h2 className="t-section">Withdrawal in progress</h2>
                <ProgressSteps kind="withdrawal" phase={flow.phase} />
                <p className="t-small text-ink/80">The amount is reserved so it cannot be withdrawn twice. Settlement time is not guaranteed.</p>
              </div>
            ) : reviewing && amount !== null ? (
              <div className="card space-y-5">
                <h2 className="t-section">Review withdrawal</h2>
                <FlowRow from={DEMO_CONFIG.custodyPrincipal} to="Your connected wallet (demo)" amount={amount} />
                <dl className="t-small grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-card border border-ink/10 p-4">
                  <dt className="text-ink/75">Available principal now</dt>
                  <dd className="num text-right font-medium">{fmtUsdc(balances.availablePrincipal)} USDC</dd>
                  <dt className="text-ink/75">Reserved by this withdrawal</dt>
                  <dd className="num text-right font-medium">{fmtUsdc(amount)} USDC</dd>
                  <dt className="text-ink/75">Available principal after</dt>
                  <dd className="num text-right font-medium">{fmtUsdc(balances.availablePrincipal - amount)} USDC</dd>
                  <dt className="text-ink/75">Network fee (separate)</dt>
                  <dd className="text-right font-medium">{DEMO_CONFIG.feeEstimate.replace('Estimated network fee: ', '')}</dd>
                </dl>
                <p className="t-small prose-reading text-ink/85">
                  Only available principal is used. No donation or sponsor-funded proceeds are deducted from it, and fees are funded
                  separately. Reserved amounts cannot be spent twice.
                </p>
                {block ? <BlockCallout reason={block} /> : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="button" className="btn btn-secondary sm:flex-1" onClick={() => setReviewing(false)}>
                    Back
                  </button>
                  <button type="button" className="btn btn-primary sm:flex-[2]" disabled={!valid} onClick={() => void submit()}>
                    <ArrowUpFromLine aria-hidden className="h-4 w-4" />
                    Authorize withdrawal of {fmtUsdc(amount)} USDC
                  </button>
                </div>
              </div>
            ) : (
              <form
                className="card space-y-5"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault()
                  if (valid) setReviewing(true)
                }}
              >
                <h2 className="t-section">Amount</h2>
                {overview.dataStatus === 'loading' ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-12" />
                  </div>
                ) : overview.dataStatus === 'sync-error' ? (
                  <Callout tone="warn" title="Available principal unavailable">
                    We cannot confirm your available principal right now, so withdrawals are paused until it syncs. This is not a zero balance.
                  </Callout>
                ) : balances.availablePrincipal === 0n ? (
                  <Callout tone="info" title="No available principal">
                    {balances.reservedWithdrawals > 0n
                      ? `${fmtUsdc(balances.reservedWithdrawals)} USDC is reserved for a pending withdrawal and cannot be used twice.`
                      : 'Principal appears here after a deposit is confirmed.'}{' '}
                    <Link to="/deposit" className="font-medium underline underline-offset-4">
                      Make a deposit
                    </Link>
                  </Callout>
                ) : (
                  <AmountField
                    label="Withdrawal amount"
                    value={text}
                    onChange={setText}
                    error={amountError}
                    balanceLabel="Available principal"
                    balance={balances.availablePrincipal}
                    help={`Reserved for pending withdrawals: ${fmtUsdc(balances.reservedWithdrawals)} USDC.`}
                  />
                )}
                <div>
                  <p className="field-label">Destination</p>
                  <p className="input flex items-center bg-sage/15 font-medium">Your connected wallet (demo)</p>
                  <p className="field-help">Withdrawals go to the connected wallet. Other recipients are not offered in this version.</p>
                </div>
                {block ? <BlockCallout reason={block} /> : null}
                <button type="submit" className="btn btn-primary w-full" disabled={!valid}>
                  Review withdrawal
                </button>
              </form>
            )}
          </div>

          <aside className="card-soft h-fit space-y-3">
            <h2 className="t-label text-forest">Good to know</h2>
            <ul className="t-small list-disc space-y-2 pl-5 text-ink/90">
              <li>Withdrawals use only available principal. Sponsor-funded proceeds stay restricted to donations.</li>
              <li>Network fees are paid separately and never taken from your principal.</li>
              <li>Settlement is not instant or guaranteed. A pending withdrawal stays reserved until it is confirmed.</li>
            </ul>
            <p className="t-small font-medium">{COPY.riskLine}</p>
          </aside>
        </div>
      </ConnectGate>
    </>
  )
}
