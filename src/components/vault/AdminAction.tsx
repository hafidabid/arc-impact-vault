import { useState } from 'react'
import { useSession, useTransaction } from '@/chain/hooks'
import { TxPanel } from '@/components/chain/TxPanel'
import { cx } from '@/lib/cx'

type WriteArgs = Parameters<ReturnType<typeof useTransaction>['send']>[1]

/**
 * One contract action with an optional typed confirmation for irreversible steps. Each action owns its
 * transaction state so results stay next to the control that caused them.
 */
export function AdminAction({
  scope,
  title,
  description,
  buttonLabel,
  args,
  disabledReason,
  confirmWord,
  danger = false,
}: {
  scope: string
  title: string
  description: string
  buttonLabel: string
  args: WriteArgs | undefined
  disabledReason?: string
  confirmWord?: string
  danger?: boolean
}) {
  const { tx, send, recheck, reset, busy } = useTransaction(scope)
  const session = useSession()
  const [typed, setTyped] = useState('')
  const confirmed = !confirmWord || typed === confirmWord
  const disabled = Boolean(disabledReason) || !args || busy || !confirmed || session.wrongNetwork

  return (
    <section className={cx('card', danger && 'border-[#8a2f1d]/45')} aria-label={title}>
      <h3 className="font-semibold text-forest">{title}</h3>
      <p className="t-small prose-reading mt-1 text-ink/85">{description}</p>
      {disabledReason ? <p className="t-small mt-2 font-medium text-ink/85">Unavailable: {disabledReason}</p> : null}
      {confirmWord && !disabledReason ? (
        <div className="mt-3 max-w-xs">
          <label className="field-label" htmlFor={`${scope}-confirm`}>
            Type {confirmWord} to confirm
          </label>
          <input id={`${scope}-confirm`} className="input" value={typed} autoComplete="off" onChange={(event) => setTyped(event.target.value)} />
        </div>
      ) : null}
      <button
        type="button"
        className={cx('btn mt-4', danger ? 'btn-secondary border-[#8a2f1d] text-[#7a2a1a]' : 'btn-primary')}
        disabled={disabled}
        onClick={() => {
          if (args) void send(title, args).then(() => setTyped(''))
        }}
      >
        {buttonLabel}
      </button>
      <div className="mt-3">
        <TxPanel tx={tx} onRecheck={recheck} onDismiss={reset} />
      </div>
    </section>
  )
}
