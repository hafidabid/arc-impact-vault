# [App Name]

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

[Brief description of what the app does and its primary use case]

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## Share links

- Starter apps already ship `getShareBase`, `buildShareLink` and `installShareSync` in `src/lib/share.ts`; import them instead of rewriting them.
- Keep shareable state in the URL path or query, not in the `#fragment`.
- Never put a secret (private key, claim secret, seed phrase, session token, API key) in the URL path or query, encoded or not: every in-app path and query is mirrored to the visitor's studio.arc.io address bar and browser history and reaches servers. A bearer claim secret goes only in the `#fragment` appended to the share link (`` `${await buildShareLink('/claim')}#${secret}` ``) and is read from `location.hash` on load. A link to the app's own share URL shown inside the app must be copy-only or open in a new tab with `target="_blank" rel="noopener noreferrer"`.
- Build every link a user copies or sends with `buildShareLink()` from `src/lib/share.ts`.
- Keep the `installShareSync()` call in `src/main.tsx` when editing it; it keeps the Studio address bar in step with in-app navigation.
- Navigate inside the app with relative links.

## To Run

```bash
bun install
bun run dev
```

---

## Impact Vault (contracts only)

Yield-giving vault on Arc Testnet: principal returned to depositors, only yield goes to admin-approved causes.

Deployed on Arc Testnet (USDC 0x3600000000000000000000000000000000000000):
- MockYieldStrategy (testnet-only demo, unaudited): 0xb0bae8c07a5c738aa7eac07eccd0de0c4009bb71
- ImpactVault: 0xa0ed7b2ebe39093fff85d64c530d17a897939d06
- Admin (owner): 0x6A1e1c6De242E90579287D22fdf87ae472B29754 (generated test wallet, key in .env as TEST_ADMIN_PRIVATE_KEY)
- Fallback cause: 0xb1CB14E6c08E41d5cb856345F017A91E9D3445DE (generated test wallet, key in .env as TEST_FALLBACK_CAUSE_PRIVATE_KEY)
- Timeline: deposits close 1794065013, maturity 1794669813 (unix), claim grace 7 days
- Emergency exit: owner-only emergencyShutdown(), then enableInKindExit() if the strategy cannot be redeemed.

## ImpactVault donor frontend (demo, mock data)

- Spec lives in `context/ImpactVault-UIUX-Specification/` (read-only input, not part of the app).
- Routes: `/`, `/onboarding`, `/impact`, `/impact/:poolId`, `/dashboard`, `/deposit`, `/activity`, `/withdraw`, `/account`. Admin, ledger and evidence routes are a later turn.
- Data layer: `src/services/vault-client.ts` is the only interface the UI uses. `src/services/mock-client.ts` implements it with a persisted synthetic ledger (`src/data/seed.ts`, `src/lib/ledger.ts`). To go live, implement `VaultClient` against the wallet and contracts and change the export in `src/services/index.ts`.
- Money is integer USDC base units everywhere; use `src/lib/units.ts` (wraps `@/onchain-money`).
- Content rules: never combine principal and sponsor proceeds into one total; avoid the prohibited phrases listed in spec file 08.
- Fonts: Inter via `@fontsource-variable/inter`. Design tokens in `tailwind.config.js` and `src/index.css`.
