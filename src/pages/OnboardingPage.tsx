import { ArrowLeft, ArrowRight, BadgeCheck, CircleDashed, Coins, Landmark } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useReadContract } from 'wagmi'
import { erc20Abi } from '@/chain/abi'
import { CHAIN, USDC_ADDRESS } from '@/chain/config'
import { shortAddress } from '@/chain/derive'
import { useNow, useSession, useVaultSnapshot } from '@/chain/hooks'
import { ConnectButton } from '@/components/layout/ConnectButton'
import { usePageTitle } from '@/components/layout/PageParts'
import { Callout } from '@/components/ui/Callout'
import { Skeleton } from '@/components/ui/Misc'
import { Chip } from '@/components/ui/StatusChip'
import { Timeline } from '@/components/vault/Timeline'
import { COPY } from '@/data/copy'
import { cx } from '@/lib/cx'

const STEP_TITLES = ['Separate accounting', 'Wallet and network', 'Vault terms'] as const

function Progress({ step }: { step: number }) {
  return (
    <nav aria-label="Onboarding progress" className="mb-6">
      <p className="t-small mb-2 font-medium text-ink/80">
        Step {step} of {STEP_TITLES.length}: {STEP_TITLES[step - 1]}
      </p>
      <ol className="grid grid-cols-3 gap-2">
        {STEP_TITLES.map((title, index) => {
          const number = index + 1
          return (
            <li key={title} aria-current={number === step ? 'step' : undefined}>
              <span className={cx('block h-1.5 rounded-full transition duration-150', number <= step ? 'bg-forest' : 'bg-ink/15')} />
              <span className="sr-only">
                {title}
                {number < step ? ' (complete)' : number === step ? ' (current)' : ''}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function StepOne() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-card bg-forest p-5 text-ivory">
          <Landmark aria-hidden className="mb-3 h-6 w-6 text-sage" />
          <h3 className="font-semibold">Your principal</h3>
          <p className="t-small mt-1 text-ivory/90">What you deposit. It is recorded under your wallet and is yours to claim back at maturity.</p>
        </div>
        <div className="relative overflow-hidden rounded-card border border-gold bg-gold/25 p-5 pl-7">
          <div aria-hidden className="pattern-sponsor absolute inset-y-0 left-0 w-3 bg-gold" />
          <Coins aria-hidden className="mb-3 h-6 w-6 text-forest" />
          <h3 className="font-semibold">The vault&apos;s yield</h3>
          <p className="t-small mt-1">Whatever the strategy earns above total deposits. It is reserved for approved causes and is never credited to you.</p>
        </div>
      </div>
      <Callout tone="warn" title="Before you continue">
        {COPY.riskLine} If the strategy returns less than total deposits, withdrawals are paid back pro rata. You can browse the public pages without connecting.
      </Callout>
    </div>
  )
}

function StepTwo() {
  const session = useSession()
  const decimals = useReadContract({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'decimals', chainId: CHAIN.id })
  const connected = session.isConnected
  const tokenOk = decimals.data === 6
  const items = [
    { label: 'Wallet', ok: connected, text: connected && session.address ? `Connected: ${shortAddress(session.address)}` : 'Not connected yet' },
    { label: 'Network', ok: connected && !session.wrongNetwork, text: !connected ? 'Checked after connecting' : session.wrongNetwork ? 'Wrong network' : `${CHAIN.name} verified` },
    {
      label: 'Token',
      ok: tokenOk,
      text: decimals.isLoading ? 'Checking…' : decimals.isError ? 'Could not verify the token' : tokenOk ? `USDC at ${shortAddress(USDC_ADDRESS)}, 6 decimals` : `Unexpected decimals: ${String(decimals.data)}`,
    },
  ]
  return (
    <div className="space-y-4">
      <p className="prose-reading text-ink/90">
        Connect a wallet so ImpactVault can show your balances. Connecting does not request any spending approval. Each deposit asks you to review and approve an exact amount separately.
      </p>
      <ul className="divide-y divide-ink/10 rounded-card border border-ink/15">
        {items.map((item) => (
          <li key={item.label} className="flex min-h-[56px] items-center justify-between gap-3 px-4 py-3">
            <span className="font-medium">{item.label}</span>
            <span className="flex items-center gap-2 text-right text-[15px]">
              {item.text}
              <Chip tone={item.ok ? 'ok' : 'neutral'} icon={item.ok ? BadgeCheck : CircleDashed}>
                {item.ok ? 'Checked' : 'Pending'}
              </Chip>
            </span>
          </li>
        ))}
      </ul>
      {session.wrongNetwork ? (
        <Callout
          tone="error"
          title="Wrong network"
          action={
            <button type="button" className="btn btn-primary" onClick={() => void session.switchNetwork()}>
              Switch to {CHAIN.name}
            </button>
          }
        >
          Switch to the configured network to continue.
        </Callout>
      ) : null}
      {!connected ? <ConnectButton /> : null}
    </div>
  )
}

function StepThree() {
  const snapshot = useVaultSnapshot()
  const now = useNow()
  return (
    <div className="space-y-4">
      <p className="prose-reading text-ink/90">Your deposit is locked for a fixed term. These are the vault&apos;s dates, read from the contract.</p>
      <div className="rounded-card border border-ink/15 p-4">{snapshot.status === 'ready' ? <Timeline vault={snapshot.data} now={now} /> : <Skeleton className="h-40" />}</div>
      <Callout tone="info" title="Who controls what">
        The vault owner approves causes and decides when yield is sent. The owner can also pause new deposits and, in an emergency, shut the vault down early. The owner cannot spend your principal.
      </Callout>
    </div>
  )
}

export default function OnboardingPage() {
  usePageTitle('Get started')
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const session = useSession()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const raw = Number(params.get('step') ?? '1')
  const step = raw >= 1 && raw <= 3 ? Math.floor(raw) : 1

  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    headingRef.current?.focus()
  }, [step])

  const go = (next: number) => setParams({ step: String(next) }, { replace: false })
  const canContinue = step !== 2 || (session.isConnected && !session.wrongNetwork)

  return (
    <div className="mx-auto max-w-2xl">
      <Progress step={step} />
      <div className="card animate-rise">
        <h1 ref={headingRef} tabIndex={-1} className="t-page mb-5 outline-none">
          {step === 1 ? 'How your funds stay accounted for separately' : step === 2 ? 'Connect your wallet' : 'Review the vault terms'}
        </h1>
        {step === 1 ? <StepOne /> : step === 2 ? <StepTwo /> : <StepThree />}

        <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          {step === 1 ? (
            <Link to="/" className="btn btn-ghost justify-start">
              <ArrowLeft aria-hidden className="h-4 w-4" />
              Back to home
            </Link>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={() => go(step - 1)}>
              <ArrowLeft aria-hidden className="h-4 w-4" />
              Back
            </button>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            {step === 2 ? (
              <Link to="/impact" className="btn btn-ghost">
                Keep browsing without connecting
              </Link>
            ) : null}
            {step < 3 ? (
              <button type="button" className="btn btn-primary" disabled={!canContinue} onClick={() => go(step + 1)}>
                Continue
                <ArrowRight aria-hidden className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => void navigate('/deposit')}>
                Open deposit
                <ArrowRight aria-hidden className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {step === 2 && !canContinue ? <p className="t-small mt-3 text-ink/75">Continue unlocks after your wallet is connected on {CHAIN.name}.</p> : null}
      </div>
    </div>
  )
}
