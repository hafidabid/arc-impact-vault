/** Product copy. Keep wording aligned with the content rules in the UI specification. */
export const COPY = {
  brand: 'ImpactVault',
  heroTitle: 'Give the interest. Keep the money.',
  heroBody:
    'Lock your USDC for a fixed term and get your full deposit back at the end. The interest it earns goes to causes like hunger relief and forest-fire recovery, and every transfer is public.',
  principalLabel: 'Deposited principal',
  riskLine:
    'Principal is not insured or guaranteed. Smart-contract, strategy, token and network risks remain.',
  yieldNote:
    'Yield is a property of the whole vault. It is not credited to any depositor and cannot be withdrawn as principal.',
  transferNote:
    'A confirmed transfer records a token movement to an address. It does not by itself show that relief was delivered.',
} as const

export const RISK_POINTS = [
  'Principal is not insured or guaranteed. Smart-contract, strategy, token and network risks remain.',
  'If the yield strategy returns less than the total deposited, every depositor is paid back pro rata and may receive less than they deposited.',
  'Deposits are locked until the vault matures. In an emergency the vault owner can shut the vault down early, which also ends deposits permanently.',
  'Only yield realised by the vault is donated. The vault owner chooses which approved cause receives it and when; if the owner does not distribute it within the grace period, anyone can send it to the fallback cause.',
  'Cause names describe intended purposes. They do not establish charity verification, actual beneficiaries or completed impact.',
  'Nothing here is a financial recommendation.',
] as const
