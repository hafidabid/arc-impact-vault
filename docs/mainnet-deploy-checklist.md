# ImpactVault: mainnet deploy checklist

Arc Studio does not deploy to, sign for, fund or transact on mainnet. You run every step below yourself, outside Arc Studio.
Transactions on mainnet involve real funds and are irreversible. You are solely responsible for the result.

The deploy script is `contracts/script/DeployImpactVaultMainnet.s.sol`. It reads every value from environment variables and has no defaults for addresses or dates.

## 1. Decide the inputs (nothing here has a safe default)

| Input | Env var | Notes |
|---|---|---|
| Yield strategy | `STRATEGY_ADDRESS` | A real, audited ERC-4626 vault whose asset is Arc USDC, with synchronous redemption. `MockYieldStrategy` must never be used. |
| Admin | `ADMIN_ADDRESS` | A multisig or hardware wallet you control. Not the generated testnet wallets. |
| Fallback cause | `FALLBACK_CAUSE` | A recipient address you have verified yourself. Leftover yield can be swept here. |
| Deposits close | `DEPOSIT_DEADLINE` | Unix seconds. Fixed at deploy. |
| Maturity | `MATURITY` | Unix seconds, on or after the deadline. Fixed at deploy. |
| Grace period | `CLAIM_GRACE_PERIOD` | Seconds, at least 604800 (7 days). |

Chain: Arc mainnet, chain ID `5042`. USDC is the ERC-20 at `0x3600000000000000000000000000000000000000` (6 decimals). Gas is paid in USDC. Confirm both against the official Arc docs before use.
Use the RPC URL from the official Arc docs, and keep it in `ARC_MAINNET_RPC_URL`.

## 2. Before you deploy

- [ ] Independent professional audit of `ImpactVault.sol` and of the chosen strategy.
- [ ] Unit tests for settlement, loss, rounding, emergency shutdown and in-kind exit. These do not exist yet.
- [ ] Fork tests against the real strategy: deposit, settle at maturity, withdraw, loss case.
- [ ] Full dry run on Arc Testnet with realistic dates, including settle, withdraw, yield distribution and emergency exit.
- [ ] Review every address, the dates, the grace period and the owner. Check them twice, with another person.
- [ ] Decide how causes and recipients are vetted before the admin approves them.
- [ ] Decide the first-launch limits (the vault supports a deposit cap set by the admin).
- [ ] Remove the testnet wallet keys you generated from `.env` if you no longer need them, and never reuse them on mainnet.

## 3. Signing and keys

- Use an encrypted keystore (`cast wallet import`) or a hardware wallet.
- Never put a private key in chat, in the repo, or on the command line.
- The deployer needs enough USDC for gas.

## 4. Deploy

1. Export the env vars from section 1 in your shell (not in a committed file).
2. Simulate first. This sends nothing:

       forge script contracts/script/DeployImpactVaultMainnet.s.sol:DeployImpactVaultMainnet \
         --rpc-url "$ARC_MAINNET_RPC_URL" --account <keystore-name>

3. Read the printed owner, strategy, fallback cause and dates. Stop if anything is not what you meant.
4. Broadcast by adding `--broadcast` to the same command.
5. The script asserts owner, strategy, USDC, timeline and the fallback cause after deploying.

## 5. After deploying

- [ ] Verify the source on the explorer.
- [ ] Confirm owner, strategy, USDC, deposit deadline, maturity and grace period from the explorer or with `cast call`.
- [ ] Add the real causes with `addCause`, one at a time, from the admin wallet.
- [ ] Test the full lifecycle with a small deposit before opening to anyone else.
- [ ] If the admin differs from the deployer, ownership is set at construction. No handoff is needed.
- [ ] Keep an incident plan: who can call `pause`, `emergencyShutdown` and `enableInKindExit`, and under what conditions.

## 6. The frontend

The donor app still runs on synthetic data. Before real users use it:

- implement the live client behind `src/services/vault-client.ts` (wallet, chain config, contract calls, indexer),
- configure the verified chain, USDC address and vault address,
- remove the demo banner, demo controls and synthetic receipts,
- complete recipient due diligence, evidence review and privacy review.

## Known design limits to accept or change before launch

- Principal is returned in full only if the strategy returns at least the total deposited. A strategy loss is shared pro rata by depositors.
- Anyone can sweep leftover yield to the fallback cause after settlement plus the grace period.
- In-kind emergency exit pays depositors strategy shares, not USDC.
- The admin chooses and approves causes. The contract does not verify them.
