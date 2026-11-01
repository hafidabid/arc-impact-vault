/**
 * Arc mainnet demo: deploys MockYieldStrategy once and one ImpactVault per round, then runs three full
 * give-your-yield rounds with two depositors (A, B), the admin and a donation receiver.
 *
 * Every transaction is appended to submission/mainnet-tx-log.json (public data only: addresses, hashes,
 * gas). The log doubles as resume state: a step already recorded is never sent again, so re-running after
 * a crash continues where it stopped instead of double-spending.
 *
 *   bun --env-file=secrets scripts/mainnet-demo.ts                    # dry run: plan + balances
 *   bun --env-file=secrets scripts/mainnet-demo.ts --broadcast        # run everything
 *   bun --env-file=secrets scripts/mainnet-demo.ts --broadcast --stop-after r3.deposit.B
 *   bun --env-file=secrets scripts/mainnet-demo.ts --broadcast --window 600   # longer deposit window for new vaults
 *
 * Yield here is simulated: the admin transfers USDC into the strategy. The strategy is the unaudited
 * testnet reference contract and only ever holds a few demo dollars.
 */
import { existsSync, readFileSync, writeFileSync } from 'fs'
import {
  createPublicClient, createWalletClient, http, erc20Abi, formatUnits, parseUnits, getAddress,
  type Address, type Hex, type TransactionReceipt,
} from 'viem'
import { arc } from 'viem/chains'
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts'
import vaultArt from '../contracts/out/ImpactVault.sol/ImpactVault.json'
import stratArt from '../contracts/out/MockYieldStrategy.sol/MockYieldStrategy.json'

const LOG_PATH = new URL('../submission/mainnet-tx-log.json', import.meta.url)
const USDC = getAddress('0x3600000000000000000000000000000000000000')
const ROUNDS = 3
const DEPOSIT = { A: parseUnits('0.7', 6), B: parseUnits('0.8', 6) }
const YIELD = { A: parseUnits('0.1', 6), B: parseUnits('0.2', 6) }
// Round 3: an extra vault deploy (expired before use) left the admin 0.06 short of liquid USDC for 0.2,
// and topping up was not an option, so B's simulated yield that round is 0.14.
const YIELD_OVERRIDE: Record<string, bigint> = { 'r3.B': parseUnits('0.14', 6) }
const yieldFor = (round: number, who: 'A' | 'B') => YIELD_OVERRIDE[`r${round}.${who}`] ?? YIELD[who]
const GAS_BUFFER = parseUnits('0.03', 6) // per actor, covers approve + deposit + withdraw for 3 rounds
const RECEIVER_GAS = parseUnits('0.01', 6) // lets the receiver send the yield back each round
const DEPOSIT_WINDOW = process.argv.includes('--window') ? BigInt(process.argv[process.argv.indexOf('--window') + 1]) : 180n // seconds from deploy until deposits close
const CLAIM_GRACE = 604800n // contract minimum, 7 days
const PRIORITY_FEE = 1_000_000_000n // 1 gwei tip; base fee is ~20 gwei

const args = process.argv.slice(2)
const broadcast = args.includes('--broadcast')
const stopAfter = args.includes('--stop-after') ? args[args.indexOf('--stop-after') + 1] : undefined

const key = (name: string) => {
  const v = process.env[name]
  if (!v) throw new Error(`${name} missing — run with bun --env-file=secrets`)
  return privateKeyToAccount((v.startsWith('0x') ? v : `0x${v}`) as Hex)
}
const actors = {
  admin: key('DEV_ETH_PRIVATE_KEY'),
  A: key('ACTOR_A_PK'),
  B: key('ACTOR_B_PK'),
  receiver: key('DONATION_RECEIVE_PK'),
}
type Actor = keyof typeof actors

const transport = http('https://rpc.mainnet.arc.io')
const pub = createPublicClient({ chain: arc, transport })
const wallets = Object.fromEntries(
  Object.entries(actors).map(([k, account]) => [k, createWalletClient({ account, chain: arc, transport })]),
) as Record<Actor, ReturnType<typeof createWalletClient<typeof transport, typeof arc, PrivateKeyAccount>>>

interface LogEntry {
  step: string
  round: number | null
  description: string
  actor: Actor
  from: Address
  to: Address | null
  hash: Hex
  block: string
  timestamp: string
  gasUsed: string
  feeUsdc: string
  contractAddress?: Address
}
interface Log { chainId: number; explorer: string; addresses: Record<string, Address>; vaults: Record<string, { address: Address; deployBlock: string; depositDeadline: string; maturity: string }>; txs: LogEntry[] }

const log: Log = existsSync(LOG_PATH)
  ? JSON.parse(readFileSync(LOG_PATH, 'utf8'))
  : { chainId: arc.id, explorer: arc.blockExplorers.default.url, addresses: {}, vaults: {}, txs: [] }
for (const [k, a] of Object.entries(actors)) log.addresses[k] = a.address
const save = () => writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + '\n')
const done = (step: string) => log.txs.some((t) => t.step === step)

const usdcBal = (a: Address) => pub.readContract({ address: USDC, abi: erc20Abi, functionName: 'balanceOf', args: [a] })
const fmt = (v: bigint) => formatUnits(v, 6)

async function record(step: string, round: number | null, description: string, actor: Actor, hash: Hex): Promise<TransactionReceipt> {
  const r = await pub.waitForTransactionReceipt({ hash })
  if (r.status !== 'success') throw new Error(`${step} reverted: ${hash}`)
  const block = await pub.getBlock({ blockNumber: r.blockNumber })
  const fee = r.gasUsed * r.effectiveGasPrice
  log.txs.push({
    step, round, description, actor, from: r.from, to: r.to, hash, block: r.blockNumber.toString(),
    timestamp: new Date(Number(block.timestamp) * 1000).toISOString(), gasUsed: r.gasUsed.toString(),
    feeUsdc: formatUnits(fee, 18), ...(r.contractAddress ? { contractAddress: r.contractAddress } : {}),
  })
  save()
  console.log(`✓ ${step.padEnd(22)} ${description} — ${arc.blockExplorers.default.url}/tx/${hash} (fee ${formatUnits(fee, 18)} USDC)`)
  if (stopAfter === step) { console.log(`stopping after ${step}`); process.exit(0) }
  return r
}

async function step(name: string, round: number | null, description: string, actor: Actor, send: () => Promise<Hex>) {
  if (done(name)) return
  if (!broadcast) { console.log(`· ${name.padEnd(22)} ${description}`); return }
  await record(name, round, description, actor, await send())
}

const fees = async () => {
  const base = (await pub.getBlock()).baseFeePerGas ?? 20_000_000_000n
  return { maxFeePerGas: base * 2n + PRIORITY_FEE, maxPriorityFeePerGas: PRIORITY_FEE }
}
const transfer = (from: Actor, to: Address, amount: bigint) => async () =>
  wallets[from].writeContract({ address: USDC, abi: erc20Abi, functionName: 'transfer', args: [to, amount], ...(await fees()) })

async function main() {
  if ((await pub.getChainId()) !== 5042) throw new Error('not Arc mainnet')
  console.log(broadcast ? 'BROADCASTING on Arc mainnet' : 'DRY RUN (pass --broadcast to send)')
  for (const [k, a] of Object.entries(actors)) console.log(`  ${k.padEnd(8)} ${a.address} ${fmt(await usdcBal(a.address))} USDC`)

  const { admin, A, B, receiver } = actors

  // Setup: strategy + funding.
  await step('deploy.strategy', null, 'Admin deploys MockYieldStrategy (ERC-4626 over USDC)', 'admin', async () =>
    wallets.admin.deployContract({ abi: stratArt.abi, bytecode: stratArt.bytecode.object as Hex, args: [USDC], ...(await fees()) }))
  const strategy = log.txs.find((t) => t.step === 'deploy.strategy')?.contractAddress
  if (strategy) log.addresses.strategy = strategy
  await step('fund.A', null, `Admin sends ${fmt(DEPOSIT.A + GAS_BUFFER)} USDC to actor A`, 'admin', transfer('admin', A.address, DEPOSIT.A + GAS_BUFFER))
  await step('fund.B', null, `Admin sends ${fmt(DEPOSIT.B + GAS_BUFFER)} USDC to actor B`, 'admin', transfer('admin', B.address, DEPOSIT.B + GAS_BUFFER))
  await step('fund.receiver', null, `Admin sends ${fmt(RECEIVER_GAS)} USDC gas money to donation receiver`, 'admin', transfer('admin', receiver.address, RECEIVER_GAS))

  for (let r = 1; r <= ROUNDS; r++) {
    const p = `r${r}`
    if (!strategy && !broadcast) { console.log(`· round ${r}: deploy vault, deposits, yield, settle, withdraw, donate, recycle`); continue }

    if (!done(`${p}.deploy.vault`)) {
      if (!broadcast) { console.log(`· ${p}.deploy.vault`); continue }
      const now = (await pub.getBlock()).timestamp
      const deadline = now + DEPOSIT_WINDOW
      const maturity = deadline + 15n
      const rec = await record(`${p}.deploy.vault`, r, `Admin deploys ImpactVault round ${r} (deposits close ${new Date(Number(deadline) * 1000).toISOString()})`, 'admin',
        await wallets.admin.deployContract({
          abi: vaultArt.abi, bytecode: vaultArt.bytecode.object as Hex,
          args: [USDC, strategy, admin.address, deadline, maturity, receiver.address, CLAIM_GRACE], ...(await fees()),
        }))
      log.vaults[p] = { address: rec.contractAddress!, deployBlock: rec.blockNumber.toString(), depositDeadline: deadline.toString(), maturity: maturity.toString() }
      save()
    }
    if (!log.vaults[p]) {
      // Deploy was recorded but the run stopped before the vault entry was saved: rebuild it from chain.
      const tx = log.txs.find((t) => t.step === `${p}.deploy.vault`)!
      const read = (functionName: string) => pub.readContract({ address: tx.contractAddress!, abi: vaultArt.abi, functionName }) as Promise<bigint>
      log.vaults[p] = { address: tx.contractAddress!, deployBlock: tx.block, depositDeadline: (await read('depositDeadline')).toString(), maturity: (await read('maturity')).toString() }
      save()
    }
    const v = log.vaults[p]
    const vault = v.address
    const vw = (actor: Actor, functionName: string, fnArgs: unknown[]) => async () =>
      wallets[actor].writeContract({ address: vault, abi: vaultArt.abi, functionName, args: fnArgs, ...(await fees()) } as never)

    for (const who of ['A', 'B'] as const) {
      await step(`${p}.approve.${who}`, r, `Actor ${who} approves ${fmt(DEPOSIT[who])} USDC to vault`, who, async () =>
        wallets[who].writeContract({ address: USDC, abi: erc20Abi, functionName: 'approve', args: [vault, DEPOSIT[who]], ...(await fees()) }))
      await step(`${p}.deposit.${who}`, r, `Actor ${who} deposits ${fmt(DEPOSIT[who])} USDC into the vault`, who, vw(who, 'deposit', [DEPOSIT[who]]))
    }
    await step(`${p}.yield.A`, r, `Admin adds ${fmt(yieldFor(r, 'A'))} USDC yield to the strategy (on A's deposit)`, 'admin', transfer('admin', strategy!, yieldFor(r, 'A')))
    await step(`${p}.yield.B`, r, `Admin adds ${fmt(yieldFor(r, 'B'))} USDC yield to the strategy (on B's deposit)`, 'admin', transfer('admin', strategy!, yieldFor(r, 'B')))

    if (!done(`${p}.settle`) && broadcast) {
      const wait = Number(v.maturity) - Number((await pub.getBlock()).timestamp) + 2
      if (wait > 0) { console.log(`  waiting ${wait}s for maturity…`); await new Promise((res) => setTimeout(res, wait * 1000)) }
    }
    await step(`${p}.settle`, r, 'Admin settles the matured vault (principal and yield separated)', 'admin', vw('admin', 'settle', []))
    for (const who of ['A', 'B'] as const)
      await step(`${p}.withdraw.${who}`, r, `Actor ${who} withdraws full principal ${fmt(DEPOSIT[who])} USDC`, who, vw(who, 'withdraw', []))

    if (!done(`${p}.donate`) && broadcast) {
      const y = await pub.readContract({ address: vault, abi: vaultArt.abi, functionName: 'yieldRemaining' }) as bigint
      console.log(`  realised yield ${fmt(y)} USDC`)
    }
    await step(`${p}.donate`, r, 'Admin distributes all realised yield to the donation receiver', 'admin', vw('admin', 'distributeAllYield', [receiver.address]))
    if (r < ROUNDS) {
      const yieldTx = log.txs.find((t) => t.step === `${p}.donate`)
      const realised = yieldTx ? await realisedYield(vault) : YIELD.A + YIELD.B
      await step(`${p}.recycle`, r, `Donation receiver returns ${fmt(realised)} USDC to admin to fund the next round's yield`, 'receiver', transfer('receiver', admin.address, realised))
    }
  }

  // Collect everything back to the admin, leaving each wallet empty except unavoidable gas dust.
  for (const who of ['A', 'B', 'receiver'] as const) {
    if (done(`collect.${who}`)) continue
    if (!broadcast) { console.log(`· collect.${who}`); continue }
    const bal = await usdcBal(actors[who].address)
    const f = await fees()
    const gas = await pub.estimateContractGas({ account: actors[who], address: USDC, abi: erc20Abi, functionName: 'transfer', args: [admin.address, bal] })
    // Native and ERC-20 USDC share one balance; reserve the worst-case fee (gas * maxFee), rounded up to 6 dp.
    const reserve = (gas * 12n / 10n * f.maxFeePerGas + 10n ** 12n - 1n) / 10n ** 12n
    const amount = bal - reserve
    if (amount <= 0n) continue
    await record(`collect.${who}`, null, `${who === 'receiver' ? 'Donation receiver' : `Actor ${who}`} returns ${fmt(amount)} USDC to admin`, who,
      await wallets[who].writeContract({ address: USDC, abi: erc20Abi, functionName: 'transfer', args: [admin.address, amount], gas: gas * 12n / 10n, ...f }))
  }

  console.log('\nFinal balances:')
  for (const [k, a] of Object.entries(actors)) console.log(`  ${k.padEnd(8)} ${fmt(await usdcBal(a.address))} USDC`)
  const total = log.txs.reduce((s, t) => s + parseUnits(t.feeUsdc, 18), 0n)
  console.log(`Total gas spent: ${formatUnits(total, 18)} USDC over ${log.txs.length} txs`)
}

async function realisedYield(vault: Address) {
  return pub.readContract({ address: vault, abi: vaultArt.abi, functionName: 'yieldPool' }) as Promise<bigint>
}

await main()
