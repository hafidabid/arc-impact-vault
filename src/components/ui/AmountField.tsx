import { AlertCircle } from 'lucide-react'
import { useId } from 'react'
import { amountToInput, fmtUsdc } from '@/lib/units'

interface AmountFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | null
  help?: string
  /** Shown as "<balanceLabel>: x.xx USDC" with a Max control. */
  balanceLabel?: string
  balance?: bigint
  disabled?: boolean
}

export function AmountField({ label, value, onChange, error, help, balanceLabel, balance, disabled }: AmountFieldProps) {
  const id = useId()
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="field-label !mb-0">
          {label}
        </label>
        {balance !== undefined ? (
          <button
            type="button"
            className="t-small min-h-[44px] rounded-control px-2 font-medium text-forest underline decoration-forest/40 underline-offset-4 hover:bg-sage/20 disabled:opacity-50"
            onClick={() => onChange(amountToInput(balance))}
            disabled={disabled}
          >
            Max: {fmtUsdc(balance)}
          </button>
        ) : null}
      </div>
      <div className="relative mt-1">
        <input
          id={id}
          className="input num pr-20 text-lg font-semibold"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={[help ? helpId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-ink/75">
          USDC
        </span>
      </div>
      {balanceLabel && balance !== undefined ? (
        <p className="field-help">
          {balanceLabel}: <span className="num font-medium text-ink">{fmtUsdc(balance)} USDC</span>
        </p>
      ) : null}
      {help ? (
        <p id={helpId} className="field-help">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="field-error">
          <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  )
}
