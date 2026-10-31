import { SearchCheck } from 'lucide-react'
import { useState } from 'react'
import { CopyButton } from '@/components/ui/Misc'
import { Sheet } from '@/components/ui/Sheet'
import { StatusChip, SyntheticChip } from '@/components/ui/StatusChip'
import { TYPE_LABEL } from '@/components/money/Receipt'
import { DEMO_CONFIG } from '@/data/config'
import { COPY } from '@/data/copy'
import { poolName } from '@/data/pools'
import { fmtDateTime } from '@/lib/format'
import { fmtUsdc } from '@/lib/units'
import type { AccountId, Operation } from '@/lib/types'
import { useVault } from '@/state/VaultProvider'

const ACCOUNT_LABEL: Record<AccountId, string> = {
  principal_custody_asset: 'Principal custody (asset)',
  user_principal_payable: 'Your principal (payable)',
  sponsor_custody_asset: 'Sponsor custody (asset)',
  unassigned_sponsor_funds: 'Unassigned sponsor funds',
  user_attributed_donation_proceeds: 'Your attributed demo proceeds',
  hunger_donation_payable: 'Hunger Relief donation payable',
  kalimantan_donation_payable: 'Kalimantan Forest Fire Relief donation payable',
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-x-3 py-2 sm:grid-cols-[150px_1fr]">
      <dt className="t-small text-ink/75">{term}</dt>
      <dd className="min-w-0 break-words text-[15px] font-medium">{children}</dd>
    </div>
  )
}

export function OperationDetail({ operation, onClose }: { operation: Operation | null; onClose: () => void }) {
  const { client } = useVault()
  const [lookup, setLookup] = useState<'idle' | 'checking' | 'still'>('idle')
  const inFlight = operation?.status === 'submitted' || operation?.status === 'needs-reconciliation'
  return (
    <Sheet
      open={operation !== null}
      onClose={onClose}
      title={operation ? `${TYPE_LABEL[operation.type]}` : 'Details'}
      description="Full record, including ledger entries."
    >
      {operation ? (
        <div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <SyntheticChip />
            <StatusChip status={operation.status} />
          </div>
          <dl className="divide-y divide-ink/10 rounded-card border border-ink/10 px-4">
            <Row term="Operation ID">
              <span className="num">{operation.operationId}</span>
            </Row>
            <Row term="Timestamp">{fmtDateTime(operation.createdAt)}</Row>
            <Row term="Record type">{operation.layer === 'ledger' ? 'Internal ledger entry (not an onchain transfer)' : 'Onchain token transfer'}</Row>
            <Row term="Source">{operation.from}</Row>
            <Row term="Destination">{operation.to}</Row>
            <Row term="Amount">
              <span className="num">{fmtUsdc(operation.amount)} USDC</span>
            </Row>
            <Row term="Token">{DEMO_CONFIG.tokenLabel}</Row>
            <Row term="Network">{DEMO_CONFIG.networkLabel}</Row>
            <Row term="Reference">{operation.reference}</Row>
            {operation.poolId ? <Row term="Pool">{poolName(operation.poolId)}</Row> : null}
            {operation.lotId ? <Row term="Funding lot">{operation.lotId}</Row> : null}
            {operation.positionId ? <Row term="Position">{operation.positionId}</Row> : null}
            {operation.linkedOperationId ? <Row term="Linked to">{operation.linkedOperationId}</Row> : null}
            {operation.note ? <Row term="Note">{operation.note}</Row> : null}
          </dl>

          <h3 className="t-label mt-5">Ledger entries (USDC)</h3>
          <div className="mt-2 overflow-x-auto rounded-card border border-ink/10">
            <table className="w-full min-w-[420px] text-left text-sm">
              <caption className="sr-only">Balanced debit and credit entries for this operation</caption>
              <thead className="bg-sage/20">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Account
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Debit
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {operation.entries.map((entry) => (
                  <tr key={`${entry.account}-${entry.debit}-${entry.credit}`}>
                    <th scope="row" className="px-3 py-2 font-normal">
                      {ACCOUNT_LABEL[entry.account]}
                    </th>
                    <td className="num px-3 py-2 text-right">{entry.debit > 0n ? fmtUsdc(entry.debit) : ''}</td>
                    <td className="num px-3 py-2 text-right">{entry.credit > 0n ? fmtUsdc(entry.credit) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {operation.status !== 'confirmed' ? (
            <p className="t-small mt-3 text-ink/80">
              Ledger entries for this operation post only after it is confirmed. A pending record is never counted as settled.
            </p>
          ) : null}
          <p className="t-small mt-3 rounded-control bg-gold/25 px-3 py-2">{COPY.syntheticReceipt}</p>
          {inFlight ? (
            <div className="mt-4 rounded-card border border-ink/15 bg-sage/15 p-4" role="status">
              <p className="font-semibold">Checking transaction</p>
              <p className="t-small mt-1 text-ink/85">
                Look this operation up by its ID. This never creates a new payment.
                {lookup === 'still' ? ' Still checking: no receipt is available yet.' : ''}
              </p>
              <button
                type="button"
                className="btn btn-primary mt-3"
                disabled={lookup === 'checking'}
                onClick={() => {
                  setLookup('checking')
                  void client.lookupReceipt(operation.operationId).then((outcome) => {
                    setLookup(outcome === 'confirmed' ? 'idle' : 'still')
                  })
                }}
              >
                <SearchCheck aria-hidden className="h-4 w-4" />
                Look up receipt
              </button>
            </div>
          ) : null}
          <div className="mt-4">
            <CopyButton value={operation.operationId} label="operation ID" />
          </div>
        </div>
      ) : null}
    </Sheet>
  )
}
