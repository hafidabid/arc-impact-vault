import { Check, Loader2, SearchCheck } from 'lucide-react'
import { useState } from 'react'
import { Callout } from '@/components/ui/Callout'
import { cx } from '@/lib/cx'
import type { FlowResult, Operation } from '@/lib/types'
import type { FlowUiPhase } from '@/state/VaultProvider'
import { useVault } from '@/state/VaultProvider'
import { Receipt } from './Receipt'

export type FlowKind = 'deposit' | 'allocation' | 'withdrawal'

interface Step {
  key: string
  label: string
  phases: FlowUiPhase[]
}

const STEPS: Record<FlowKind, Step[]> = {
  deposit: [
    { key: 'approve', label: 'Approve exact allowance', phases: ['awaiting-approval'] },
    { key: 'sign', label: 'Sign deposit', phases: ['awaiting-signature'] },
    { key: 'submit', label: 'Submit', phases: ['submitted'] },
    { key: 'confirm', label: 'Confirm', phases: ['pending'] },
  ],
  allocation: [
    { key: 'authorize', label: 'Authorize allocation', phases: ['awaiting-signature'] },
    { key: 'reserve', label: 'Reserve proceeds', phases: ['reserved'] },
    { key: 'route', label: 'Route transfer', phases: ['submitted'] },
    { key: 'confirm', label: 'Confirm transfer', phases: ['pending'] },
  ],
  withdrawal: [
    { key: 'authorize', label: 'Authorize withdrawal', phases: ['awaiting-signature'] },
    { key: 'reserve', label: 'Reserve principal', phases: ['reserved'] },
    { key: 'submit', label: 'Submit', phases: ['submitted'] },
    { key: 'confirm', label: 'Confirm', phases: ['pending'] },
  ],
}

const PHASE_TEXT: Record<Exclude<FlowUiPhase, 'idle'>, string> = {
  'awaiting-approval': 'Waiting for your wallet. Approve the exact allowance for this amount only.',
  'awaiting-signature': 'Waiting for your wallet signature. Nothing has moved yet.',
  reserved: 'Reserved. The amount is held so it cannot be spent twice. Nothing is confirmed yet.',
  submitted: 'Submitted to the network. Signing is not confirmation.',
  pending: 'Pending. Balances update only after the transaction is confirmed.',
}

export function ProgressSteps({ kind, phase }: { kind: FlowKind; phase: FlowUiPhase }) {
  const steps = STEPS[kind]
  const current = steps.findIndex((step) => step.phases.includes(phase))
  return (
    <div>
      <ol className="grid gap-2 sm:grid-cols-4" aria-label="Progress">
        {steps.map((step, index) => {
          const done = index < current
          const active = index === current
          return (
            <li
              key={step.key}
              aria-current={active ? 'step' : undefined}
              className={cx(
                'flex items-center gap-2.5 rounded-control border px-3 py-2.5 text-sm font-medium transition duration-150',
                active ? 'border-forest bg-forest/10' : 'border-ink/15 bg-ivory',
                !active && !done && 'text-ink/75',
              )}
            >
              <span
                aria-hidden
                className={cx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs',
                  done ? 'border-forest bg-forest text-ivory' : active ? 'border-forest text-forest' : 'border-ink/30',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : index + 1}
              </span>
              <span>{step.label}</span>
            </li>
          )
        })}
      </ol>
      {/* Announces state changes without moving focus. */}
      <p role="status" aria-live="polite" className="t-small mt-3 font-medium text-ink">
        {phase !== 'idle' ? PHASE_TEXT[phase] : ''}
      </p>
    </div>
  )
}

interface ResultProps {
  kind: FlowKind
  result: FlowResult
  onReset: () => void
  /** Fires when an unknown submission is later resolved by lookup. */
  onResolved?: () => void
}

export function FlowOutcome({ kind, result, onReset, onResolved }: ResultProps) {
  const { state, client } = useVault()
  const [lookup, setLookup] = useState<'idle' | 'checking' | 'still'>('idle')
  const operationId = 'operationId' in result ? result.operationId : undefined
  const operation: Operation | undefined = state.operations.find((op) => op.operationId === operationId)

  if (result.status === 'rejected') {
    return (
      <Callout
          live
        tone="warn"
        title={result.at === 'approval' ? 'Allowance request rejected' : 'Signature rejected'}
        action={
          <button type="button" className="btn btn-secondary" onClick={onReset}>
            Review and try again
          </button>
        }
      >
        You rejected the request in your wallet. Nothing was submitted and your balances are unchanged.
      </Callout>
    )
  }

  if (result.status === 'failed') {
    return (
      <div className="space-y-3">
        <Callout
          live
          tone="error"
          title={kind === 'allocation' ? 'Transfer failed' : kind === 'deposit' ? 'Deposit failed' : 'Withdrawal failed'}
          action={
            <button type="button" className="btn btn-secondary" onClick={onReset}>
              Start over
            </button>
          }
        >
          {kind === 'allocation'
            ? 'The transfer failed on the network. The reservation was released only after reconciliation, so your proceeds are available again. Your principal was not touched.'
            : kind === 'deposit'
              ? 'The deposit failed on the network. Your principal balance is unchanged.'
              : 'The withdrawal failed on the network. The reserved principal is available again.'}
        </Callout>
        {operation ? <Receipt operation={operation} /> : null}
      </div>
    )
  }

  if (result.status === 'unknown') {
    const resolved = operation?.status === 'confirmed'
    if (resolved) {
      return (
        <div className="space-y-3">
          <Callout live tone="success" title="Transaction confirmed">
            The receipt lookup found your transaction. It was never submitted twice.
          </Callout>
          {operation ? <Receipt operation={operation} /> : null}
        </div>
      )
    }
    return (
      <div className="space-y-3">
        <Callout
          live
          tone="info"
          title="Checking transaction"
          action={
            <button
              type="button"
              className="btn btn-primary"
              disabled={lookup === 'checking'}
              onClick={() => {
                setLookup('checking')
                void client.lookupReceipt(result.operationId).then((outcome) => {
                  setLookup(outcome === 'confirmed' ? 'idle' : 'still')
                  if (outcome === 'confirmed') onResolved?.()
                })
              }}
            >
              {lookup === 'checking' ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <SearchCheck aria-hidden className="h-4 w-4" />}
              Look up receipt
            </button>
          }
        >
          We could not confirm whether this was submitted. The amount stays reserved under operation{' '}
          <span className="num font-semibold">{result.operationId}</span> so it cannot be spent twice. Do not pay again: look up the receipt
          instead. It is safe to refresh.
          {lookup === 'still' ? <span className="mt-2 block font-medium">Still checking. No receipt is available yet.</span> : null}
        </Callout>
        {operation ? <Receipt operation={operation} showActivityLink /> : null}
      </div>
    )
  }

  if (result.status === 'confirmed' && operation) {
    return (
      <div className="space-y-3">
        <Callout live tone="success" title={kind === 'deposit' ? 'Deposit confirmed' : kind === 'allocation' ? 'Transfer confirmed' : 'Withdrawal confirmed'}>
          {kind === 'allocation'
            ? 'Principal stays unchanged. The proceeds you allocated are now counted once as confirmed donated.'
            : kind === 'deposit'
              ? 'Your deposited principal is updated. Sponsor proceeds are not created by a deposit.'
              : 'Your principal balance is updated.'}
        </Callout>
        <Receipt operation={operation} />
      </div>
    )
  }

  return null
}
