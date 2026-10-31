import { createMockClient } from './mock-client'
import type { VaultClient } from './vault-client'

/** Swap this single export for a wallet and contract backed client when going live. */
export const vaultClient: VaultClient = createMockClient()
export type { VaultClient } from './vault-client'
