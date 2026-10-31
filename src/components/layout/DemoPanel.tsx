import { FlaskConical, RotateCcw } from 'lucide-react'
import { useId, useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { STAGE_LABELS } from '@/data/seed'
import type { DemoStage } from '@/data/seed'
import { cx } from '@/lib/cx'
import type { Scenario } from '@/lib/types'
import { useVault } from '@/state/VaultProvider'

interface SegmentedProps<K extends keyof Scenario> {
  legend: string
  hint?: string
  field: K
  options: { value: Scenario[K]; label: string }[]
}

function Segmented<K extends keyof Scenario>({ legend, hint, field, options }: SegmentedProps<K>) {
  const { state, client } = useVault()
  const name = useId()
  const current = state.scenario[field]
  return (
    <fieldset className="min-w-0">
      <legend className="t-label text-ink">{legend}</legend>
      {hint ? <p className="field-help !mt-0.5">{hint}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = current === option.value
          return (
            <label
              key={String(option.value)}
              className={cx(
                'inline-flex min-h-[44px] cursor-pointer items-center rounded-control border px-3.5 text-sm font-medium transition duration-150',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest',
                checked ? 'border-forest bg-forest text-ivory' : 'border-ink/25 bg-ivory text-ink hover:bg-sage/20',
              )}
            >
              <input
                type="radio"
                name={`${name}-${field}`}
                className="sr-only"
                checked={checked}
                onChange={() => client.setScenario({ [field]: option.value })}
              />
              {option.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function DemoPanelTrigger() {
  const [open, setOpen] = useState(false)
  const { client, overview } = useVault()
  return (
    <>
      <button type="button" className="btn btn-quiet min-h-[44px] gap-2 px-3 text-sm" onClick={() => setOpen(true)}>
        <FlaskConical aria-hidden className="h-4 w-4" />
        Demo controls
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Demo controls"
        description="Everything here is synthetic. Use these controls to reach every state in the flows. They do not exist in a live build."
      >
        <div className="space-y-6">
          <section aria-labelledby="demo-stage" className="space-y-2">
            <h3 id="demo-stage" className="t-label">
              Worked example progress
            </h3>
            <div className="grid gap-2">
              {(Object.keys(STAGE_LABELS) as unknown as DemoStage[]).map((stage) => (
                <button
                  key={stage}
                  type="button"
                  className="btn btn-quiet justify-start gap-3 px-3.5 text-left text-sm font-medium"
                  onClick={() => client.jumpToStage(Number(stage) as DemoStage)}
                >
                  <span aria-hidden className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/40 text-xs font-semibold">
                    {stage}
                  </span>
                  {STAGE_LABELS[stage]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                className="btn btn-secondary text-sm"
                disabled={!overview.hasPosition || overview.lotFunded}
                onClick={() => void client.fundDemoSponsorLot()}
              >
                Fund 0.20 USDC sponsor lot
              </button>
              <button
                type="button"
                className="btn btn-secondary text-sm"
                disabled={!overview.lotFunded || overview.lotAttributed}
                onClick={() => void client.attributeDemoSponsorLot()}
              >
                Attribute lot to this position
              </button>
            </div>
            <p className="field-help">Sponsor funding and attribution are separate events. A deposit never creates sponsor proceeds by itself.</p>
          </section>

          <Segmented
            legend="Wallet"
            field="wallet"
            options={[
              { value: 'available', label: 'Wallet available' },
              { value: 'missing', label: 'No wallet found' },
            ]}
          />
          <Segmented
            legend="Network"
            field="network"
            options={[
              { value: 'configured', label: 'Configured network' },
              { value: 'wrong', label: 'Wrong network' },
            ]}
          />
          <Segmented
            legend="Network fees"
            field="fees"
            options={[
              { value: 'funded', label: 'Fees funded' },
              { value: 'insufficient', label: 'Insufficient for fees' },
            ]}
          />
          <Segmented
            legend="Wallet signature"
            field="signature"
            options={[
              { value: 'approve', label: 'Approve' },
              { value: 'reject-approval', label: 'Reject allowance' },
              { value: 'reject-signature', label: 'Reject signature' },
            ]}
          />
          <Segmented
            legend="After submission"
            field="submission"
            options={[
              { value: 'confirm', label: 'Confirms' },
              { value: 'fail', label: 'Fails' },
              { value: 'ambiguous', label: 'Status unknown' },
            ]}
          />
          <Segmented
            legend="Data connection"
            hint="Loading and sync failures never show zero as a settled balance."
            field="data"
            options={[
              { value: 'ready', label: 'Ready' },
              { value: 'loading', label: 'Loading' },
              { value: 'sync-error', label: 'Sync failure' },
            ]}
          />

          <button type="button" className="btn btn-quiet w-full gap-2" onClick={() => client.resetDemo()}>
            <RotateCcw aria-hidden className="h-4 w-4" />
            Reset all demo data
          </button>
        </div>
      </Sheet>
    </>
  )
}
