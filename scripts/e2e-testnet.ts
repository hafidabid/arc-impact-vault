/**
 * Live end-to-end check against the configured deployment, using the dev wallet in ./secrets
 * (DEV_ETH_PRIVATE_KEY, ARC_RPC_URL). It drives the same ABIs, derivations and log reader the app uses.
 * Spends 1 USDC of testnet funds into the vault. Run: bun run test:testnet
 */
import { readFileSync } from 'fs'
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { erc20Abi, strategyAbi, vaultAbi } from '../src/chain/abi'
import { CHAIN, STRATEGY_ADDRESS, USDC_ADDRESS, VAULT_ADDRESS } from '../src/chain/config'
import { classifyTxError, minSharesFor, vaultPhase } from '../src/chain/derive'
import { fetchVaultLogs } from '../src/chain/logs'

const env = Object.fromEntries(
  readFileSync(new URL('../secrets', import.meta.url), 'utf8')
    .split('\n')
    .filter((line) => line.includes('='))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).replace(/^["']|["']$/g, '')]),
)
const account = privateKeyToAccount(env.DEV_ETH_PRIVATE_KEY as `0x${string}`)
const transport = http(env.ARC_RPC_URL)
const publicClient = createPublicClient({ chain: CHAIN, transport })
const wallet = createWalletClient({ account, chain: CHAIN, transport })

let failures = 0
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
  if (!ok) failures += 1
}
const read = <T>(address: `0x${string}`, abi: readonly unknown[], functionName: string, args: unknown[] = []) =>
  publicClient.readContract({ address, abi, functionName, args }) as Promise<T>

const AMOUNT = parseUnits('1', 6)
const before = {
  principal: await read<bigint>(VAULT_ADDRESS, vaultAbi, 'principalOf', [account.address]),
  total: await read<bigint>(VAULT_ADDRESS, vaultAbi, 'totalPrincipal'),
  balance: await read<bigint>(USDC_ADDRESS, erc20Abi, 'balanceOf', [account.address]),
}
console.log(`wallet ${account.address}  usdc ${before.balance}  principal ${before.principal}`)

const now = BigInt((await publicClient.getBlock()).timestamp)
const v = {
  paused: await read<boolean>(VAULT_ADDRESS, vaultAbi, 'paused'),
  emergency: await read<boolean>(VAULT_ADDRESS, vaultAbi, 'emergency'),
  inKindExit: await read<boolean>(VAULT_ADDRESS, vaultAbi, 'inKindExit'),
  isSettled: await read<boolean>(VAULT_ADDRESS, vaultAbi, 'isSettled'),
  depositDeadline: await read<bigint>(VAULT_ADDRESS, vaultAbi, 'depositDeadline'),
  maturity: await read<bigint>(VAULT_ADDRESS, vaultAbi, 'maturity'),
}
const phase = vaultPhase(v, now)
check('vault is open for deposits', phase === 'open', phase)
if (phase !== 'open') process.exit(1)

// --- approve exactly the deposit amount ---
const approveHash = await wallet.writeContract({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'approve', args: [VAULT_ADDRESS, AMOUNT] })
const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash })
const allowance = await read<bigint>(USDC_ADDRESS, erc20Abi, 'allowance', [account.address, VAULT_ADDRESS])
check('approve confirmed with exact allowance', approveReceipt.status === 'success' && allowance === AMOUNT, `allowance ${allowance}`)

// --- deposit with the same slippage guard the UI uses ---
const preview = await read<bigint>(STRATEGY_ADDRESS, strategyAbi, 'previewDeposit', [AMOUNT])
const minShares = minSharesFor(preview)
const depositHash = await wallet.writeContract({ address: VAULT_ADDRESS, abi: vaultAbi, functionName: 'deposit', args: [AMOUNT, minShares] })
const depositReceipt = await publicClient.waitForTransactionReceipt({ hash: depositHash })
check('deposit confirmed', depositReceipt.status === 'success', depositHash)

const after = {
  principal: await read<bigint>(VAULT_ADDRESS, vaultAbi, 'principalOf', [account.address]),
  total: await read<bigint>(VAULT_ADDRESS, vaultAbi, 'totalPrincipal'),
  balance: await read<bigint>(USDC_ADDRESS, erc20Abi, 'balanceOf', [account.address]),
  allowance: await read<bigint>(USDC_ADDRESS, erc20Abi, 'allowance', [account.address, VAULT_ADDRESS]),
}
check('principal increased by exactly the deposit', after.principal === before.principal + AMOUNT)
check('vault total principal increased by exactly the deposit', after.total === before.total + AMOUNT)
check('allowance fully consumed (no lingering approval)', after.allowance === 0n, `${after.allowance}`)
const spent = before.balance - after.balance
check('USDC spent is the deposit plus fees only', spent >= AMOUNT && spent < AMOUNT + parseUnits('0.5', 6), `spent ${spent}, fees ≈ ${spent - AMOUNT}`)

// --- the ledger reader sees it ---
// The public RPC's log index can trail the receipt by a few seconds, so poll rather than assume.
let entries = await fetchVaultLogs(publicClient)
for (let attempt = 0; attempt < 10 && !entries.some((entry) => entry.txHash === depositHash); attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 2_000))
  entries = await fetchVaultLogs(publicClient)
}
const mine = entries.find((entry) => entry.txHash === depositHash && entry.kind === 'deposit')
check('ledger reader returns the new Deposited event', Boolean(mine) && mine?.amount === AMOUNT && mine?.account?.toLowerCase() === account.address.toLowerCase())
check('ledger is sorted newest first', entries.every((entry, i) => i === 0 || (entries[i - 1]?.blockNumber ?? 0n) >= entry.blockNumber))
check('ledger includes the cause approval from deployment', entries.some((entry) => entry.kind === 'cause-added'))

// --- guarded paths surface readable errors ---
const expectRevert = async (name: string, run: () => Promise<unknown>, contains: string) => {
  try {
    await run()
    check(name, false, 'did not revert')
  } catch (error) {
    const failure = classifyTxError(error)
    check(name, failure.kind === 'reverted' && failure.message.includes(contains), failure.kind === 'reverted' ? failure.message : failure.kind)
  }
}
const sim = (functionName: string, args: unknown[] = []) => () =>
  publicClient.simulateContract({ account, address: VAULT_ADDRESS, abi: vaultAbi, functionName, args } as never)
await expectRevert('withdraw before maturity is rejected', sim('withdraw'), 'maturity')
await expectRevert('non-owner cannot pause', sim('pause'), 'owner')
await expectRevert('non-owner cannot add a cause', sim('addCause', ['0x0000000000000000000000000000000000000001']), 'owner')
await expectRevert('non-owner cannot shut down', sim('emergencyShutdown'), 'owner')
await expectRevert('settle before maturity is rejected', sim('settle'), 'maturity')
await expectRevert('zero deposit is rejected', sim('deposit', [0n, 1n]), 'greater than zero')

console.log(failures === 0 ? '\nAll live checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
