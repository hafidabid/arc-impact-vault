import { Check } from 'lucide-react'
import { useId } from 'react'
import { POOLS } from '@/data/pools'
import { cx } from '@/lib/cx'
import type { PoolId } from '@/lib/types'
import { PoolGlyph } from './PoolGlyph'

interface PoolPickerProps {
  legend: string
  value: PoolId | null
  onChange: (id: PoolId) => void
  hint?: string
}

/** Exactly two choices. Radio semantics, keyboard operable, selection shown with a check and a border. */
export function PoolPicker({ legend, value, onChange, hint }: PoolPickerProps) {
  const name = useId()
  return (
    <fieldset>
      <legend className="field-label">{legend}</legend>
      {hint ? <p className="field-help !mt-0 mb-2">{hint}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {POOLS.map((pool) => {
          const checked = value === pool.id
          return (
            <label
              key={pool.id}
              className={cx(
                'relative flex min-h-[88px] cursor-pointer items-start gap-3 rounded-card border p-4 transition duration-150',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest',
                checked ? 'border-forest bg-forest/[0.07] shadow-card ring-1 ring-forest' : 'border-ink/20 bg-ivory hover:bg-sage/15',
              )}
            >
              <input type="radio" name={name} className="sr-only" checked={checked} onChange={() => onChange(pool.id)} />
              <PoolGlyph id={pool.id} className="h-10 w-10 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold leading-snug">{pool.name}</span>
                <span className="t-small mt-0.5 block text-ink/80">{pool.short}</span>
              </span>
              <span
                aria-hidden
                className={cx(
                  'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                  checked ? 'border-forest bg-forest text-ivory' : 'border-ink/35',
                )}
              >
                {checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
