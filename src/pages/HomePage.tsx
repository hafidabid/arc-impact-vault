import { ArrowRight, FileSearch, HandHeart, Landmark, ReceiptText, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ContourArt, HeroGlow } from '@/components/art/ContourArt'
import { usePageTitle } from '@/components/layout/PageParts'
import { FlowRow } from '@/components/money/FlowRow'
import { PoolCard } from '@/components/pools/PoolCard'
import { Chip, SponsorChip, StatusChip, SyntheticChip } from '@/components/ui/StatusChip'
import { SectionHeading } from '@/components/ui/Misc'
import { COPY, SPONSOR_NOT_RETURN } from '@/data/copy'
import { POOLS } from '@/data/pools'
import { fmtDateTime } from '@/lib/format'
import { fmtUsdc } from '@/lib/units'
import { useVault } from '@/state/VaultProvider'

const STEPS = [
  {
    icon: Landmark,
    title: 'Deposit your principal',
    body: 'Deposit USDC. It is recorded as your principal, accounted for on its own, and available to withdraw subject to custody and network risks.',
  },
  {
    icon: Sprout,
    title: 'A sponsor funds a donation lot',
    body: 'Separately, a sponsor funds demo proceeds and assigns them to eligible positions. A deposit never creates them.',
  },
  {
    icon: HandHeart,
    title: 'Choose a pool',
    body: 'Direct those proceeds to Hunger Relief or Kalimantan Forest Fire Relief, then follow the transfer record and evidence status.',
  },
]

export default function HomePage() {
  usePageTitle('A clearer path to impact')
  const { state } = useVault()
  const transfer = state.operations.find((op) => op.type === 'settlement' && op.status === 'confirmed')

  return (
    <div className="space-y-16 md:space-y-24">
      <section className="relative isolate -mx-4 overflow-hidden rounded-b-[32px] px-4 pb-10 pt-6 md:-mx-6 md:px-6 md:pb-16 md:pt-10 lg:-mx-8 lg:px-8">
        <HeroGlow />
        <ContourArt className="absolute -right-24 -top-16 -z-10 h-[480px] w-[480px] opacity-70 md:-right-10 md:h-[620px] md:w-[620px]" />
        <div className="max-w-2xl animate-rise">
          <Chip tone="sponsor" icon={ReceiptText}>
            Demo with synthetic data
          </Chip>
          <h1 className="t-page mt-5 max-w-xl">{COPY.heroTitle}</h1>
          <p className="prose-reading mt-4 text-ink/90">{COPY.heroBody}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/onboarding" className="btn btn-primary min-h-[52px] px-6 text-base">
              Explore the demo
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <Link to="/impact" className="btn btn-secondary min-h-[52px] px-6 text-base">
              See the pools
            </Link>
          </div>
          <p className="t-small mt-4 max-w-md text-ink/75">No wallet needed to browse. Connecting never requests a spending approval.</p>
        </div>
      </section>

      <section aria-labelledby="how-heading">
        <SectionHeading id="how-heading" title="How the demo works" description="Three steps, each recorded as its own event." />
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card relative">
              <span aria-hidden className="num absolute right-5 top-4 text-5xl font-semibold text-sage/50">
                {index + 1}
              </span>
              <span aria-hidden className="mb-4 flex h-11 w-11 items-center justify-center rounded-control bg-forest text-ivory">
                <step.icon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold leading-snug text-forest">
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
              </h3>
              <p className="t-small prose-reading mt-1.5 text-ink/85">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="example-heading">
        <SectionHeading
          id="example-heading"
          title="Example: 3.00 USDC deposited, 0.20 USDC sponsor-funded"
          description="Two amounts, two sources, two separate records. They are never added into one total."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-card bg-forest p-5 text-ivory shadow-lift md:p-6">
            <ContourArt className="absolute -right-12 -top-12 h-56 w-56 opacity-40" />
            <div className="relative">
              <p className="t-label text-ivory/90">Deposited principal</p>
              <p className="t-balance mt-1">
                3.00 <span className="text-xl font-medium opacity-80">USDC</span>
              </p>
              <p className="t-small mt-3 text-ivory/85">From your wallet to principal custody. It stays accounted for as yours.</p>
            </div>
          </div>
          <div className="card relative overflow-hidden pl-6 md:pl-8">
            <div aria-hidden className="pattern-sponsor absolute inset-y-0 left-0 w-3 bg-gold" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="t-label">Sponsor-funded demo proceeds</p>
              <SponsorChip />
            </div>
            <p className="t-balance mt-1">
              0.20 <span className="text-xl font-medium text-ink/75">USDC</span>
            </p>
            <p className="t-small mt-3 text-ink/85">{SPONSOR_NOT_RETURN} Restricted to donations.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <FlowRow from="Your wallet" to="Principal custody" amount={3_000_000n} />
          <FlowRow from="Sponsor wallet" to="Proceeds custody, then pool recipient" amount={200_000n} />
        </div>
        <p className="t-small mt-3 max-w-reading text-ink/80">Principal custody never sends funds to a pool recipient. Only sponsor-funded proceeds do.</p>
      </section>

      <section aria-labelledby="pools-heading">
        <SectionHeading
          id="pools-heading"
          title="Two pools"
          description="Pool names describe intended purposes. They do not establish charity verification, actual beneficiaries or completed impact."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {POOLS.map((pool) => (
            <PoolCard key={pool.id} poolId={pool.id} />
          ))}
        </div>
      </section>

      <section aria-labelledby="transparency-heading">
        <SectionHeading id="transparency-heading" title="Transparency preview" description="Every movement has a record you can trace. Records below are synthetic." />
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-semibold">
                <ReceiptText aria-hidden className="h-5 w-5 text-forest" />
                Transfer record
              </h3>
              <div className="flex gap-1.5">
                <SyntheticChip />
                {transfer ? <StatusChip status={transfer.status} /> : null}
              </div>
            </div>
            {transfer ? (
              <>
                <p className="num mt-3 text-2xl font-semibold">{fmtUsdc(transfer.amount)} USDC</p>
                <p className="t-small text-ink/75">
                  {transfer.operationId} · {fmtDateTime(transfer.updatedAt)}
                </p>
                <FlowRow className="mt-3" from={transfer.from} to={transfer.to} />
                <p className="t-small prose-reading mt-3 text-ink/85">{COPY.transferConfirmed}</p>
              </>
            ) : (
              <p className="t-small mt-3 text-ink/80">No transfer has been recorded in this demo session yet.</p>
            )}
          </div>
          <div className="card">
            <h3 className="flex items-center gap-2 font-semibold">
              <FileSearch aria-hidden className="h-5 w-5 text-forest" />
              Evidence status
            </h3>
            <p className="mt-3 text-lg font-semibold">None submitted yet</p>
            <p className="t-small prose-reading mt-1 text-ink/85">
              When evidence is submitted, a reviewer decides whether to accept it for display. {COPY.evidenceAccepted}
            </p>
            <Link to="/impact/hunger-relief" className="btn btn-secondary mt-4">
              See a pool page
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
