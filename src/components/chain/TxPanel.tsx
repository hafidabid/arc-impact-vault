import { CheckCircle2, Loader2, OctagonAlert, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import type { TxStage } from '@/chain/hooks'
import { Callout } from '@/components/ui/Callout'
import { TxLink } from './AddressLink'

/**
 * Announces transaction state changes politely without moving focus. "Checking transaction" never
 * offers a fresh payment: it offers a receipt lookup for the same hash.
 */
export function TxPanel({ tx, onRecheck, onDismiss, success }: { tx: TxStage; onRecheck: () => void; onDismiss: () => void; success?: ReactNode }) {
  return (
    <div aria-live="polite" className="empty:hidden">
      {tx.stage === 'awaiting-signature' ? (
        <Callout tone="info" title="Confirm in your wallet">
          <span className="inline-flex items-center gap-2">
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            {tx.label}. Nothing has been sent yet.
          </span>
        </Callout>
      ) : null}
      {tx.stage === 'submitted' ? (
        <Callout tone="info" title="Pending">
          <span className="inline-flex items-center gap-2">
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            {tx.label} was submitted. Balances update once it is confirmed.
          </span>
          <p className="mt-1">
            Transaction <TxLink hash={tx.hash} />
          </p>
        </Callout>
      ) : null}
      {tx.stage === 'checking' ? (
        <Callout
          tone="warn"
          title="Checking transaction"
          action={
            <button type="button" className="btn btn-secondary" onClick={onRecheck}>
              <RefreshCw aria-hidden className="h-4 w-4" />
              Check again
            </button>
          }
        >
          We could not confirm the status of {tx.label.toLowerCase()} yet. It may still go through, so do not send it again. Transaction{' '}
          <TxLink hash={tx.hash} />
        </Callout>
      ) : null}
      {tx.stage === 'confirmed' ? (
        <Callout
          tone="success"
          title="Confirmed"
          action={
            <button type="button" className="btn btn-quiet" onClick={onDismiss}>
              Dismiss
            </button>
          }
        >
          <span className="inline-flex items-start gap-2">
            <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {tx.label} is confirmed. Receipt: <TxLink hash={tx.hash} />
              {success ? <span className="mt-1 block">{success}</span> : null}
            </span>
          </span>
        </Callout>
      ) : null}
      {tx.stage === 'failed' ? (
        <Callout
          live
          tone={tx.failure.kind === 'rejected' ? 'warn' : 'error'}
          title={tx.failure.kind === 'rejected' ? 'Request declined in your wallet' : 'Transaction did not complete'}
          action={
            <button type="button" className="btn btn-quiet" onClick={onDismiss}>
              Dismiss
            </button>
          }
        >
          <span className="inline-flex items-start gap-2">
            <OctagonAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {tx.failure.kind === 'rejected'
                ? 'You declined the request, so nothing was sent and your balances are unchanged.'
                : tx.failure.message}
              {tx.hash ? (
                <span className="mt-1 block">
                  Transaction <TxLink hash={tx.hash} />
                </span>
              ) : null}
            </span>
          </span>
        </Callout>
      ) : null}
    </div>
  )
}
