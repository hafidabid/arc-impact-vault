import type {
  AccountId,
  Balances,
  JournalEntry,
  Operation,
  OperationType,
  PoolId,
} from './types'

/** Assets are debit-normal. Everything else here is a liability or restricted-fund account (credit-normal). */
const DEBIT_NORMAL: ReadonlySet<AccountId> = new Set<AccountId>([
  'principal_custody_asset',
  'sponsor_custody_asset',
])

const PAYABLE_ACCOUNT: Record<PoolId, AccountId> = {
  'hunger-relief': 'hunger_donation_payable',
  'kalimantan-forest-fire-relief': 'kalimantan_donation_payable',
}

export const payableAccountFor = (poolId: PoolId): AccountId => PAYABLE_ACCOUNT[poolId]

/** Entries post once an operation reaches the state where the ledger recognises it. */
function postsEntries(op: Operation): boolean {
  if (op.type === 'allocation') return op.status === 'confirmed'
  return op.status === 'confirmed'
}

export function accountBalance(operations: readonly Operation[], account: AccountId): bigint {
  let net = 0n
  for (const op of operations) {
    if (!postsEntries(op)) continue
    for (const entry of op.entries) {
      if (entry.account === account) net += entry.debit - entry.credit
    }
  }
  return DEBIT_NORMAL.has(account) ? net : -net
}

const sumWhere = (operations: readonly Operation[], test: (op: Operation) => boolean): bigint =>
  operations.filter(test).reduce((total, op) => total + op.amount, 0n)

const isInFlight = (op: Operation) => op.status === 'submitted' || op.status === 'needs-reconciliation'

export function computeBalances(operations: readonly Operation[]): Balances {
  const principalPayable = accountBalance(operations, 'user_principal_payable')
  const reservedWithdrawals = sumWhere(operations, (op) => op.type === 'withdrawal' && isInFlight(op))

  const confirmedFor = (poolId: PoolId) =>
    sumWhere(operations, (op) => op.type === 'settlement' && op.status === 'confirmed' && op.poolId === poolId)

  return {
    principalCustody: accountBalance(operations, 'principal_custody_asset'),
    principalPayable,
    sponsorCustody: accountBalance(operations, 'sponsor_custody_asset'),
    unassignedSponsor: accountBalance(operations, 'unassigned_sponsor_funds'),
    availableProceeds: accountBalance(operations, 'user_attributed_donation_proceeds'),
    allocatedAwaitingTransfer: {
      'hunger-relief': accountBalance(operations, 'hunger_donation_payable'),
      'kalimantan-forest-fire-relief': accountBalance(operations, 'kalimantan_donation_payable'),
    },
    confirmedDonations: {
      'hunger-relief': confirmedFor('hunger-relief'),
      'kalimantan-forest-fire-relief': confirmedFor('kalimantan-forest-fire-relief'),
    },
    reservedWithdrawals,
    pendingDeposits: sumWhere(operations, (op) => op.type === 'deposit' && isInFlight(op)),
    availablePrincipal: principalPayable - reservedWithdrawals,
    pendingTransfers: sumWhere(operations, (op) => op.type === 'settlement' && isInFlight(op)),
  }
}

/** Every journal transaction must balance in integer units. */
export function isBalanced(entries: readonly JournalEntry[]): boolean {
  let debit = 0n
  let credit = 0n
  for (const entry of entries) {
    debit += entry.debit
    credit += entry.credit
  }
  return debit === credit
}

export const allOperationsBalanced = (operations: readonly Operation[]): boolean =>
  operations.every((op) => isBalanced(op.entries))

const pair = (debitAccount: AccountId, creditAccount: AccountId, amount: bigint): JournalEntry[] => [
  { account: debitAccount, debit: amount, credit: 0n },
  { account: creditAccount, debit: 0n, credit: amount },
]

/** The journal each operation type posts, per the worked example. */
export function entriesFor(type: OperationType, amount: bigint, poolId?: PoolId): JournalEntry[] {
  const payable = poolId ? payableAccountFor(poolId) : 'hunger_donation_payable'
  switch (type) {
    case 'deposit':
      return pair('principal_custody_asset', 'user_principal_payable', amount)
    case 'sponsor_funding':
      return pair('sponsor_custody_asset', 'unassigned_sponsor_funds', amount)
    case 'attribution':
      return pair('unassigned_sponsor_funds', 'user_attributed_donation_proceeds', amount)
    case 'allocation':
      return pair('user_attributed_donation_proceeds', payable, amount)
    case 'settlement':
      return pair(payable, 'sponsor_custody_asset', amount)
    case 'withdrawal':
      return pair('user_principal_payable', 'principal_custody_asset', amount)
    case 'reversal':
      return pair(payable, 'user_attributed_donation_proceeds', amount)
  }
}

export const nextOperationId = (operations: readonly Operation[]): string => {
  const highest = operations.reduce((max, op) => {
    const match = /^demo-(\d+)$/.exec(op.operationId)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  return `demo-${String(highest + 1).padStart(3, '0')}`
}

export const hasAttributedLot = (operations: readonly Operation[]): boolean =>
  operations.some((op) => op.type === 'attribution' && op.status === 'confirmed')

export const hasFundedLot = (operations: readonly Operation[]): boolean =>
  operations.some((op) => op.type === 'sponsor_funding' && op.status === 'confirmed')
