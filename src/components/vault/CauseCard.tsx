import { ArrowRight, HeartHandshake } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AddressLink } from '@/components/chain/AddressLink'
import { Chip } from '@/components/ui/StatusChip'
import { causeSlug } from '@/data/causes'
import type { CauseInfo } from '@/data/causes'
import { fmtUsdc } from '@/lib/units'

export function CauseCard({ cause, distributed }: { cause: CauseInfo; distributed: bigint | undefined }) {
  return (
    <article className="card flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-control bg-sage/35 text-forest">
          <HeartHandshake className="h-6 w-6" />
        </span>
        {cause.isFallback ? <Chip tone="accent">Fallback</Chip> : null}
      </div>
      <h3 className="mt-3 text-xl font-semibold text-forest">{cause.name}</h3>
      <p className="t-small prose-reading mt-1 text-ink/85">{cause.purpose}</p>
      <dl className="mt-4 space-y-2 text-[15px]">
        <div className="flex flex-wrap justify-between gap-x-4">
          <dt className="t-small text-ink/80">Recipient address</dt>
          <dd>
            <AddressLink address={cause.address} />
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-4">
          <dt className="t-small text-ink/80">Yield transferred</dt>
          <dd className="num font-medium">{distributed === undefined ? 'Loading…' : `${fmtUsdc(distributed)} USDC`}</dd>
        </div>
      </dl>
      <Link to={`/impact/${causeSlug(cause.address)}`} className="btn btn-secondary mt-5 self-start">
        View details
        <ArrowRight aria-hidden className="h-4 w-4" />
        <span className="sr-only">for {cause.name}</span>
      </Link>
    </article>
  )
}
