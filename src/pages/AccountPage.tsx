import { BellOff, FlaskConical, LogOut, ShieldCheck, Wallet } from 'lucide-react'
import { ConnectButton } from '@/components/layout/ConnectButton'
import { PageHeader, SessionNotices, usePageTitle } from '@/components/layout/PageParts'
import { PoolPicker } from '@/components/pools/PoolPicker'
import { Callout } from '@/components/ui/Callout'
import { Chip } from '@/components/ui/StatusChip'
import { CopyButton, Definition, SectionHeading } from '@/components/ui/Misc'
import { DEMO_CONFIG } from '@/data/config'
import { RISK_POINTS } from '@/data/copy'
import { useVault } from '@/state/VaultProvider'

export default function AccountPage() {
  usePageTitle('Account')
  const { state, overview, client } = useVault()
  const connected = overview.connected

  return (
    <>
      <PageHeader title="Account" description="Your wallet session, preferences and disclosures. Settings here never change balances, history or evidence decisions." />
      <div className="space-y-6">
        <SessionNotices />

        <section aria-labelledby="wallet-heading" className="card">
          <SectionHeading id="wallet-heading" title="Wallet" />
          {connected ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full bg-sage/35">
                  <Wallet className="h-5 w-5 text-forest" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="num break-all text-lg font-semibold">{DEMO_CONFIG.walletId}</p>
                  <p className="t-small text-ink/75">{DEMO_CONFIG.walletNote}</p>
                </div>
                <CopyButton value={DEMO_CONFIG.walletId} label="wallet identifier" />
              </div>
              <dl className="mt-5 space-y-3 border-t border-ink/10 pt-4">
                <Definition term="Network">
                  {state.session.network === 'wrong' ? (
                    <Chip tone="bad">Wrong network</Chip>
                  ) : (
                    <>
                      {DEMO_CONFIG.networkLabel} <span className="t-small block font-normal text-ink/75">{DEMO_CONFIG.networkNote}</span>
                    </>
                  )}
                </Definition>
                <Definition term="Token">{DEMO_CONFIG.tokenLabel}</Definition>
              </dl>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button type="button" className="btn btn-secondary" onClick={() => client.disconnectWallet()}>
                  <LogOut aria-hidden className="h-4 w-4" />
                  Disconnect
                </button>
                <p className="t-small min-w-0 flex-1 text-ink/80">Disconnecting ends this session. It does not move custody or cancel pending transfers.</p>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="t-small prose-reading text-ink/85">No wallet is connected. Public pages stay available without one.</p>
              <ConnectButton />
            </div>
          )}
        </section>

        <section aria-labelledby="environment-heading" className="card">
          <SectionHeading id="environment-heading" title="Environment" />
          <Callout tone="sponsor" title="Demo environment" live={false}>
            <span className="inline-flex items-center gap-1.5">
              <FlaskConical aria-hidden className="h-4 w-4" />
              {DEMO_CONFIG.environment}
            </span>
            . Nothing here is connected to a live chain.
          </Callout>
          <dl className="mt-4 space-y-3">
            {DEMO_CONFIG.contractRefs.map((ref) => (
              <Definition key={ref.label} term={ref.label}>
                {ref.value}
              </Definition>
            ))}
          </dl>
        </section>

        <section aria-labelledby="preferences-heading" id="preferences" className="card scroll-mt-24">
          <SectionHeading id="preferences-heading" title="Preferences" />
          <PoolPicker
            legend="Default pool preference"
            hint="Used as the starting choice in future allocation reviews. It does not authorize any transfer."
            value={state.poolPreference}
            onChange={(id) => client.setPoolPreference(id)}
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-card border border-ink/10 p-4">
              <h3 className="t-label flex items-center gap-2">
                <BellOff aria-hidden className="h-4 w-4" /> Notifications
              </h3>
              <p className="t-small mt-1 text-ink/80">Notification preferences are not supported in this demo.</p>
            </div>
            <div className="rounded-card border border-ink/10 p-4">
              <h3 className="t-label">Accessibility</h3>
              <p className="t-small mt-1 text-ink/80">
                Motion follows your device's reduced-motion setting. Text scales with browser zoom up to 200%.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="disclosures-heading" id="disclosures" className="card scroll-mt-24">
          <SectionHeading id="disclosures-heading" title="Risk disclosures" />
          <ul className="prose-reading t-small list-disc space-y-2 pl-5 text-ink/90">
            {RISK_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="privacy-heading" className="card-soft">
          <h2 id="privacy-heading" className="t-section flex items-center gap-2">
            <ShieldCheck aria-hidden className="h-5 w-5" />
            Data and privacy
          </h2>
          <p className="t-small prose-reading mt-2 text-ink/90">
            This demo keeps its synthetic state in your browser storage so a refresh can recover pending activity by operation ID. It stores no
            private keys. Your records are shown only to the connected wallet, and public totals are aggregate demo figures that do not imply
            individual sponsor credits are redeemable funds.
          </p>
          <button
            type="button"
            className="btn btn-secondary mt-4"
            onClick={() => {
              if (window.confirm('Reset all synthetic demo data in this browser?')) client.resetDemo()
            }}
          >
            Reset demo data
          </button>
        </section>
      </div>
    </>
  )
}
