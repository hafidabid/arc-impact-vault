# Navigation and flows

## Responsive information architecture

Public routes: `/`, `/onboarding`, `/impact`, `/impact/hunger-relief`, `/impact/kalimantan-forest-fire-relief`.

Wallet routes: `/dashboard`, `/deposit`, `/activity`, `/withdraw`, `/account`. Admin routes: `/admin`, `/admin/ledger`, `/admin/evidence`, and pool configuration under `/admin/pools/:id`.

Below 768px, use a compact header and bottom navigation: Home (dashboard), Impact, Activity, Account. Deposit and Withdraw are prominent dashboard actions. Add safe-area padding and enough bottom content space to avoid overlap. Public visitors see a simple header, Explore and Connect actions. Admin uses a separate labeled workspace with Overview, Ledger, Pools and Evidence; never place admin controls among donor actions.

At 768–1023px, use a compact side rail or top navigation. At 1024px and above, use a labeled sidebar with a persistent connected-wallet/network summary. Tables become stacked labeled records on mobile, with a full-detail drawer for hashes and account entries. Preserve current filters and navigation position when returning from a detail page.

## Onboarding

Explain principal and sponsor proceeds → explain transfer/custody risks and demo mode → connect wallet → verify network and token → select the default pool preference → open deposit. A pool preference does not authorize a transfer. Wallet connection itself must not request spending approval.

## Deposit

Enter 3.00 USDC → validate network, balance and fee availability → review token, network, custody destination and amount → approve exact spending allowance if required → sign deposit → pending → confirmed receipt. Refresh balances only from confirmed events. Sponsor funding and attribution are separate events; do not promise that every deposit earns 0.20 USDC.

## Demo sponsor attribution and allocation

Confirm 3 USDC deposit → confirm sponsor funding lot of 0.20 USDC → assign that lot once to this eligible demo position → show 0.20 available proceeds → choose Hunger Relief → review source and destination → authorize allocation → reserve 0.20 → route transfer → confirm receipt. Show principal 3.00 throughout, with pending states clearly marked. A failed confirmed-on-chain transfer attempt releases its reservation only after reconciliation; an ambiguous timeout stays pending.

## Withdrawal

Select available principal → show amount, destination and separate network fee estimate → review → authorize → reserve principal → submit → confirm. A 3.00 USDC withdrawal requires 3.00 available principal and independently funded fees. Never silently deduct a donation or sponsor-funded proceeds from principal. Pending transfers are not available to spend twice.

## Recovery

Rejecting a wallet signature leaves balances unchanged. Wrong network gives a switch action; insufficient fees gives an explanation. Unknown submission status gives “Checking transaction” and a receipt lookup, not a fresh payment button. Refresh and reconnect recover pending activity by stable operation ID.
