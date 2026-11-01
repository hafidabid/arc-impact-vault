/**
 * Local-only JSON-RPC signer for browser testing. Serves an EIP-1193 style endpoint on 127.0.0.1 that signs
 * with DEV_ETH_PRIVATE_KEY from ./secrets, so a test page can act as a connected wallet without a browser
 * extension. It never listens on a public interface. Run: bun run scripts/dev-signer.ts
 */
import { readFileSync } from 'fs'
import { createPublicClient, createWalletClient, http } from 'viem'
import type { Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { CHAIN } from '../src/chain/config'

const env = Object.fromEntries(
  readFileSync(new URL('../secrets', import.meta.url), 'utf8')
    .split('\n')
    .filter((line) => line.includes('='))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).replace(/^["']|["']$/g, '')]),
)
const account = privateKeyToAccount(env.DEV_ETH_PRIVATE_KEY as Hex)
const transport = http(env.ARC_RPC_URL)
const rpc = createPublicClient({ chain: CHAIN, transport })
const wallet = createWalletClient({ account, chain: CHAIN, transport })
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' }

type Json = Record<string, unknown>
async function handle(method: string, params: unknown[]): Promise<unknown> {
  switch (method) {
    case 'eth_requestAccounts':
    case 'eth_accounts':
      return [account.address]
    case 'wallet_switchEthereumChain':
    case 'wallet_addEthereumChain':
      return null
    case 'eth_sendTransaction': {
      const tx = params[0] as Json
      return wallet.sendTransaction({
        to: tx.to as Hex,
        data: tx.data as Hex | undefined,
        value: tx.value ? BigInt(tx.value as string) : undefined,
        gas: tx.gas ? BigInt(tx.gas as string) : undefined,
      })
    }
    case 'personal_sign':
      return wallet.signMessage({ message: { raw: params[0] as Hex } })
    default:
      return rpc.request({ method, params } as never)
  }
}

Bun.serve({
  hostname: '127.0.0.1',
  port: 8799,
  async fetch(request: Request) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
    const body = (await request.json()) as { id: number; method: string; params?: unknown[] }
    try {
      const result = await handle(body.method, body.params ?? [])
      return Response.json({ jsonrpc: '2.0', id: body.id, result }, { headers: cors })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'error'
      return Response.json({ jsonrpc: '2.0', id: body.id, error: { code: /rejected/i.test(message) ? 4001 : -32000, message } }, { headers: cors })
    }
  },
})
console.log(`dev signer for ${account.address} on http://127.0.0.1:8799`)
