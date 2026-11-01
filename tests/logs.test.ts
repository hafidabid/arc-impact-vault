import { describe, expect, it, vi } from 'vitest'
import type { PublicClient } from 'viem'
import { logsInRange } from '../src/chain/logs'

const fake = (impl: (range: { fromBlock: bigint; toBlock: bigint }) => unknown[]) =>
  ({ getLogs: vi.fn(async (range: { fromBlock: bigint; toBlock: bigint }) => impl(range)) }) as unknown as PublicClient & { getLogs: ReturnType<typeof vi.fn> }

describe('logsInRange', () => {
  it('splits a range the node calls too large and returns every log once', async () => {
    const client = fake(({ fromBlock, toBlock }) => {
      if (toBlock - fromBlock + 1n > 100n) throw new Error('requested range too large')
      return Array.from({ length: Number(toBlock - fromBlock + 1n) }, (_, i) => ({ blockNumber: fromBlock + BigInt(i) }))
    })
    const logs = (await logsInRange(client, 1n, 450n)) as unknown as { blockNumber: bigint }[]
    expect(logs).toHaveLength(450)
    expect(new Set(logs.map((l) => l.blockNumber)).size).toBe(450)
  })

  it('retries after a rate limit instead of failing', async () => {
    let calls = 0
    const client = fake(() => {
      if (++calls < 2) throw new Error('rate limit exceeded')
      return [{ blockNumber: 1n }]
    })
    expect(await logsInRange(client, 1n, 10n)).toHaveLength(1)
    expect(calls).toBe(2)
  })

  it('surfaces unrelated errors', async () => {
    const client = fake(() => {
      throw new Error('connection refused')
    })
    await expect(logsInRange(client, 1n, 10n)).rejects.toThrow('connection refused')
  })
})
