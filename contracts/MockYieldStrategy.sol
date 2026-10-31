// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

/// @title Mock Yield Strategy — TESTNET ONLY
/// @notice DEMO ONLY, UNAUDITED, NOT FOR REAL FUNDS. A passive USDC ERC-4626 demonstration vault.
/// @dev Asset on Arc Testnet: 0x3600000000000000000000000000000000000000 (six decimals).
/// Anyone can simulate yield by transferring ERC-20 USDC directly to this strategy: ERC4626.totalAssets()
/// reads its asset balance, so donations raise the share price without minting shares. No native gas
/// balance or native-token transfer is used. Direct donations emit the USDC token's Transfer event.
/// This does not earn real yield, has no admin, and inherits standard ERC-4626 deposit/withdraw events.
/// DONATION-INFLATION CAVEAT: offset six strengthens OpenZeppelin's virtual asset/share mitigation,
/// making inflation attacks costly and share rounding negligible, but not eliminating slippage. Check minimum
/// shares with a router/wrapper; seed the strategy for demos. Virtual shares capture some donations,
/// so redeemable yield may be smaller than donated USDC. Do not use convertToAssets as a payout guarantee.
contract MockYieldStrategy is ERC4626 {
    /// @notice Asset must be a nonzero, six-decimal ERC-20.
    error InvalidAsset();

    /// @notice Deploy a demo share token with twelve decimals against six-decimal USDC.
    /// @param usdc_ USDC ERC-20 address; use the Arc Testnet address above on Arc Testnet.
    constructor(address usdc_)
        ERC20("Impact Demo Strategy Share", "imUSDC")
        ERC4626(IERC20(usdc_))
    {
        if (usdc_ == address(0)) revert InvalidAsset();
        if (IERC20Metadata(usdc_).decimals() != 6) revert InvalidAsset();
    }

    /// @notice Demo shares use six extra decimals beyond USDC to reduce share rounding.
    /// @return Six, using OpenZeppelin's virtual asset and one million virtual shares.
    function _decimalsOffset() internal pure override returns (uint8) { return 6; }
}
