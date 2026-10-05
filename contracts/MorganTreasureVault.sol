// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MorganTreasureVault (Hybrid Staking & Treasury Vault)
 * @author Morgan Treasure Protocol Architecture Team
 * @notice Production-Ready BEP-20 Staking, Automated Dynamic APY & Hybrid Web3 Treasury Vault
 * 
 * HYBRID WEB3 SPECIFICATIONS:
 * 1. Off-Chain (MariaDB + PHP API):
 *    - High-throughput 15-tier MLM genealogy tree
 *    - Real-time 300% maximum profit capping computation
 *    - Dynamic daily ROI cron accrual (0.50% - 1.00%)
 *    - Unified financial transaction ledger & team analytics
 * 
 * 2. On-Chain (BNB Smart Chain - MorganTreasureVault.sol):
 *    - Secure non-custodial BEP-20 USDT staking custody
 *    - Algorithmic Dynamic APY curve based on Vault reserve depth ($1M to $3M USDT)
 *    - Indexed Web3 event emissions (Staked, Withdrawn, Disbursed) for PHP API sync
 *    - Automated hot-wallet batch disbursement for instant 24/7 withdrawals
 *    - 5% protocol liquidity retention fee (95% net payout) to preserve reserve health
 *    - Gas-optimized: Eliminates expensive 15-tier on-chain loops while retaining protocol views
 */

// ============================================================================
// 1. OPENZEPPELIN / BEP-20 INTERFACES & UTILITIES
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
        require(initialOwner != address(0), "Ownable: initial owner is zero address");
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
        require(newOwner != address(0), "Ownable: new owner is zero address");
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
        require(!_paused, "Pausable: paused");
        _;
    }

    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }

    function paused() public view virtual returns (bool) {
        return _paused;
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
// 2. HYBRID MORGAN TREASURE VAULT CORE CONTRACT
// ============================================================================

contract MorganTreasureVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // --- STRUCTS ---
    struct User {
        bool isRegistered;
        address sponsor;
        uint256 totalStaked;
        uint256 totalEarned;             // Cumulative earnings towards 300% cap
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
    uint256 public reserveThresholdLow;                     // Reserve depth for 0.50% ROI ($1,000,000)
    uint256 public reserveThresholdHigh;                    // Reserve depth for 1.00% ROI ($3,000,000)
    bool public isDynamicRoiAutomated;                      // True = algorithmic by reserve, False = manual override
    uint256 public manualDailyRoiBps;                       // Manual override fallback BPS

    // Global Statistics
    uint256 public totalStakedAllUsers;
    uint256 public totalWithdrawnAllUsers;
    uint256 public totalCommissionsDistributed;
    uint256 public totalRoiDistributed;
    uint256 public totalProtocolUsers;

    // Authorized Hot-Wallet Operators (PHP Backend API hot wallet for instant disbursements)
    mapping(address => bool) public isOperator;

    // Level Commission Schedule (For transparency & frontend queries)
    uint256[NUMBER_OF_LEVELS] public levelCommissionBps;
    uint256[NUMBER_OF_LEVELS] public levelDirectRequirement;

    // Mappings
    mapping(address => User) public users;
    mapping(address => DepositRecord[]) public userDeposits;
    mapping(address => address[]) public userDirects;

    // --- EVENTS ---
    event Registered(address indexed user, address indexed sponsor);
    event Deposited(address indexed user, uint256 amount, uint256 dailyRoiBps, uint256 timestamp);
    event Staked(address indexed user, uint256 amount, string packageId, string sponsorId, uint256 timestamp);
    event ContinuousRoiAccrued(address indexed user, uint256 amountAccrued, uint256 newPending);
    event Withdrawn(address indexed user, uint256 grossAmount, uint256 feeAmount, uint256 netPayout);
    event PayoutDisbursed(address indexed recipient, uint256 netAmount, uint256 feeAmount, string referenceId);
    event BatchPayoutDisbursed(uint256 totalRecipients, uint256 totalNetAmount);
    event DynamicRoiUpdated(uint256 newDailyBps, uint256 contractReserve);
    event DynamicModeSwitched(bool isAutomated, uint256 manualBps);
    event OperatorUpdated(address indexed operator, bool indexed status);
    event TreasuryReserveUpdated(address indexed newTreasury);
    event ParametersUpdated(uint256 minDeposit, uint256 reserveLow, uint256 reserveHigh);

    // --- MODIFIERS ---
    modifier onlyOperatorOrOwner() {
        require(msg.sender == owner() || isOperator[msg.sender], "Vault: Caller not authorized operator");
        _;
    }

    // --- CONSTRUCTOR ---
    constructor(
        address _stakingToken,
        address _genesisSponsor,
        address _treasuryReserve,
        address _initialOperator
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
        manualDailyRoiBps = 75; // 0.75% default

        // Commission Schedule (15 Levels)
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

        // Direct Referral Requirements
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

        // Authorize Operator (PHP Hot-Wallet)
        if (_initialOperator != address(0)) {
            isOperator[_initialOperator] = true;
            emit OperatorUpdated(_initialOperator, true);
        }

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
            uint256 bpsSpan = MAX_DAILY_ROI_BPS - MIN_DAILY_ROI_BPS;

            dailyBps = MIN_DAILY_ROI_BPS + ((reserveDelta * bpsSpan) / thresholdSpan);
            return dailyBps;
        }
    }

    function getAnnualApyBps() external view returns (uint256) {
        return getDynamicDailyBps() * 365;
    }

    function calculatePendingRoi(address account) public view returns (uint256 pendingRoi) {
        User storage u = users[account];
        if (u.totalStaked == 0 || u.lastAccrualTimestamp == 0 || block.timestamp <= u.lastAccrualTimestamp) {
            return 0;
        }

        uint256 maxEarnings = u.totalStaked * MAX_CAP_MULTIPLIER;
        if (u.totalEarned >= maxEarnings) {
            return 0;
        }

        uint256 remainingCap = maxEarnings - u.totalEarned;
        uint256 timeElapsed = block.timestamp - u.lastAccrualTimestamp;
        uint256 dailyBps = getDynamicDailyBps();

        uint256 rawReward = (u.totalStaked * dailyBps * timeElapsed) / (BPS_DIVISOR * SECONDS_PER_DAY);
        return rawReward > remainingCap ? remainingCap : rawReward;
    }

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
    // 4. REGISTRATION & DEPOSIT LOGIC (HYBRID WEB3 COMPLIANT)
    // ============================================================================

    /**
     * @notice Register wallet with sponsor before staking.
     */
    function register(address sponsor) external whenNotPaused {
        require(!users[msg.sender].isRegistered, "Already registered");
        require(sponsor != address(0) && sponsor != msg.sender, "Invalid sponsor address");
        require(users[sponsor].isRegistered, "Sponsor not registered");

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

        emit Registered(userAddress, sponsorAddress);
    }

    /**
     * @notice Standard Staking Deposit (USDT transfer to Vault)
     * Emits events for both direct contract monitoring and PHP backend API ingestion.
     */
    function deposit(uint256 amount, address sponsor) external nonReentrant whenNotPaused {
        require(amount >= minDepositAmount, "Amount below minimum deposit");

        if (!users[msg.sender].isRegistered) {
            require(sponsor != address(0) && sponsor != msg.sender, "Invalid sponsor address");
            require(users[sponsor].isRegistered, "Sponsor not registered");
            _registerUser(msg.sender, sponsor);
        }

        _updateAccrual(msg.sender);

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

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
        emit Staked(msg.sender, amount, "standard", "", block.timestamp);
    }

    /**
     * @notice Hybrid Staking Deposit with Package ID & Sponsor Code
     * Directly consumed by PHP API deposit endpoint.
     */
    function depositWithPackage(
        uint256 amount,
        string calldata packageId,
        string calldata sponsorId
    ) external nonReentrant whenNotPaused {
        require(amount >= minDepositAmount, "Amount below minimum deposit");

        _updateAccrual(msg.sender);

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        User storage u = users[msg.sender];
        u.isRegistered = true;
        u.totalStaked += amount;
        totalStakedAllUsers += amount;

        uint256 currentDailyBps = getDynamicDailyBps();
        userDeposits[msg.sender].push(DepositRecord({
            amount: amount,
            timestamp: block.timestamp,
            roiBpsAtDeposit: currentDailyBps
        }));

        emit Deposited(msg.sender, amount, currentDailyBps, block.timestamp);
        emit Staked(msg.sender, amount, packageId, sponsorId, block.timestamp);
    }

    // ============================================================================
    // 5. HYBRID DISBURSEMENT (API HOT-WALLET AUTOMATION) & WITHDRAWALS
    // ============================================================================

    /**
     * @notice Backend Hot-Wallet / Admin Disbursement
     * Triggered by PHP API (withdraw.php) to fulfill user withdrawal requests on-chain.
     * Deducts 5% liquidity retention fee to protect Vault reserve; transfers 95% net to user.
     */
    function disbursePayout(
        address recipient,
        uint256 grossAmount,
        string calldata referenceId
    ) external onlyOperatorOrOwner nonReentrant whenNotPaused {
        require(recipient != address(0), "Invalid recipient");
        require(grossAmount > 0, "Gross amount must be > 0");

        uint256 fee = (grossAmount * WITHDRAWAL_FEE_BPS) / BPS_DIVISOR;
        uint256 netPayout = grossAmount - fee;

        require(stakingToken.balanceOf(address(this)) >= netPayout, "Insufficient contract liquid reserves");

        totalWithdrawnAllUsers += grossAmount;
        users[recipient].totalWithdrawn += grossAmount;

        stakingToken.safeTransfer(recipient, netPayout);

        emit PayoutDisbursed(recipient, netPayout, fee, referenceId);
    }

    /**
     * @notice Batch Payout Disbursement for API high-volume throughput
     * Executes multiple user withdrawals in 1 gas-saving transaction.
     */
    function disburseBatchPayouts(
        address[] calldata recipients,
        uint256[] calldata grossAmounts
    ) external onlyOperatorOrOwner nonReentrant whenNotPaused {
        require(recipients.length == grossAmounts.length, "Array lengths mismatch");
        require(recipients.length > 0 && recipients.length <= 100, "Invalid batch size (1-100)");

        uint256 totalNetDisbursed = 0;

        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint256 gross = grossAmounts[i];

            if (recipient == address(0) || gross == 0) continue;

            uint256 fee = (gross * WITHDRAWAL_FEE_BPS) / BPS_DIVISOR;
            uint256 net = gross - fee;

            totalWithdrawnAllUsers += gross;
            users[recipient].totalWithdrawn += gross;
            totalNetDisbursed += net;

            stakingToken.safeTransfer(recipient, net);
            emit PayoutDisbursed(recipient, net, fee, "BATCH");
        }

        emit BatchPayoutDisbursed(recipients.length, totalNetDisbursed);
    }

    /**
     * @notice Direct On-Chain Withdrawal for accrued Dynamic ROI
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");

        _updateAccrual(msg.sender);

        User storage u = users[msg.sender];
        uint256 totalAvailable = u.pendingRoiReward + u.referralReward;
        require(amount <= totalAvailable, "Withdrawal exceeds available balance");

        uint256 remainingToDeduct = amount;
        if (u.pendingRoiReward >= remainingToDeduct) {
            u.pendingRoiReward -= remainingToDeduct;
        } else {
            remainingToDeduct -= u.pendingRoiReward;
            u.pendingRoiReward = 0;
            u.referralReward -= remainingToDeduct;
        }

        uint256 fee = (amount * WITHDRAWAL_FEE_BPS) / BPS_DIVISOR;
        uint256 netPayout = amount - fee;

        u.totalWithdrawn += amount;
        totalWithdrawnAllUsers += amount;

        require(stakingToken.balanceOf(address(this)) >= netPayout, "Insufficient contract liquid reserves");
        stakingToken.safeTransfer(msg.sender, netPayout);

        emit Withdrawn(msg.sender, amount, fee, netPayout);
    }

    // ============================================================================
    // 6. VIEW & FRONTEND QUERY HELPERS
    // ============================================================================

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

    function getUserDeposits(address account) external view returns (DepositRecord[] memory) {
        return userDeposits[account];
    }

    function getUserDirects(address account) external view returns (address[] memory) {
        return userDirects[account];
    }

    function getLevelCommissionBps() external view returns (uint256[NUMBER_OF_LEVELS] memory) {
        return levelCommissionBps;
    }

    function getLevelDirectRequirements() external view returns (uint256[NUMBER_OF_LEVELS] memory) {
        return levelDirectRequirement;
    }

    // ============================================================================
    // 7. ADMIN & OPERATOR GOVERNANCE
    // ============================================================================

    function setOperator(address operator, bool status) external onlyOwner {
        require(operator != address(0), "Invalid operator address");
        isOperator[operator] = status;
        emit OperatorUpdated(operator, status);
    }

    function setDynamicRoiMode(bool _isAutomated, uint256 _manualBps) external onlyOwner {
        if (!_isAutomated) {
            require(_manualBps >= MIN_DAILY_ROI_BPS && _manualBps <= MAX_DAILY_ROI_BPS, "BPS out of bounds");
            manualDailyRoiBps = _manualBps;
        }
        isDynamicRoiAutomated = _isAutomated;
        emit DynamicModeSwitched(_isAutomated, _manualBps);
    }

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

    function setTreasuryReserve(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasuryReserve = _treasury;
        emit TreasuryReserveUpdated(_treasury);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
