import { Loader2, Plug, TriangleAlert, Wallet } from 'lucide-react'
import { ConnectKitButton } from 'connectkit'
import { Link } from 'react-router-dom'
import { shortAddress } from '@/chain/derive'
import { useSession } from '@/chain/hooks'
import { cx } from '@/lib/cx'

export function ConnectButton({ className, size = 'default' }: { className?: string; size?: 'default' | 'compact' }) {
  const session = useSession()

  return (
    <ConnectKitButton.Custom>
      {({ show, isConnecting }) => {
        if (session.isConnected && session.address) {
          return (
            <div className="flex items-center gap-2">
              {session.wrongNetwork ? (
                <button
                  type="button"
                  className="btn btn-secondary min-h-[44px] border-[#8a2f1d]/60 px-3 text-[#7a2a1a]"
                  disabled={session.switching}
                  onClick={() => void session.switchNetwork()}
                >
                  <TriangleAlert aria-hidden className="h-4 w-4" />
                  <span>Switch network</span>
                </button>
              ) : null}
              <Link
                to="/account"
                className={cx('btn btn-quiet gap-2 px-3', className)}
                aria-label={`Connected as ${session.address}${session.wrongNetwork ? ' on the wrong network' : ''}. Open account`}
              >
                <span aria-hidden className={cx('h-2 w-2 rounded-full', session.wrongNetwork ? 'bg-[#8a2f1d]' : 'bg-forest')} />
                <Wallet aria-hidden className="h-4 w-4" />
                <span className={cx('num text-sm', size === 'compact' && 'hidden sm:inline')}>{shortAddress(session.address)}</span>
              </Link>
            </div>
          )
        }
        const connecting = isConnecting || session.connecting
        return (
          <button type="button" className={cx('btn btn-primary', className)} disabled={connecting} onClick={() => show?.()}>
            {connecting ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Plug aria-hidden className="h-4 w-4" />}
            {connecting ? 'Connecting' : 'Connect wallet'}
          </button>
        )
      }}
    </ConnectKitButton.Custom>
  )
}
