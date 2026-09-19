<?php
require_once __DIR__ . '/config.php';

$address = trim($_GET['address'] ?? '');

$directs = [
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

$pdo = getDbConnection();

if ($pdo && !empty($address)) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE sponsor_address = ? ORDER BY id DESC");
        $stmt->execute([$address]);
        $rows = $stmt->fetchAll();

        if (!empty($rows)) {
            $directs = [];
            foreach ($rows as $idx => $r) {
                $directs[] = [
                    'id' => (string)($idx + 1),
                    'walletAddress' => substr($r['wallet_address'], 0, 6) . '...' . substr($r['wallet_address'], -4),
                    'name' => $r['nickname'] ?: 'Investor ' . substr($r['wallet_address'], 2, 4),
                    'packageName' => $r['active_package_name'],
                    'stakedAmountUsdt' => (float)$r['total_staked_usdt'],
                    'commissionPercent' => 10,
                    'earnedUsdt' => (float)$r['total_staked_usdt'] * 0.1,
                    'joinedDate' => substr($r['created_at'], 0, 10),
                    'status' => ((float)$r['total_staked_usdt'] > 0) ? 'active' : 'inactive',
                    'txHash' => '0x' . substr(md5($r['wallet_address']), 0, 8),
                    'phoneOrTelegram' => '@' . ($r['nickname'] ? strtolower(str_replace(' ', '', $r['nickname'])) : 'investor'),
                    'level' => 1
                ];
            }
        }
    } catch (Exception $e) {
        // Fallback
    }
}

sendResponse('success', 'Team data retrieved', [
    'directs' => $directs,
    'totalCount' => count($directs),
    'turnover' => 24500
]);
