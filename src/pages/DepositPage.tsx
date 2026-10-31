import { ArrowDownToLine, Landmark } from 'lucide-react'
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

function Terms() {
  return (
    <section aria-labelledby="terms-heading" className="card-soft h-fit">
      <h2 id="terms-heading" className="t-label text-forest">
        Where your deposit goes
      </h2>
      <dl className="t-small mt-3 space-y-3">
        {[
          ['Token', DEMO_CONFIG.tokenLabel],
          ['Network', DEMO_CONFIG.networkLabel],
          ['Custody destination', DEMO_CONFIG.custodyPrincipal],
          ['Network fee', DEMO_CONFIG.feeEstimate],
        ].map(([term, value]) => (
          <div key={term}>
            <dt className="text-ink/75">{term}</dt>
            <dd className="text-[15px] font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="t-small mt-4 text-ink/80">{DEMO_CONFIG.networkNote}</p>
      <p className="t-small mt-3 font-medium">{COPY.riskLine}</p>
    </section>
  )
}

export default function DepositPage() {
  usePageTitle('Deposit')
  const { state, overview, client } = useVault()
  const [text, setText] = useState('3.00')
  const [reviewing, setReviewing] = useState(false)
  const flow = useFlow()

  const parsed = useMemo(() => parseAmountInput(text), [text])
  const amount = parsed.ok ? parsed.value : null
  const loading = overview.dataStatus === 'loading'
  const unavailable = overview.dataStatus === 'sync-error'
  const balanceError =
    amount !== null && overview.dataStatus === 'ready' && amount > overview.walletUsdc
      ? `This is more than your wallet balance of ${fmtUsdc(overview.walletUsdc)} USDC.`
      : null
  const amountError = text === '' ? null : !parsed.ok ? parsed.error : balanceError
  const block = blockReasonFor(state, overview, 'deposit', null)
  const valid = amount !== null && !balanceError && !block && overview.dataStatus === 'ready'
  const showOutcome = flow.result !== null && flow.result.status !== 'blocked'

  const submit = async () => {
    if (!valid || amount === null) return
    await flow.run((onPhase) => client.deposit(amount, onPhase))
  }

  return (
    <>
      <PageHeader
        back={{ to: '/dashboard', label: 'Dashboard' }}
        title="Deposit"
        description="Deposit USDC as principal. It stays accounted for separately from any sponsor-funded proceeds."
      />
      <ConnectGate purpose="Depositing needs a connected wallet on the configured network.">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <SessionNotices />
            {showOutcome && flow.result ? (
              <div className="space-y-4">
                <FlowOutcome kind="deposit" result={flow.result} onReset={() => { flow.reset(); setReviewing(true) }} />
                {flow.result.status === 'confirmed' ? (
                  <div className="flex flex-wrap gap-2">
                    <Link to="/dashboard" className="btn btn-primary">
                      Go to dashboard
                    </Link>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        flow.reset()
                        setReviewing(false)
                      }}
                    >
                      Make another deposit
                    </button>
                  </div>
                ) : null}
              </div>
            ) : flow.busy ? (
              <div className="card space-y-4">
                <h2 className="t-section">Deposit in progress</h2>
                <ProgressSteps kind="deposit" phase={flow.phase} />
                <p className="t-small text-ink/80">
                  Do not submit again. If the status becomes unknown you will get a receipt lookup instead of a new payment button.
                </p>
              </div>
            ) : reviewing && amount !== null ? (
              <div className="card space-y-5">
                <h2 className="t-section">Review deposit</h2>
                <dl className="divide-y divide-ink/10 rounded-card border border-ink/10">
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <dt className="font-medium">Deposit principal</dt>
                    <dd className="num text-lg font-semibold">{fmtUsdc(amount)} USDC</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 bg-gold/20 px-4 py-3">
                    <dt className="font-medium">Sponsor proceeds</dt>
                    <dd className="t-small text-right font-medium">funded separately; subject to eligibility</dd>
                  </div>
                </dl>
                <FlowRow from="Your wallet (demo)" to={DEMO_CONFIG.custodyPrincipal} amount={amount} />
                <dl className="t-small grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                  <dt className="text-ink/75">Token</dt>
                  <dd className="text-right font-medium">{DEMO_CONFIG.tokenLabel}</dd>
                  <dt className="text-ink/75">Network</dt>
                  <dd className="text-right font-medium">{DEMO_CONFIG.networkLabel}</dd>
                  <dt className="text-ink/75">Allowance requested</dt>
                  <dd className="num text-right font-medium">Exactly {fmtUsdc(amount)} USDC</dd>
                </dl>
                <p className="t-small prose-reading text-ink/85">
                  A deposit does not create sponsor proceeds. Sponsor funding and attribution are separate events, and nothing here promises that
                  a deposit receives any. {COPY.riskLine}
                </p>
                {block ? <BlockCallout reason={block} /> : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="button" className="btn btn-secondary sm:flex-1" onClick={() => setReviewing(false)}>
                    Back
                  </button>
                  <button type="button" className="btn btn-primary sm:flex-[2]" disabled={!valid} onClick={() => void submit()}>
                    <ArrowDownToLine aria-hidden className="h-4 w-4" />
                    Approve and deposit {fmtUsdc(amount)} USDC
                  </button>
                </div>
              </div>
            ) : (
              <form
                className="card space-y-5"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (valid) setReviewing(true)
                }}
                noValidate
              >
                <div className="flex items-center gap-3">
                  <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-control bg-forest text-ivory">
                    <Landmark className="h-5 w-5" />
                  </span>
                  <h2 className="t-section">Amount</h2>
                </div>
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-12" />
                  </div>
                ) : (
                  <AmountField
                    label="Deposit amount"
                    value={text}
                    onChange={setText}
                    error={amountError}
                    balanceLabel="Wallet balance (demo)"
                    balance={unavailable ? undefined : overview.walletUsdc}
                    help="Enter 3.00 to follow the worked example."
                    disabled={unavailable}
                  />
                )}
                {unavailable ? <Callout tone="warn" title="Wallet balance unavailable">We cannot confirm your balance right now, so deposits are paused until it syncs.</Callout> : null}
                {block ? <BlockCallout reason={block} /> : null}
                <button type="submit" className="btn btn-primary w-full" disabled={!valid}>
                  Review deposit
                </button>
              </form>
            )}
          </div>
          <Terms />
        </div>
      </ConnectGate>
    </>
  )
}
