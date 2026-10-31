// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @title Impact Vault
/// @notice Fixed-term USDC vault: principal is senior and only realized yield goes to approved causes.
/// @dev NOT a principal guarantee: strategy losses are allocated pro rata, rounding payouts down.
/// Full principal is payable only if redemption returns at least totalPrincipal. The immutable strategy
/// must be trusted, synchronous, liquid at maturity, and use ordinary, non-rebasing, fee-free USDC.
/// On Arc Testnet pass USDC's ERC-20 address 0x3600000000000000000000000000000000000000.
/// Native gas balances are never read or used. There are no payable entry points.
/// The admin may irreversibly trigger an emergency exit for testnet simulation safety. Shutdown
/// permanently closes deposits and permits early settlement; there is no un-shutdown. If redemption
/// fails, the admin may irreversibly select in-kind claims instead of normal USDC settlement.
contract ImpactVault is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    /// @notice Minimum delay from settlement before permissionless fallback yield sweeping.
    uint64 public constant MIN_CLAIM_GRACE_PERIOD = 7 days;

    /// @notice Immutable six-decimal ERC-20 asset.
    IERC20 public immutable usdc;
    /// @notice Immutable ERC-4626 strategy; cannot be replaced by the admin.
    IERC4626 public immutable strategy;
    /// @notice Deposits are accepted strictly before this timestamp.
    uint64 public immutable depositDeadline;
    /// @notice Earliest permissionless settlement timestamp absent emergency shutdown.
    uint64 public immutable maturity;
    /// @notice Permanently approved destination for permissionless yield sweeping.
    address public immutable fallbackCause;
    /// @notice Delay after actual settlement before anyone may sweep remaining yield.
    uint64 public immutable claimGracePeriod;
    /// @notice Lifetime principal deposited; not reduced by normal claims (settlement denominator).
    /// @dev In-kind claims instead reduce this value; their denominator is the fixed inKindPrincipal.
    uint256 public totalPrincipal;
    /// @notice Maximum lifetime principal; initially unlimited.
    uint256 public depositCap = type(uint256).max;
    /// @notice Whether strategy redemption and settlement have completed.
    bool public isSettled;
    /// @notice Admin-triggered, permanent emergency shutdown; deposits can never reopen.
    bool public emergency;
    /// @notice Irreversible in-kind exit mode, mutually exclusive with completed settlement.
    bool public inKindExit;
    /// @notice Fixed snapshot of vault strategy shares when in-kind exits were enabled.
    uint256 public inKindShares;
    /// @notice Fixed snapshot of totalPrincipal when in-kind exits were enabled.
    uint256 public inKindPrincipal;
    /// @notice Actual USDC balance increase from redeeming all strategy shares.
    uint256 public settledAssets;
    /// @notice Timestamp of completed settlement; zero before settlement.
    uint256 public settledAt;
    /// @notice Original realized yield, excluding unsolicited USDC held outside the strategy.
    uint256 public yieldPool;
    /// @notice Undistributed yield reserved exclusively for approved causes.
    uint256 public yieldRemaining;
    /// @notice Reserved principal assets; before settlement this is the nominal principal.
    /// @dev After settlement includes conservative rounding reserves until the final claim.
    uint256 public principalOwed;
    /// @notice Nominal principal whose owners have not yet claimed.
    uint256 public unclaimedPrincipal;
    /// @notice Cause approval lookup; fallbackCause cannot be removed.
    mapping(address => bool) public approvedCause;
    /// @dev Nominal principal of each depositor; claims are nontransferable.
    mapping(address => uint256) private _principal;
    /// @dev Enumerable mirror of approvedCause.
    EnumerableSet.AddressSet private _causes;

    /// @notice An address is zero, or a transfer destination is this vault.
    error InvalidAddress();
    /// @notice The deposit deadline or maturity is invalid.
    error InvalidTimeline();
    /// @notice Strategy asset or asset decimals do not match the required asset.
    error InvalidAsset();
    /// @notice A required positive amount was zero.
    error ZeroAmount();
    /// @notice Deposits are closed.
    error DepositsClosed();
    /// @notice Permanent emergency shutdown is already active; deposits are prohibited.
    error EmergencyActive();
    /// @notice This action requires an emergency shutdown.
    error EmergencyNotActive();
    /// @notice In-kind exit mode is already active; settlement is prohibited.
    error InKindExitActive();
    /// @notice This action requires in-kind exit mode.
    error InKindExitNotActive();
    /// @notice Settlement cannot occur before maturity absent emergency shutdown.
    error NotMature();
    /// @notice This vault has already settled.
    error AlreadySettled();
    /// @notice This action requires completed settlement.
    error NotSettled();
    /// @notice The lifetime deposit cap would be exceeded.
    error CapExceeded();
    /// @notice The deposit cap cannot decrease after the first deposit.
    error CapCannotDecrease();
    /// @notice Token transfer or strategy spending did not match the deposit exactly.
    error UnexpectedAssetMovement();
    /// @notice The measured share increase was below the requested minimum or zero.
    error InsufficientShares();
    /// @notice Minted shares redeem for less than the deposit beyond one raw asset unit of rounding.
    error DepositSharesWorthLess(uint256 redeemable, uint256 amount);
    /// @notice Redemption did not consume all held shares.
    error SharesRemain();
    /// @notice The caller has no principal to claim.
    error NoPrincipal();
    /// @notice The cause is not approved.
    error CauseNotApproved();
    /// @notice The cause is already approved.
    error CauseAlreadyApproved();
    /// @notice The fallback cause must remain approved.
    error ProtectedFallback();
    /// @notice Requested distribution exceeds remaining yield.
    error InsufficientYield();
    /// @notice The permissionless sweep grace period has not expired.
    error GracePeriodActive();
    /// @notice The configured claim grace period is shorter than seven days.
    error GracePeriodTooShort();
    /// @notice Reserved assets or unsettled strategy shares cannot be rescued.
    error ReservedAssets();

    /// @notice Immutable configuration recorded at construction.
    event VaultConfigured(address indexed usdc, address indexed strategy, address indexed admin, uint64 depositDeadline, uint64 maturity, address fallbackCause, uint64 claimGracePeriod);
    /// @notice Principal invested and actual strategy shares received.
    event Deposited(address indexed depositor, uint256 amount, uint256 shares);
    /// @notice Lifetime deposit cap changed.
    event DepositCapUpdated(uint256 oldCap, uint256 newCap);
    /// @notice All shares redeemed and principal/yield reserves established.
    event Settled(uint256 assets, uint256 principalReserved, uint256 yield, uint256 timestamp);
    /// @notice Permanent shutdown activated; settled reports whether immediate redemption succeeded.
    event EmergencyShutdown(bool settled);
    /// @notice Irreversible in-kind mode enabled with fixed share and nominal principal snapshots.
    event InKindExitEnabled(uint256 shares, uint256 principal);
    /// @notice Strategy shares transferred in exchange for extinguishing nominal principal.
    event InKindWithdrawn(address indexed user, uint256 shares, uint256 principalCredited);
    /// @notice A depositor claimed; amount may be below nominalPrincipal after a loss.
    event Withdrawn(address indexed depositor, uint256 nominalPrincipal, uint256 amount);
    /// @notice A cause was approved.
    event CauseAdded(address indexed cause);
    /// @notice A cause was removed.
    event CauseRemoved(address indexed cause);
    /// @notice Realized yield was transferred to a cause.
    event YieldDistributed(address indexed cause, uint256 amount);
    /// @notice Permissionless fallback sweep completed.
    event YieldSwept(address indexed caller, uint256 amount);
    /// @notice Final claim released unallocatable rounding dust as rescuable surplus, not yield.
    event RoundingDustReleased(uint256 amount);
    /// @notice Unreserved tokens were rescued.
    event TokenRescued(address indexed token, address indexed to, uint256 amount);

    /// @notice Configure the immutable asset, strategy, admin and schedule.
    /// @param usdc_ Six-decimal USDC ERC-20 address (not a native-token sentinel).
    /// @param strategy_ Synchronous ERC-4626 strategy holding usdc_.
    /// @param admin Initial owner; future transfers use Ownable2Step.
    /// @param depositDeadline_ Exclusive deadline for deposits, strictly in the future.
    /// @param maturity_ First settlement time absent emergency, at or after depositDeadline_.
    /// @param fallbackCause_ Permanently approved recipient, not this vault.
    /// @param claimGracePeriod_ Delay from actual settlement to permissionless yield sweep; at least seven days.
    constructor(
        address usdc_, address strategy_, address admin,
        uint64 depositDeadline_, uint64 maturity_, address fallbackCause_, uint64 claimGracePeriod_
    ) Ownable(admin) {
        if (usdc_ == address(0) || strategy_ == address(0) || admin == address(0)
            || fallbackCause_ == address(0) || fallbackCause_ == address(this)) revert InvalidAddress();
        if (depositDeadline_ <= block.timestamp || maturity_ < depositDeadline_) revert InvalidTimeline();
        if (claimGracePeriod_ < MIN_CLAIM_GRACE_PERIOD) revert GracePeriodTooShort();
        if (IERC4626(strategy_).asset() != usdc_ || IERC20Metadata(usdc_).decimals() != 6) revert InvalidAsset();
        usdc = IERC20(usdc_);
        strategy = IERC4626(strategy_);
        depositDeadline = depositDeadline_;
        maturity = maturity_;
        fallbackCause = fallbackCause_;
        claimGracePeriod = claimGracePeriod_;
        approvedCause[fallbackCause_] = true;
        _causes.add(fallbackCause_);
        emit CauseAdded(fallbackCause_);
        emit VaultConfigured(usdc_, strategy_, admin, depositDeadline_, maturity_, fallbackCause_, claimGracePeriod_);
    }

    /// @notice Deposit USDC with a minimum of one strategy share (raw share units).
    /// @dev Prefer the overload with an explicit minimum to protect against donation/inflation slippage.
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        _deposit(amount, 1);
    }

    /// @notice Deposit USDC with a caller-selected minimum actual share increase.
    /// @param amount Principal in six-decimal USDC units.
    /// @param minShares Minimum strategy shares accepted, in strategy share units.
    function deposit(uint256 amount, uint256 minShares) external nonReentrant whenNotPaused {
        _deposit(amount, minShares);
    }

    /// @dev Pull exactly amount, invest exactly amount, and credit principal only after measuring shares.
    function _deposit(uint256 amount, uint256 minShares) private {
        if (emergency) revert EmergencyActive();
        if (block.timestamp >= depositDeadline || isSettled) revert DepositsClosed();
        if (amount == 0) revert ZeroAmount();
        if (amount > depositCap - totalPrincipal) revert CapExceeded();
        uint256 balanceBefore = usdc.balanceOf(address(this));
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        if (usdc.balanceOf(address(this)) - balanceBefore != amount) revert UnexpectedAssetMovement();
        uint256 sharesBefore = strategy.balanceOf(address(this));
        usdc.forceApprove(address(strategy), amount);
        strategy.deposit(amount, address(this));
        usdc.forceApprove(address(strategy), 0);
        uint256 shares = strategy.balanceOf(address(this)) - sharesBefore;
        if (shares == 0 || shares < minShares) revert InsufficientShares();
        uint256 redeemable = strategy.previewRedeem(shares);
        if (redeemable < amount - 1) revert DepositSharesWorthLess(redeemable, amount);
        if (usdc.balanceOf(address(this)) != balanceBefore) revert UnexpectedAssetMovement();
        _principal[msg.sender] += amount;
        totalPrincipal += amount;
        unclaimedPrincipal += amount;
        principalOwed += amount;
        emit Deposited(msg.sender, amount, shares);
    }

    /// @notice Set any cap before the first deposit; thereafter only raise it.
    function setDepositCap(uint256 newCap) external onlyOwner {
        if (totalPrincipal != 0 && newCap < depositCap) revert CapCannotDecrease();
        uint256 oldCap = depositCap;
        depositCap = newCap;
        emit DepositCapUpdated(oldCap, newCap);
    }

    /// @notice Pause deposits only; settlement, withdrawals and distributions are unaffected.
    function pause() external onlyOwner { _pause(); }

    /// @notice Reopen deposits subject to the immutable deadline and permanent emergency shutdown.
    function unpause() external onlyOwner { _unpause(); }

    /// @notice Anyone may redeem all shares at maturity, or immediately after emergency shutdown.
    /// @dev A failed shutdown redemption can be retried here; in-kind mode permanently disables settlement.
    function settle() external nonReentrant { _settle(); }

    /// @notice Admin-only, one-way emergency shutdown for testnet safety; never reopens deposits.
    /// @dev Attempts early settlement. A reverting strategy redeem is caught, leaving settlement retryable
    /// and allowing the admin to enable in-kind exits. Successful settlement enables normal withdraw().
    function emergencyShutdown() external onlyOwner nonReentrant {
        if (isSettled) revert AlreadySettled();
        if (emergency) revert EmergencyActive();
        emergency = true;
        uint256 beforeBalance = usdc.balanceOf(address(this));
        uint256 shares = strategy.balanceOf(address(this));
        if (shares == 0) {
            _finalizeSettlement(beforeBalance);
        } else {
            try strategy.redeem(shares, address(this), address(this)) returns (uint256) {
                _finalizeSettlement(beforeBalance);
            } catch {
                emit EmergencyShutdown(false);
                return;
            }
        }
        emit EmergencyShutdown(true);
    }

    /// @notice Admin-only, irreversible fallback to depositor claims on strategy shares, not USDC.
    /// @dev Requires an unsettled emergency. Only reads strategy share balances; does not redeem assets.
    /// Depositors must redeem their received shares from the strategy themselves when possible. In this
    /// degraded mode, any embedded yield goes pro rata to depositors rather than approved causes.
    function enableInKindExit() external onlyOwner nonReentrant {
        if (!emergency) revert EmergencyNotActive();
        if (isSettled) revert AlreadySettled();
        if (inKindExit) revert InKindExitActive();
        inKindShares = strategy.balanceOf(address(this));
        inKindPrincipal = totalPrincipal;
        inKindExit = true;
        emit InKindExitEnabled(inKindShares, inKindPrincipal);
    }

    /// @notice Claim your pro-rata strategy shares during the irreversible emergency in-kind exit.
    /// @dev No pause/admin check. Redeem received shares directly from the strategy yourself. Uses fixed
    /// snapshots and rounds down, so aggregate payouts never exceed inKindShares. Share rounding dust
    /// remains locked, cannot be rescued by the admin, and is not allocated to the last claimant.
    function emergencyWithdrawInKind() external nonReentrant {
        if (!inKindExit) revert InKindExitNotActive();
        uint256 nominal = _principal[msg.sender];
        if (nominal == 0) revert NoPrincipal();
        uint256 shares = Math.mulDiv(inKindShares, nominal, inKindPrincipal);
        _principal[msg.sender] = 0;
        totalPrincipal -= nominal;
        principalOwed -= nominal;
        unclaimedPrincipal -= nominal;
        emit InKindWithdrawn(msg.sender, shares, nominal);
        if (shares != 0) IERC20(address(strategy)).safeTransfer(msg.sender, shares);
    }

    /// @dev Redeem normally or retry after shutdown; in-kind mode cannot return to settlement.
    function _settle() private {
        if (inKindExit) revert InKindExitActive();
        if (isSettled) revert AlreadySettled();
        if (!emergency && block.timestamp < maturity) revert NotMature();
        uint256 beforeBalance = usdc.balanceOf(address(this));
        uint256 shares = strategy.balanceOf(address(this));
        if (shares != 0) strategy.redeem(shares, address(this), address(this));
        _finalizeSettlement(beforeBalance);
    }

    /// @dev Shared normal/emergency accounting from actual receipts, excluding direct USDC donations.
    function _finalizeSettlement(uint256 beforeBalance) private {
        if (strategy.balanceOf(address(this)) != 0) revert SharesRemain();
        uint256 assets = usdc.balanceOf(address(this)) - beforeBalance;
        settledAssets = assets;
        principalOwed = Math.min(assets, totalPrincipal);
        yieldPool = assets > totalPrincipal ? assets - totalPrincipal : 0;
        yieldRemaining = yieldPool;
        settledAt = block.timestamp;
        isSettled = true;
        emit Settled(assets, principalOwed, yieldPool, settledAt);
    }

    /// @notice Claim all of your principal after maturity or emergency shutdown; auto-settles if necessary.
    /// @dev No pause/admin check. Under loss, payout is floor(principal * settledAssets / totalPrincipal).
    /// Every claimant uses the same fixed denominator, including the last; rounding cannot exhaust reserves.
    /// Once all claims finish, any fractional-allocation dust becomes surplus, never donated as yield.
    /// @return payout USDC transferred (possibly zero following a total strategy loss).
    function withdraw() external nonReentrant returns (uint256 payout) {
        uint256 nominal = _principal[msg.sender];
        if (nominal == 0) revert NoPrincipal();
        if (!isSettled) _settle();
        payout = settledAssets >= totalPrincipal ? nominal : Math.mulDiv(nominal, settledAssets, totalPrincipal);
        _principal[msg.sender] = 0;
        unclaimedPrincipal -= nominal;
        principalOwed -= payout;
        if (unclaimedPrincipal == 0 && principalOwed != 0) {
            uint256 dust = principalOwed;
            principalOwed = 0;
            emit RoundingDustReleased(dust);
        }
        emit Withdrawn(msg.sender, nominal, payout);
        if (payout != 0) usdc.safeTransfer(msg.sender, payout);
    }

    /// @notice Approve a nonzero cause other than this vault.
    function addCause(address cause) external onlyOwner {
        if (cause == address(0) || cause == address(this)) revert InvalidAddress();
        if (approvedCause[cause]) revert CauseAlreadyApproved();
        approvedCause[cause] = true;
        _causes.add(cause);
        emit CauseAdded(cause);
    }

    /// @notice Revoke a cause other than the permanent fallback.
    function removeCause(address cause) external onlyOwner {
        if (cause == address(0)) revert InvalidAddress();
        if (cause == fallbackCause) revert ProtectedFallback();
        if (!approvedCause[cause]) revert CauseNotApproved();
        approvedCause[cause] = false;
        _causes.remove(cause);
        emit CauseRemoved(cause);
    }

    /// @notice Transfer a positive amount of settled yield to an approved cause.
    function distributeYield(address cause, uint256 amount) external onlyOwner nonReentrant {
        _distributeYield(cause, amount);
    }

    /// @notice Transfer all remaining settled yield to an approved cause.
    function distributeAllYield(address cause) external onlyOwner nonReentrant {
        _distributeYield(cause, yieldRemaining);
    }

    /// @dev Reduce only the yield reserve before transferring; principalOwed is untouched.
    function _distributeYield(address cause, uint256 amount) private {
        if (!isSettled) revert NotSettled();
        if (!approvedCause[cause]) revert CauseNotApproved();
        if (amount == 0) revert ZeroAmount();
        if (amount > yieldRemaining) revert InsufficientYield();
        yieldRemaining -= amount;
        usdc.safeTransfer(cause, amount);
        emit YieldDistributed(cause, amount);
    }

    /// @notice After settledAt + claimGracePeriod, anyone may send remaining yield to the admin-chosen fallbackCause.
    /// @dev Intentional permissionless liveness safeguard. Depositor claims never expire; this sweeps only yield.
    /// Reverts on zero remaining yield.
    function sweepYieldToFallback() external nonReentrant {
        if (!isSettled) revert NotSettled();
        if (block.timestamp < settledAt + uint256(claimGracePeriod)) revert GracePeriodActive();
        uint256 amount = yieldRemaining;
        _distributeYield(fallbackCause, amount);
        emit YieldSwept(msg.sender, amount);
    }

    /// @notice Rescue unrelated tokens or unreserved USDC; cannot rescue strategy shares before settlement.
    /// @dev USDC rescue is additionally prohibited until settlement. Direct USDC donations and released
    /// rounding dust are surplus, not strategy-generated yield. Native tokens cannot be rescued here.
    function rescueToken(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        if (token == address(0) || to == address(0) || to == address(this)) revert InvalidAddress();
        if (amount == 0) revert ZeroAmount();
        if (token == address(strategy) && !isSettled) revert ReservedAssets();
        if (token == address(usdc)) {
            if (!isSettled) revert ReservedAssets();
            uint256 balance = usdc.balanceOf(address(this));
            uint256 reserved = principalOwed + yieldRemaining;
            if (balance < reserved || amount > balance - reserved) revert ReservedAssets();
        }
        IERC20(token).safeTransfer(to, amount);
        emit TokenRescued(token, to, amount);
    }

    /// @notice Return the caller-independent nominal principal still claimable by account.
    function principalOf(address account) external view returns (uint256) { return _principal[account]; }

    /// @notice Return all currently approved causes; ordering may change upon removal.
    function approvedCauses() external view returns (address[] memory) { return _causes.values(); }

    /// @notice Estimated strategy yield before settlement; realized original yield after settlement.
    /// @dev Estimates are not guarantees and may revert if the external strategy's view reverts.
    function projectedYield() external view returns (uint256) {
        if (isSettled) return yieldPool;
        uint256 assets = strategy.convertToAssets(strategy.balanceOf(address(this)));
        return assets > totalPrincipal ? assets - totalPrincipal : 0;
    }
}
