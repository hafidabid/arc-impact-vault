import { ExternalLink } from 'lucide-react'
import { explorerUrl } from '@/chain/config'
import { shortAddress, shortHash } from '@/chain/derive'

export function AddressLink({ address, full = false }: { address: string; full?: boolean }) {
  return (
    <a
      href={explorerUrl('address', address)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[24px] items-center gap-1 break-all font-medium text-forest underline underline-offset-4"
    >
      <span className="num">{full ? address : shortAddress(address)}</span>
      <ExternalLink aria-hidden className="h-3.5 w-3.5 shrink-0" />
      <span className="sr-only">(opens in explorer)</span>
    </a>
  )
}

export function TxLink({ hash, full = false }: { hash: string; full?: boolean }) {
  return (
    <a
      href={explorerUrl('tx', hash)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[24px] items-center gap-1 break-all font-medium text-forest underline underline-offset-4"
    >
      <span className="num">{full ? hash : shortHash(hash)}</span>
      <ExternalLink aria-hidden className="h-3.5 w-3.5 shrink-0" />
      <span className="sr-only">(opens in explorer)</span>
    </a>
  )
}
