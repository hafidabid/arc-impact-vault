import { describe, expect, it } from 'vitest'
import type { LedgerEntry } from '@/chain/logs'
import { csvCell, ledgerToCsv } from '@/lib/csv'
import { fmtDuration, fmtUnixDateTime } from '@/lib/format'
import { amountToInput, fmtUsdc, parseAmountInput } from '@/lib/units'

describe('USDC formatting and parsing (integer base units, 6 decimals)', () => {
  it('formats without floating point', () => {
    expect(fmtUsdc(3_000_000n)).toBe('3.00')
    expect(fmtUsdc(200_000n)).toBe('0.20')
    expect(fmtUsdc(1_234_567n)).toBe('1.234567')
    expect(fmtUsdc(1_250_500_000n)).toBe('1,250.50')
    expect(fmtUsdc(0n)).toBe('0.00')
  })
  it('keeps precision on very large balances', () => expect(fmtUsdc(9_007_199_254_740_993_000_000n)).toBe('9,007,199,254,740,993.00'))
  it('parses user input exactly', () => {
    expect(parseAmountInput('3.00')).toEqual({ ok: true, value: 3_000_000n })
    expect(parseAmountInput('0.000001')).toEqual({ ok: true, value: 1n })
    expect(parseAmountInput('1,000.5')).toEqual({ ok: true, value: 1_000_500_000n })
  })
  it('rejects empty, zero, negative, junk and over-precise input', () => {
    for (const bad of ['', '0', '0.00', '-1', 'abc', '1.2.3', '1e3']) expect(parseAmountInput(bad).ok).toBe(false)
    expect(parseAmountInput('0.0000001').ok).toBe(false)
  })
  it('round-trips through the input format', () => expect(parseAmountInput(amountToInput(1_234_500n))).toEqual({ ok: true, value: 1_234_500n }))
})

describe('date helpers', () => {
  it('always states the timezone', () => expect(fmtUnixDateTime(0)).toBe('01 Jan 1970, 00:00 UTC'))
  it('formats durations', () => {
    expect(fmtDuration(30n)).toBe('under a minute')
    expect(fmtDuration(3_600n * 5n + 60n * 20n)).toBe('5 h 20 min')
    expect(fmtDuration(86_400n * 6n + 3_600n * 4n)).toBe('6 days 4 h')
    expect(fmtDuration(86_400n + 3_600n)).toBe('1 day 1 h')
  })
})

describe('CSV export', () => {
  const entry: LedgerEntry = {
    id: '0xabc:1',
    kind: 'deposit',
    txHash: '0xabc',
    logIndex: 1,
    blockNumber: 7n,
    timestamp: 1_700_000_000,
    account: '0x1111111111111111111111111111111111111111',
    amount: 3_000_000n,
    detail: '12 strategy shares',
  }
  it('neutralises spreadsheet formulas and quotes special characters', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(csvCell('+1')).toBe("'+1")
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('plain')).toBe('plain')
  })
  it('labels network and units and keeps exact amounts', () => {
    const lines = ledgerToCsv([entry]).split('\r\n')
    expect(lines[0]).toContain('network,chain_id')
    expect(lines[0]).toContain('amount_usdc,amount_base_units')
    expect(lines[1]).toContain('Arc Testnet')
    expect(lines[1]).toContain(',3.000000,3000000,')
  })
})
