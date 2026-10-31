import { CircleDashed } from 'lucide-react'
import { COPY } from '@/data/copy'
import { DemoPanelTrigger } from './DemoPanel'

export function DemoBanner() {
  return (
    <div className="border-b border-ink/15 bg-gold/45">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1.5 md:px-6">
        <p className="t-small flex min-w-0 items-start gap-2 font-medium text-ink">
          <CircleDashed aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{COPY.demoBanner}</span>
        </p>
        <DemoPanelTrigger />
      </div>
    </div>
  )
}
