import type {
  FlowPhase,
  FlowResult,
  LookupResult,
  PoolId,
  Scenario,
  VaultState,
} from '@/lib/types'
import type { DemoStage } from '@/data/seed'

export type PhaseListener = (phase: FlowPhase) => void

/**
 * The only surface the UI talks to. The demo ships a mock implementation
 * (`mock-client.ts`). A live implementation (wallet, contract, indexer API) can replace it by
 * implementing this interface and changing the single `vaultClient` export in `services/index.ts`.
 */
export interface VaultClient {
  /** Immutable snapshot. The reference changes only when state changes. */
  getState(): VaultState
  subscribe(listener: () => void): () => void

  // Wallet session
  connectWallet(): Promise<'connected' | 'missing-wallet'>
  disconnectWallet(): void
  switchNetwork(): Promise<void>

  // Preferences (a pool preference never authorizes a transfer)
  setPoolPreference(poolId: PoolId): void
  completeOnboarding(): void

  // Money flows. Each resolves only after the flow ends; `onPhase` reports progress.
  deposit(amount: bigint, onPhase: PhaseListener): Promise<FlowResult>
  allocate(poolId: PoolId, amount: bigint, onPhase: PhaseListener): Promise<FlowResult>
  withdraw(amount: bigint, onPhase: PhaseListener): Promise<FlowResult>

  /** Looks a pending or unknown operation up by its stable operation ID. Never creates a new payment. */
  lookupReceipt(operationId: string): Promise<LookupResult>

  // Demo-only controls. A live client implements these as no-ops.
  setScenario(patch: Partial<Scenario>): void
  jumpToStage(stage: DemoStage): void
  resetDemo(): void
  fundDemoSponsorLot(): Promise<boolean>
  attributeDemoSponsorLot(): Promise<boolean>
}
