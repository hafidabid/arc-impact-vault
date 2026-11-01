# Content and acceptance checklist

## Copy examples

- “Deposited principal: 3.00 USDC.”
- “Available sponsor-funded demo proceeds: 0.20 USDC.”
- “This donation uses sponsor-funded demo proceeds. Your deposited principal is accounted for separately.”
- “Transfer confirmed. This receipt records a token transfer; evidence of relief delivery is shown separately.”
- “Evidence accepted for display by a reviewer. This is not charity accreditation.”
- “Principal is not insured or guaranteed. Contract, custody, token and network risks remain.”

Avoid “earned 0.20”, “6.67% yield”, “risk-free”, “guaranteed principal”, “insured deposit”, “verified charity”, and “formal waqf”. Do not substitute religious endowment terminology for the actual custody and donation model.

## Functional acceptance

1. Explorer, onboarding and admin offer only Hunger Relief and Kalimantan Forest Fire Relief.
2. A confirmed 3.00 deposit creates no automatic sponsor credit; a separately confirmed, funded attribution enables 0.20.
3. Routing 0.20 to Hunger Relief leaves principal at 3.00 and available proceeds at 0.00; confirmed donations show 0.20 once.
4. A second allocation of the same 0.20 fails, including concurrent requests, refresh/replay and duplicate event ingestion.
5. Insufficient sponsor custody, paused pool, unapproved recipient or wrong network blocks settlement.
6. Failed and ambiguous transfers follow distinct recovery paths; a timeout cannot authorize duplicate spending.
7. A full withdrawal uses only available principal and separately funded fees. Pending withdrawal amounts cannot be reused.
8. Reviewer acceptance changes evidence status only. Self-review and unauthorized treasury actions fail server-side.
9. Every worked journal balances; principal and sponsor balances reconcile independently.
10. Demo receipts are visibly synthetic; real receipts include the configured network and valid transaction reference.

## UX acceptance

Check at 320, 390, 768, 1024 and 1440px widths. All pages support keyboard navigation and screen-reader labels. Confirm focus visibility, color contrast, zoom, reduced motion, touch targets, bottom safe areas and readable mobile ledger rows. Test empty, loading, offline, wrong-network, pending, rejected and confirmed states. No loading/error view invents a zero balance or successful transfer.

## Remaining configuration decisions

Choose chain and USDC deployment; define finality threshold; select custody/contracts and fee payer; supply approved recipient addresses and due-diligence disclosures; define live sponsor eligibility policy; implement review/audit/privacy access; complete security and legal review appropriate to launch. These are open implementation decisions, not claims of completed work.
