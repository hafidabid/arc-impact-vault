# Accounting and technical safeguards

## Money model

Use integer USDC base units under the configured token's verified decimals. The example assumes six decimals: 3.00 USDC = 3,000,000 units and 0.20 USDC = 200,000 units. Never use floating-point arithmetic for balances. Verify chain ID, token address and decimals before enabling transactions; a symbol alone is insufficient.

Maintain distinct custody accounts, preferably distinct contracts/addresses, for principal and sponsor proceeds. Separate ledger buckets alone do not prevent a contract with broad spending rights from accessing principal. The donation router must have no allowance or role permitting principal spending. Enforce that boundary in the custody design and transaction authorization.

Principal is a user liability and withdrawal entitlement subject to actual custody availability and system risks. Sponsor proceeds are restricted sponsor funds assigned for donation; attribution does not make them withdrawable principal. This MVP has no investment strategy or actual yield.

## Worked journal (USDC)

| Event | Debit | Credit | Amount |
|---|---|---|---|
| Confirm deposit | Principal custody asset | User principal payable | 3.00 |
| Confirm sponsor funding | Sponsor custody asset | Unassigned sponsor funds | 0.20 |
| Attribute eligible lot | Unassigned sponsor funds | User-attributed donation proceeds | 0.20 |
| Reserve Hunger allocation | User-attributed donation proceeds | Hunger donation payable | 0.20 |
| Confirm recipient transfer | Hunger donation payable | Sponsor custody asset | 0.20 |

After these events: principal asset and user payable both remain 3.00; sponsor custody is 0.00; available proceeds and donation payable are 0.00; confirmed historical donations total 0.20. The historical donation total is derived from settled transfer events and is not added to remaining assets.

A later full withdrawal debits User principal payable and credits Principal custody asset by 3.00. Gas is funded separately by an explicitly disclosed payer and excluded from this USDC example. If fees cannot be funded separately, block/review the action; never silently use principal or reduce the promised 0.20 transfer.

## Eligibility and attribution

For this demo, an explicit sponsor policy assigns one funded 200,000-unit lot to the confirmed example deposit. Record policy/version, sponsor funding transaction, lot ID, user position ID, eligible amount, attribution timestamp, environment and unique attribution ID. A deposit does not mint proceeds. No time-based accrual or percentage return is implied.

Credit only confirmed, unassigned sponsor funds. Enforce attribution ≤ unassigned funded balance, allocation ≤ available attributed proceeds, settlement ≤ reserved payable and actual sponsor custody. Lock records atomically; prevent replay with unique funding-event, attribution and operation identifiers. Eligibility changes apply prospectively and never rewrite completed transfers.

## Reservation and transaction state

Use Created → Awaiting authorization → Reserved → Submitted → Confirmed, with Rejected, Failed and Needs reconciliation branches. Reserve once before submission, with one active transfer per reservation. Persist chain ID, transaction hash/nonce, operation ID and recipient configuration version. Signing is not confirmation. Do not retry an ambiguous submission as a fresh transfer.

On a proven failed transfer, reverse its reservation using linked compensating entries. On timeout or unknown status, retain reservation until reconciliation. Reorgs create explicit rollback/compensating records according to chain finality policy; retain the original event. Index confirmed events idempotently using chain ID, transaction hash and log index. Set the confirmation threshold explicitly for the chosen network before live use.

## Invariants

- Every journal transaction balances in integer units and one token/network.
- Principal custody reconciles to outstanding principal obligations; pending withdrawals are reserved within that obligation, not counted twice.
- Sponsor custody reconciles to unassigned funds + attributed available proceeds + unsettled donation payables, accounting for explicit pending movements.
- Principal never funds donations, fees, evidence actions or sponsor attribution.
- Principal balance changes only through valid deposit, withdrawal or linked corrective events.
- Exactly two permitted pool IDs; recipient must be configured, approved and unpaused at authorization.
- Settled donation totals count each confirmed transfer once; internal allocation is not a donation transfer.

## Minimum data records

Wallet/position; token/network config; principal journal; sponsor funding lot; eligibility policy; attribution; allocation/reservation; transfer; recipient version; evidence version; review decision; audit event. Each financial record includes amount units, token/network, environment, operation ID, status, timestamps and linked provenance IDs. Store no wallet private keys in the app.

Reconcile on-chain custody, confirmed events and ledger obligations on a scheduled basis and before sensitive settlements. Apply database constraints, transactional locks and contract role restrictions; UI checks alone are insufficient. Use append-only corrections and independent audit access. Live deployment requires chain/custody selection, security review and recipient validation; none is represented as completed by this specification.
