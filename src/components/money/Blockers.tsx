import { Link } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { DEMO_CONFIG } from '@/data/config'
import type { Overview } from '@/lib/selectors'
import type { BlockReason, VaultState } from '@/lib/types'
import { useVault } from '@/state/VaultProvider'
import { ConnectButton } from '@/components/layout/ConnectButton'

export type MoneyKind = 'deposit' | 'allocation' | 'withdrawal'

/** Checks that gate a flow before anything is requested from the wallet. */
export function blockReasonFor(
  state: VaultState,
  overview: Overview,
  kind: MoneyKind,
  amount: bigint | null,
): BlockReason | null {
  if (!overview.connected) return 'no-wallet'
  if (overview.wrongNetwork) return 'wrong-network'
  if (kind !== 'allocation' && state.scenario.fees === 'insufficient') return 'insufficient-fees'
  if (amount === null) return null
  if (kind === 'deposit' && amount > overview.walletUsdc) return 'insufficient-balance'
  if (kind === 'withdrawal' && amount > overview.balances.availablePrincipal) return 'insufficient-principal'
  if (kind === 'allocation' && amount > overview.balances.availableProceeds) return 'insufficient-proceeds'
  return null
}

export function BlockCallout({ reason }: { reason: BlockReason }) {
  const { client } = useVault()
  switch (reason) {
    case 'no-wallet':
      return (
        <Callout live tone="info" title="Connect a wallet to continue" action={<ConnectButton />}>
          Connecting does not request any spending approval.
        </Callout>
      )
    case 'wrong-network':
      return (
        <Callout
          live
          tone="error"
          title="Wrong network"
          action={
            <button type="button" className="btn btn-primary" onClick={() => void client.switchNetwork()}>
              Switch to {DEMO_CONFIG.networkLabel}
            </button>
          }
        >
          Your wallet is on a different network than the one configured for ImpactVault. Switch networks before continuing. Nothing was sent.
        </Callout>
      )
    case 'insufficient-fees':
      return (
        <Callout live tone="error" title="Not enough to cover network fees">
          This action needs a small network fee that is funded separately. Your principal and sponsor proceeds are never used for fees, so
          nothing was submitted. Add fee funds to your wallet, then try again.
        </Callout>
      )
    case 'insufficient-balance':
      return (
        <Callout live tone="error" title="Insufficient wallet balance">
          Your wallet does not hold enough USDC for this deposit. Enter a smaller amount.
        </Callout>
      )
    case 'insufficient-principal':
      return (
        <Callout live tone="error" title="More than your available principal">
          A withdrawal can use only available principal. Amounts reserved for pending withdrawals cannot be spent twice, and donations or
          sponsor proceeds are never deducted from principal.
        </Callout>
      )
    case 'insufficient-proceeds':
      return (
        <Callout live tone="error" title="More than your available proceeds">
          Allocation cannot exceed the eligible proceeds credited to you. <Link to="/activity" className="font-medium underline underline-offset-4">See activity</Link>.
        </Callout>
      )
  }
}
