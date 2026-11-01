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
- MockYieldStrategy (testnet-only demo, unaudited): 0xb0bae8c07a5c738aa7eac07eccd0de0c4009bb71 — permissionless, no admin, shared by both vaults below.
- ImpactVault: 0xd56B2ba0c4082D74856e4f739DaF9174507eaA6b (deploy block 70101849)
- Admin (owner): 0x922De363B0eB317bE610f4FC707eF994A011EDE3 — the same key as `DEV_ETH_PRIVATE_KEY` in `secrets`, and the address that deployed it. Admin calls are verified working.
- Fallback cause: 0x922De363B0eB317bE610f4FC707eF994A011EDE3 (same address as admin, so swept yield stays recoverable on testnet)
- Timeline: deposits close 2026-11-08T01:32:57Z, maturity 2026-11-15T01:32:57Z, claim grace 7 days
- Emergency exit: owner-only emergencyShutdown(), then enableInKindExit() if the strategy cannot be redeemed.
- Redeploy with `bun --env-file=secrets scripts/redeploy-vault.ts [--broadcast]`. It reuses the on-chain init code of the first deployment instead of recompiling, so Foundry is not required; it refuses to run if that init code's trailing bytes do not decode to the known original constructor args.

### Superseded first deployment (do not use)

- ImpactVault 0xa0ed7b2ebe39093fff85d64c530d17a897939d06 (deploy block 70028821) is **stranded**. It was deployed through Arc Studio's hosted deployer (EOA 0x8792161a120924A6c04791D3C4a576C4c93A4C2B via CREATE2 factory 0xa3039A54856ed74B5AEc999EeF3fc954Ab010Cf6), and its owner was set to a generated wallet 0x6A1e1c6De242E90579287D22fdf87ae472B29754 whose key was only ever in a git-ignored `.env` that no longer exists. That owner has nonce 0 and a zero USDC balance, so it can neither be recovered nor pay Arc gas: every `onlyOwner` function on that vault is permanently unreachable, including `transferOwnership`. It still holds 1.0 test USDC of principal. Depositors can still `withdraw()`/`claim()` because those are permissionless; nothing else works.
- Lesson: on Arc, gas is paid in USDC, so an admin address must hold USDC and its key must be stored somewhere durable (`secrets`, not `.env`). Prefer making the deploying signer the admin.

## ImpactVault frontend (live, contract-backed)

- Spec lives in `ui-refs/` (and `context/ImpactVault-UIUX-Specification/`); where it describes sponsor lots, allocation or evidence review, the deployed contract is the source of truth (no such features on-chain).
- Config: `src/chain/config.ts`, overridable with `VITE_VAULT_ADDRESS`, `VITE_STRATEGY_ADDRESS`, `VITE_USDC_ADDRESS`, `VITE_VAULT_DEPLOY_BLOCK`, and `VITE_CAUSES` (JSON `[{address,name,purpose}]` for cause names). Moving to production = new env values and the production chain in `CHAIN`.
- Reads/writes: `src/chain/hooks.ts` (wagmi). Pure logic in `src/chain/derive.ts` (phase, payout, errors). Events → ledger in `src/chain/logs.ts`.
- Routes: `/`, `/onboarding`, `/impact`, `/impact/:address`, `/dashboard`, `/deposit`, `/withdraw`, `/activity`, `/account`; owner-only `/admin`, `/admin/ledger`, `/admin/causes`.
- Money is integer USDC base units; Arc gas is paid in the same USDC, so deposits reserve a fee.
- Tests: `bun run test` (unit), `bun run test:testnet` (live, spends 1 test USDC using `secrets`, which is git-ignored). `scripts/dev-signer.ts` is a local-only signer for browser testing.
