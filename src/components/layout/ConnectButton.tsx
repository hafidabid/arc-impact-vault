import { Loader2, Plug, TriangleAlert, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sheet } from '@/components/ui/Sheet'
import { DEMO_CONFIG } from '@/data/config'
import { cx } from '@/lib/cx'
import { useVault } from '@/state/VaultProvider'

export function ConnectButton({ className, size = 'default' }: { className?: string; size?: 'default' | 'compact' }) {
  const { state, client } = useVault()
  const [missingOpen, setMissingOpen] = useState(false)
  const { status, network } = state.session

  if (status === 'connected') {
    return (
      <div className="flex items-center gap-2">
        {network === 'wrong' ? (
          <button
            type="button"
            className="btn btn-secondary min-h-[44px] border-[#8a2f1d]/60 px-3 text-[#7a2a1a]"
            onClick={() => void client.switchNetwork()}
          >
            <TriangleAlert aria-hidden className="h-4 w-4" />
            <span>Switch network</span>
          </button>
        ) : null}
        <Link
          to="/account"
          className={cx('btn btn-quiet gap-2 px-3', className)}
          aria-label={`Connected demo wallet on ${network === 'wrong' ? 'the wrong network' : DEMO_CONFIG.networkLabel}. Open account`}
        >
          <span aria-hidden className={cx('h-2 w-2 rounded-full', network === 'wrong' ? 'bg-[#8a2f1d]' : 'bg-forest')} />
          <Wallet aria-hidden className="h-4 w-4" />
          <span className={cx('text-sm', size === 'compact' && 'hidden sm:inline')}>{DEMO_CONFIG.walletId}</span>
        </Link>
      </div>
    )
  }

  const connecting = status === 'connecting'
  return (
    <>
      <button
        type="button"
        className={cx('btn btn-primary', className)}
        disabled={connecting}
        onClick={() => {
          void client.connectWallet().then((outcome) => {
            if (outcome === 'missing-wallet') setMissingOpen(true)
          })
        }}
      >
        {connecting ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Plug aria-hidden className="h-4 w-4" />}
        {connecting ? 'Connecting' : 'Connect wallet'}
      </button>
      <Sheet
        open={missingOpen}
        onClose={() => setMissingOpen(false)}
        title="No wallet found"
        description="Connecting a wallet does not request any spending approval, but a browser wallet is needed to continue."
      >
        <p className="t-small prose-reading text-ink/90">
          This browser has no wallet available. Install or unlock a wallet, then try again. You can keep browsing the public pages without
          connecting.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              client.setScenario({ wallet: 'available' })
              setMissingOpen(false)
            }}
          >
            Demo: make a wallet available
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setMissingOpen(false)}>
            Keep browsing
          </button>
        </div>
      </Sheet>
    </>
  )
}
