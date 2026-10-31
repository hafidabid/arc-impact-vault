import { HandHeart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PoolPicker } from '@/components/pools/PoolPicker'
import { AmountField } from '@/components/ui/AmountField'
import { Callout } from '@/components/ui/Callout'
import { Sheet } from '@/components/ui/Sheet'
import { COPY } from '@/data/copy'
import { POOL_BY_ID } from '@/data/pools'
import type { PoolId } from '@/lib/types'
import { amountToInput, fmtUsdc, parseAmountInput } from '@/lib/units'
import { useFlow, useVault } from '@/state/VaultProvider'
import { BlockCallout, blockReasonFor } from './Blockers'
import { FlowRow } from './FlowRow'
import { FlowOutcome, ProgressSteps } from './TxPanel'

interface AllocateSheetProps {
  open: boolean
  onClose: () => void
  initialPool?: PoolId | null
}

export function AllocateSheet({ open, onClose, initialPool }: AllocateSheetProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Allocate proceeds"
      description="Direct sponsor-funded demo proceeds to one pool. One pool per action."
    >
      <AllocateBody onClose={onClose} initialPool={initialPool} />
    </Sheet>
  )
}

/** Mounted only while the sheet is open, so every opening starts from a fresh form. */
function AllocateBody({ onClose, initialPool }: { onClose: () => void; initialPool?: PoolId | null }) {
  const { state, overview, client } = useVault()
  const available = overview.balances.availableProceeds
  const [pool, setPool] = useState<PoolId | null>(initialPool ?? state.poolPreference)
  const [text, setText] = useState(amountToInput(available))
  const [reviewing, setReviewing] = useState(false)
  const flow = useFlow()

  const parsed = useMemo(() => parseAmountInput(text), [text])
  const amount = parsed.ok ? parsed.value : null
  const amountError = !parsed.ok ? parsed.error : amount !== null && amount > available ? `You can allocate up to ${fmtUsdc(available)} USDC.` : null
  const block = blockReasonFor(state, overview, 'allocation', amount)
  const valid = pool !== null && amount !== null && !amountError && !block
  const busy = flow.busy
  const finished = flow.result !== null && flow.result.status !== 'blocked'

  const authorize = async () => {
    if (!valid || pool === null || amount === null) return
    await flow.run((onPhase) => client.allocate(pool, amount, onPhase))
  }

  return (
    <>
      {finished && flow.result ? (
        <div className="space-y-4">
          <FlowOutcome kind="allocation" result={flow.result} onReset={() => { flow.reset(); setReviewing(true) }} />
          <button type="button" className="btn btn-secondary w-full" onClick={onClose}>
            Done
          </button>
        </div>
      ) : busy ? (
        <div className="space-y-4">
          <ProgressSteps kind="allocation" phase={flow.phase} />
          <p className="t-small text-ink/80">You can close this window. Pending activity is kept by operation ID.</p>
        </div>
      ) : !reviewing ? (
        <div className="space-y-5">
          <Callout tone="sponsor" title={COPY.proceedsSentence}>
            {COPY.donationNote}
          </Callout>
          <PoolPicker legend="Choose a pool" value={pool} onChange={setPool} />
          <AmountField
            label="Amount to allocate"
            value={text}
            onChange={setText}
            error={amountError}
            balance={available}
            balanceLabel="Available proceeds"
            help="Allocating does not change your deposited principal."
          />
          {block ? <BlockCallout reason={block} /> : null}
          <button type="button" className="btn btn-primary w-full" disabled={!valid} onClick={() => setReviewing(true)}>
            Review allocation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pool && amount !== null ? (
            <>
              <FlowRow
                layer="ledger"
                from="Your attributed demo proceeds"
                fromHint="Sponsor-funded, from lot demo-sponsor-lot-001"
                to={POOL_BY_ID[pool].name}
                toHint="Reserved, then transferred to the configured demo recipient"
                amount={amount}
              />
              <dl className="t-small grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 rounded-card border border-ink/10 p-4">
                <dt className="text-ink/80">Deposited principal (not used)</dt>
                <dd className="num text-right font-medium">{fmtUsdc(overview.balances.principalPayable)} USDC</dd>
                <dt className="text-ink/80">Proceeds after this allocation</dt>
                <dd className="num text-right font-medium">{fmtUsdc(available - amount)} USDC</dd>
                <dt className="text-ink/80">Recipient configuration</dt>
                <dd className="text-right font-medium">{POOL_BY_ID[pool].recipientVersion}</dd>
              </dl>
              <p className="t-small prose-reading text-ink/85">
                You authorize one allocation. The amount is reserved, then routed. Reserving it is an internal ledger record and is not a
                second deposit. Your pool preference is not an authorization.
              </p>
              {block ? <BlockCallout reason={block} /> : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" className="btn btn-secondary sm:flex-1" onClick={() => setReviewing(false)}>
                  Back
                </button>
                <button type="button" className="btn btn-primary sm:flex-[2]" disabled={!valid} onClick={() => void authorize()}>
                  <HandHeart aria-hidden className="h-4 w-4" />
                  Authorize allocation
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </>
  )
}
