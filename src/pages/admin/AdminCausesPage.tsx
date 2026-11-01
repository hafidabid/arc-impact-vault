import { useState } from 'react'
import { isAddress, parseUnits } from 'viem'
import { vaultAbi } from '@/chain/abi'
import { CHAIN, VAULT_ADDRESS } from '@/chain/config'
import { useCauses } from '@/chain/useCauses'
import { AddressLink } from '@/components/chain/AddressLink'
import { AdminGate } from '@/components/layout/AdminGate'
import { PageHeader, SyncError, usePageTitle } from '@/components/layout/PageParts'
import { Callout } from '@/components/ui/Callout'
import { SectionHeading, Skeleton } from '@/components/ui/Misc'
import { Chip } from '@/components/ui/StatusChip'
import { AdminAction } from '@/components/vault/AdminAction'
import { fmtUsdc, parseAmountInput } from '@/lib/units'

const base = { address: VAULT_ADDRESS, abi: vaultAbi, chainId: CHAIN.id } as const

function Causes() {
  const { snapshot, rows } = useCauses()
  const [newCause, setNewCause] = useState('')
  const [removeTarget, setRemoveTarget] = useState('')
  const [distTarget, setDistTarget] = useState('')
  const [amountText, setAmountText] = useState('')

  if (snapshot.status === 'error') return <SyncError onRetry={snapshot.refetch} />
  if (snapshot.status === 'loading' || !rows) return <Skeleton className="h-64" />
  const v = snapshot.data

  const addValid = isAddress(newCause)
  const already = addValid && v.approvedCauses.some((a) => a.toLowerCase() === newCause.toLowerCase())
  const amount = amountText ? parseAmountInput(amountText) : null
  const distValid = isAddress(distTarget)
  const removable = rows.filter((row) => !row.info.isFallback)

  return (
    <div className="space-y-10">
      <section aria-labelledby="approved">
        <SectionHeading id="approved" title="Approved causes" description="Yield can only be sent to these addresses. Removing a cause does not change past transfers." />
        <ul className="divide-y divide-ink/10 rounded-card border border-ink/15">
          {rows.map((row) => (
            <li key={row.info.address} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium">{row.info.name}</p>
                <AddressLink address={row.info.address} full />
              </div>
              <div className="flex items-center gap-3">
                {row.info.isFallback ? <Chip tone="accent">Fallback · cannot be removed</Chip> : null}
                <span className="num t-small">{row.distributed === undefined ? '…' : `${fmtUsdc(row.distributed)} USDC sent`}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="distribute" className="space-y-3">
        <SectionHeading id="distribute" title="Distribute yield" description={`Undistributed yield: ${fmtUsdc(v.yieldRemaining)} USDC. Available once the vault has settled.`} />
        <div className="card grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="dist-cause">
              Cause
            </label>
            <select id="dist-cause" className="input" value={distTarget} onChange={(event) => setDistTarget(event.target.value)}>
              <option value="">Select a cause</option>
              {rows.map((row) => (
                <option key={row.info.address} value={row.info.address}>
                  {row.info.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="dist-amount">
              Amount (USDC)
            </label>
            <input id="dist-amount" className="input num" inputMode="decimal" value={amountText} onChange={(event) => setAmountText(event.target.value)} placeholder="0.00" aria-invalid={amount && !amount.ok ? true : undefined} />
            {amount && !amount.ok ? <p className="field-error">{amount.error}</p> : null}
            {amount?.ok && amount.value > v.yieldRemaining ? <p className="field-error">More than the remaining yield.</p> : null}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <AdminAction
            scope="distribute"
            title="Distribute amount"
            description="Sends this amount of settled yield to the selected cause. This is a real token transfer and cannot be reversed."
            buttonLabel="Send yield"
            args={distValid && amount?.ok && amount.value <= v.yieldRemaining ? { ...base, functionName: 'distributeYield', args: [distTarget, parseUnits(amountText.replace(/,/g, ''), 6)] } : undefined}
            disabledReason={!v.isSettled ? 'The vault has not settled.' : !distValid ? 'Select a cause.' : !amount?.ok ? 'Enter an amount.' : amount.value > v.yieldRemaining ? 'Amount exceeds remaining yield.' : undefined}
          />
          <AdminAction
            scope="distribute-all"
            title="Distribute all remaining yield"
            description={`Sends the full ${fmtUsdc(v.yieldRemaining)} USDC remaining to the selected cause.`}
            buttonLabel="Send all remaining yield"
            args={distValid ? { ...base, functionName: 'distributeAllYield', args: [distTarget] } : undefined}
            disabledReason={!v.isSettled ? 'The vault has not settled.' : !distValid ? 'Select a cause.' : v.yieldRemaining === 0n ? 'No yield remaining.' : undefined}
          />
        </div>
      </section>

      <section aria-labelledby="manage" className="space-y-3">
        <SectionHeading id="manage" title="Add or remove a cause" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="field-label" htmlFor="add-cause">
                Recipient address
              </label>
              <input id="add-cause" className="input num" value={newCause} onChange={(event) => setNewCause(event.target.value.trim())} placeholder="0x…" autoComplete="off" aria-invalid={newCause && !addValid ? true : undefined} />
              {newCause && !addValid ? <p className="field-error">Enter a valid address.</p> : <p className="field-help">Check the address carefully. Yield sent to it cannot be recovered.</p>}
            </div>
            <AdminAction
              scope="add-cause"
              title="Approve cause"
              description="Adds this address to the list of recipients that can receive yield."
              buttonLabel="Approve cause"
              args={addValid && !already ? { ...base, functionName: 'addCause', args: [newCause] } : undefined}
              disabledReason={!addValid ? 'Enter a valid address.' : already ? 'Already approved.' : undefined}
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className="field-label" htmlFor="rm-cause">
                Cause to remove
              </label>
              <select id="rm-cause" className="input" value={removeTarget} onChange={(event) => setRemoveTarget(event.target.value)}>
                <option value="">Select a cause</option>
                {removable.map((row) => (
                  <option key={row.info.address} value={row.info.address}>
                    {row.info.name}
                  </option>
                ))}
              </select>
            </div>
            <AdminAction
              scope="remove-cause"
              title="Remove cause"
              description="Stops future yield going to this address. The fallback cause can never be removed."
              buttonLabel="Remove cause"
              args={isAddress(removeTarget) ? { ...base, functionName: 'removeCause', args: [removeTarget] } : undefined}
              disabledReason={isAddress(removeTarget) ? undefined : 'Select a cause.'}
            />
          </div>
        </div>
        <Callout tone="info">Pool names and purposes shown to the public are configured with the app, not on-chain. The contract only stores addresses.</Callout>
      </section>
    </div>
  )
}

export default function AdminCausesPage() {
  usePageTitle('Admin causes')
  return (
    <>
      <PageHeader eyebrow="Admin" title="Causes and yield" description="Approve recipients and send realised yield to them." />
      <AdminGate>{() => <Causes />}</AdminGate>
    </>
  )
}
