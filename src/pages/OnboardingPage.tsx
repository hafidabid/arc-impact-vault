import { ArrowLeft, ArrowRight, BadgeCheck, CircleDashed, Coins, Landmark, ShieldAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ConnectButton } from '@/components/layout/ConnectButton'
import { usePageTitle } from '@/components/layout/PageParts'
import { PoolPicker } from '@/components/pools/PoolPicker'
import { Callout } from '@/components/ui/Callout'
import { Chip } from '@/components/ui/StatusChip'
import { DEMO_CONFIG } from '@/data/config'
import { COPY, SPONSOR_NOT_RETURN } from '@/data/copy'
import { cx } from '@/lib/cx'
import { useVault } from '@/state/VaultProvider'

const STEP_TITLES = ['Separate accounting', 'Wallet and network', 'Pool preference'] as const

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
          <p className="t-small mt-1 text-ivory/90">What you deposit. It is recorded as your principal and kept separate from every donation.</p>
        </div>
        <div className="relative overflow-hidden rounded-card border border-gold bg-gold/25 p-5 pl-7">
          <div aria-hidden className="pattern-sponsor absolute inset-y-0 left-0 w-3 bg-gold" />
          <Coins aria-hidden className="mb-3 h-6 w-6 text-forest" />
          <h3 className="font-semibold">Sponsor-funded demo proceeds</h3>
          <p className="t-small mt-1">Funded separately by a sponsor and restricted to donations. {SPONSOR_NOT_RETURN}</p>
        </div>
      </div>
      <Callout tone="warn" title="Before you continue">
        {COPY.riskLine} Keeping balances separate does not guarantee recovery of principal.
      </Callout>
      <Callout tone="info" title="This is a demo">
        Balances, receipts and transfers are synthetic. Proceeds shown here are sponsor-funded demo funds, and a deposit does not create
        them. You can browse the public pages without connecting.
      </Callout>
    </div>
  )
}

function StepTwo() {
  const { overview, client } = useVault()
  const connected = overview.connected
  const items = [
    { label: 'Wallet', ok: connected, text: connected ? `Connected: ${DEMO_CONFIG.walletId} (synthetic)` : 'Not connected yet' },
    {
      label: 'Network',
      ok: connected && !overview.wrongNetwork,
      text: !connected ? 'Checked after connecting' : overview.wrongNetwork ? 'Wrong network' : `${DEMO_CONFIG.networkLabel} verified`,
    },
    { label: 'Token', ok: connected && !overview.wrongNetwork, text: !connected || overview.wrongNetwork ? 'Checked after connecting' : `${DEMO_CONFIG.tokenLabel} verified` },
  ]
  return (
    <div className="space-y-4">
      <p className="prose-reading text-ink/90">
        Connect a wallet so ImpactVault can show your balances. Connecting does not request any spending approval. Each deposit asks you to
        review and approve an exact amount separately.
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
      {overview.wrongNetwork ? (
        <Callout
          tone="error"
          title="Wrong network"
          action={
            <button type="button" className="btn btn-primary" onClick={() => void client.switchNetwork()}>
              Switch network
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
  const { state, client } = useVault()
  return (
    <div className="space-y-4">
      <PoolPicker
        legend="Default pool preference"
        hint="Optional. You can change it later in Account."
        value={state.poolPreference}
        onChange={(id) => client.setPoolPreference(id)}
      />
      <Callout tone="info" title="A preference is not an authorization">
        Choosing a pool here does not move any money. Each allocation is reviewed and authorized separately.
      </Callout>
    </div>
  )
}

export default function OnboardingPage() {
  usePageTitle('Get started')
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { overview, client } = useVault()
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
  const canContinue = step !== 2 || (overview.connected && !overview.wrongNetwork)

  return (
    <div className="mx-auto max-w-2xl">
      <Progress step={step} />
      <div className="card animate-rise">
        <div className="mb-1 flex items-center gap-2">
          <ShieldAlert aria-hidden className="h-4 w-4 text-forest" />
          <span className="t-label text-ink/75">Demo onboarding</span>
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="t-page mb-5 outline-none">
          {step === 1 ? 'How your funds stay accounted for separately' : step === 2 ? 'Connect your wallet' : 'Pick a default pool'}
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
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  client.completeOnboarding()
                  void navigate('/deposit')
                }}
              >
                Open deposit
                <ArrowRight aria-hidden className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {step === 2 && !canContinue ? (
          <p className="t-small mt-3 text-ink/75">Continue unlocks after your wallet is connected on the configured network.</p>
        ) : null}
      </div>
    </div>
  )
}
