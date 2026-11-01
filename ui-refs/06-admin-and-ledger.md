# Admin overview and fund-flow ledger

## Admin overview

Show separately: principal custody balance, outstanding user principal, available sponsor proceeds, reserved allocations, confirmed donations, pending withdrawals and reconciliation exceptions. Include last sync time, configured network, environment and paused-state indicators. Do not combine principal and sponsor funds into an unlabeled impact total.

Provide quick access to unresolved transfers, sponsor funding/attribution, recipient configuration, evidence queue and reconciliation. MVP has no pool creation UI. Pool settings can change description and reviewed recipient configuration, with an audit trail; financial history remains immutable.

## Fund-flow ledger

Filters: source bucket, event type, wallet/position (authorized staff only), pool, status, time and operation ID. Columns: timestamp, operation ID, type, from, to, amount/token, pool, confirmation state and transaction reference. Expand a row to view balanced entries, funding lot, allocation, signer/actor, relevant recipient version and reconciler status. CSV export uses the same access restrictions and includes environment and unit labels.

Flow diagram labels: User wallet → Principal custody; Sponsor wallet → Proceeds custody → Pool recipient. Never draw Principal custody → Pool recipient. Internal attribution/reservation is labeled “Ledger allocation”; it must not look like a second on-chain deposit.

## Proposed roles

| Role | Allowed actions |
|---|---|
| Donor | Own deposits, allocations, withdrawals and receipts |
| Operations | Sponsor attribution, transfer investigation, reconciliation |
| Treasury approver | Approve recipient changes and authorized settlement |
| Evidence submitter | Submit evidence versions |
| Reviewer | Decide evidence display status; no self-review |
| Auditor | Read ledger, decisions and audit exports |

Enforce permissions server-side and in contracts where applicable. Hiding a button is not access control. Recipient changes require a separate approver and apply to future authorized transfers; a changed recipient invalidates an unsent prior review so the transfer must be reviewed again. Log actor, action, old/new value, timestamp and reason. No admin balance-edit form or delete-history control.

## Operational states

Paused allocations, paused transfers and paused deposits must have distinct labels. Show whether withdrawals are available. A reconciliation discrepancy blocks affected settlements and gives operators an exception record. Do not mark pending activity failed solely because an indexer or RPC is offline.
