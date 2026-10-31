import { ArrowLeft, CloudOff, Wallet } from 'lucide-react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { useVault } from '@/state/VaultProvider'
import { ConnectButton } from './ConnectButton'

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | ImpactVault (demo)`
  }, [title])
}

export function PageHeader({
  title,
  description,
  back,
  actions,
  eyebrow,
}: {
  title: string
  description?: string
  back?: { to: string; label: string }
  actions?: ReactNode
  eyebrow?: string
}) {
  return (
    <header className="mb-6 md:mb-8">
      {back ? (
        <Link to={back.to} className="t-small mb-3 inline-flex min-h-[44px] items-center gap-1.5 font-medium text-forest hover:underline">
          <ArrowLeft aria-hidden className="h-4 w-4" />
          {back.label}
        </Link>
      ) : null}
      {eyebrow ? <p className="t-label mb-1 text-ink/75">{eyebrow}</p> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="t-page">{title}</h1>
          {description ? <p className="prose-reading mt-2 text-ink/85">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-ink/30 bg-sage/10 px-6 py-10 text-center">
      <span aria-hidden className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sage/35 text-forest">
        {icon ?? <Wallet className="h-6 w-6" />}
      </span>
      <h2 className="text-xl font-semibold text-forest">{title}</h2>
      {children ? <p className="prose-reading t-small mt-1.5 max-w-md text-ink/85">{children}</p> : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  )
}

/** Wraps wallet-only pages. Shows a connect prompt rather than inventing balances. */
export function ConnectGate({ children, purpose }: { children: ReactNode; purpose: string }) {
  const { overview } = useVault()
  if (!overview.connected) {
    return (
      <EmptyState title="Connect your wallet" action={<ConnectButton />}>
        {purpose} Connecting does not request any spending approval. You can keep browsing public pages without connecting.
      </EmptyState>
    )
  }
  return <>{children}</>
}

/** Network and sync notices that sit above page content. */
export function SessionNotices() {
  const { overview, client } = useVault()
  return (
    <div className="space-y-3 empty:hidden">
      {overview.wrongNetwork ? (
        <Callout
          live
          tone="error"
          title="Wrong network"
          action={
            <button type="button" className="btn btn-primary" onClick={() => void client.switchNetwork()}>
              Switch network
            </button>
          }
        >
          Your wallet is on a different network than the one configured for ImpactVault. Actions are blocked until you switch.
        </Callout>
      ) : null}
      {overview.dataStatus === 'sync-error' ? (
        <Callout
          live
          tone="warn"
          title="Could not sync your balances"
          action={
            <button type="button" className="btn btn-secondary" onClick={() => client.setScenario({ data: 'ready' })}>
              <CloudOff aria-hidden className="h-4 w-4" />
              Try again
            </button>
          }
        >
          Balances are hidden instead of shown as zero, because an unknown balance is not the same as an empty one.
        </Callout>
      ) : null}
    </div>
  )
}
