# Pools, evidence and reviewer controls

## Exactly two pools

| Stable ID | Display name | Intended purpose |
|---|---|---|
| `hunger-relief` | Hunger Relief | Support food assistance through a configured recipient |
| `kalimantan-forest-fire-relief` | Kalimantan Forest Fire Relief | Support relief associated with forest fires in Kalimantan through a configured recipient |

Do not invent recipient organizations, active incidents, partner logos, beneficiary counts or endorsements. Both pages use the same structure: purpose, source of funds, recipient disclosure, ledger totals, allocation action, transfer history, evidence timeline and limitations. An unconfigured recipient disables settlement. A pool may be paused without creating a replacement pool.

## Funding presentation

Separate “Available to allocate”, “Allocated awaiting transfer”, “Transferred”, and “Evidence reviewed”. Evidence reviewed is a status/count, not another money balance. A confirmed transfer proves a token movement to an address; it does not prove delivery of food or relief. No “verified charity” badge is allowed.

## Evidence record

Store evidence ID, pool ID, linked transfer IDs, submitter, submission time, activity date/range, title, summary, document/media references, content hash where available, access level, reviewer decisions and version history. State what the evidence supports and what remains unconfirmed. Exclude personal beneficiary details from public views unless separately authorized and appropriately protected.

## Workflow

Draft → Submitted → Under review → Accepted for display / Needs changes / Rejected. Published evidence can later be marked Disputed or Superseded; retain the previous record and reason. A resubmission creates a version rather than overwriting the original. “Accepted for display” means a reviewer accepted that submission for publication; it does not certify the charity or guarantee impact.

## Reviewer interface

A queue filters by pool and review state. The detail panel shows the submission, linked transfer receipt, previous versions, scope of the review and decision history. Reviewers can request changes, accept for display, reject, or flag a published claim as disputed. Require a reason for each decision. Show a public decision summary and retain internal reviewer identity/access metadata according to the access policy.

Submitters cannot review their own evidence. Review permissions cannot send funds or change recipients. Evidence acceptance never creates a financial journal entry, unlocks principal, or changes a transfer's settlement status. Disable duplicate decisions on stale versions and require the reviewer to reload the latest submission.
