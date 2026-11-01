import { ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSession, useVaultSnapshot } from '@/chain/hooks'
import { EmptyState, SyncError } from './PageParts'
import { ConnectButton } from './ConnectButton'
import { Skeleton } from '@/components/ui/Misc'

/**
 * UI gate for the admin workspace. It hides controls from everyone but the vault owner, but it is not access
 * control: every admin action is enforced by the contract, which rejects any other caller.
 */
export function AdminGate({ children }: { children: (ctx: { owner: `0x${string}` }) => ReactNode }) {
  const session = useSession()
  const snapshot = useVaultSnapshot()

  if (!session.isConnected) {
    return (
      <EmptyState icon={<ShieldAlert className="h-6 w-6" />} title="Connect the vault owner wallet" action={<ConnectButton />}>
        The admin workspace is for the vault owner. Connecting does not request any spending approval.
      </EmptyState>
    )
  }
  if (snapshot.status === 'error') return <SyncError onRetry={snapshot.refetch} />
  if (snapshot.status === 'loading') return <Skeleton className="h-48" />
  const isOwner = session.address?.toLowerCase() === snapshot.data.owner.toLowerCase()
  if (!isOwner) {
    return (
      <EmptyState icon={<ShieldAlert className="h-6 w-6" />} title="This wallet is not the vault owner">
        Only the owner address can use admin controls, and the contract enforces this. Switch to the owner wallet to continue.
      </EmptyState>
    )
  }
  return <>{children({ owner: snapshot.data.owner })}</>
}
