/** Product copy. Keep wording aligned with the content rules in the UI specification. */
export const COPY = {
  brand: 'ImpactVault',
  heroTitle: 'Give the interest. Keep the money.',
  heroBody:
    'Deposit USDC for a fixed term and receive your full principal at maturity. The yield it earns is donated to approved causes in hunger relief and forest restoration, and every transfer is recorded publicly on Arc.',
  principalLabel: 'Deposited principal',
  riskLine:
    'Deposits are not insured or guaranteed and carry smart-contract, strategy and network risk.',
  yieldNote:
    'Yield belongs to the vault, not to individual depositors. It is held in reserve for approved causes and is never paid out as principal.',
  transferNote:
    'Every donation is a public on-chain transfer to the recipient’s address. Recipients are accountable for reporting how the funds are used.',
} as const

export const RISK_POINTS = [
  'Principal is not insured or guaranteed. Deposits carry smart-contract, strategy, token and network risk.',
  'Principal is repaid in full when the yield strategy returns at least the total deposited. If it returns less, every depositor is repaid pro rata.',
  'Deposits are held until maturity. In an emergency the vault owner may close the vault early, which permanently ends new deposits.',
  'Only realised yield is donated. The vault owner directs it to approved causes; yield not donated within the grace period can be sent by anyone to the vault’s default cause.',
  'Cause names and missions are published by ImpactVault. Approval is not a third-party accreditation, and each recipient reports on its own use of funds.',
  'ImpactVault does not provide financial advice.',
] as const
