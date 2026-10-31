import { DEMO_LOT_ID, DEMO_POSITION_ID, DEMO_SPONSOR_LOT, operationsForStage } from '@/data/seed'
import type { DemoStage } from '@/data/seed'
import { POOL_BY_ID } from '@/data/pools'
import { computeBalances, entriesFor, hasAttributedLot, hasFundedLot, nextOperationId } from '@/lib/ledger'
import { walletBalance } from '@/lib/selectors'
import type {
  BlockReason,
  FlowResult,
  LookupResult,
  Operation,
  OperationType,
  PoolId,
  Scenario,
  VaultState,
} from '@/lib/types'
import { loadState, saveState } from './persist'
import type { PhaseListener, VaultClient } from './vault-client'

const DEFAULT_SCENARIO: Scenario = {
  wallet: 'available',
  network: 'configured',
  fees: 'funded',
  signature: 'approve',
  submission: 'confirm',
  data: 'ready',
}

const initialState = (): VaultState => ({
  version: 1,
  session: { status: 'disconnected', network: 'configured' },
  scenario: { ...DEFAULT_SCENARIO },
  operations: operationsForStage(5),
  poolPreference: null,
  onboardingComplete: false,
})

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))
const now = () => new Date().toISOString()

interface OpInit {
  type: OperationType
  amount: bigint
  poolId?: PoolId
  status: Operation['status']
  from: string
  to: string
  layer: Operation['layer']
  linkedOperationId?: string
  lotId?: string
  note?: string
}

export function createMockClient(): VaultClient {
  let state: VaultState = loadState() ?? initialState()
  const listeners = new Set<() => void>()

  const commit = (next: VaultState) => {
    state = next
    saveState(next)
    listeners.forEach((listener) => listener())
  }

  const patchOperation = (operationId: string, patch: Partial<Operation>) => {
    commit({
      ...state,
      operations: state.operations.map((op) =>
        op.operationId === operationId ? { ...op, ...patch, updatedAt: now() } : op,
      ),
    })
  }

  const addOperation = (init: OpInit): Operation => {
    const operationId = nextOperationId(state.operations)
    const stamp = now()
    const op: Operation = {
      operationId,
      type: init.type,
      status: init.status,
      amount: init.amount,
      poolId: init.poolId,
      entries: entriesFor(init.type, init.amount, init.poolId),
      createdAt: stamp,
      updatedAt: stamp,
      from: init.from,
      to: init.to,
      layer: init.layer,
      reference: `synthetic-${init.layer === 'onchain' ? 'receipt' : 'ledger'}-${operationId}`,
      positionId: DEMO_POSITION_ID,
      linkedOperationId: init.linkedOperationId,
      lotId: init.lotId,
      note: init.note,
    }
    commit({ ...state, operations: [...state.operations, op] })
    return op
  }

  const preflight = (needsFees: boolean): BlockReason | null => {
    if (state.session.status !== 'connected') return 'no-wallet'
    if (state.session.network === 'wrong') return 'wrong-network'
    if (needsFees && state.scenario.fees === 'insufficient') return 'insufficient-fees'
    return null
  }

  /** Applies the demo outcome to an in-flight operation and reports it as a flow result. */
  const conclude = (operationId: string, outcome: Scenario['submission']): FlowResult => {
    const op = state.operations.find((item) => item.operationId === operationId)
    if (!op) return { status: 'unknown', operationId }
    if (outcome === 'confirm') {
      patchOperation(operationId, { status: 'confirmed' })
      return { status: 'confirmed', operationId }
    }
    if (outcome === 'ambiguous') {
      patchOperation(operationId, {
        status: 'needs-reconciliation',
        note: 'Submission status is unknown. The reservation is kept until the transaction is reconciled.',
      })
      return { status: 'unknown', operationId }
    }
    patchOperation(operationId, { status: 'failed', note: 'The network reported that this transfer failed.' })
    let released = false
    if (op.type === 'settlement' && op.linkedOperationId && op.poolId) {
      addOperation({
        type: 'reversal',
        amount: op.amount,
        poolId: op.poolId,
        status: 'confirmed',
        from: `${POOL_BY_ID[op.poolId].name} (ledger allocation)`,
        to: 'Your attributed demo proceeds',
        layer: 'ledger',
        linkedOperationId: op.operationId,
        lotId: op.lotId,
        note: 'Reservation released after the failed transfer was reconciled.',
      })
      released = true
    }
    if (op.type === 'withdrawal') released = true
    return { status: 'failed', operationId, releasedReservation: released }
  }

  // Recover pending activity by stable operation ID after a refresh.
  window.setTimeout(() => {
    state.operations
      .filter((op) => op.status === 'submitted')
      .forEach((op) => {
        void sleep(1500).then(() => conclude(op.operationId, state.scenario.submission))
      })
  }, 0)

  const client: VaultClient = {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    async connectWallet() {
      if (state.scenario.wallet === 'missing') return 'missing-wallet'
      commit({ ...state, session: { status: 'connecting', network: state.session.network } })
      await sleep(900)
      commit({
        ...state,
        session: { status: 'connected', network: state.scenario.network },
      })
      return 'connected'
    },
    disconnectWallet() {
      commit({ ...state, session: { status: 'disconnected', network: 'configured' } })
    },
    async switchNetwork() {
      await sleep(600)
      commit({
        ...state,
        session: { ...state.session, network: 'configured' },
        scenario: { ...state.scenario, network: 'configured' },
      })
    },

    setPoolPreference(poolId) {
      commit({ ...state, poolPreference: poolId })
    },
    completeOnboarding() {
      commit({ ...state, onboardingComplete: true })
    },

    async deposit(amount, onPhase: PhaseListener) {
      const blocked = preflight(true)
      if (blocked) return { status: 'blocked', reason: blocked }
      if (amount > walletBalance(state.operations)) return { status: 'blocked', reason: 'insufficient-balance' }

      onPhase('awaiting-approval')
      await sleep(1300)
      if (state.scenario.signature === 'reject-approval') return { status: 'rejected', at: 'approval' }
      onPhase('awaiting-signature')
      await sleep(1300)
      if (state.scenario.signature === 'reject-signature') return { status: 'rejected', at: 'signature' }

      const op = addOperation({
        type: 'deposit',
        amount,
        status: 'submitted',
        from: 'Your wallet (demo)',
        to: 'Principal custody',
        layer: 'onchain',
      })
      onPhase('submitted')
      await sleep(700)
      onPhase('pending')
      await sleep(2400)
      return conclude(op.operationId, state.scenario.submission)
    },

    async allocate(poolId, amount, onPhase) {
      const blocked = preflight(false)
      if (blocked) return { status: 'blocked', reason: blocked }
      if (amount > computeBalances(state.operations).availableProceeds) {
        return { status: 'blocked', reason: 'insufficient-proceeds' }
      }
      onPhase('awaiting-signature')
      await sleep(1300)
      if (state.scenario.signature !== 'approve') return { status: 'rejected', at: 'signature' }

      const pool = POOL_BY_ID[poolId]
      const allocation = addOperation({
        type: 'allocation',
        amount,
        poolId,
        status: 'confirmed',
        from: 'Your attributed demo proceeds',
        to: `${pool.name} (ledger allocation)`,
        layer: 'ledger',
        lotId: DEMO_LOT_ID,
      })
      onPhase('reserved')
      await sleep(900)
      const transfer = addOperation({
        type: 'settlement',
        amount,
        poolId,
        status: 'submitted',
        from: 'Proceeds custody',
        to: `${pool.name} demo recipient`,
        layer: 'onchain',
        linkedOperationId: allocation.operationId,
        lotId: DEMO_LOT_ID,
      })
      onPhase('submitted')
      await sleep(700)
      onPhase('pending')
      await sleep(2400)
      return conclude(transfer.operationId, state.scenario.submission)
    },

    async withdraw(amount, onPhase) {
      const blocked = preflight(true)
      if (blocked) return { status: 'blocked', reason: blocked }
      if (amount > computeBalances(state.operations).availablePrincipal) {
        return { status: 'blocked', reason: 'insufficient-principal' }
      }
      onPhase('awaiting-signature')
      await sleep(1300)
      if (state.scenario.signature !== 'approve') return { status: 'rejected', at: 'signature' }

      const op = addOperation({
        type: 'withdrawal',
        amount,
        status: 'submitted',
        from: 'Principal custody',
        to: 'Your wallet (demo)',
        layer: 'onchain',
      })
      onPhase('reserved')
      await sleep(800)
      onPhase('submitted')
      await sleep(600)
      onPhase('pending')
      await sleep(2400)
      return conclude(op.operationId, state.scenario.submission)
    },

    async lookupReceipt(operationId): Promise<LookupResult> {
      await sleep(900)
      const op = state.operations.find((item) => item.operationId === operationId)
      if (!op) return 'not-found'
      if (op.status === 'confirmed') return 'confirmed'
      const attempts = (op.lookupAttempts ?? 0) + 1
      patchOperation(operationId, { lookupAttempts: attempts })
      if (attempts < 2) return 'still-checking'
      patchOperation(operationId, { status: 'confirmed', note: 'Confirmed through receipt lookup.' })
      return 'confirmed'
    },

    setScenario(patch) {
      const session =
        patch.network && state.session.status === 'connected'
          ? { ...state.session, network: patch.network }
          : state.session
      commit({ ...state, session, scenario: { ...state.scenario, ...patch } })
    },
    jumpToStage(stage: DemoStage) {
      commit({ ...state, operations: operationsForStage(stage) })
    },
    resetDemo() {
      const fresh = initialState()
      commit({ ...fresh, session: state.session })
    },
    async fundDemoSponsorLot() {
      const hasDeposit = state.operations.some((op) => op.type === 'deposit' && op.status === 'confirmed')
      if (!hasDeposit || hasFundedLot(state.operations)) return false
      await sleep(500)
      addOperation({
        type: 'sponsor_funding',
        amount: DEMO_SPONSOR_LOT,
        status: 'confirmed',
        from: 'Sponsor wallet (demo)',
        to: 'Proceeds custody',
        layer: 'onchain',
        lotId: DEMO_LOT_ID,
      })
      return true
    },
    async attributeDemoSponsorLot() {
      if (!hasFundedLot(state.operations) || hasAttributedLot(state.operations)) return false
      await sleep(500)
      addOperation({
        type: 'attribution',
        amount: DEMO_SPONSOR_LOT,
        status: 'confirmed',
        from: 'Unassigned sponsor funds',
        to: 'Your attributed demo proceeds',
        layer: 'ledger',
        lotId: DEMO_LOT_ID,
      })
      return true
    },
  }
  return client
}
