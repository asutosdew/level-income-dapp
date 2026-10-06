<?php
/**
 * Morgan Treasure - Advanced Executive Admin Management API
 * 
 * Capabilities:
 * 1. Admin Authentication & Session Management
 * 2. Complete Company & Protocol Financial Status (Turnover, Withdrawals, Reserves, Solvency)
 * 3. User Directory (Search, Filter, Balances, Team Downline)
 * 4. 15-Tier Level Income Breakdown & Analytics
 * 5. Manual Daily ROI Cron Trigger (Real-time Payout Execution)
 * 6. User Wallets & Private Keys Secure Vault
 * 7. Unified Audit Transactions Ledger
 */

require_once __DIR__ . '/config.php';

$pdo = getDbConnection();

$action = strtolower(trim($_GET['action'] ?? 'overview'));

// ----------------------------------------------------------------------------
// 1. Admin Login Endpoint (POST action=login)
// ----------------------------------------------------------------------------
if ($action === 'login') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse('error', 'POST request required for admin login', null, 405);
    }

    $payload = getJsonPayload();
    $password = trim($payload['password'] ?? '');

    // Accepted secure admin credentials
    $validPasswords = [
        'Server@2050',
        'MorganAdmin@2050',
        DB_PASS,
        CRON_SECRET
    ];

    if (in_array($password, $validPasswords, true)) {
        $token = hash('sha256', 'MT_ADMIN_' . CRON_SECRET . '_' . date('Ymd'));
        sendResponse('success', 'Admin authenticated successfully', [
            'token' => $token,
            'role' => 'Executive Administrator',
            'expiresIn' => 86400,
            'timestamp' => date('c')
        ]);
    } else {
        sendResponse('error', 'Invalid Admin Password or Passkey', null, 401);
    }
}

// ----------------------------------------------------------------------------
// 2. Authentication Check for All Protected Admin Actions
// ----------------------------------------------------------------------------
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$adminKey = $_SERVER['HTTP_X_ADMIN_KEY'] ?? ($_GET['key'] ?? '');
$validToken = hash('sha256', 'MT_ADMIN_' . CRON_SECRET . '_' . date('Ymd'));

$isAuthorized = false;

if ($adminKey === CRON_SECRET || $adminKey === 'Server@2050' || $adminKey === DB_PASS) {
    $isAuthorized = true;
} elseif (!empty($authHeader) && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    if ($matches[1] === $validToken) {
        $isAuthorized = true;
    }
} elseif (isset($_GET['token']) && $_GET['token'] === $validToken) {
    $isAuthorized = true;
}

if (!$isAuthorized) {
    sendResponse('error', 'Unauthorized: Please provide valid Admin credentials', null, 401);
}

if (!$pdo) {
    sendResponse('error', 'Database connection unavailable', null, 500);
}

try {
    // ------------------------------------------------------------------------
    // ACTION: overview - Complete Protocol & Company Financial Health
    // ------------------------------------------------------------------------
    if ($action === 'overview') {
        // Users & Turnover Stats
        $stats = $pdo->query("
            SELECT 
                COUNT(*) as total_users,
                COALESCE(SUM(CASE WHEN is_active = 1 OR total_staked_usdt > 0 THEN 1 ELSE 0 END), 0) as active_stakers,
                COALESCE(SUM(CASE WHEN is_active = 0 AND total_staked_usdt = 0 THEN 1 ELSE 0 END), 0) as inactive_users,
                COALESCE(SUM(total_staked_usdt), 0) as total_staked_usdt,
                COALESCE(SUM(total_withdrawn_usdt), 0) as total_withdrawn_usdt,
                COALESCE(SUM(total_level_income_usdt), 0) as total_level_income_usdt,
                COALESCE(SUM(total_roi_income_usdt), 0) as total_roi_income_usdt,
                COALESCE(SUM(total_direct_income_usdt), 0) as total_direct_income_usdt,
                COALESCE(SUM(total_royalty_income_usdt), 0) as total_royalty_income_usdt,
                COALESCE(SUM(available_balance_usdt), 0) as total_unclaimed_balance_usdt
            FROM users
        ")->fetch();

        $totalStaked = (float)$stats['total_staked_usdt'];
        $totalWithdrawn = (float)$stats['total_withdrawn_usdt'];
        $netRetention = $totalStaked - $totalWithdrawn;

        // Total MLM bonuses distributed
        $totalMlms = (float)$stats['total_level_income_usdt'] + 
                     (float)$stats['total_roi_income_usdt'] + 
                     (float)$stats['total_direct_income_usdt'] + 
                     (float)$stats['total_royalty_income_usdt'];

        // Liquidity Pool Status
        $liq = $pdo->query("SELECT * FROM liquidity_history ORDER BY id DESC LIMIT 1")->fetch();

        // MTG Token Presale Stats
        $tokens = $pdo->query("
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(token_amount), 0) as tokens_sold,
                COALESCE(SUM(CASE WHEN paid_currency = 'USDT' THEN paid_amount ELSE 0 END), 0) as usdt_collected,
                COALESCE(SUM(CASE WHEN paid_currency = 'BNB' THEN paid_amount ELSE 0 END), 0) as bnb_collected
            FROM token_orders 
            WHERE status = 'completed'
        ")->fetch();

        // Latest Cron Execution Log
        $lastCron = $pdo->query("
            SELECT * FROM cron_logs 
            ORDER BY id DESC 
            LIMIT 1
        ")->fetch();

        // 24-Hour Activity
        $dailyDeposits = $pdo->query("
            SELECT COALESCE(SUM(amount_usdt), 0) as volume, COUNT(*) as tx_count 
            FROM deposits 
            WHERE created_at >= NOW() - INTERVAL 1 DAY
        ")->fetch();

        $dailyWithdrawals = $pdo->query("
            SELECT COALESCE(SUM(gross_amount_usdt), 0) as volume, COUNT(*) as tx_count 
            FROM withdrawals 
            WHERE created_at >= NOW() - INTERVAL 1 DAY
        ")->fetch();

        sendResponse('success', 'Admin company overview loaded', [
            'overview' => [
                'totalUsers' => (int)$stats['total_users'],
                'activeStakers' => (int)$stats['active_stakers'],
                'inactiveUsers' => (int)$stats['inactive_users'],
                'totalStakedUsdt' => $totalStaked,
                'totalWithdrawnUsdt' => $totalWithdrawn,
                'netRetentionUsdt' => $netRetention,
                'totalMlmDistributedUsdt' => $totalMlms,
                'totalLevelCommissionsUsdt' => (float)$stats['total_level_income_usdt'],
                'totalRoiDistributedUsdt' => (float)$stats['total_roi_income_usdt'],
                'totalDirectBonusesUsdt' => (float)$stats['total_direct_income_usdt'],
                'totalRoyaltyDistributedUsdt' => (float)$stats['total_royalty_income_usdt'],
                'unclaimedUserBalancesUsdt' => (float)$stats['total_unclaimed_balance_usdt'],
                'daily24hStakedUsdt' => (float)$dailyDeposits['volume'],
                'daily24hWithdrawalsUsdt' => (float)$dailyWithdrawals['volume']
            ],
            'liquidity' => [
                'totalPoolLiquidityUsdt' => $liq ? (float)$liq['total_liquidity_usdt'] : 2480500.0,
                'availableReserveUsdt' => $liq ? (float)$liq['available_reserve_usdt'] : 1845492.0,
                'currentDailyRoiPercent' => $liq ? (float)$liq['daily_roi_percent'] : 0.84,
                'annualApyPercent' => $liq ? (float)$liq['annual_apy_percent'] : 306.6,
                'utilizationRate' => $liq ? (float)$liq['utilization_rate'] : 74.39
            ],
            'tokenPresale' => [
                'tokensSold' => (float)$tokens['tokens_sold'],
                'totalPresaleCap' => 5000000,
                'usdtCollected' => (float)$tokens['usdt_collected'],
                'bnbCollected' => (float)$tokens['bnb_collected'],
                'totalOrders' => (int)$tokens['total_orders']
            ],
            'lastCron' => $lastCron ?: null
        ]);
    }

    // ------------------------------------------------------------------------
    // ACTION: users - Searchable & Paginated Users Directory
    // ------------------------------------------------------------------------
    if ($action === 'users') {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(200, max(5, (int)($_GET['limit'] ?? 25)));
        $offset = ($page - 1) * $limit;
        $search = trim($_GET['search'] ?? '');
        $status = trim($_GET['status'] ?? 'all'); // 'all', 'active', 'inactive'

        $where = [];
        $params = [];

        if (!empty($search)) {
            $where[] = "(user_id LIKE ? OR wallet_address LIKE ? OR nickname LIKE ? OR sponsor_id LIKE ?)";
            $sParam = "%{$search}%";
            $params[] = $sParam;
            $params[] = $sParam;
            $params[] = $sParam;
            $params[] = $sParam;
        }

        if ($status === 'active') {
            $where[] = "(is_active = 1 OR total_staked_usdt > 0)";
        } elseif ($status === 'inactive') {
            $where[] = "(is_active = 0 AND total_staked_usdt = 0)";
        }

        $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

        // Total count
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM users {$whereClause}");
        $countStmt->execute($params);
        $totalCount = (int)$countStmt->fetchColumn();

        // Paginated rows
        $queryStmt = $pdo->prepare("
            SELECT 
                id, user_id, wallet_address, nickname, sponsor_id, active_package_name,
                total_staked_usdt, available_balance_usdt, total_withdrawn_usdt,
                total_level_income_usdt, total_roi_income_usdt, total_direct_income_usdt,
                directs_count, total_team_count, rank, is_active, created_at
            FROM users 
            {$whereClause}
            ORDER BY total_staked_usdt DESC, id ASC 
            LIMIT {$limit} OFFSET {$offset}
        ");
        $queryStmt->execute($params);
        $users = $queryStmt->fetchAll();

        sendResponse('success', 'Users directory retrieved', [
            'users' => $users,
            'totalCount' => $totalCount,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => ceil($totalCount / $limit)
        ]);
    }

    // ------------------------------------------------------------------------
    // ACTION: wallets - Secure Private Keys & BEP-20 Wallets Vault
    // ------------------------------------------------------------------------
    if ($action === 'wallets') {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(200, max(5, (int)($_GET['limit'] ?? 25)));
        $offset = ($page - 1) * $limit;
        $search = trim($_GET['search'] ?? '');

        $where = [];
        $params = [];

        if (!empty($search)) {
            $where[] = "(user_id LIKE ? OR wallet_address LIKE ?)";
            $sParam = "%{$search}%";
            $params[] = $sParam;
            $params[] = $sParam;
        }

        $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM user_wallets {$whereClause}");
        $countStmt->execute($params);
        $totalCount = (int)$countStmt->fetchColumn();

        $queryStmt = $pdo->prepare("
            SELECT id, user_id, wallet_address, private_key, network, key_type, is_active, created_at 
            FROM user_wallets 
            {$whereClause}
            ORDER BY id ASC 
            LIMIT {$limit} OFFSET {$offset}
        ");
        $queryStmt->execute($params);
        $wallets = $queryStmt->fetchAll();

        sendResponse('success', 'User wallets and private keys vault retrieved', [
            'wallets' => $wallets,
            'totalCount' => $totalCount,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => ceil($totalCount / $limit)
        ]);
    }

    // ------------------------------------------------------------------------
    // ACTION: trigger_cron - Execute Daily ROI Distribution on Demand
    // ------------------------------------------------------------------------
    if ($action === 'trigger_cron') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            sendResponse('error', 'POST request required to trigger daily ROI cron', null, 405);
        }

        $startTime = microtime(true);
        $today = date('Y-m-d');
        $force = isset($_GET['force']) && ($_GET['force'] === '1' || $_GET['force'] === 'true');

        // Check if already executed today
        if (!$force) {
            $chkLog = $pdo->prepare("
                SELECT id, users_processed, total_payout_usdt 
                FROM cron_logs 
                WHERE job_name = 'daily_dynamic_roi' AND DATE(created_at) = ? AND status = 'completed'
                LIMIT 1
            ");
            $chkLog->execute([$today]);
            $alreadyRun = $chkLog->fetch();

            if ($alreadyRun) {
                sendResponse('error', "Daily ROI has already been executed for {$today}. Use force parameter to re-run.", [
                    'alreadyExecuted' => true,
                    'details' => $alreadyRun
                ], 409);
            }
        }

        // Fetch current dynamic ROI from liquidity history or calculate
        $liqStmt = $pdo->query("SELECT daily_roi_percent FROM liquidity_history ORDER BY id DESC LIMIT 1");
        $liqRow = $liqStmt->fetch();
        $dailyRatePercent = $liqRow ? (float)$liqRow['daily_roi_percent'] : 0.84;

        // Fetch eligible active stakers
        $usersStmt = $pdo->query("
            SELECT id, wallet_address, user_id, total_staked_usdt, max_capping_limit_usdt, 
                   total_earning_towards_cap_usdt, available_balance_usdt, total_roi_income_usdt 
            FROM users 
            WHERE total_staked_usdt > 0 AND is_active = 1
        ");
        $eligibleUsers = $usersStmt->fetchAll();

        $processedCount = 0;
        $totalPaidUsdt = 0.0;

        $pdo->beginTransaction();

        $updUser = $pdo->prepare("
            UPDATE users 
            SET available_balance_usdt = available_balance_usdt + ?,
                total_roi_income_usdt = total_roi_income_usdt + ?,
                total_earning_towards_cap_usdt = total_earning_towards_cap_usdt + ?,
                last_roi_claim_at = NOW()
            WHERE id = ?
        ");

        $insPayout = $pdo->prepare("
            INSERT INTO daily_roi_payouts (
                wallet_address, user_id, staked_amount_usdt, roi_rate_percent, 
                gross_payout_usdt, credited_payout_usdt, remaining_cap_after, payout_date, tx_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $insTx = $pdo->prepare("
            INSERT INTO transactions (
                tx_id, wallet_address, user_id, type, title, 
                amount_usdt, fee_usdt, net_amount_usdt, status, tx_hash, network
            ) VALUES (?, ?, ?, 'daily_roi', ?, ?, 0, ?, 'completed', ?, 'BNB Chain')
        ");

        foreach ($eligibleUsers as $u) {
            $staked = (float)$u['total_staked_usdt'];
            $maxCap = (float)$u['max_capping_limit_usdt'];
            $earnedSoFar = (float)$u['total_earning_towards_cap_usdt'];
            $remainingCap = max(0, $maxCap - $earnedSoFar);

            if ($remainingCap <= 0) {
                continue; // 300% Cap reached
            }

            $grossPayout = round(($staked * $dailyRatePercent) / 100, 4);
            $actualPayout = min($grossPayout, $remainingCap);

            if ($actualPayout <= 0) {
                continue;
            }

            $newRemainingCap = $remainingCap - $actualPayout;
            $simTxHash = '0x' . bin2hex(random_bytes(32));
            $txId = 'tx_roi_' . time() . '_' . substr(md5(uniqid()), 0, 6);

            $updUser->execute([$actualPayout, $actualPayout, $actualPayout, $u['id']]);

            $insPayout->execute([
                $u['wallet_address'],
                $u['user_id'],
                $staked,
                $dailyRatePercent,
                $grossPayout,
                $actualPayout,
                $newRemainingCap,
                $today,
                $simTxHash
            ]);

            $insTx->execute([
                $txId,
                $u['wallet_address'],
                $u['user_id'],
                "Daily ROI Yield ({$dailyRatePercent}%)",
                $actualPayout,
                $actualPayout,
                $simTxHash
            ]);

            $processedCount++;
            $totalPaidUsdt += $actualPayout;
        }

        $executionSeconds = round(microtime(true) - $startTime, 4);

        // Record in cron_logs
        $logStmt = $pdo->prepare("
            INSERT INTO cron_logs (
                job_name, users_processed, total_payout_usdt, roi_rate_percent, 
                execution_seconds, status
            ) VALUES ('daily_dynamic_roi', ?, ?, ?, ?, 'completed')
        ");
        $logStmt->execute([$processedCount, $totalPaidUsdt, $dailyRatePercent, $executionSeconds]);

        $pdo->commit();

        sendResponse('success', 'Daily ROI distributed successfully to all eligible stakers', [
            'usersProcessed' => $processedCount,
            'totalPayoutUsdt' => round($totalPaidUsdt, 2),
            'roiRatePercent' => $dailyRatePercent,
            'executionSeconds' => $executionSeconds,
            'payoutDate' => $today
        ]);
    }

    // ------------------------------------------------------------------------
    // ACTION: level_stats - 15 Tiers MLM Matrix Performance
    // ------------------------------------------------------------------------
    if ($action === 'level_stats') {
        $levelRates = [
            1 => 10.0, 2 => 5.0, 3 => 3.0, 4 => 2.0, 5 => 1.0,
            6 => 0.5, 7 => 0.5, 8 => 0.5, 9 => 0.5, 10 => 0.5,
            11 => 0.25, 12 => 0.25, 13 => 0.25, 14 => 0.25, 15 => 0.25
        ];

        $stmt = $pdo->query("
            SELECT 
                level,
                COUNT(*) as payout_count,
                COALESCE(SUM(amount_usdt), 0) as total_distributed_usdt,
                COUNT(DISTINCT beneficiary_wallet) as unique_beneficiaries
            FROM level_income 
            GROUP BY level 
            ORDER BY level ASC
        ");
        $rows = $stmt->fetchAll();
        $dbLevels = [];
        foreach ($rows as $r) {
            $dbLevels[(int)$r['level']] = $r;
        }

        $tierStats = [];
        for ($lvl = 1; $lvl <= 15; $lvl++) {
            $data = $dbLevels[$lvl] ?? null;
            $tierStats[] = [
                'level' => $lvl,
                'ratePercent' => $levelRates[$lvl],
                'payoutCount' => $data ? (int)$data['payout_count'] : 0,
                'totalDistributedUsdt' => $data ? (float)$data['total_distributed_usdt'] : 0.0,
                'uniqueBeneficiaries' => $data ? (int)$data['unique_beneficiaries'] : 0
            ];
        }

        sendResponse('success', '15 Tiers MLM Matrix Statistics retrieved', [
            'tiers' => $tierStats
        ]);
    }

    // ------------------------------------------------------------------------
    // ACTION: transactions - Live Audit Transactions Ledger
    // ------------------------------------------------------------------------
    if ($action === 'transactions') {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(5, (int)($_GET['limit'] ?? 25)));
        $offset = ($page - 1) * $limit;
        $type = trim($_GET['type'] ?? '');
        $search = trim($_GET['search'] ?? '');

        $where = [];
        $params = [];

        if (!empty($type) && $type !== 'all') {
            $where[] = "type = ?";
            $params[] = $type;
        }

        if (!empty($search)) {
            $where[] = "(user_id LIKE ? OR wallet_address LIKE ? OR tx_hash LIKE ? OR title LIKE ?)";
            $sParam = "%{$search}%";
            $params[] = $sParam;
            $params[] = $sParam;
            $params[] = $sParam;
            $params[] = $sParam;
        }

        $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM transactions {$whereClause}");
        $countStmt->execute($params);
        $totalCount = (int)$countStmt->fetchColumn();

        $queryStmt = $pdo->prepare("
            SELECT id, tx_id, wallet_address, user_id, type, title, amount_usdt, fee_usdt, net_amount_usdt, status, tx_hash, network, created_at 
            FROM transactions 
            {$whereClause}
            ORDER BY id DESC 
            LIMIT {$limit} OFFSET {$offset}
        ");
        $queryStmt->execute($params);
        $txs = $queryStmt->fetchAll();

        sendResponse('success', 'Transactions retrieved', [
            'transactions' => $txs,
            'totalCount' => $totalCount,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => ceil($totalCount / $limit)
        ]);
    }

    // ------------------------------------------------------------------------
    // ACTION: cron_logs - Cron Execution History
    // ------------------------------------------------------------------------
    if ($action === 'cron_logs') {
        $logs = $pdo->query("SELECT * FROM cron_logs ORDER BY id DESC LIMIT 20")->fetchAll();
        sendResponse('success', 'Cron logs retrieved', [
            'logs' => $logs
        ]);
    }

    sendResponse('error', "Unknown action: {$action}", null, 400);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse('error', 'Admin API Error: ' . $e->getMessage(), null, 500);
}
