# Impact Vault

**Give your yield, keep your money.**

Impact Vault is a yield-giving vault on [Arc](https://arc.io), Circle's stablecoin-native L1. Depositors lock USDC until a fixed maturity and get **100% of their principal back**. Only the yield earned along the way is donated — and it can only ever go to causes the vault owner has approved on-chain.

Charitable giving usually asks people to choose between their savings and their values. Impact Vault removes the choice: your capital comes home, your interest does the work. Every approval, distribution and withdrawal is a public event on Arc, so donors can verify where the money went instead of taking a report's word for it.

Built with [Arc Studio](https://studio.arc.io) (https://studio.arc.io/app/ce2d0910-98fd-4df0-8829-093186ce2021) for [Arc Microgrants](https://dorahacks.io/hackathon/arc-microgrants-2/detail).

<p align="center">
  <img src="docs/screenshots/home.png" alt="Impact Vault home page: the vault's live phase, total deposited principal, yield to date and the approved causes" width="100%">
</p>

<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="Depositor dashboard showing deposited principal, vault timeline and recent activity" width="49%">
  <img src="docs/screenshots/impact.png" alt="Impact explorer listing on-chain approved causes and the yield distributed to each" width="49%">
</p>

---

## How it works

| Phase | What happens |
| --- | --- |
| **Open** | Deposit USDC before the deposit deadline. Your principal is recorded under your wallet and invested in the vault's ERC-4626 yield strategy. |
| **Locked** | The strategy earns yield for the vault as a whole. Yield is never credited to individual depositors, so no one can withdraw someone else's gain. |
| **Matured** | Anyone can settle the vault. Principal and realised yield are separated and reserved. |
| **Settled** | Every depositor withdraws their full original deposit. The owner distributes the realised yield to approved causes. |

Four properties make it trustworthy rather than merely transparent:

- **Principal is senior.** Depositors are made whole before a single unit of yield can be distributed. The contract separates `totalPrincipal` from the yield pool and will not let the owner touch the former.
- **The owner cannot choose a new recipient at payout time.** Causes must be approved on-chain *before* they can receive anything, and each approval is its own public event.
- **Nobody can sit on the money.** If the owner has not distributed the yield within the claim grace period (minimum 7 days, enforced in the constructor), *anyone* can sweep what is left to the fallback cause fixed at deployment.
- **There is an exit.** The owner can halt deposits and let depositors leave early. If the strategy cannot be redeemed for cash, depositors receive their pro-rata share of the strategy position in kind instead.

One honest caveat, stated plainly because it is a money app: principal is returned in full **as long as the yield strategy returns at least the total deposited**. If the strategy loses value, depositors share that loss proportionally. The vault does not and cannot promise otherwise, and the interface never describes projected yield as a guarantee.

## Architecture

```
  Browser (React + wagmi/viem)
         │  reads: contract views + event logs
         │  writes: user-signed transactions
         ▼
  ImpactVault.sol  ──invests──▶  ERC-4626 strategy  ──holds──▶  USDC
   (Ownable2Step,                                              (Arc native
    Pausable,                                                   gas token)
    ReentrancyGuard)
```

**There is no backend, and that is the point.** The browser talks straight to Arc. Every figure on screen is a contract read, and the activity ledger is reconstructed from on-chain events — there is no server, no database and no indexer to trust, go down, or disagree with the chain. That also means nothing to deploy or pay for beyond a static bundle.

The yield source is a pluggable ERC-4626 vault, passed once in the constructor and immutable thereafter. Pointing Impact Vault at a different lending market means a new deployment, not a privileged setter.

## Tech stack

React 18 · Vite · TypeScript · Tailwind CSS · wagmi v2 · viem · ConnectKit · Solidity 0.8.28 · Foundry · OpenZeppelin 5.6

Network: Arc Testnet (chain ID `5042002`) by default, Arc Mainnet (chain ID `5042`) with `VITE_CHAIN=arc`. USDC is the native gas token on Arc, so deposits reserve a fee.

## Live deployment

### Arc Mainnet

Live on Arc Mainnet (chain ID `5042`) since 2026-11-01. The app at **https://arc-impact-vault.vercel.app** reads it, and all contracts are source-verified on [Arc Explorer](https://explorer.arc.io). The deployment ran four demo rounds with real USDC. Each round used its own vault, because a vault's maturity is fixed at deploy and it settles once.

| | |
| --- | --- |
| ImpactVault (round 4, used by the mainnet app build) | [`0x73f5a8200052e1cb8297e1f2fe6a7a049e0c86df`](https://explorer.arc.io/address/0x73f5a8200052e1cb8297e1f2fe6a7a049e0c86df) |
| ImpactVault (round 3) | [`0xa4dc3f921003f44870a6f3097449c67fdcbcfdbe`](https://explorer.arc.io/address/0xa4dc3f921003f44870a6f3097449c67fdcbcfdbe) |
| ImpactVault (round 1) | [`0x67f62f2bf77c50907fd503eaf47829a1848cfb39`](https://explorer.arc.io/address/0x67f62f2bf77c50907fd503eaf47829a1848cfb39) |
| ImpactVault (round 2) | [`0x1be966b6755737d99190e21f20af4e2ba0775d14`](https://explorer.arc.io/address/0x1be966b6755737d99190e21f20af4e2ba0775d14) |
| Yield strategy (demo MockYieldStrategy) | [`0x4575af36401119405ae4b8c67369c22c41bfb51d`](https://explorer.arc.io/address/0x4575af36401119405ae4b8c67369c22c41bfb51d) |
| Owner / admin | [`0x922De363B0eB317bE610f4FC707eF994A011EDE3`](https://explorer.arc.io/address/0x922De363B0eB317bE610f4FC707eF994A011EDE3) |
| ImpactVault Hunger Relief Fund (default cause) | [`0x4Ad77b6e1399779AeeB5E95172F7bC13314E87ec`](https://explorer.arc.io/address/0x4Ad77b6e1399779AeeB5E95172F7bC13314E87ec) |
| ImpactVault Forest Restoration Fund | [`0xC09eF1438D424606269E2CCc67deAA70F325C04b`](https://explorer.arc.io/address/0xC09eF1438D424606269E2CCc67deAA70F325C04b) |
| Round 4 deploy block | `28985044` |
| USDC | `0x3600000000000000000000000000000000000000` |

#### Mainnet activity

In each round:

1. Two depositors deposited USDC (0.7 and 0.8 in rounds 1–3; 0.5 and 0.6 in round 4).
2. The admin added simulated yield to the strategy.
3. The vault was settled at maturity.
4. Both depositors withdrew their **full principal**.
5. The admin donated all realised yield to approved causes: the ImpactVault Hunger Relief Fund in rounds 1–3, and both funds in round 4.

After round 3, the admin approved a second cause, the ImpactVault Forest Restoration Fund ([tx](https://explorer.arc.io/tx/0x2054f6652b047633bd02f8698e738d978e6b326f24fe26e4cdc578b783619f70)). Round 4 approved it on its own vault ([tx](https://explorer.arc.io/tx/0x1df1cd18c0dcbd12d28aa683b19a734f2c194b76f000ad6342a3da794c150bdf)).

| Round | Deposits | Realised yield donated | Donation tx |
| --- | --- | --- | --- |
| 1 | 0.7 + 0.8 USDC | 0.299999 USDC | [`0xe5180f01…f4679`](https://explorer.arc.io/tx/0xe5180f01643dd0516c2bd3420c210f18c4f215eb762683f7e47a0f0b1e8f4679) |
| 2 | 0.7 + 0.8 USDC | 0.299999 USDC | [`0x5b9ccfb0…93630`](https://explorer.arc.io/tx/0x5b9ccfb0fa7c739dcf268def3bc03cc89f3e83e47e2dc3b445177d6462b93630) |
| 3 | 0.7 + 0.8 USDC | 0.239999 USDC | [`0x5b60ae3c…6bd72`](https://explorer.arc.io/tx/0x5b60ae3ce8ac37c5291e48eafaaf8c0c264509f73b8aff069881c0ad6586bd72) |
| 4 | 0.5 + 0.6 USDC | 0.1 USDC to Hunger Relief + 0.199998 USDC to Forest Restoration | [`0x5a8b9757…9b449`](https://explorer.arc.io/tx/0x5a8b9757654c558e892698dda3d94c3ffb88df1f9982d341bcf60e04f489b449), [`0x3554cd73…2c675`](https://explorer.arc.io/tx/0x3554cd7357555ed5e7a36c04c45c5bb884c854ba99e64f05ea241bc637b2c675) |

That is 5.6 USDC of principal deposited and returned, and 1.139995 USDC of yield donated, across 61 transactions. Total gas was 0.399 USDC. [`scripts/mainnet-demo.ts`](scripts/mainnet-demo.ts) (rounds 1–3) and [`scripts/mainnet-round4.ts`](scripts/mainnet-round4.ts) sent every transaction and logs each one, so a re-run resumes rather than repeats.

The mainnet strategy is the unaudited demo `MockYieldStrategy`, and its yield is USDC the admin transferred in. The demo proves the vault's mechanics with real money on mainnet. It does not show real investment returns, and the strategy should not hold meaningful funds.

---

## Quick start

Prerequisites: [Bun](https://bun.sh). [Foundry](https://book.getfoundry.sh) is needed only to build, test or deploy contracts.

```bash
bun install
bun run dev          # http://localhost:5173
```

```bash
bun run check        # lint + typecheck
bun run test         # unit tests (pure logic, no network)
bun run contracts:build
bun run contracts:test
```

## Deploying the frontend

The app is a static bundle — any static host works (Arc Studio, Vercel, Netlify, Cloudflare Pages, S3 + CDN).

```bash
bun run build        # emits dist/
bun run preview      # serve dist/ locally to sanity-check it
```

Configuration is entirely environment-driven, so **moving networks never requires a code change**. Set these at build time:

| Variable | Purpose |
| --- | --- |
| `VITE_CHAIN` | `arc` for Arc Mainnet; unset for Arc Testnet |
| `VITE_VAULT_ADDRESS` | ImpactVault address |
| `VITE_STRATEGY_ADDRESS` | ERC-4626 strategy address |
| `VITE_USDC_ADDRESS` | USDC address |
| `VITE_VAULT_DEPLOY_BLOCK` | First block to scan for events — set to the vault's deploy block so the ledger does not scan from genesis |
| `VITE_CAUSES` | JSON `[{"address","name","purpose"}]` giving display names to approved causes. The contract only stores addresses; an approved cause with no entry is shown by address and never under an invented name |

```bash
VITE_VAULT_ADDRESS=0x… \
VITE_STRATEGY_ADDRESS=0x… \
VITE_VAULT_DEPLOY_BLOCK=… \
bun run build
```

Defaults in `src/chain/config.ts` point at the live testnet deployment, so a plain `bun run build` produces a working testnet app. To build against the mainnet round 4 vault:

```bash
VITE_CHAIN=arc \
VITE_VAULT_ADDRESS=0x73f5a8200052e1cb8297e1f2fe6a7a049e0c86df \
VITE_STRATEGY_ADDRESS=0x4575af36401119405ae4b8c67369c22c41bfb51d \
VITE_VAULT_DEPLOY_BLOCK=28985044 \
bun run build
```

## License

MIT
