import { entriesFor } from '@/lib/ledger'
import type { Operation } from '@/lib/types'

/**
 * Synthetic seed: the worked example (3.00 USDC principal, 0.20 USDC sponsor-funded demo proceeds
 * routed to Hunger Relief). Illustrative only. No real transfers.
 */
export const DEMO_LOT_ID = 'demo-sponsor-lot-001'
export const DEMO_POSITION_ID = 'demo-position-001'
export const DEMO_WALLET_START = 10_000_000n // 10.00 USDC of demo wallet balance
export const DEMO_DEPOSIT = 3_000_000n // 3.00 USDC
export const DEMO_SPONSOR_LOT = 200_000n // 0.20 USDC

const at = (time: string) => `2026-10-31T${time}:00.000Z`

const base = { status: 'confirmed' as const, positionId: DEMO_POSITION_ID }

export const SEED_OPERATIONS: readonly Operation[] = [
  {
    ...base,
    operationId: 'demo-001',
    type: 'deposit',
    amount: DEMO_DEPOSIT,
    entries: entriesFor('deposit', DEMO_DEPOSIT),
    createdAt: at('09:00'),
    updatedAt: at('09:01'),
    from: 'Your wallet (demo)',
    to: 'Principal custody',
    layer: 'onchain',
    reference: 'synthetic-receipt-demo-001',
  },
  {
    ...base,
    operationId: 'demo-002',
    type: 'sponsor_funding',
    amount: DEMO_SPONSOR_LOT,
    entries: entriesFor('sponsor_funding', DEMO_SPONSOR_LOT),
    createdAt: at('09:12'),
    updatedAt: at('09:13'),
    from: 'Sponsor wallet (demo)',
    to: 'Proceeds custody',
    layer: 'onchain',
    reference: 'synthetic-receipt-demo-002',
    lotId: DEMO_LOT_ID,
  },
  {
    ...base,
    operationId: 'demo-003',
    type: 'attribution',
    amount: DEMO_SPONSOR_LOT,
    entries: entriesFor('attribution', DEMO_SPONSOR_LOT),
    createdAt: at('09:30'),
    updatedAt: at('09:30'),
    from: 'Unassigned sponsor funds',
    to: 'Your attributed demo proceeds',
    layer: 'ledger',
    reference: 'synthetic-ledger-demo-003',
    lotId: DEMO_LOT_ID,
  },
  {
    ...base,
    operationId: 'demo-004',
    type: 'allocation',
    amount: DEMO_SPONSOR_LOT,
    poolId: 'hunger-relief',
    entries: entriesFor('allocation', DEMO_SPONSOR_LOT, 'hunger-relief'),
    createdAt: at('10:05'),
    updatedAt: at('10:05'),
    from: 'Your attributed demo proceeds',
    to: 'Hunger Relief (ledger allocation)',
    layer: 'ledger',
    reference: 'synthetic-ledger-demo-004',
    lotId: DEMO_LOT_ID,
  },
  {
    ...base,
    operationId: 'demo-005',
    type: 'settlement',
    amount: DEMO_SPONSOR_LOT,
    poolId: 'hunger-relief',
    entries: entriesFor('settlement', DEMO_SPONSOR_LOT, 'hunger-relief'),
    createdAt: at('10:05'),
    updatedAt: at('10:07'),
    from: 'Proceeds custody',
    to: 'Hunger Relief demo recipient',
    layer: 'onchain',
    reference: 'synthetic-receipt-demo-005',
    lotId: DEMO_LOT_ID,
    linkedOperationId: 'demo-004',
  },
]

export type DemoStage = 0 | 1 | 2 | 3 | 4 | 5

export const STAGE_LABELS: Record<DemoStage, string> = {
  0: 'Before deposit',
  1: 'Deposit confirmed',
  2: 'Sponsor lot funded (not yet attributed)',
  3: 'Proceeds attributed: 0.20 available',
  4: 'Allocation reserved (transfer pending)',
  5: 'Transfer confirmed (full worked example)',
}

/** Operations for a stage of the worked example. Stage 4 leaves the transfer in flight. */
export function operationsForStage(stage: DemoStage): Operation[] {
  if (stage === 0) return []
  const count = Math.min(stage, 5)
  const ops = SEED_OPERATIONS.slice(0, count).map((op) => ({ ...op, entries: [...op.entries] }))
  if (stage === 4) {
    const last = ops[3]
    ops.push({
      ...SEED_OPERATIONS[4],
      entries: entriesFor('settlement', DEMO_SPONSOR_LOT, 'hunger-relief'),
      status: 'submitted',
      updatedAt: last.updatedAt,
    })
  }
  return ops
}
