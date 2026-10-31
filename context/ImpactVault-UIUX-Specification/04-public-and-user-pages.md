# Public and user pages

## Public homepage

**Purpose:** explain the model before asking for a wallet.

Hero: “Your deposit. A clearer path to impact.” Supporting text explains that the demo uses separate sponsor funds for donations. Primary CTA: “Explore the demo”; secondary: “See the pools”. Follow with a three-step explanation, a visibly labeled 3.00 + 0.20 example, two pool cards, a transparency preview and a risks/disclosures footer. Avoid combined “vault value” that suggests 3.20 belongs to the depositor. Never show fabricated live impact statistics.

## Onboarding

Use three short screens: how funds stay accounted for separately; wallet and network setup; pool preference. Show progress and Back/Continue controls. Explain that principal remains subject to custody, contract, token and network risks. State that proceeds here are sponsor-funded demo funds. Allow visitors to browse public content without connecting.

## Deposit

Show USDC amount input, wallet balance, configured network/token, fee estimate and custody destination. Review panel separates “Deposit principal: 3.00 USDC” from “Sponsor proceeds: funded separately; subject to eligibility”. Require an explicit transaction review. Include loading, missing wallet, wrong network, insufficient balance/fees, rejected approval, pending and confirmed states. Link the confirmed deposit to its receipt.

## Dashboard

Top card: “Deposited principal · 3.00 USDC”. Second: “Available sponsor-funded demo proceeds · 0.20 USDC” when actually credited. Show allocated/pending and confirmed donation totals separately. Display pool preference, Deposit and Withdraw actions, “Allocate proceeds”, recent activity and evidence updates. After a confirmed 0.20 donation, principal stays 3.00, available proceeds becomes 0.00 and confirmed donated becomes 0.20. Avoid APY, yield and insured-balance badges.

## Impact explorer

Show exactly two cards: Hunger Relief and Kalimantan Forest Fire Relief. Each has purpose, eligible allocation CTA, funding/transfer totals with definitions, recipient configuration status and latest evidence status. No third pool, search result or “create pool” action in MVP. With no eligible proceeds, explain why the allocation action is unavailable and link to activity.

## Activity

Chronological events for deposits, sponsor funding/attribution, allocations, transfers, withdrawals and reversals. Filter by event type, pool, status and date. A detail view shows operation ID, timestamp/timezone, source, destination, amount, token, network, transaction reference and confirmation status. Distinguish internal ledger entries from on-chain transfers. Empty state explains that connected-wallet activity appears here; loading and sync failures must not display zero as a settled balance.

## Withdraw

Show available principal independently of sponsor funds; input amount and connected-wallet destination. Explain reserved amounts and fees before confirmation. Default to the connected wallet; defer arbitrary recipient withdrawals in MVP. Show pending, confirmed and failure receipts. Do not force a donation to withdraw or promise instant settlement.

## Account

Wallet address with copy control, network, disconnect, accessibility/preferences, notification preferences where supported, risk disclosures and data/privacy information. Show demo/live environment and configured contract references. Pool preference can be updated for future allocation reviews. Account settings cannot edit balances, transaction history or evidence decisions. Disconnecting ends the session, not custody or pending transfers.

## Shared page behavior

Use descriptive page titles, labeled breadcrumbs in admin/details, clear back navigation and recoverable errors. Never expose another user's private records through a wallet-address filter. Public aggregate data must not imply that individual sponsor credits are user-owned redeemable funds.
