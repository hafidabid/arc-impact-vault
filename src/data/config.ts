/** Demo configuration. A live build supplies the verified chain, token and contract references. */
export const DEMO_CONFIG = {
  environment: 'Demo (synthetic)',
  networkLabel: 'Demo network',
  networkNote: 'Not a live chain. A real network is chosen and verified before live use.',
  tokenLabel: 'USDC (6 decimals)',
  tokenNote: 'Token address and decimals are verified before any live transaction.',
  walletId: 'demo-wallet-001',
  walletNote: 'Synthetic identifier. Not a real wallet address.',
  custodyPrincipal: 'Principal custody (demo)',
  custodyProceeds: 'Proceeds custody (demo)',
  contractRefs: [
    { label: 'Principal custody', value: 'Not configured in demo mode' },
    { label: 'Proceeds custody', value: 'Not configured in demo mode' },
    { label: 'Donation router', value: 'Not configured in demo mode' },
  ],
  feeNote: 'Network fees are paid separately from your principal and from sponsor proceeds.',
  feeEstimate: 'Estimated network fee: covered separately (demo)',
} as const
