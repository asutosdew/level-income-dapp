// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MorganTreasureVault
 * @author Morgan Treasure Protocol Architecture Team
 * @notice Production-Ready BEP-20 Staking, Automated Dynamic APY & 15-Tier Level MLM Protocol
 * 
 * CORE PROTOCOL SPECIFICATIONS:
 * 1. Automated Dynamic Daily APY:
 *    - Automatically floats between 0.50% (50 BPS) and 1.00% (100 BPS) daily.
 *    - Continuous per-second reward accrual based on contract vault USDT reserve depth.
 * 2. Hard 300% (3.0x) Profit Cap:
 *    - All earnings (Daily Dynamic ROI + 15-Tier Commissions) are mathematically capped at 300% of staked principal.
 * 3. 15-Tier Instant Affiliate Commission:
 *    - Level 1: 10.00% (1000 BPS)
 *    - Level 2:  5.00% (500 BPS)
 *    - Level 3:  3.00% (300 BPS)
 *    - Level 4:  2.00% (200 BPS)
 *    - Level 5:  1.00% (100 BPS)
 *    - Level 6-10: 0.50% each (50 BPS each = 2.50%)
 *    - Level 11-15: 0.25% each (25 BPS each = 1.25%)
 *    - Total Affiliate Allocation = 22.75% (2275 BPS)
 *    - Unlocked based on active direct referral counts (1 direct: L1-2, 2: L3-5, 3: L6-10, 5: L11-15).
 * 4. 5% Withdrawal Liquidity Retention Fee:
 *    - 95% net payout to user, 5% retained in the contract reserve to sustain liquidity and boost dynamic APY.
 * 5. Production Security:
 *    - ReentrancyGuard, Ownable, Pausable, and SafeERC20 with low-level call verification.
 */

// ============================================================================
// 1. OPENZEPPELIN INTERFACES & UTILITIES (Self-Contained for 1-Click Verification)
// ============================================================================

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
    function symbol() external view returns (string memory);
    function name() external view returns (string memory);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

library SafeERC20 {
    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transfer.selector, to, value));
    }

    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));
    }

    function safeApprove(IERC20 token, address spender, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, value));
    }

    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        (bool success, bytes memory returndata) = address(token).call(data);
        require(success, "SafeERC20: low-level call failed");
        if (returndata.length > 0) {
            require(abi.decode(returndata, (bool)), "SafeERC20: ERC20 operation did not succeed");
        }
    }
}

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        require(initialOwner != address(0), "Ownable: initial owner is the zero address");
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

abstract contract Pausable is Context {
    event Paused(address account);
    event Unpaused(address account);

    bool private _paused;

    constructor() {
        _paused = false;
    }

    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    modifier whenPaused() {
        _requirePaused();
        _;
    }

    function paused() public view virtual returns (bool) {
        return _paused;
    }

    function _requireNotPaused() internal view virtual {
        require(!paused(), "Pausable: paused");
    }

    function _requirePaused() internal view virtual {
        require(paused(), "Pausable: not paused");
    }

    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}

// ============================================================================
// 2. MORGAN TREASURE VAULT CORE CONTRACT
// ============================================================================

contract MorganTreasureVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // --- STRUCTS ---
    struct User {
        bool isRegistered;
        address sponsor;
        uint256 totalStaked;
        uint256 totalEarned;             // Cumulative earnings towards 300% cap (ROI + Level Commission)
        uint256 pendingRoiReward;        // Accrued claimable ROI
        uint256 referralReward;          // Accrued claimable MLM Level Commission
        uint256 totalWithdrawn;          // Total successfully withdrawn USDT
        uint256 lastAccrualTimestamp;    // Timestamp of last continuous ROI calculation
        uint256 directCount;             // Number of active direct referrals
        uint256 teamCount;               // Total downline network size
        uint256 teamTurnover;            // Total USDT volume staked in downline
    }

    struct DepositRecord {
        uint256 amount;
        uint256 timestamp;
        uint256 roiBpsAtDeposit;
    }

    // --- PROTOCOL CONSTANTS ---
    uint256 public constant BPS_DIVISOR = 10000;            // 100% = 10,000 BPS
    uint256 public constant SECONDS_PER_DAY = 86400;
    uint256 public constant MAX_CAP_MULTIPLIER = 3;         // 300% hard earning cap (3x)
    uint256 public constant WITHDRAWAL_FEE_BPS = 500;       // 5.00% liquidity fee
    uint256 public constant MIN_DAILY_ROI_BPS = 50;         // 0.50% per day minimum
    uint256 public constant MAX_DAILY_ROI_BPS = 100;        // 1.00% per day maximum
    uint256 public constant NUMBER_OF_LEVELS = 15;

    // --- STATE VARIABLES ---
    IERC20 public immutable stakingToken;                   // BEP-20 USDT Token
    uint8 public immutable tokenDecimals;
    address public treasuryReserve;                         // Protocol insurance/treasury fallback

    uint256 public minDepositAmount;                        // Minimum deposit (default: 50 USDT)
    uint256 public reserveThresholdLow;                     // Reserve depth for 0.50% ROI (e.g. 1,000,000 USDT)
    uint256 public reserveThresholdHigh;                    // Reserve depth for 1.00% ROI (e.g. 3,000,000 USDT)
    bool public isDynamicRoiAutomated;                      // True = algorithmic by reserve, False = manual override
    uint256 public manualDailyRoiBps;                       // Manual override fallback BPS

    // Global Statistics
    uint256 public totalStakedAllUsers;
    uint256 public totalWithdrawnAllUsers;
    uint256 public totalCommissionsDistributed;
    uint256 public totalRoiDistributed;
    uint256 public totalProtocolUsers;

    // Level Commission Basis Points (Total = 2275 BPS = 22.75%)
    // L1=10%, L2=5%, L3=3%, L4=2%, L5=1%, L6-10=0.5% each, L11-15=0.25% each
    uint256[NUMBER_OF_LEVELS] public levelCommissionBps;

    // Direct referrals required to unlock each level tier
    // L1-2: 1 direct, L3-5: 2 directs, L6-10: 3 directs, L11-15: 5 directs
    uint256[NUMBER_OF_LEVELS] public levelDirectRequirement;

    // Mappings
    mapping(address => User) public users;
    mapping(address => DepositRecord[]) public userDeposits;
    mapping(address => address[]) public userDirects;

    // --- EVENTS ---
    event Registered(address indexed user, address indexed sponsor);
    event Deposited(address indexed user, uint256 amount, uint256 dailyRoiBps, uint256 timestamp);
    event ContinuousRoiAccrued(address indexed user, uint256 amountAccrued, uint256 newPending);
    event LevelCommissionPaid(address indexed beneficiary, address indexed from, uint256 level, uint256 amount);
    event LevelCommissionCapped(address indexed beneficiary, address indexed from, uint256 level, uint256 skippedAmount);
    event Withdrawn(address indexed user, uint256 grossAmount, uint256 feeAmount, uint256 netPayout);
    event DynamicRoiUpdated(uint256 newDailyBps, uint256 contractReserve);
    event DynamicModeSwitched(bool isAutomated, uint256 manualBps);
    event TreasuryReserveUpdated(address indexed newTreasury);
    event ParametersUpdated(uint256 minDeposit, uint256 reserveLow, uint256 reserveHigh);

    // --- CONSTRUCTOR ---
    constructor(
        address _stakingToken,
        address _genesisSponsor,
        address _treasuryReserve
    ) Ownable(msg.sender) {
        require(_stakingToken != address(0), "Invalid staking token");
        require(_genesisSponsor != address(0), "Invalid genesis sponsor");
        require(_treasuryReserve != address(0), "Invalid treasury reserve");

        stakingToken = IERC20(_stakingToken);
        tokenDecimals = IERC20(_stakingToken).decimals();
        treasuryReserve = _treasuryReserve;

        minDepositAmount = 50 * (10 ** tokenDecimals);
        reserveThresholdLow = 1_000_000 * (10 ** tokenDecimals);
        reserveThresholdHigh = 3_000_000 * (10 ** tokenDecimals);
        isDynamicRoiAutomated = true;
        manualDailyRoiBps = 75; // 0.75% default if ever set manual

        // Initialize 15-Tier MLM Commission Schedule
        levelCommissionBps[0]  = 1000; // Level 1: 10.00%
        levelCommissionBps[1]  = 500;  // Level 2:  5.00%
        levelCommissionBps[2]  = 300;  // Level 3:  3.00%
        levelCommissionBps[3]  = 200;  // Level 4:  2.00%
        levelCommissionBps[4]  = 100;  // Level 5:  1.00%
        levelCommissionBps[5]  = 50;   // Level 6:  0.50%
        levelCommissionBps[6]  = 50;   // Level 7:  0.50%
        levelCommissionBps[7]  = 50;   // Level 8:  0.50%
        levelCommissionBps[8]  = 50;   // Level 9:  0.50%
        levelCommissionBps[9]  = 50;   // Level 10: 0.50%
        levelCommissionBps[10] = 25;   // Level 11: 0.25%
        levelCommissionBps[11] = 25;   // Level 12: 0.25%
        levelCommissionBps[12] = 25;   // Level 13: 0.25%
        levelCommissionBps[13] = 25;   // Level 14: 0.25%
        levelCommissionBps[14] = 25;   // Level 15: 0.25%

        // Initialize Direct Referral Unlock Requirements
        levelDirectRequirement[0]  = 1;
        levelDirectRequirement[1]  = 1;
        levelDirectRequirement[2]  = 2;
        levelDirectRequirement[3]  = 2;
        levelDirectRequirement[4]  = 2;
        levelDirectRequirement[5]  = 3;
        levelDirectRequirement[6]  = 3;
        levelDirectRequirement[7]  = 3;
        levelDirectRequirement[8]  = 3;
        levelDirectRequirement[9]  = 3;
        levelDirectRequirement[10] = 5;
        levelDirectRequirement[11] = 5;
        levelDirectRequirement[12] = 5;
        levelDirectRequirement[13] = 5;
        levelDirectRequirement[14] = 5;

        // Register Genesis Root Sponsor
        users[_genesisSponsor].isRegistered = true;
        users[_genesisSponsor].sponsor = address(0);
        totalProtocolUsers = 1;
        emit Registered(_genesisSponsor, address(0));
    }

    // ============================================================================
    // 3. AUTOMATED DYNAMIC APY / ROI ENGINE
    // ============================================================================

    /**
     * @notice Calculates real-time daily ROI BPS based on pool reserve depth.
     * Formula:
     * - Reserve <= ThresholdLow ($1M) => 50 BPS (0.50%/day)
     * - Reserve >= ThresholdHigh ($3M) => 100 BPS (1.00%/day)
     * - Between Low & High => Linear curve: 50 + (50 * (Reserve - Low)) / (High - Low)
     * @return dailyBps Dynamic daily ROI in basis points (50 to 100).
     */
    function getDynamicDailyBps() public view returns (uint256 dailyBps) {
        if (!isDynamicRoiAutomated) {
            return manualDailyRoiBps;
        }

        uint256 currentReserve = stakingToken.balanceOf(address(this));

        if (currentReserve <= reserveThresholdLow) {
            return MIN_DAILY_ROI_BPS; // 0.50%
        } else if (currentReserve >= reserveThresholdHigh) {
            return MAX_DAILY_ROI_BPS; // 1.00%
        } else {
            uint256 reserveDelta = currentReserve - reserveThresholdLow;
            uint256 thresholdSpan = reserveThresholdHigh - reserveThresholdLow;
            uint256 bpsSpan = MAX_DAILY_ROI_BPS - MIN_DAILY_ROI_BPS; // 50 BPS

            dailyBps = MIN_DAILY_ROI_BPS + ((reserveDelta * bpsSpan) / thresholdSpan);
            return dailyBps;
        }
    }

    /**
     * @notice Returns equivalent Annual Percentage Yield (APY / APR) based on current daily ROI.
     */
    function getAnnualApyBps() external view returns (uint256) {
        return getDynamicDailyBps() * 365;
    }

    /**
     * @notice Calculates unaccrued pending daily ROI for an account since last accrual.
     * Takes into account the 300% maximum earning ceiling.
     */
    function calculatePendingRoi(address account) public view returns (uint256 pendingRoi) {
        User storage u = users[account];
        if (u.totalStaked == 0 || u.lastAccrualTimestamp == 0 || block.timestamp <= u.lastAccrualTimestamp) {
            return 0;
        }

        uint256 maxEarnings = u.totalStaked * MAX_CAP_MULTIPLIER;
        if (u.totalEarned >= maxEarnings) {
            return 0; // 300% Cap already hit
        }

        uint256 remainingCap = maxEarnings - u.totalEarned;
        uint256 timeElapsed = block.timestamp - u.lastAccrualTimestamp;
        uint256 dailyBps = getDynamicDailyBps();

        // Continuous linear accrual: (Staked * BPS * timeElapsed) / (10000 * 86400)
        uint256 rawReward = (u.totalStaked * dailyBps * timeElapsed) / (BPS_DIVISOR * SECONDS_PER_DAY);

        // Cap to remaining allowed earnings
        if (rawReward > remainingCap) {
            pendingRoi = remainingCap;
        } else {
            pendingRoi = rawReward;
        }
    }

    /**
     * @dev Internal update function to snapshot continuous ROI accrual into storage.
     */
    function _updateAccrual(address account) internal {
        User storage u = users[account];
        if (u.totalStaked == 0) {
            u.lastAccrualTimestamp = block.timestamp;
            return;
        }

        uint256 pending = calculatePendingRoi(account);
        if (pending > 0) {
            u.pendingRoiReward += pending;
            u.totalEarned += pending;
            totalRoiDistributed += pending;
            emit ContinuousRoiAccrued(account, pending, u.pendingRoiReward);
        }

        u.lastAccrualTimestamp = block.timestamp;
    }

    // ============================================================================
    // 4. REGISTRATION & DEPOSIT LOGIC
    // ============================================================================

    /**
     * @notice Register wallet with a verified sponsor before staking.
     */
    function register(address sponsor) external whenNotPaused {
        require(!users[msg.sender].isRegistered, "Already registered");
        require(sponsor != address(0) && sponsor != msg.sender, "Invalid sponsor address");
        require(users[sponsor].isRegistered, "Sponsor not registered in protocol");

        _registerUser(msg.sender, sponsor);
    }

    function _registerUser(address userAddress, address sponsorAddress) internal {
        User storage u = users[userAddress];
        u.isRegistered = true;
        u.sponsor = sponsorAddress;
        u.lastAccrualTimestamp = block.timestamp;

        users[sponsorAddress].directCount += 1;
        userDirects[sponsorAddress].push(userAddress);
        totalProtocolUsers += 1;

        // Propagate team count up the 15 levels
        address upline = sponsorAddress;
        for (uint256 i = 0; i < NUMBER_OF_LEVELS && upline != address(0); i++) {
            users[upline].teamCount += 1;
            upline = users[upline].sponsor;
        }

        emit Registered(userAddress, sponsorAddress);
    }

    /**
     * @notice Stake USDT to earn dynamic daily ROI and activate 15-tier downline commissions.
     * @param amount Amount of BEP-20 USDT tokens to stake (in 18 decimals).
     * @param sponsor Address of referrer (used if user is not yet registered).
     */
    function deposit(uint256 amount, address sponsor) external nonReentrant whenNotPaused {
        require(amount >= minDepositAmount, "Amount below minimum deposit");

        // Auto-register if new user
        if (!users[msg.sender].isRegistered) {
            require(sponsor != address(0) && sponsor != msg.sender, "Invalid sponsor address");
            require(users[sponsor].isRegistered, "Sponsor not registered in protocol");
            _registerUser(msg.sender, sponsor);
        }

        // Accrue any existing ROI prior to principal balance increase
        _updateAccrual(msg.sender);

        // Safe transfer USDT from user to vault
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update user staking records
        User storage u = users[msg.sender];
        u.totalStaked += amount;
        totalStakedAllUsers += amount;

        uint256 currentDailyBps = getDynamicDailyBps();
        userDeposits[msg.sender].push(DepositRecord({
            amount: amount,
            timestamp: block.timestamp,
            roiBpsAtDeposit: currentDailyBps
        }));

        emit Deposited(msg.sender, amount, currentDailyBps, block.timestamp);

        // Distribute 15-Tier Downline Commissions
        _distributeAffiliateCommissions(msg.sender, amount);
    }

    /**
     * @dev Distributes 15-tier MLM affiliate commissions up the sponsor tree.
     * Enforces active direct referral unlock requirements and 300% profit capping.
     */
    function _distributeAffiliateCommissions(address depositor, uint256 depositAmount) internal {
        address currentUpline = users[depositor].sponsor;

        for (uint256 lvl = 0; lvl < NUMBER_OF_LEVELS && currentUpline != address(0); lvl++) {
            User storage up = users[currentUpline];
            up.teamTurnover += depositAmount;

            uint256 requiredDirects = levelDirectRequirement[lvl];
            uint256 commissionBps = levelCommissionBps[lvl];
            uint256 potentialCommission = (depositAmount * commissionBps) / BPS_DIVISOR;

            // Check Qualification: Must have staked and meet direct referral requirement
            if (up.totalStaked > 0 && up.directCount >= requiredDirects) {
                uint256 maxEarnings = up.totalStaked * MAX_CAP_MULTIPLIER;
                
                if (up.totalEarned < maxEarnings) {
                    uint256 remainingCap = maxEarnings - up.totalEarned;
                    uint256 actualPayout = potentialCommission;

                    if (actualPayout > remainingCap) {
                        actualPayout = remainingCap;
                        emit LevelCommissionCapped(currentUpline, depositor, lvl + 1, potentialCommission - actualPayout);
                    }

                    if (actualPayout > 0) {
                        up.referralReward += actualPayout;
                        up.totalEarned += actualPayout;
                        totalCommissionsDistributed += actualPayout;
                        emit LevelCommissionPaid(currentUpline, depositor, lvl + 1, actualPayout);
                    }
                } else {
                    emit LevelCommissionCapped(currentUpline, depositor, lvl + 1, potentialCommission);
                }
            }

            currentUpline = up.sponsor;
        }
    }

    // ============================================================================
    // 5. WITHDRAWALS & LIQUIDITY RETENTION FEE
    // ============================================================================

    /**
     * @notice Withdraws accrued Dynamic ROI and MLM Referral Commissions.
     * Deducts 5% liquidity fee to reinforce vault reserve, transferring 95% net to user.
     * @param amount Gross USDT amount requested for withdrawal.
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than zero");

        // Bring continuous ROI accrual up to date
        _updateAccrual(msg.sender);

        User storage u = users[msg.sender];
        uint256 totalAvailable = u.pendingRoiReward + u.referralReward;
        require(amount <= totalAvailable, "Withdrawal amount exceeds available balance");

        // Deduct from available balances (ROI balance first, then Referral balance)
        uint256 remainingToDeduct = amount;
        if (u.pendingRoiReward >= remainingToDeduct) {
            u.pendingRoiReward -= remainingToDeduct;
            remainingToDeduct = 0;
        } else {
            remainingToDeduct -= u.pendingRoiReward;
            u.pendingRoiReward = 0;
            u.referralReward -= remainingToDeduct;
        }

        // Calculate 5% liquidity retention fee & 95% net payout
        uint256 fee = (amount * WITHDRAWAL_FEE_BPS) / BPS_DIVISOR;
        uint256 netPayout = amount - fee;

        u.totalWithdrawn += amount;
        totalWithdrawnAllUsers += amount;

        // Ensure contract has sufficient liquid USDT for net payout
        require(stakingToken.balanceOf(address(this)) >= netPayout, "Insufficient contract liquid reserves");

        // Transfer 95% net payout to user
        stakingToken.safeTransfer(msg.sender, netPayout);

        emit Withdrawn(msg.sender, amount, fee, netPayout);
    }

    /**
     * @notice Withdraws all available earnings (both ROI and referral commissions) in 1 click.
     */
    function withdrawAll() external nonReentrant whenNotPaused {
        _updateAccrual(msg.sender);

        User storage u = users[msg.sender];
        uint256 totalAvailable = u.pendingRoiReward + u.referralReward;
        require(totalAvailable > 0, "No claimable earnings available");

        u.pendingRoiReward = 0;
        u.referralReward = 0;

        uint256 fee = (totalAvailable * WITHDRAWAL_FEE_BPS) / BPS_DIVISOR;
        uint256 netPayout = totalAvailable - fee;

        u.totalWithdrawn += totalAvailable;
        totalWithdrawnAllUsers += totalAvailable;

        require(stakingToken.balanceOf(address(this)) >= netPayout, "Insufficient contract liquid reserves");
        stakingToken.safeTransfer(msg.sender, netPayout);

        emit Withdrawn(msg.sender, totalAvailable, fee, netPayout);
    }

    // ============================================================================
    // 6. VIEW & FRONTEND QUERY HELPERS
    // ============================================================================

    /**
     * @notice Returns complete user dashboard profile in a single call.
     */
    function getUserDashboard(address account) external view returns (
        bool isRegistered,
        address sponsor,
        uint256 totalStaked,
        uint256 totalEarned,
        uint256 maxCappingLimit,
        uint256 claimableRoi,
        uint256 claimableReferral,
        uint256 totalWithdrawn,
        uint256 directCount,
        uint256 teamCount,
        uint256 teamTurnover,
        uint256 currentDailyBps
    ) {
        User storage u = users[account];
        uint256 pendingRoi = calculatePendingRoi(account);

        return (
            u.isRegistered,
            u.sponsor,
            u.totalStaked,
            u.totalEarned + pendingRoi,
            u.totalStaked * MAX_CAP_MULTIPLIER,
            u.pendingRoiReward + pendingRoi,
            u.referralReward,
            u.totalWithdrawn,
            u.directCount,
            u.teamCount,
            u.teamTurnover,
            getDynamicDailyBps()
        );
    }

    /**
     * @notice Returns protocol-wide liquidity, reserves, and dynamic APY status.
     */
    function getProtocolStats() external view returns (
        uint256 totalVaultReserve,
        uint256 totalStakedGlobal,
        uint256 totalWithdrawnGlobal,
        uint256 totalCommissionsGlobal,
        uint256 totalRoiGlobal,
        uint256 totalUsersGlobal,
        uint256 currentDailyBps,
        uint256 currentAnnualApyBps,
        bool isAutomated
    ) {
        uint256 reserve = stakingToken.balanceOf(address(this));
        uint256 dailyBps = getDynamicDailyBps();

        return (
            reserve,
            totalStakedAllUsers,
            totalWithdrawnAllUsers,
            totalCommissionsDistributed,
            totalRoiDistributed,
            totalProtocolUsers,
            dailyBps,
            dailyBps * 365,
            isDynamicRoiAutomated
        );
    }

    /**
     * @notice Returns array of deposits made by a user.
     */
    function getUserDeposits(address account) external view returns (DepositRecord[] memory) {
        return userDeposits[account];
    }

    /**
     * @notice Returns array of direct referral addresses sponsored by user.
     */
    function getUserDirects(address account) external view returns (address[] memory) {
        return userDirects[account];
    }

    /**
     * @notice Returns level commission rates in BPS.
     */
    function getLevelCommissionBps() external view returns (uint256[NUMBER_OF_LEVELS] memory) {
        return levelCommissionBps;
    }

    /**
     * @notice Returns direct referral count requirements for each level.
     */
    function getLevelDirectRequirements() external view returns (uint256[NUMBER_OF_LEVELS] memory) {
        return levelDirectRequirement;
    }

    // ============================================================================
    // 7. ADMIN / PROTOCOL GOVERNANCE
    // ============================================================================

    /**
     * @notice Configures dynamic ROI behavior (automated reserve vs manual override).
     */
    function setDynamicRoiMode(bool _isAutomated, uint256 _manualBps) external onlyOwner {
        if (!_isAutomated) {
            require(_manualBps >= MIN_DAILY_ROI_BPS && _manualBps <= MAX_DAILY_ROI_BPS, "BPS out of bounds");
            manualDailyRoiBps = _manualBps;
        }
        isDynamicRoiAutomated = _isAutomated;
        emit DynamicModeSwitched(_isAutomated, _manualBps);
    }

    /**
     * @notice Configures protocol parameters: min deposit and dynamic reserve scaling bounds.
     */
    function setProtocolParameters(
        uint256 _minDeposit,
        uint256 _reserveLow,
        uint256 _reserveHigh
    ) external onlyOwner {
        require(_reserveHigh > _reserveLow, "Invalid reserve thresholds");
        minDepositAmount = _minDeposit;
        reserveThresholdLow = _reserveLow;
        reserveThresholdHigh = _reserveHigh;
        emit ParametersUpdated(_minDeposit, _reserveLow, _reserveHigh);
    }

    /**
     * @notice Updates treasury reserve destination address.
     */
    function setTreasuryReserve(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasuryReserve = _treasury;
        emit TreasuryReserveUpdated(_treasury);
    }

    /**
     * @notice Circuit-breaker pause in case of network anomaly or upgrade.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Resume protocol operations.
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
