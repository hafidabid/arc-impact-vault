import { CheckCircle2, CircleDashed, Clock3, RefreshCw, ShieldAlert, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cx } from '@/lib/cx'
import type { OperationStatus } from '@/lib/types'

type Tone = 'ok' | 'pending' | 'check' | 'bad' | 'neutral' | 'sponsor'

interface ChipSpec {
  label: string
  icon: LucideIcon
  tone: Tone
}

const STATUS: Record<OperationStatus, ChipSpec> = {
  confirmed: { label: 'Confirmed', icon: CheckCircle2, tone: 'ok' },
  submitted: { label: 'Pending', icon: Clock3, tone: 'pending' },
  'needs-reconciliation': { label: 'Checking transaction', icon: RefreshCw, tone: 'check' },
  failed: { label: 'Failed', icon: XCircle, tone: 'bad' },
}

const TONE: Record<Tone, string> = {
  ok: 'border-forest/40 bg-forest text-ivory',
  pending: 'border-ink/30 bg-sage/25 text-ink',
  check: 'border-ink/40 bg-ivory text-ink',
  bad: 'border-[#8a2f1d]/50 bg-[#8a2f1d]/10 text-[#7a2a1a]',
  neutral: 'border-ink/25 bg-ivory text-ink',
  sponsor: 'border-gold bg-gold/40 text-ink',
}

export function Chip({
  tone = 'neutral',
  icon: Icon,
  children,
  className,
}: {
  tone?: Tone
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={cx('chip', TONE[tone], className)}>
      {Icon ? <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} /> : null}
      {children}
    </span>
  )
}

export function StatusChip({ status, label }: { status: OperationStatus; label?: string }) {
  const spec = STATUS[status]
  return (
    <Chip tone={spec.tone} icon={spec.icon}>
      {label ?? spec.label}
    </Chip>
  )
}

export const SyntheticChip = () => (
  <Chip tone="sponsor" icon={CircleDashed}>
    Synthetic demo
  </Chip>
)

export const SponsorChip = () => (
  <Chip tone="sponsor" icon={ShieldAlert}>
    Sponsor-funded demo
  </Chip>
)
