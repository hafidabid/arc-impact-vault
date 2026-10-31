import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpen,
  Coins,
  HandHeart,
  Link2,
  Send,
  Undo2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Chip, StatusChip } from '@/components/ui/StatusChip'
import { TYPE_LABEL } from '@/components/money/Receipt'
import { poolName } from '@/data/pools'
import { fmtDateTime } from '@/lib/format'
import { fmtUsdc } from '@/lib/units'
import type { Operation, OperationType } from '@/lib/types'

const ICON: Record<OperationType, LucideIcon> = {
  deposit: ArrowDownToLine,
  sponsor_funding: Coins,
  attribution: Link2,
  allocation: HandHeart,
  settlement: Send,
  withdrawal: ArrowUpFromLine,
  reversal: Undo2,
}

export function OperationRow({ operation, onOpen }: { operation: Operation; onOpen: (operation: Operation) => void }) {
  const Icon = ICON[operation.type]
  const ledger = operation.layer === 'ledger'
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(operation)}
        className="flex w-full min-h-[64px] items-center gap-3 rounded-control px-3 py-3 text-left transition duration-150 hover:bg-sage/20"
        aria-label={`${TYPE_LABEL[operation.type]}, ${fmtUsdc(operation.amount)} USDC, ${operation.status}. Open details`}
      >
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/35 text-forest">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold leading-snug">{TYPE_LABEL[operation.type]}</span>
            {operation.poolId ? <span className="t-small text-ink/75">{poolName(operation.poolId)}</span> : null}
          </span>
          <span className="t-small mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-ink/75">
            <span>{fmtDateTime(operation.createdAt)}</span>
            <Chip tone="neutral" icon={ledger ? BookOpen : Send} className="!py-0.5 text-xs">
              {ledger ? 'Internal ledger entry' : 'Onchain transfer'}
            </Chip>
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="num font-semibold">{fmtUsdc(operation.amount)} USDC</span>
          <StatusChip status={operation.status} />
        </span>
      </button>
    </li>
  )
}
