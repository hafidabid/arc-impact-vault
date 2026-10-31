import type { PoolConfig, PoolId } from '@/lib/types'

/**
 * Exactly two pools. Names describe intended purposes. They do not establish charity
 * verification, actual beneficiaries, or completed impact.
 */
export const POOLS: readonly PoolConfig[] = [
  {
    id: 'hunger-relief',
    name: 'Hunger Relief',
    short: 'Food assistance',
    purpose: 'Support food assistance through a configured recipient.',
    sourceOfFunds:
      'Sponsor-funded demo proceeds only. Deposited principal is accounted for separately and is never used for donations.',
    recipientStatus: 'configured-demo',
    recipientVersion: 'demo-recipient-v1',
    paused: false,
    limitations: [
      'The recipient shown here is a synthetic demo configuration. No real organization, partner or beneficiary is represented.',
      'A confirmed transfer proves a token movement to an address. It does not prove delivery of food or relief.',
      'Evidence shown later is accepted for display by a reviewer. It is not charity accreditation.',
    ],
  },
  {
    id: 'kalimantan-forest-fire-relief',
    name: 'Kalimantan Forest Fire Relief',
    short: 'Forest fire relief',
    purpose:
      'Support relief associated with forest fires in Kalimantan through a configured recipient.',
    sourceOfFunds:
      'Sponsor-funded demo proceeds only. Deposited principal is accounted for separately and is never used for donations.',
    recipientStatus: 'configured-demo',
    recipientVersion: 'demo-recipient-v1',
    paused: false,
    limitations: [
      'The recipient shown here is a synthetic demo configuration. No real organization, partner or beneficiary is represented.',
      'This pool does not describe any active incident. A confirmed transfer does not prove delivery of relief.',
      'Evidence shown later is accepted for display by a reviewer. It is not charity accreditation.',
    ],
  },
]

export const POOL_BY_ID: Record<PoolId, PoolConfig> = {
  'hunger-relief': POOLS[0],
  'kalimantan-forest-fire-relief': POOLS[1],
}

export const poolName = (id: PoolId | undefined): string => (id ? POOL_BY_ID[id].name : 'No pool')

export const isPoolId = (value: string | undefined): value is PoolId =>
  value === 'hunger-relief' || value === 'kalimantan-forest-fire-relief'

/** Evidence workflow vocabulary, shown as a legend. No submissions exist in this demo. */
export const EVIDENCE_STATES = [
  { label: 'Draft', meaning: 'Prepared by a submitter and not yet sent.' },
  { label: 'Submitted', meaning: 'Sent and waiting for a reviewer.' },
  { label: 'Under review', meaning: 'A reviewer is checking the submission.' },
  { label: 'Accepted for display', meaning: 'A reviewer accepted this submission for publication. This is not charity accreditation.' },
  { label: 'Needs changes', meaning: 'The reviewer asked for changes. A resubmission creates a new version.' },
  { label: 'Rejected', meaning: 'The reviewer did not accept the submission.' },
] as const
