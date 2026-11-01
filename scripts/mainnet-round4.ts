/**
 * Arc mainnet round 4: one more give-your-yield round on a fresh ImpactVault, donating to both approved
 * causes (Hunger Relief Fund = default cause, Forest Restoration Fund = approved with addCause).
 *
 * Shares submission/mainnet-tx-log.json with scripts/mainnet-demo.ts: steps already recorded are skipped,
 * so a re-run resumes instead of double-spending. Donations stay with the two funds; depositors' balances
 * are collected back to the admin at the end.
 *
 *   bun --env-file=secrets scripts/mainnet-round4.ts              # dry run
 *   bun --env-file=secrets scripts/mainnet-round4.ts --broadcast
 */
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { createPublicClient, createWalletClient, http, erc20Abi, formatUnits, parseUnits, getAddress, type Address, type Hex } from 'viem'
import { arc } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import vaultArt from '../contracts/out/ImpactVault.sol/ImpactVault.json'

const LOG_PATH = new URL('../submission/mainnet-tx-log.json', import.meta.url)
const USDC = getAddress('0x3600000000000000000000000000000000000000')
const DEPOSIT = { A: parseUnits('0.5', 6), C: parseUnits('0.6', 6) }
const YIELD = { A: parseUnits('0.1', 6), C: parseUnits('0.2', 6) }
const HUNGER_SHARE = parseUnits('0.1', 6) // the rest of the realised yield goes to the forest fund
const GAS_BUFFER = parseUnits('0.02', 6)
const DEPOSIT_WINDOW = 180n
const CLAIM_GRACE = 604800n
const PRIORITY_FEE = 1_000_000_000n

const broadcast = process.argv.includes('--broadcast')
const key = (name: string) => {
  const v = process.env[name]
  if (!v) throw new Error(`${name} missing — run with bun --env-file=secrets`)
  return privateKeyToAccount(v as Hex)
}
const actors = { admin: key('DEV_ETH_PRIVATE_KEY'), A: key('ACTOR_A_PK'), C: key('ACTOR_C_PK') }
type Actor = keyof typeof actors
const hunger = key('DONATION_RECEIVE_PK').address
const forest = key('FOREST_FUND_PK').address

const transport = http('https://rpc.mainnet.arc.io')
const pub = createPublicClient({ chain: arc, transport })
const wallet = (a: Actor) => createWalletClient({ account: actors[a], chain: arc, transport })

if (!existsSync(LOG_PATH)) throw new Error('run scripts/mainnet-demo.ts first')
const log = JSON.parse(readFileSync(LOG_PATH, 'utf8'))
log.addresses.C = actors.C.address
log.addresses.forestFund = forest
const save = () => writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + '\n')
const done = (step: string) => log.txs.some((t: { step: string }) => t.step === step)
const fmt = (v: bigint) => formatUnits(v, 6)
const bal = (a: Address) => pub.readContract({ address: USDC, abi: erc20Abi, functionName: 'balanceOf', args: [a] })
const fees = async () => ({ maxFeePerGas: ((await pub.getBlock()).baseFeePerGas ?? 20_000_000_000n) * 2n + PRIORITY_FEE, maxPriorityFeePerGas: PRIORITY_FEE })

async function step(name: string, description: string, actor: Actor, send: () => Promise<Hex>) {
  if (done(name)) return undefined
  if (!broadcast) { console.log(`· ${name.padEnd(20)} ${description}`); return undefined }
  const hash = await send()
  const r = await pub.waitForTransactionReceipt({ hash })
  if (r.status !== 'success') throw new Error(`${name} reverted: ${hash}`)
  const b = await pub.getBlock({ blockNumber: r.blockNumber })
  const fee = r.gasUsed * r.effectiveGasPrice
  log.txs.push({
    step: name, round: 4, description, actor, from: r.from, to: r.to, hash, block: r.blockNumber.toString(),
    timestamp: new Date(Number(b.timestamp) * 1000).toISOString(), gasUsed: r.gasUsed.toString(), feeUsdc: formatUnits(fee, 18),
    ...(r.contractAddress ? { contractAddress: r.contractAddress } : {}),
  })
  save()
  console.log(`✓ ${name.padEnd(20)} ${description} — ${arc.blockExplorers.default.url}/tx/${hash} (fee ${formatUnits(fee, 18)})`)
  return r
}
const transfer = (from: Actor, to: Address, amount: bigint) => async () =>
  wallet(from).writeContract({ address: USDC, abi: erc20Abi, functionName: 'transfer', args: [to, amount], ...(await fees()) })

if ((await pub.getChainId()) !== 5042) throw new Error('not Arc mainnet')
console.log(broadcast ? 'BROADCASTING on Arc mainnet' : 'DRY RUN (pass --broadcast to send)')
for (const [k, a] of Object.entries({ ...Object.fromEntries(Object.entries(actors).map(([k, v]) => [k, v.address])), hunger, forest }))
  console.log(`  ${k.padEnd(7)} ${a} ${fmt(await bal(a as Address))} USDC`)

const strategy = log.addresses.strategy as Address
for (const who of ['A', 'C'] as const)
  await step(`r4.fund.${who}`, `Admin sends ${fmt(DEPOSIT[who] + GAS_BUFFER)} USDC to actor ${who}`, 'admin', transfer('admin', actors[who].address, DEPOSIT[who] + GAS_BUFFER))

if (!done('r4.deploy.vault')) {
  if (!broadcast) console.log('· r4.deploy.vault')
  else {
    const deadline = (await pub.getBlock()).timestamp + DEPOSIT_WINDOW
    const maturity = deadline + 15n
    const r = await step('r4.deploy.vault', `Admin deploys ImpactVault round 4 (deposits close ${new Date(Number(deadline) * 1000).toISOString()})`, 'admin', async () =>
      wallet('admin').deployContract({ abi: vaultArt.abi, bytecode: vaultArt.bytecode.object as Hex, args: [USDC, strategy, actors.admin.address, deadline, maturity, hunger, CLAIM_GRACE], ...(await fees()) }))
    log.vaults.r4 = { address: r!.contractAddress!, deployBlock: r!.blockNumber.toString(), depositDeadline: deadline.toString(), maturity: maturity.toString() }
    save()
  }
}

if (broadcast) {
  const v = log.vaults.r4
  const vault = v.address as Address
  const call = (actor: Actor, functionName: string, args: unknown[]) => async () =>
    wallet(actor).writeContract({ address: vault, abi: vaultArt.abi, functionName, args, ...(await fees()) } as never)

  await step('r4.addCause.forest', 'Admin approves the Forest Restoration Fund on the round 4 vault', 'admin', call('admin', 'addCause', [forest]))
  for (const who of ['A', 'C'] as const) {
    await step(`r4.approve.${who}`, `Actor ${who} approves ${fmt(DEPOSIT[who])} USDC to vault`, who, async () =>
      wallet(who).writeContract({ address: USDC, abi: erc20Abi, functionName: 'approve', args: [vault, DEPOSIT[who]], ...(await fees()) }))
    await step(`r4.deposit.${who}`, `Actor ${who} deposits ${fmt(DEPOSIT[who])} USDC into the vault`, who, call(who, 'deposit', [DEPOSIT[who]]))
  }
  for (const who of ['A', 'C'] as const)
    await step(`r4.yield.${who}`, `Admin adds ${fmt(YIELD[who])} USDC yield to the strategy (on ${who}'s deposit)`, 'admin', transfer('admin', strategy, YIELD[who]))

  if (!done('r4.settle')) {
    const wait = Number(v.maturity) - Number((await pub.getBlock()).timestamp) + 2
    if (wait > 0) { console.log(`  waiting ${wait}s for maturity…`); await new Promise((res) => setTimeout(res, wait * 1000)) }
  }
  await step('r4.settle', 'Admin settles the matured vault (principal and yield separated)', 'admin', call('admin', 'settle', []))
  for (const who of ['A', 'C'] as const)
    await step(`r4.withdraw.${who}`, `Actor ${who} withdraws full principal ${fmt(DEPOSIT[who])} USDC`, who, call(who, 'withdraw', []))
  await step('r4.donate.hunger', `Admin donates ${fmt(HUNGER_SHARE)} USDC of yield to the Hunger Relief Fund`, 'admin', call('admin', 'distributeYield', [hunger, HUNGER_SHARE]))
  if (!done('r4.donate.forest')) {
    const rest = (await pub.readContract({ address: vault, abi: vaultArt.abi, functionName: 'yieldRemaining' })) as bigint
    await step('r4.donate.forest', `Admin donates the remaining ${fmt(rest)} USDC of yield to the Forest Restoration Fund`, 'admin', call('admin', 'distributeAllYield', [forest]))
  }

  for (const who of ['A', 'C'] as const) {
    if (done(`r4.collect.${who}`)) continue
    const b = await bal(actors[who].address)
    const f = await fees()
    const gas = await pub.estimateContractGas({ account: actors[who], address: USDC, abi: erc20Abi, functionName: 'transfer', args: [actors.admin.address, b] })
    const reserve = (gas * 12n / 10n * f.maxFeePerGas + 10n ** 12n - 1n) / 10n ** 12n
    if (b <= reserve) continue
    await step(`r4.collect.${who}`, `Actor ${who} returns ${fmt(b - reserve)} USDC to admin`, who, async () =>
      wallet(who).writeContract({ address: USDC, abi: erc20Abi, functionName: 'transfer', args: [actors.admin.address, b - reserve], gas: gas * 12n / 10n, ...f }))
  }
}

console.log('\nBalances:')
for (const [k, a] of Object.entries({ admin: actors.admin.address, A: actors.A.address, C: actors.C.address, hunger, forest }))
  console.log(`  ${k.padEnd(7)} ${a} ${fmt(await bal(a))} USDC`)
