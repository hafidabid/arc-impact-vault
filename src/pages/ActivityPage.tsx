import { Search, X } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { OperationDetail } from '@/components/activity/OperationDetail'
import { OperationRow } from '@/components/activity/OperationRow'
import { TYPE_LABEL } from '@/components/money/Receipt'
import { ConnectGate, EmptyState, PageHeader, SessionNotices, usePageTitle } from '@/components/layout/PageParts'
import { Skeleton } from '@/components/ui/Misc'
import { POOLS, poolName } from '@/data/pools'
import { dayKey, fmtDay } from '@/lib/format'
import type { Operation, OperationType } from '@/lib/types'
import { useVault } from '@/state/VaultProvider'

const TYPES = Object.keys(TYPE_LABEL) as OperationType[]
const STATUS_OPTIONS = [
  ['confirmed', 'Confirmed'],
  ['pending', 'Pending'],
  ['needs-reconciliation', 'Checking transaction'],
  ['failed', 'Failed'],
] as const

function matchesStatus(op: Operation, status: string): boolean {
  if (status === 'pending') return op.status === 'submitted'
  return op.status === status
}

interface SelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}

function FilterSelect({ label, value, onChange, children }: SelectProps) {
  return (
    <label className="block min-w-0">
      <span className="field-label">{label}</span>
      <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  )
}

export default function ActivityPage() {
  usePageTitle('Activity')
  const { state, overview } = useVault()
  const [params, setParams] = useSearchParams()
  const get = (key: string) => params.get(key) ?? ''
  const q = get('q').trim().toLowerCase()

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const typeFilter = get('type')
  const poolFilter = get('pool')
  const statusFilter = get('status')
  const fromFilter = get('from')
  const toFilter = get('to')

  const filtered = useMemo(() => {
    return [...state.operations]
      .filter((op) => (typeFilter ? op.type === typeFilter : true))
      .filter((op) => (poolFilter ? (poolFilter === 'none' ? !op.poolId : op.poolId === poolFilter) : true))
      .filter((op) => (statusFilter ? matchesStatus(op, statusFilter) : true))
      .filter((op) => (fromFilter ? dayKey(op.createdAt) >= fromFilter : true))
      .filter((op) => (toFilter ? dayKey(op.createdAt) <= toFilter : true))
      .filter((op) =>
        q
          ? [op.operationId, TYPE_LABEL[op.type], poolName(op.poolId), op.from, op.to, op.reference].join(' ').toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.operationId.localeCompare(a.operationId))
  }, [state.operations, typeFilter, poolFilter, statusFilter, fromFilter, toFilter, q])

  const grouped = useMemo(() => {
    const groups = new Map<string, Operation[]>()
    for (const op of filtered) {
      const key = dayKey(op.createdAt)
      groups.set(key, [...(groups.get(key) ?? []), op])
    }
    return [...groups.entries()]
  }, [filtered])

  const detailId = get('op')
  const detail = state.operations.find((op) => op.operationId === detailId) ?? null
  const hasFilters = ['type', 'pool', 'status', 'from', 'to', 'q'].some((key) => get(key))

  return (
    <>
      <PageHeader
        title="Activity"
        description="Deposits, sponsor funding and attribution, allocations, transfers, withdrawals and reversals. Internal ledger entries are labeled apart from onchain transfers."
      />
      <ConnectGate purpose="Activity shows records for your connected wallet only.">
        <div className="space-y-5">
          <SessionNotices />
          <form className="card" role="search" aria-label="Filter activity" onSubmit={(event) => event.preventDefault()}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <label className="block sm:col-span-2 lg:col-span-2">
                <span className="field-label">Search</span>
                <span className="relative block">
                  <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/75" />
                  <input
                    className="input pl-10"
                    type="search"
                    placeholder="Operation ID, pool or type"
                    value={get('q')}
                    onChange={(event) => set('q', event.target.value)}
                  />
                </span>
              </label>
              <FilterSelect label="Event type" value={get('type')} onChange={(value) => set('type', value)}>
                <option value="">All events</option>
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {TYPE_LABEL[type]}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect label="Pool" value={get('pool')} onChange={(value) => set('pool', value)}>
                <option value="">All pools</option>
                {POOLS.map((pool) => (
                  <option key={pool.id} value={pool.id}>
                    {pool.name}
                  </option>
                ))}
                <option value="none">No pool</option>
              </FilterSelect>
              <FilterSelect label="Status" value={get('status')} onChange={(value) => set('status', value)}>
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </FilterSelect>
              <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-1">
                <label className="block min-w-0">
                  <span className="field-label">From (UTC)</span>
                  <input className="input" type="date" value={get('from')} onChange={(event) => set('from', event.target.value)} />
                </label>
                <label className="block min-w-0">
                  <span className="field-label">To (UTC)</span>
                  <input className="input" type="date" value={get('to')} onChange={(event) => set('to', event.target.value)} />
                </label>
              </div>
            </div>
            {hasFilters ? (
              <button type="button" className="btn btn-ghost mt-3" onClick={() => setParams({}, { replace: true })}>
                <X aria-hidden className="h-4 w-4" />
                Clear filters
              </button>
            ) : null}
          </form>

          <p className="t-small text-ink/75" role="status">
            {overview.dataStatus === 'ready' ? `${filtered.length} ${filtered.length === 1 ? 'record' : 'records'}` : ''}
          </p>

          {overview.dataStatus === 'loading' ? (
            <div className="card space-y-3" aria-busy="true" aria-label="Loading activity">
              {[0, 1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-16" />
              ))}
            </div>
          ) : overview.dataStatus === 'sync-error' ? (
            <EmptyState title="Activity could not be loaded">
              This is a sync problem, not an empty history. Use Try again above, then check back.
            </EmptyState>
          ) : state.operations.length === 0 ? (
            <EmptyState title="No activity yet">Connected-wallet activity appears here after your first deposit.</EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No records match these filters"
              action={
                <button type="button" className="btn btn-secondary" onClick={() => setParams({}, { replace: true })}>
                  Clear filters
                </button>
              }
            />
          ) : (
            <div className="space-y-5">
              {grouped.map(([day, items]) => (
                <section key={day} aria-label={fmtDay(items[0].createdAt)} className="card !p-2 md:!p-3">
                  <h2 className="t-label px-3 pb-1 pt-2 text-ink/75">{fmtDay(items[0].createdAt)} (UTC)</h2>
                  <ul className="divide-y divide-ink/10">
                    {items.map((op) => (
                      <OperationRow key={op.operationId} operation={op} onOpen={(item) => set('op', item.operationId)} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </ConnectGate>
      <OperationDetail operation={detail} onClose={() => set('op', '')} />
    </>
  )
}
