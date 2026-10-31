/** Approved product copy. Keep wording aligned with the content spec. */
export const COPY = {
  brand: 'ImpactVault',
  heroTitle: 'Your deposit. A clearer path to impact.',
  heroBody:
    'In this demo, donations come from separate sponsor funds. Your deposited principal stays accounted for on its own.',
  principalLabel: 'Deposited principal',
  principalSentence: 'Deposited principal: 3.00 USDC.',
  proceedsLabel: 'Available sponsor-funded demo proceeds',
  proceedsSentence: 'Available sponsor-funded demo proceeds: 0.20 USDC.',
  donationNote:
    'This donation uses sponsor-funded demo proceeds. Your deposited principal is accounted for separately.',
  transferConfirmed:
    'Transfer confirmed. This receipt records a token transfer; evidence of relief delivery is shown separately.',
  evidenceAccepted: 'Evidence accepted for display by a reviewer. This is not charity accreditation.',
  riskLine:
    'Principal is not insured or guaranteed. Contract, custody, token and network risks remain.',
  demoBanner:
    'Demo mode. Balances, receipts and transfers are synthetic. No live wallet, network or funds are involved.',
  syntheticReceipt: 'Synthetic demo receipt. Not a real transaction.',
  depositSponsorLine: 'Sponsor proceeds: funded separately; subject to eligibility',
} as const

export const SPONSOR_NOT_RETURN =
  'The sponsor contribution is separately funded. It is not a return on your deposit.'

export const RISK_POINTS = [
  'Principal is not insured or guaranteed. Contract, custody, token and network risks remain.',
  'Keeping balances separate does not guarantee recovery of principal.',
  'Sponsor-funded proceeds are restricted to donations. They are not withdrawable principal.',
  'A deposit does not create sponsor proceeds. Sponsor funding and attribution are separate, eligibility-based events.',
  'Pool names describe intended purposes. They do not establish charity verification, actual beneficiaries or completed impact.',
  'This is a demo with synthetic data. Nothing here is a financial recommendation.',
] as const
