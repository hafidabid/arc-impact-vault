import { formatUnitsExact, parseUsdc, AmountError } from '@/onchain-money'
import { USDC_DECIMALS } from '@/onchain-facts'

const group = (whole: string) => whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

/** "3.00", "0.20", "1,250.50". Never rounds: extra precision (up to 6 digits) is kept. */
export function fmtUsdc(raw: bigint): string {
  const exact = formatUnitsExact(raw, USDC_DECIMALS)
  const [whole, fraction = ''] = exact.split('.')
  return `${group(whole)}.${fraction.padEnd(2, '0')}`
}

export const fmtUsdcUnit = (raw: bigint): string => `${fmtUsdc(raw)} USDC`

export const ZERO = 0n

export type ParsedAmount = { ok: true; value: bigint } | { ok: false; error: string }

/** Parses user text into integer base units. Never uses floating point. */
export function parseAmountInput(text: string): ParsedAmount {
  const trimmed = text.trim().replace(/,/g, '')
  if (trimmed === '') return { ok: false, error: 'Enter an amount in USDC.' }
  try {
    const value = parseUsdc(trimmed)
    if (value <= 0n) return { ok: false, error: 'Enter an amount greater than 0.00 USDC.' }
    return { ok: true, value }
  } catch (error) {
    if (error instanceof AmountError && error.code === 'TOO_MANY_FRACTION_DIGITS') {
      return { ok: false, error: 'USDC supports up to 6 decimal places.' }
    }
    return { ok: false, error: 'Enter a number such as 3.00.' }
  }
}

/** Editable text for an amount, without grouping separators. */
export const amountToInput = (raw: bigint): string => {
  const exact = formatUnitsExact(raw, USDC_DECIMALS)
  const [whole, fraction = ''] = exact.split('.')
  return `${whole}.${fraction.padEnd(2, '0')}`
}
