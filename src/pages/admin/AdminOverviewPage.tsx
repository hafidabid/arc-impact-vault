import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { parseUnits } from 'viem'
import { vaultAbi } from '@/chain/abi'
import { CHAIN, STRATEGY_ADDRESS, VAULT_ADDRESS } from '@/chain/config'
import { isUnlimited, PHASE_LABEL, sweepOpensAt, vaultPhase } from '@/chain/derive'
import { useNow, useVaultSnapshot } from '@/chain/hooks'
import { AddressLink } from '@/components/chain/AddressLink'
import { AdminGate } from '@/components/layout/AdminGate'
import { PageHeader, SyncError, usePageTitle } from '@/components/layout/PageParts'
import { Callout } from '@/components/ui/Callout'
import { Definition, SectionHeading, Skeleton } from '@/components/ui/Misc'
import { Chip, PhaseChip } from '@/components/ui/StatusChip'
import { AdminAction } from '@/components/vault/AdminAction'
import { BalanceCard } from '@/components/vault/BalanceCard'
import { fmtUnixDateTime } from '@/lib/format'
import { fmtUsdc, parseAmountInput } from '@/lib/units'

const base = { address: VAULT_ADDRESS, abi: vaultAbi, chainId: CHAIN.id } as const

function CapForm({ current }: { current: bigint }) {
  const [text, setText] = useState('')
  const parsed = text ? parseAmountInput(text) : null
  return (
    <div className="space-y-3">
      <div className="max-w-xs">
        <label className="field-label" htmlFor="cap">
          New lifetime deposit cap (USDC)
        </label>
        <input id="cap" className="input num" inputMode="decimal" value={text} placeholder={isUnlimited(current) ? 'Currently unlimited' : fmtUsdc(current)} onChange={(event) => setText(event.target.value)} aria-invalid={parsed && !parsed.ok ? true : undefined} />
        {parsed && !parsed.ok ? <p className="field-error">{parsed.error}</p> : <p className="field-help">After the first deposit the cap can only be raised.</p>}
      </div>
      <AdminAction
        scope="cap"
        title="Set deposit cap"
        description="Limits the lifetime principal the vault will accept."
        buttonLabel="Update cap"
        args={parsed?.ok ? { ...base, functionName: 'setDepositCap', args: [parseUnits(text.replace(/,/g, ''), 6)] } : undefined}
        disabledReason={parsed?.ok ? undefined : 'Enter a valid amount.'}
      />
    </div>
  )
}

function Overview() {
  const snapshot = useVaultSnapshot()
  const now = useNow()
  if (snapshot.status === 'error') return <SyncError onRetry={snapshot.refetch} />
  if (snapshot.status === 'loading') return <Skeleton className="h-64" />
  const v = snapshot.data
  const phase = vaultPhase(v, now)
  const sweepAt = sweepOpensAt(v)
  const reserved = v.principalOwed + v.yieldRemaining
  const reconciles = v.isSettled ? v.vaultUsdc >= reserved : null
  const canSettle = !v.isSettled && !v.inKindExit && (v.emergency || now >= v.maturity)

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <PhaseChip phase={phase} />
        {v.paused ? <Chip tone="accent">Deposits paused</Chip> : null}
        {v.emergency ? <Chip tone="bad">Emergency shutdown active</Chip> : null}
        {v.inKindExit ? <Chip tone="bad">In-kind exit enabled</Chip> : null}
        <Chip tone="neutral">{v.isSettled ? 'Withdrawals open' : v.emergency || now >= v.maturity ? 'Withdrawals open on claim' : 'Withdrawals locked until maturity'}</Chip>
      </div>

      <section aria-labelledby="balances">
        <SectionHeading id="balances" title="Balances" description="Principal and yield are shown separately and never combined." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BalanceCard label="Outstanding user principal" value={v.unclaimedPrincipal} note="Owed to depositors who have not yet claimed." />
          <BalanceCard label="Total principal ever deposited" value={v.totalPrincipal} />
          <BalanceCard label="Reserved for principal claims" value={v.principalOwed} note={v.isSettled ? 'Held by the vault after settlement.' : 'Nominal principal before settlement.'} />
          <BalanceCard label={v.isSettled ? 'Yield realised' : 'Estimated yield'} value={v.isSettled ? v.yieldPool : v.projectedYield} note={v.isSettled ? undefined : 'An estimate that may change before settlement.'} />
          <BalanceCard label="Yield not yet distributed" value={v.yieldRemaining} note="Reserved for approved causes." />
          <BalanceCard label="USDC held by vault contract" value={v.vaultUsdc} note={v.isSettled ? undefined : 'Principal is invested in the strategy until settlement, so this is normally zero.'} />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="recon">
        <SectionHeading id="recon" title="Reconciliation" />
        {reconciles === null ? (
          <Callout tone="info">Reconciliation applies after settlement, when the vault holds USDC. Before then, principal sits in the strategy.</Callout>
        ) : reconciles ? (
          <Callout tone="success" title="Balanced">
            The vault holds {fmtUsdc(v.vaultUsdc)} USDC against {fmtUsdc(reserved)} USDC reserved for principal claims and undistributed yield.
          </Callout>
        ) : (
          <Callout live tone="error" title="Reconciliation exception">
            The vault holds {fmtUsdc(v.vaultUsdc)} USDC but {fmtUsdc(reserved)} USDC is reserved. Investigate before distributing yield.
          </Callout>
        )}
      </section>

      <section className="mt-10" aria-labelledby="flow">
        <SectionHeading id="flow" title="Fund flow" />
        <div className="card space-y-3 text-[15px]">
          <p className="flex flex-wrap items-center gap-2">
            <Chip>Depositor wallet</Chip>
            <ArrowRight aria-hidden className="h-4 w-4" />
            <Chip>ImpactVault</Chip>
            <ArrowRight aria-hidden className="h-4 w-4" />
            <Chip>Yield strategy</Chip>
            <span className="t-small text-ink/75">principal in</span>
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <Chip>ImpactVault</Chip>
            <ArrowRight aria-hidden className="h-4 w-4" />
            <Chip tone="accent">Approved cause</Chip>
            <span className="t-small text-ink/75">realised yield only. Principal never goes to a cause.</span>
          </p>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="config">
        <SectionHeading id="config" title="Configuration" />
        <dl className="card space-y-3">
          <Definition term="Network">{CHAIN.name}</Definition>
          <Definition term="Vault"><AddressLink address={VAULT_ADDRESS} full /></Definition>
          <Definition term="Strategy"><AddressLink address={STRATEGY_ADDRESS} full /></Definition>
          <Definition term="Default cause"><AddressLink address={v.fallbackCause} full /></Definition>
          <Definition term="Deposit deadline">{fmtUnixDateTime(v.depositDeadline)}</Definition>
          <Definition term="Maturity">{fmtUnixDateTime(v.maturity)}</Definition>
          <Definition term="Deposit cap">{isUnlimited(v.depositCap) ? 'Unlimited' : `${fmtUsdc(v.depositCap)} USDC`}</Definition>
          <Definition term="Status">{PHASE_LABEL[phase]}</Definition>
        </dl>
      </section>

      <section className="mt-10" aria-labelledby="controls">
        <SectionHeading id="controls" title="Controls" description="Each action is a contract call. The contract rejects any caller except the owner where noted." />
        <div className="grid gap-4 lg:grid-cols-2">
          <AdminAction
            scope="pause"
            title={v.paused ? 'Resume deposits' : 'Pause deposits'}
            description="Pausing stops new deposits only. Settlement, withdrawals and yield distribution are unaffected."
            buttonLabel={v.paused ? 'Resume deposits' : 'Pause deposits'}
            args={{ ...base, functionName: v.paused ? 'unpause' : 'pause' }}
          />
          <CapForm current={v.depositCap} />
          <AdminAction
            scope="settle"
            title="Settle vault"
            description="Redeems the strategy and fixes principal and yield. Anyone can do this at or after maturity."
            buttonLabel="Settle"
            args={{ ...base, functionName: 'settle' }}
            disabledReason={v.isSettled ? 'Already settled.' : v.inKindExit ? 'In-kind exit is active.' : !canSettle ? 'Not mature yet.' : undefined}
          />
          <AdminAction
            scope="sweep"
            title="Send remaining yield to default cause"
            description="After the grace period, anyone can send yield that has not been donated to the default cause."
            buttonLabel="Send to default cause"
            args={{ ...base, functionName: 'sweepYieldToFallback' }}
            disabledReason={!v.isSettled ? 'The vault has not settled.' : sweepAt !== null && now < sweepAt ? `Opens ${fmtUnixDateTime(sweepAt)}.` : v.yieldRemaining === 0n ? 'No yield left.' : undefined}
          />
          <AdminAction
            scope="emergency"
            danger
            title="Emergency shutdown"
            description="Irreversible. Permanently closes deposits and lets depositors claim early. It cannot be undone."
            buttonLabel="Shut down vault"
            confirmWord="SHUTDOWN"
            args={{ ...base, functionName: 'emergencyShutdown' }}
            disabledReason={v.isSettled ? 'Already settled.' : v.emergency ? 'Already active.' : undefined}
          />
          <AdminAction
            scope="inkind"
            danger
            title="Enable in-kind exit"
            description="Irreversible. Only if the strategy cannot be redeemed after an emergency: depositors then claim strategy shares instead of USDC, and any embedded yield goes to them rather than causes."
            buttonLabel="Enable in-kind exit"
            confirmWord="IN-KIND"
            args={{ ...base, functionName: 'enableInKindExit' }}
            disabledReason={!v.emergency ? 'Requires an emergency shutdown first.' : v.isSettled ? 'Already settled.' : v.inKindExit ? 'Already enabled.' : undefined}
          />
        </div>
      </section>
    </>
  )
}

export default function AdminOverviewPage() {
  usePageTitle('Admin overview')
  return (
    <>
      <PageHeader eyebrow="Admin" title="Overview" description="Vault state, reconciliation and owner controls." />
      <AdminGate>{() => <Overview />}</AdminGate>
      <Callout tone="info" className="mt-10">
        There is no balance-edit or history-delete control. Every figure here is read from the contract.
      </Callout>
    </>
  )
}
