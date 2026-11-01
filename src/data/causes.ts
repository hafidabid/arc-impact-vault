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
    name: isFallback ? 'Fallback cause' : `Approved cause ${shortAddress(address)}`,
    purpose: isFallback
      ? 'Receives any yield the owner has not distributed once the grace period after settlement has passed.'
      : 'An address the vault owner has approved to receive yield. No description has been published for it.',
    isFallback,
    labelled: false,
  }
}

export const causeSlug = (address: Address): string => address.toLowerCase()
