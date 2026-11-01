import { ArrowRight, Landmark, Sprout, HandHeart, ShieldCheck, Eye, Target } from 'lucide-react'
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
    body: 'Deposit any amount before the deadline. Your principal is recorded against your wallet.',
  },
  {
    icon: Sprout,
    title: 'The vault earns yield',
    body: 'During the term, deposits are invested through the vault’s yield strategy. Yield accrues to the vault, separate from your principal.',
  },
  {
    icon: HandHeart,
    title: 'Principal returned, yield donated',
    body: 'At maturity you withdraw your full principal. The yield is donated to approved causes, with every transfer on public record.',
  },
]

const PROMISES = [
  { icon: ShieldCheck, title: 'Principal comes first', body: 'Depositors are repaid in full before any yield is donated, provided the strategy holds its value.' },
  { icon: Target, title: 'Only yield is donated', body: 'Yield can be sent only to causes the vault owner has approved on-chain in advance.' },
  { icon: Eye, title: 'Transparent by design', body: 'Every deposit, approval and donation is a public record on Arc that anyone can audit.' },
]

const FOCUS_AREAS = [
  {
    image: '/images/projects/food-relief.jpg',
    imageAlt: 'Volunteers packing fresh food and essentials into donation boxes',
    title: 'Hunger relief',
    body: 'Funding meals and food parcels for families facing food insecurity, so that saving and giving no longer compete.',
  },
  {
    image: '/images/projects/forest-recovery.jpg',
    imageAlt: 'Volunteers holding young saplings ready for planting',
    title: 'Forest restoration',
    body: 'Supporting reforestation and community recovery after forest fires, including in Kalimantan.',
  },
]

export default function HomePage() {
  usePageTitle('Give the impact, your money still')
  const { snapshot, rows } = useCauses()
  const now = useNow()
  const vault = snapshot.status === 'ready' ? snapshot.data : undefined

  return (
    <div className="space-y-16 md:space-y-24">
      <section className="relative isolate overflow-hidden rounded-[28px] border-2 border-forest animate-aurora bg-gradient-to-br from-sage/55 via-ivory to-gold/45 bg-[length:220%_220%] px-5 py-8 shadow-[0_18px_40px_-20px_rgba(22,77,66,0.45)] md:px-12 md:py-14">
        <HeroGlow />
        <ContourArt animate flow="#D7B36B" stroke="#164D42" className="absolute -right-24 -top-16 -z-10 h-[480px] w-[480px] opacity-40 md:-right-10 md:h-[620px] md:w-[620px]" />
        <div className="max-w-2xl animate-rise">
          {vault ? <PhaseChip phase={vaultPhase(vault, now)} /> : <Skeleton className="h-6 w-36" />}
          <h1 className="t-page mt-5 max-w-xl">{COPY.heroTitle}</h1>
          <p className="prose-reading mt-4 text-lg text-ink">{COPY.heroBody}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/onboarding" className="btn btn-primary min-h-[52px] px-6 text-base">
              Start giving
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <Link to="/impact" className="btn btn-secondary min-h-[52px] px-6 text-base">
              See where it goes
            </Link>
          </div>
          <p className="t-small mt-4 max-w-md text-ink/80">Browse freely without a wallet. Connecting never grants spending access.</p>
        </div>
      </section>

      <section aria-label="Why it works">
        <ul className="grid gap-4 md:grid-cols-3">
          {PROMISES.map((item) => (
            <li key={item.title} className="card flex gap-4">
              <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-gold/45 text-forest">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold leading-snug text-forest">{item.title}</h2>
                <p className="t-small mt-1 text-ink/85">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="focus-heading">
        <SectionHeading id="focus-heading" title="Where your yield goes" description="ImpactVault directs yield to two focus areas. Every recipient is approved on-chain before it can receive funds." />
        <ul className="grid gap-4 md:grid-cols-2">
          {FOCUS_AREAS.map((item) => (
            <li key={item.title} className="card overflow-hidden !p-0">
              <img
                src={item.image}
                alt={item.imageAlt}
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="p-4 md:p-6">
                <h3 className="text-lg font-semibold text-forest">{item.title}</h3>
                <p className="t-small prose-reading mt-1.5 text-ink/85">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="t-small mt-3 text-ink/70">Photography is illustrative.</p>
      </section>

      <section aria-labelledby="how-heading">
        <SectionHeading id="how-heading" title="How it works" description="Three steps, each recorded on-chain." />
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
        <SectionHeading id="vault-heading" title="The vault right now" description="Live figures from the vault contract on Arc." />
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <BalanceCard label="Total deposited principal" value={vault?.totalPrincipal} note="Held for repayment to depositors." />
            <BalanceCard
              label={vault?.isSettled ? 'Yield realised' : 'Estimated yield so far'}
              value={vault ? (vault.isSettled ? vault.yieldPool : vault.projectedYield) : undefined}
              note={vault?.isSettled ? 'Earned by the vault and reserved for approved causes.' : 'Estimated, not guaranteed. Reserved for approved causes.'}
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
          title="Approved causes"
          description="The organisations eligible to receive yield from this vault."
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
