import { ArrowRight, Landmark, Sprout, HandHeart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PHASE_LABEL } from '@/chain/derive'
import { useNow } from '@/chain/hooks'
import { vaultPhase } from '@/chain/derive'
import { useCauses } from '@/chain/useCauses'
import { ContourArt, HeroGlow } from '@/components/art/ContourArt'
import { usePageTitle } from '@/components/layout/PageParts'
import { SectionHeading, Skeleton } from '@/components/ui/Misc'
import { PhaseChip } from '@/components/ui/StatusChip'
import { BalanceCard } from '@/components/vault/BalanceCard'
import { CauseCard } from '@/components/vault/CauseCard'
import { Timeline } from '@/components/vault/Timeline'
import { COPY } from '@/data/copy'

const STEPS = [
  {
    icon: Landmark,
    title: 'Deposit USDC',
    body: 'Deposit before the deposit deadline. Your principal is recorded on-chain under your wallet and invested by the vault in its yield strategy.',
  },
  {
    icon: Sprout,
    title: 'The vault earns yield',
    body: 'Until maturity the strategy may earn yield for the vault as a whole. It is never credited to individual depositors.',
  },
  {
    icon: HandHeart,
    title: 'Principal back, yield donated',
    body: 'At maturity you withdraw your principal. The vault owner sends the realised yield to an approved cause, and every transfer is public.',
  },
]

export default function HomePage() {
  usePageTitle('A clearer path to impact')
  const { snapshot, rows } = useCauses()
  const now = useNow()
  const vault = snapshot.status === 'ready' ? snapshot.data : undefined

  return (
    <div className="space-y-16 md:space-y-24">
      <section className="relative isolate -mx-4 overflow-hidden rounded-b-[32px] px-4 pb-10 pt-6 md:-mx-6 md:px-6 md:pb-16 md:pt-10 lg:-mx-8 lg:px-8">
        <HeroGlow />
        <ContourArt animate className="absolute -right-24 -top-16 -z-10 h-[480px] w-[480px] opacity-70 md:-right-10 md:h-[620px] md:w-[620px]" />
        <div className="max-w-2xl animate-rise">
          {vault ? <PhaseChip phase={vaultPhase(vault, now)} /> : <Skeleton className="h-6 w-36" />}
          <h1 className="t-page mt-5 max-w-xl">{COPY.heroTitle}</h1>
          <p className="prose-reading mt-4 text-ink/90">{COPY.heroBody}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/onboarding" className="btn btn-primary min-h-[52px] px-6 text-base">
              Get started
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <Link to="/impact" className="btn btn-secondary min-h-[52px] px-6 text-base">
              See the causes
            </Link>
          </div>
          <p className="t-small mt-4 max-w-md text-ink/75">No wallet needed to browse. Connecting never requests a spending approval.</p>
        </div>
      </section>

      <section aria-labelledby="how-heading">
        <SectionHeading id="how-heading" title="How it works" description="Three steps, each recorded as its own on-chain event." />
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

      <section aria-labelledby="vault-heading">
        <SectionHeading id="vault-heading" title="The vault right now" description="Read live from the contract." />
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <BalanceCard label="Total deposited principal" value={vault?.totalPrincipal} note="Owed back to depositors. Not donated." />
            <BalanceCard
              label={vault?.isSettled ? 'Yield realised' : 'Estimated yield so far'}
              value={vault ? (vault.isSettled ? vault.yieldPool : vault.projectedYield) : undefined}
              note={vault?.isSettled ? 'Earned by the vault and reserved for causes.' : 'An estimate, not a promise. Reserved for causes, not credited to depositors.'}
            />
          </div>
          <div className="card">
            <h3 className="t-label text-ink/80">{vault ? PHASE_LABEL[vaultPhase(vault, now)] : 'Timeline'}</h3>
            <div className="mt-3">{vault ? <Timeline vault={vault} now={now} /> : <Skeleton className="h-40" />}</div>
          </div>
        </div>
        <p className="t-small prose-reading mt-3 text-ink/80">{COPY.yieldNote}</p>
      </section>

      <section aria-labelledby="causes-heading">
        <SectionHeading
          id="causes-heading"
          title="Where the yield can go"
          description="Only causes approved by the vault owner can receive yield."
          action={
            <Link to="/impact" className="btn btn-ghost">
              All causes
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          {rows
            ? rows.map((row) => <CauseCard key={row.info.address} cause={row.info} distributed={row.distributed} />)
            : [0, 1].map((n) => <Skeleton key={n} className="h-56" />)}
        </div>
      </section>
    </div>
  )
}
