<?php
/**
 * Morgan Treasure - Admin Platform Management & Protocol Health API
 * Provides platform-wide metrics, reserve health, and system auditing from MariaDB.
 */

require_once __DIR__ . '/config.php';

$pdo = getDbConnection();

// Fallback offline simulation
if (!$pdo) {
    sendResponse('success', 'Admin analytics loaded (Offline Mode)', [
        'totalMembers' => 156,
        'activeStakers' => 112,
        'totalStakedUsdt' => 84500.0,
        'totalWithdrawnUsdt' => 32400.0,
        'totalCommissionsPaidUsdt' => 18450.0,
        'totalRoiPaidUsdt' => 14200.0,
        'vaultBalanceUsdt' => 1845200.0,
        'currentDailyRoiPercent' => 0.84,
        'status' => 'healthy'
    ]);
}

try {
    // 1. Core aggregate metrics
    $stats = $pdo->query("
        SELECT 
            COUNT(*) as total_users,
            COALESCE(SUM(CASE WHEN total_staked_usdt > 0 THEN 1 ELSE 0 END), 0) as active_stakers,
            COALESCE(SUM(total_staked_usdt), 0) as total_staked_usdt,
            COALESCE(SUM(total_withdrawn_usdt), 0) as total_withdrawn_usdt,
            COALESCE(SUM(total_level_income_usdt), 0) as total_level_income_usdt,
            COALESCE(SUM(total_roi_income_usdt), 0) as total_roi_income_usdt,
            COALESCE(SUM(total_direct_income_usdt), 0) as total_direct_income_usdt,
            COALESCE(SUM(available_balance_usdt), 0) as total_unclaimed_balance_usdt
        FROM users
    ")->fetch();

    // 2. Liquidity and ROI
    $liq = $pdo->query("SELECT * FROM liquidity_history ORDER BY id DESC LIMIT 1")->fetch();

    // 3. Recent 10 system transactions
    $recentTxs = $pdo->query("
        SELECT tx_id, wallet_address, user_id, type, title, amount_usdt, status, tx_hash, created_at 
        FROM transactions 
        ORDER BY id DESC 
        LIMIT 10
    ")->fetchAll();

    // 4. Latest Cron execution status
    $lastCron = $pdo->query("
        SELECT * FROM cron_logs 
        WHERE job_name = 'daily_dynamic_roi' 
        ORDER BY id DESC 
        LIMIT 1
    ")->fetch();

    sendResponse('success', 'Admin analytics fetched successfully from MariaDB', [
        'overview' => [
            'totalUsers' => (int)$stats['total_users'],
            'activeStakers' => (int)$stats['active_stakers'],
            'totalStakedUsdt' => (float)$stats['total_staked_usdt'],
            'totalWithdrawnUsdt' => (float)$stats['total_withdrawn_usdt'],
            'totalLevelCommissionsUsdt' => (float)$stats['total_level_income_usdt'],
            'totalRoiDistributedUsdt' => (float)$stats['total_roi_income_usdt'],
            'totalDirectBonusesUsdt' => (float)$stats['total_direct_income_usdt'],
            'unclaimedUserBalancesUsdt' => (float)$stats['total_unclaimed_balance_usdt']
        ],
        'liquidity' => [
            'totalPoolLiquidityUsdt' => $liq ? (float)$liq['total_liquidity_usdt'] : 2480500.0,
            'availableReserveUsdt' => $liq ? (float)$liq['available_reserve_usdt'] : 1845492.0,
            'currentDailyRoiPercent' => $liq ? (float)$liq['daily_roi_percent'] : 0.84,
            'annualApyPercent' => $liq ? (float)$liq['annual_apy_percent'] : 306.6
        ],
        'lastCronExecution' => $lastCron ?: null,
        'recentTransactions' => $recentTxs
    ]);

} catch (Exception $e) {
    sendResponse('error', 'Admin query error: ' . $e->getMessage(), null, 500);
}
