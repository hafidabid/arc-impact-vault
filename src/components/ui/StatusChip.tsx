import { CheckCircle2, Clock3, Lock, OctagonAlert, PauseCircle, RefreshCw, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PHASE_LABEL } from '@/chain/derive'
import type { VaultPhase } from '@/chain/derive'
import { cx } from '@/lib/cx'

type Tone = 'ok' | 'pending' | 'check' | 'bad' | 'neutral' | 'accent'

const TONE: Record<Tone, string> = {
  ok: 'border-forest/40 bg-forest text-ivory',
  pending: 'border-ink/30 bg-sage/25 text-ink',
  check: 'border-ink/40 bg-ivory text-ink',
  bad: 'border-[#8a2f1d]/50 bg-[#8a2f1d]/10 text-[#7a2a1a]',
  neutral: 'border-ink/25 bg-ivory text-ink',
  accent: 'border-gold bg-gold/40 text-ink',
}

export function Chip({ tone = 'neutral', icon: Icon, children, className }: { tone?: Tone; icon?: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <span className={cx('chip', TONE[tone], className)}>
      {Icon ? <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} /> : null}
      {children}
    </span>
  )
}

export type ConfirmationState = 'confirmed' | 'pending' | 'checking' | 'failed'

const CONFIRMATION: Record<ConfirmationState, { label: string; icon: LucideIcon; tone: Tone }> = {
  confirmed: { label: 'Confirmed', icon: CheckCircle2, tone: 'ok' },
  pending: { label: 'Pending', icon: Clock3, tone: 'pending' },
  checking: { label: 'Checking transaction', icon: RefreshCw, tone: 'check' },
  failed: { label: 'Failed', icon: XCircle, tone: 'bad' },
}

export function ConfirmationChip({ state }: { state: ConfirmationState }) {
  const spec = CONFIRMATION[state]
  return (
    <Chip tone={spec.tone} icon={spec.icon}>
      {spec.label}
    </Chip>
  )
}

const PHASE: Record<VaultPhase, { icon: LucideIcon; tone: Tone }> = {
  open: { icon: CheckCircle2, tone: 'ok' },
  paused: { icon: PauseCircle, tone: 'accent' },
  locked: { icon: Lock, tone: 'pending' },
  matured: { icon: CheckCircle2, tone: 'ok' },
  emergency: { icon: OctagonAlert, tone: 'bad' },
  'in-kind': { icon: OctagonAlert, tone: 'bad' },
  settled: { icon: CheckCircle2, tone: 'neutral' },
}

export function PhaseChip({ phase }: { phase: VaultPhase }) {
  const spec = PHASE[phase]
  return (
    <Chip tone={spec.tone} icon={spec.icon}>
      {PHASE_LABEL[phase]}
    </Chip>
  )
}
