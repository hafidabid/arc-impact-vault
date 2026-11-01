import type { Address } from 'viem'
import { CAUSE_LABELS } from '@/chain/config'
import { shortAddress } from '@/chain/derive'

export interface CauseInfo {
  address: Address
  /** Display name: configured label, "Fallback cause", or the short address. Never invented. */
  name: string
  purpose: string
  isFallback: boolean
  labelled: boolean
}

export function describeCause(address: Address, fallbackCause: Address): CauseInfo {
  const label = CAUSE_LABELS.find((item) => item.address.toLowerCase() === address.toLowerCase())
  const isFallback = address.toLowerCase() === fallbackCause.toLowerCase()
  if (label) return { address, name: label.name, purpose: label.purpose, isFallback, labelled: true }
  return {
    address,
    name: isFallback ? 'Default cause' : `Approved cause ${shortAddress(address)}`,
    purpose: isFallback
      ? 'Receives any yield the vault owner has not donated by the end of the grace period after settlement.'
      : 'Approved by the vault owner to receive yield. Its profile has not been published yet.',
    isFallback,
    labelled: false,
  }
}

export const causeSlug = (address: Address): string => address.toLowerCase()
