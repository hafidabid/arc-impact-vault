import { CheckCircle2, Circle } from 'lucide-react'
import { sweepOpensAt } from '@/chain/derive'
import type { VaultSnapshot } from '@/chain/derive'
import { cx } from '@/lib/cx'
import { fmtDuration, fmtUnixDateTime } from '@/lib/format'

interface Step {
  title: string
  at: bigint | null
  done: boolean
  hint: string
}

export function Timeline({ vault, now }: { vault: VaultSnapshot; now: bigint }) {
  const sweepAt = sweepOpensAt(vault)
  const steps: Step[] = [
    { title: 'Deposits close', at: vault.depositDeadline, done: now >= vault.depositDeadline || vault.emergency || vault.isSettled, hint: 'No new deposits after this time.' },
    { title: 'Maturity', at: vault.maturity, done: now >= vault.maturity || vault.emergency || vault.isSettled, hint: 'Principal can be claimed once the vault settles.' },
    {
      title: 'Settlement',
      at: vault.isSettled ? vault.settledAt : null,
      done: vault.isSettled,
      hint: vault.isSettled ? 'Strategy redeemed. Principal and yield are reserved.' : 'Happens when anyone settles at or after maturity, or on claim.',
    },
    {
      title: 'Default-cause transfer opens',
      at: sweepAt,
      done: sweepAt !== null && now >= sweepAt,
      hint: 'Any yield not yet donated after the grace period can be sent by anyone to the default cause.',
    },
  ]
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => {
        const last = index === steps.length - 1
        // The connector below a step is "live" when that step is done but the next one is not: it marks
        // exactly where the vault currently sits, so the travelling dashes point at the pending step.
        const live = step.done && !last && !steps[index + 1].done
        return (
        <li key={step.title} className="flex gap-3">
          <div className="relative flex shrink-0 flex-col items-center">
            {/* The marker is the only visual cue for done vs upcoming, so it has to clear 3:1 (ink/55 = 3.26:1). */}
            {step.done ? <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 text-forest" /> : <Circle aria-hidden className="mt-0.5 h-5 w-5 text-ink/55" />}
            {last ? null : (
              <span
                aria-hidden
                className={
                  live
                    ? 'mt-1 w-px flex-1 animate-timeline-travel bg-[linear-gradient(to_bottom,#164D42_0_7px,transparent_7px_14px)] bg-[length:1px_14px]'
                    : cx('mt-1 w-px flex-1', step.done ? 'bg-forest/45' : 'bg-ink/25')
                }
              />
            )}
          </div>
          <div className="min-w-0 pb-1">
            <p className="font-medium">
              {step.title}
              <span className="sr-only">{step.done ? ' (done)' : ' (upcoming)'}</span>
            </p>
            <p className="t-small num text-ink/85">
              {step.at !== null ? fmtUnixDateTime(step.at) : 'Date set at settlement'}
              {step.at !== null && !step.done && step.at > now ? ` · in ${fmtDuration(step.at - now)}` : ''}
            </p>
            <p className="t-small text-ink/75">{step.hint}</p>
          </div>
        </li>
        )
      })}
    </ol>
  )
}
