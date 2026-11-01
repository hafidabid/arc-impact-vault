/**
 * Redeploys ImpactVault on Arc Testnet with a new admin, reusing the already-deployed
 * MockYieldStrategy (which is permissionless and has no admin of its own).
 *
 * The init code is taken from the existing deployment's creation bytecode rather than recompiled,
 * so the new vault runs byte-identical logic to the one already on chain. Only the constructor
 * arguments change. Pass --broadcast to actually send; the default is a dry run.
 */
import { createPublicClient, createWalletClient, http, encodeAbiParameters, formatUnits, getAddress } from 'viem'
import { arcTestnet } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const USDC = getAddress('0x3600000000000000000000000000000000000000')
const STRATEGY = getAddress('0xb0bae8c07a5c738aa7eac07eccd0de0c4009bb71')
const OLD_VAULT = getAddress('0xa0ed7b2ebe39093fff85d64c530d17a897939d06')
const ADMIN = getAddress('0x922De363B0eB317bE610f4FC707eF994A011EDE3')
const FALLBACK_CAUSE = ADMIN
const CLAIM_GRACE = 604800n // 7 days, the contract minimum

const CTOR_TYPES = [
  { name: 'usdc_', type: 'address' },
  { name: 'strategy_', type: 'address' },
  { name: 'admin', type: 'address' },
  { name: 'depositDeadline_', type: 'uint64' },
  { name: 'maturity_', type: 'uint64' },
  { name: 'fallbackCause_', type: 'address' },
  { name: 'claimGracePeriod_', type: 'uint64' },
] as const

const broadcast = process.argv.includes('--broadcast')
const pk = process.env.DEV_ETH_PRIVATE_KEY
if (!pk) throw new Error('DEV_ETH_PRIVATE_KEY missing — run with `bun --env-file=secrets`')
const account = privateKeyToAccount((pk.startsWith('0x') ? pk : `0x${pk}`) as `0x${string}`)
if (account.address.toLowerCase() !== ADMIN.toLowerCase()) {
  throw new Error(`signer ${account.address} is not the intended admin ${ADMIN}`)
}

const transport = http()
const pub = createPublicClient({ chain: arcTestnet, transport })
const wallet = createWalletClient({ account, chain: arcTestnet, transport })

/** Pull the existing deployment's init code, stripping its trailing constructor arguments. */
async function fetchInitCode(): Promise<`0x${string}`> {
  const url = `${arcTestnet.blockExplorers.default.apiUrl}?module=contract&action=getcontractcreation&contractaddresses=${OLD_VAULT}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`explorer returned ${res.status}`)
  const body = (await res.json()) as { result?: { creationBytecode?: string }[] }
  const creation = body.result?.[0]?.creationBytecode
  if (!creation) throw new Error('explorer did not return creationBytecode')
  const argBytes = CTOR_TYPES.length * 32
  const hex = creation.slice(2)
  const initCode = hex.slice(0, hex.length - argBytes * 2)
  const trailingArgs = `0x${hex.slice(hex.length - argBytes * 2)}`
  // Sanity check: the trailing bytes must decode to the known original arguments.
  const expected = encodeAbiParameters(CTOR_TYPES, [
    USDC, STRATEGY, getAddress('0x6A1e1c6De242E90579287D22fdf87ae472B29754'),
    1794065013n, 1794669813n, getAddress('0xb1CB14E6c08E41d5cb856345F017A91E9D3445DE'), CLAIM_GRACE,
  ])
  if (trailingArgs.toLowerCase() !== expected.toLowerCase()) {
    throw new Error('trailing bytes do not match the known original constructor args — refusing to deploy')
  }
  return `0x${initCode}`
}

const now = (await pub.getBlock()).timestamp
const depositDeadline = now + 7n * 86400n
const maturity = now + 14n * 86400n

const initCode = await fetchInitCode()
const args = encodeAbiParameters(CTOR_TYPES, [
  USDC, STRATEGY, ADMIN, depositDeadline, maturity, FALLBACK_CAUSE, CLAIM_GRACE,
])
const data = `${initCode}${args.slice(2)}` as `0x${string}`

const iso = (t: bigint) => new Date(Number(t) * 1000).toISOString()
console.log('signer / admin   ', account.address)
console.log('usdc             ', USDC)
console.log('strategy (reused)', STRATEGY)
console.log('fallback cause   ', FALLBACK_CAUSE)
console.log('deposits close   ', iso(depositDeadline))
console.log('maturity         ', iso(maturity))
console.log('claim grace      ', `${CLAIM_GRACE}s`)
console.log('init code        ', `${(initCode.length - 2) / 2} bytes`)

// Arc pays gas in USDC but the native unit carries 18 decimals, not the ERC-20's six.
const GAS_DECIMALS = arcTestnet.nativeCurrency.decimals
const gas = await pub.estimateGas({ account, data })
const fees = await pub.estimateFeesPerGas()
const price = fees.maxFeePerGas ?? fees.gasPrice ?? 0n
const balance = await pub.getBalance({ address: account.address })
console.log(`\ngas estimate      ${gas}`)
console.log(`max fee/gas       ${price}`)
console.log(`worst-case cost   ${formatUnits(gas * price, GAS_DECIMALS)} USDC`)
console.log(`signer gas balance ${formatUnits(balance, GAS_DECIMALS)} USDC`)
if (gas * price > balance) throw new Error('signer cannot cover the worst-case deployment fee')

if (!broadcast) {
  console.log('\nDry run only. Re-run with --broadcast to deploy.')
  process.exit(0)
}

const hash = await wallet.sendTransaction({ data, gas: (gas * 125n) / 100n })
console.log(`\nsent ${hash}`)
const receipt = await pub.waitForTransactionReceipt({ hash })
if (receipt.status !== 'success' || !receipt.contractAddress) {
  throw new Error(`deployment failed: status=${receipt.status}`)
}
const vault = getAddress(receipt.contractAddress)
console.log(`deployed ImpactVault at ${vault} in block ${receipt.blockNumber}`)
console.log(`gas used ${receipt.gasUsed} (fee ${formatUnits(receipt.gasUsed * receipt.effectiveGasPrice, GAS_DECIMALS)} USDC)`)

const ABI = [
  { type: 'function', name: 'owner', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'fallbackCause', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'depositDeadline', inputs: [], outputs: [{ type: 'uint64' }], stateMutability: 'view' },
  { type: 'function', name: 'maturity', inputs: [], outputs: [{ type: 'uint64' }], stateMutability: 'view' },
  { type: 'function', name: 'strategy', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'usdc', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'approvedCause', inputs: [{ type: 'address' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
] as const
const read = (name: string, a?: unknown[]) =>
  pub.readContract({ address: vault, abi: ABI, functionName: name as never, args: a as never })

console.log('\n--- verification')
console.log('owner           ', await read('owner'))
console.log('fallbackCause   ', await read('fallbackCause'))
console.log('strategy        ', await read('strategy'))
console.log('usdc            ', await read('usdc'))
console.log('depositDeadline ', iso(BigInt(String(await read('depositDeadline')))))
console.log('maturity        ', iso(BigInt(String(await read('maturity')))))
console.log('cause approved  ', await read('approvedCause', [FALLBACK_CAUSE]))
console.log(`\nVITE_VAULT_ADDRESS=${vault}`)
console.log(`VITE_VAULT_DEPLOY_BLOCK=${receipt.blockNumber}`)
