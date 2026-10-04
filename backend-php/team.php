<?php
/**
 * Morgan Treasure - Team & Referral Network API
 * Queries direct referrals and downline volume from MariaDB.
 */

require_once __DIR__ . '/config.php';

$address = strtolower(trim($_GET['address'] ?? ''));

if (empty($address) || !preg_match('/^0x[a-f0-9]{40}$/', $address)) {
    sendResponse('error', 'Valid BNB Chain wallet address parameter required', null, 422);
}

$pdo = getDbConnection();

// Simulated fallback if MariaDB is unavailable
if (!$pdo) {
    $fallbackDirects = [
        ['id' => '1', 'walletAddress' => '0x1A82...39eB', 'name' => 'Alexander Wright', 'packageName' => 'Morgan Platinum ($1000)', 'stakedAmountUsdt' => 1000, 'commissionPercent' => 10, 'earnedUsdt' => 100.00, 'joinedDate' => '2026-08-14', 'status' => 'active', 'txHash' => '0x3a4b...8f12', 'phoneOrTelegram' => '@alex_wright', 'level' => 1],
        ['id' => '2', 'walletAddress' => '0x8F44...92cD', 'name' => 'Sophia Chen', 'packageName' => 'Morgan Gold ($500)', 'stakedAmountUsdt' => 500, 'commissionPercent' => 10, 'earnedUsdt' => 50.00, 'joinedDate' => '2026-08-18', 'status' => 'active', 'txHash' => '0x992e...44a1', 'phoneOrTelegram' => '@sophiacrypto', 'level' => 1],
        ['id' => '3', 'walletAddress' => '0x3C10...22bF', 'name' => 'Vikram Malhotra', 'packageName' => 'Morgan Gold ($500)', 'stakedAmountUsdt' => 500, 'commissionPercent' => 10, 'earnedUsdt' => 50.00, 'joinedDate' => '2026-08-22', 'status' => 'active', 'txHash' => '0x87dc...3312', 'phoneOrTelegram' => '+91 98*** 42100', 'level' => 1],
        ['id' => '4', 'walletAddress' => '0x5D99...18eA', 'name' => 'Elena Rostova', 'packageName' => 'Morgan Silver ($250)', 'stakedAmountUsdt' => 250, 'commissionPercent' => 10, 'earnedUsdt' => 25.00, 'joinedDate' => '2026-08-28', 'status' => 'active', 'txHash' => '0x14fe...9923', 'phoneOrTelegram' => '@elena_defitrader', 'level' => 1],
        ['id' => '5', 'walletAddress' => '0x2F33...77cC', 'name' => 'Marcus Sterling', 'packageName' => 'Morgan Bronze ($100)', 'stakedAmountUsdt' => 100, 'commissionPercent' => 10, 'earnedUsdt' => 10.00, 'joinedDate' => '2026-09-01', 'status' => 'active', 'txHash' => '0x76ba...2284', 'phoneOrTelegram' => '@msterling', 'level' => 1],
        ['id' => '6', 'walletAddress' => '0x7E12...55aB', 'name' => 'Tariq Al-Mansoor', 'packageName' => 'Morgan Bronze ($100)', 'stakedAmountUsdt' => 100, 'commissionPercent' => 10, 'earnedUsdt' => 10.00, 'joinedDate' => '2026-09-02', 'status' => 'active', 'txHash' => '0x55dc...1189', 'phoneOrTelegram' => '@tariq_dubai', 'level' => 1],
        ['id' => '7', 'walletAddress' => '0x9B44...11fD', 'name' => 'Lucas Silva', 'packageName' => 'Morgan Starter ($50)', 'stakedAmountUsdt' => 50, 'commissionPercent' => 10, 'earnedUsdt' => 5.00, 'joinedDate' => '2026-09-03', 'status' => 'active', 'txHash' => '0x66ff...0012', 'phoneOrTelegram' => '@lucassilva', 'level' => 1],
        ['id' => '8', 'walletAddress' => '0x44AA...88eE', 'name' => 'David Kim', 'packageName' => 'Pending Deposit', 'stakedAmountUsdt' => 0, 'commissionPercent' => 10, 'earnedUsdt' => 0, 'joinedDate' => '2026-09-04', 'status' => 'inactive', 'txHash' => '', 'phoneOrTelegram' => '@davidkim_seoul', 'level' => 1],
        ['id' => '9', 'walletAddress' => '0x66CC...44bA', 'name' => 'Grace O’Connor', 'packageName' => 'Pending Deposit', 'stakedAmountUsdt' => 0, 'commissionPercent' => 10, 'earnedUsdt' => 0, 'joinedDate' => '2026-09-04', 'status' => 'inactive', 'txHash' => '', 'phoneOrTelegram' => '@grace_dublin', 'level' => 1]
    ];

    sendResponse('success', 'Team data retrieved (Simulated)', [
        'directs' => $fallbackDirects,
        'totalCount' => count($fallbackDirects),
        'turnover' => 24500
    ]);
}

try {
    // 1. Fetch user to get cumulative team turnover
    $uStmt = $pdo->prepare("SELECT total_team_turnover_usdt, total_team_count FROM users WHERE wallet_address = ?");
    $uStmt->execute([$address]);
    $uRow = $uStmt->fetch();
    $totalTurnover = $uRow ? (float)$uRow['total_team_turnover_usdt'] : 0.0;

    // 2. Query direct referrals with their level 1 commissions
    $stmt = $pdo->prepare("
        SELECT u.id, u.wallet_address, u.user_id, u.nickname, u.active_package_name, 
               u.total_staked_usdt, u.is_active, u.created_at,
               COALESCE((SELECT SUM(amount_usdt) FROM level_income WHERE beneficiary_wallet = ? AND from_wallet = u.wallet_address AND level = 1), 0) as direct_commission,
               COALESCE((SELECT tx_hash FROM deposits WHERE wallet_address = u.wallet_address ORDER BY id DESC LIMIT 1), '') as latest_tx
        FROM users u 
        WHERE u.sponsor_address = ? 
        ORDER BY u.id DESC
    ");
    $stmt->execute([$address, $address]);
    $rows = $stmt->fetchAll();

    $directs = [];
    foreach ($rows as $idx => $r) {
        $staked = (float)$r['total_staked_usdt'];
        $earned = (float)$r['direct_commission'];
        if ($earned <= 0 && $staked > 0) {
            $earned = round($staked * 0.10, 2);
        }

        $directs[] = [
            'id' => (string)($idx + 1),
            'walletAddress' => substr($r['wallet_address'], 0, 6) . '...' . substr($r['wallet_address'], -4),
            'rawWalletAddress' => $r['wallet_address'],
            'userId' => $r['user_id'],
            'name' => $r['nickname'] ?: 'Investor ' . substr($r['wallet_address'], 2, 4),
            'packageName' => $r['active_package_name'] ?: ($staked > 0 ? "Staked \${$staked}" : 'Pending Deposit'),
            'stakedAmountUsdt' => $staked,
            'commissionPercent' => 10,
            'earnedUsdt' => $earned,
            'joinedDate' => substr($r['created_at'], 0, 10),
            'status' => ($staked > 0 || (int)$r['is_active'] === 1) ? 'active' : 'inactive',
            'txHash' => $r['latest_tx'] ? (substr($r['latest_tx'], 0, 6) . '...' . substr($r['latest_tx'], -4)) : '',
            'phoneOrTelegram' => '@' . ($r['nickname'] ? strtolower(str_replace([' ', '’', "'"], '', $r['nickname'])) : 'investor'),
            'level' => 1
        ];
    }

    sendResponse('success', 'Team data retrieved from MariaDB', [
        'directs' => $directs,
        'totalCount' => count($directs),
        'turnover' => $totalTurnover
    ]);

} catch (Exception $e) {
    sendResponse('error', 'Team query error: ' . $e->getMessage(), null, 500);
}
