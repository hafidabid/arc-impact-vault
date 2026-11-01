import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

type CalloutTone = 'info' | 'warn' | 'error' | 'success'

const STYLE: Record<CalloutTone, { box: string; icon: LucideIcon; iconColor: string }> = {
  info: { box: 'border-ink/15 bg-sage/20', icon: Info, iconColor: 'text-forest' },
  warn: { box: 'border-gold bg-gold/25', icon: AlertTriangle, iconColor: 'text-ink' },
  error: { box: 'border-[#8a2f1d]/50 bg-[#8a2f1d]/[0.07]', icon: OctagonAlert, iconColor: 'text-[#8a2f1d]' },
  success: { box: 'border-forest/40 bg-forest/[0.07]', icon: CheckCircle2, iconColor: 'text-forest' },
}

interface CalloutProps {
  tone?: CalloutTone
  title?: string
  children?: ReactNode
  action?: ReactNode
  className?: string
  /** Errors interrupt assistive tech. Everything else is announced politely. */
  live?: boolean
}

export function Callout({ tone = 'info', title, children, action, className, live = false }: CalloutProps) {
  const style = STYLE[tone]
  const Icon = style.icon
  return (
    <div
      role={live ? (tone === 'error' ? 'alert' : 'status') : undefined}
      className={cx('flex gap-3 rounded-card border p-4', style.box, className)}
    >
      <Icon aria-hidden className={cx('mt-0.5 h-5 w-5 shrink-0', style.iconColor)} strokeWidth={2} />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold leading-snug text-ink">{title}</p> : null}
        {children ? <div className={cx('t-small text-ink/90', title && 'mt-1')}>{children}</div> : null}
        {action ? <div className="mt-3 flex flex-wrap gap-2">{action}</div> : null}
      </div>
    </div>
  )
}
