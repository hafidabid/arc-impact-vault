// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {ImpactVault} from "../ImpactVault.sol";

/// @notice Deploys ImpactVault to Arc mainnet. YOU run this, from your own wallet, outside Arc Studio.
///
/// Every value comes from the environment. Nothing real is hardcoded, and there are no defaults for
/// addresses or dates, so a missing value fails loudly instead of deploying something unintended.
///
/// Required env vars:
///   STRATEGY_ADDRESS     audited ERC-4626 vault whose asset is Arc USDC, with synchronous redemption
///   ADMIN_ADDRESS        owner of the vault (multisig or hardware wallet recommended)
///   FALLBACK_CAUSE       approved recipient for yield nobody distributed after the grace period
///   DEPOSIT_DEADLINE     unix seconds. Deposits close at this time
///   MATURITY             unix seconds. Must be >= DEPOSIT_DEADLINE
///   CLAIM_GRACE_PERIOD   seconds after settlement before anyone can sweep leftover yield (>= 7 days)
///
/// Signing: use an encrypted keystore or a hardware wallet. Never pass a raw private key on the command line.
///   forge script contracts/script/DeployImpactVaultMainnet.s.sol:DeployImpactVaultMainnet \
///     --rpc-url "$ARC_MAINNET_RPC_URL" --account <keystore-name> --broadcast
/// Run once WITHOUT --broadcast first. That is a local simulation against live state.
contract DeployImpactVaultMainnet is Script {
    uint256 internal constant ARC_MAINNET_CHAIN_ID = 5042;
    /// @dev Arc USDC predeploy (ERC-20 view, 6 decimals). Confirm against the official contract address page.
    address internal constant ARC_USDC = 0x3600000000000000000000000000000000000000;

    function run() external returns (ImpactVault vault) {
        require(block.chainid == ARC_MAINNET_CHAIN_ID, "Wrong chain: expected Arc mainnet (5042)");

        address strategy = vm.envAddress("STRATEGY_ADDRESS");
        address admin = vm.envAddress("ADMIN_ADDRESS");
        address fallbackCause = vm.envAddress("FALLBACK_CAUSE");
        uint64 depositDeadline = uint64(vm.envUint("DEPOSIT_DEADLINE"));
        uint64 maturity = uint64(vm.envUint("MATURITY"));
        uint64 grace = uint64(vm.envUint("CLAIM_GRACE_PERIOD"));

        // Preflight: fail before anything is broadcast.
        require(strategy.code.length > 0, "STRATEGY_ADDRESS has no code on this chain");
        require(IERC4626(strategy).asset() == ARC_USDC, "Strategy asset is not Arc USDC");
        require(IERC20Metadata(ARC_USDC).decimals() == 6, "USDC decimals are not 6");
        require(admin != address(0) && fallbackCause != address(0), "Zero address");
        require(admin != fallbackCause, "Admin and fallback cause must differ");
        require(depositDeadline > block.timestamp + 1 days, "DEPOSIT_DEADLINE is too soon");
        require(maturity >= depositDeadline, "MATURITY is before DEPOSIT_DEADLINE");
        require(grace >= 7 days, "CLAIM_GRACE_PERIOD is under 7 days");

        console2.log("Deployer (signer):", msg.sender);
        console2.log("Admin (owner):    ", admin);
        console2.log("Strategy:         ", strategy);
        console2.log("Fallback cause:   ", fallbackCause);
        console2.log("Deposits close:   ", depositDeadline);
        console2.log("Maturity:         ", maturity);
        console2.log("Grace (seconds):  ", grace);

        vm.startBroadcast();
        vault = new ImpactVault(ARC_USDC, strategy, admin, depositDeadline, maturity, fallbackCause, grace);
        vm.stopBroadcast();

        // Post-deploy assertions against what was just created.
        require(vault.owner() == admin, "Owner mismatch");
        require(address(vault.strategy()) == strategy, "Strategy mismatch");
        require(address(vault.usdc()) == ARC_USDC, "USDC mismatch");
        require(vault.maturity() == maturity && vault.depositDeadline() == depositDeadline, "Timeline mismatch");
        require(vault.approvedCause(fallbackCause), "Fallback cause not approved");

        console2.log("ImpactVault deployed at:", address(vault));
    }
}
