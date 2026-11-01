import { useDisconnect } from 'wagmi'
import { Link } from 'react-router-dom'
import { CHAIN, STRATEGY_ADDRESS, USDC_ADDRESS, VAULT_ADDRESS } from '@/chain/config'
import { useSession, useVaultSnapshot } from '@/chain/hooks'
import { AddressLink } from '@/components/chain/AddressLink'
import { ConnectButton } from '@/components/layout/ConnectButton'
import { PageHeader, SessionNotices, usePageTitle } from '@/components/layout/PageParts'
import { Callout } from '@/components/ui/Callout'
import { CopyButton, Definition, SectionHeading } from '@/components/ui/Misc'
import { RISK_POINTS } from '@/data/copy'

function Account() {
  const session = useSession()
  const snapshot = useVaultSnapshot()
  const { disconnect } = useDisconnect()
  const isOwner = snapshot.status === 'ready' && session.address?.toLowerCase() === snapshot.data.owner.toLowerCase()

  return (
    <div className="space-y-8">
      <SessionNotices />
      {session.isConnected ? (
      <section className="card" aria-labelledby="wallet">
        <SectionHeading id="wallet" title="Wallet" />
        <dl className="space-y-3">
          <Definition term="Address">
            <span className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="num break-all">{session.address}</span>
              {session.address ? <CopyButton value={session.address} label="wallet address" /> : null}
            </span>
          </Definition>
          <Definition term="Wallet">{session.connectorName ?? 'Browser wallet'}</Definition>
          <Definition term="Network">{session.wrongNetwork ? 'Wrong network' : CHAIN.name}</Definition>
        </dl>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="btn btn-secondary" onClick={() => disconnect()}>
            Disconnect
          </button>
          {isOwner ? (
            <Link to="/admin" className="btn btn-quiet">
              Open admin workspace
            </Link>
          ) : null}
        </div>
        <p className="t-small mt-3 text-ink/80">Disconnecting ends this session only. It does not move funds or cancel a pending transaction.</p>
      </section>
      ) : (
        <section className="card" aria-labelledby="wallet">
          <SectionHeading id="wallet" title="Wallet" description="Connect a wallet to see your address and session." />
          <ConnectButton />
        </section>
      )}

      <section className="card" aria-labelledby="contracts">
        <SectionHeading id="contracts" title="Contracts" description="Verify these addresses before you transact." />
        <dl className="space-y-3">
          <Definition term="ImpactVault">
            <AddressLink address={VAULT_ADDRESS} full />
          </Definition>
          <Definition term="Yield strategy">
            <AddressLink address={STRATEGY_ADDRESS} full />
          </Definition>
          <Definition term="USDC token">
            <AddressLink address={USDC_ADDRESS} full />
          </Definition>
          {snapshot.status === 'ready' ? (
            <Definition term="Vault owner">
              <AddressLink address={snapshot.data.owner} full />
            </Definition>
          ) : null}
          <Definition term="Network">
            {CHAIN.name} (chain ID {CHAIN.id})
          </Definition>
        </dl>
        <p className="t-small mt-3 text-ink/80">Account settings cannot edit balances or transaction history. Those come only from the contract.</p>
      </section>

      <section className="card" id="disclosures" aria-labelledby="disclosures-h">
        <SectionHeading id="disclosures-h" title="Risks and disclosures" />
        <ul className="t-small prose-reading list-disc space-y-2 pl-5 text-ink/90">
          {RISK_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="privacy">
        <SectionHeading id="privacy" title="Data and privacy" />
        <p className="t-small prose-reading text-ink/90">
          ImpactVault reads public blockchain data for your wallet address. It has no accounts and keeps no profile. The only thing stored in your browser is the hash of a transaction you have just sent, so a refresh can still show its status.
        </p>
      </section>
      <Callout tone="info">Anyone can read deposits and withdrawals on-chain, including the wallet address that made them.</Callout>
    </div>
  )
}

export default function AccountPage() {
  usePageTitle('Account')
  return (
    <>
      <PageHeader title="Account" />
      <Account />
    </>
  )
}
