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
    body: 'Put in any amount before the deposit deadline. Your deposit stays recorded under your wallet.',
  },
  {
    icon: Sprout,
    title: 'The vault earns interest',
    body: 'While it is locked, your deposit earns yield for the vault as a whole. It never touches your principal.',
  },
  {
    icon: HandHeart,
    title: 'You get your money back',
    body: 'At maturity you withdraw your full deposit. The interest goes to a cause, and you can follow it on-chain.',
  },
]

const PROMISES = [
  { icon: ShieldCheck, title: 'Your deposit comes back', body: 'Principal is paid out first, in full, as long as the yield strategy does not lose value.' },
  { icon: Target, title: 'Only the interest is given', body: 'Yield can only go to causes the vault owner approved on-chain beforehand.' },
  { icon: Eye, title: 'Every transfer is public', body: 'Deposits, approvals and donations are all on-chain events anyone can check.' },
]

const EXAMPLES = [
  {
    image: '/images/projects/food-relief.jpg',
    imageAlt: 'Volunteers packing fresh food and essentials into donation boxes',
    title: 'Help put food on the table',
    body: 'Yield can fund meals and food parcels for families who need them. Your deposit stays in the vault; the interest supports hunger relief.',
  },
  {
    image: '/images/projects/forest-recovery.jpg',
    imageAlt: 'Volunteers holding young saplings ready for planting',
    title: 'Help forests grow back',
    body: 'Yield can support recovery after forest fires, helping communities restore forests in places like Kalimantan.',
  },
]

export default function HomePage() {
  usePageTitle('Give the interest, keep the money')
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
          <p className="t-small mt-4 max-w-md text-ink/80">No wallet needed to look around. Connecting never asks to spend anything.</p>
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

      <section aria-labelledby="examples-heading">
        <SectionHeading id="examples-heading" title="Your yield helps fund projects like these" description="The interest your deposit earns goes to approved causes. Here’s the kind of work it can fund." />
        <ul className="grid gap-4 md:grid-cols-2">
          {EXAMPLES.map((item) => (
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
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-forest">{item.title}</h3>
                  <span className="rounded-full border border-ink/30 px-2.5 py-0.5 text-xs font-medium text-ink/80">Example</span>
                </div>
                <p className="t-small prose-reading mt-1.5 text-ink/85">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="t-small prose-reading mt-3 text-ink/80">
          These are example projects, shown with stock photography. Yield goes only to causes approved by the vault owner. See the current recipients below.
        </p>
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
          title="Approved causes right now"
          description="The addresses that can receive yield from this vault."
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
