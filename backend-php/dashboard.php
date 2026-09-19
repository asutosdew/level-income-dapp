<?php
require_once __DIR__ . '/config.php';

$address = trim($_GET['address'] ?? '');

if (empty($address) || !preg_match('/^0x[a-fA-F0-9]{40}$/', $address)) {
    sendResponse('error', 'Valid BNB Chain (BEP-20) address parameter required', null, 422);
}

$pdo = getDbConnection();

if (!$pdo) {
    // Fallback simulated response
    sendResponse('success', 'User profile retrieved (Simulated)', [
        'address' => $address,
        'userId' => 'MT-77291',
        'sponsorId' => 'MT-10024',
        'sponsorAddress' => '0x9b32fa99834190cbbde029104fa2841b994801ac',
        'referralCode' => 'MT77291',
        'activePackageId' => 'gold_500',
        'activePackageName' => 'Morgan Gold ($500)',
        'totalStakedUsdt' => 500,
        'availableBalanceUsdt' => 218.40,
        'totalWithdrawnUsdt' => 320.00,
        'totalLevelIncomeUsdt' => 520.40,
        'totalDirectIncomeUsdt' => 250.00,
        'totalRoiIncomeUsdt' => 184.80,
        'totalRoyaltyIncomeUsdt' => 95.00,
        'rank' => 'Gold Treasure Leader',
        'directsCount' => 9,
        'activeDirectsCount' => 7,
        'totalTeamCount' => 156,
        'totalTeamTurnoverUsdt' => 24500,
        'strongLegVolumeUsdt' => 14800,
        'otherLegsVolumeUsdt' => 9700,
        'maxCappingLimitUsdt' => 1500,
        'totalEarningTowardsCapUsdt' => 1050.20,
        'isRegistered' => true
    ]);
}

try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE wallet_address = ?");
    $stmt->execute([$address]);
    $user = $stmt->fetch();

    if (!$user) {
        // Auto register if not existing
        $userId = 'MT-' . rand(10000, 99999);
        $insert = $pdo->prepare("INSERT INTO users (wallet_address, user_id, sponsor_id) VALUES (?, ?, 'MT-10024')");
        $insert->execute([$address, $userId]);
        
        $stmt->execute([$address]);
        $user = $stmt->fetch();
    }

    sendResponse('success', 'User profile loaded', [
        'address' => $user['wallet_address'],
        'userId' => $user['user_id'],
        'sponsorId' => $user['sponsor_id'],
        'sponsorAddress' => $user['sponsor_address'] ?? '0x9b32fa99834190cbbde029104fa2841b994801ac',
        'referralCode' => str_replace('-', '', $user['user_id']),
        'activePackageId' => $user['active_package_id'],
        'activePackageName' => $user['active_package_name'],
        'totalStakedUsdt' => (float)$user['total_staked_usdt'],
        'availableBalanceUsdt' => (float)$user['available_balance_usdt'],
        'totalWithdrawnUsdt' => (float)$user['total_withdrawn_usdt'],
        'totalLevelIncomeUsdt' => (float)$user['total_level_income_usdt'],
        'totalDirectIncomeUsdt' => (float)$user['total_direct_income_usdt'],
        'totalRoiIncomeUsdt' => (float)$user['total_roi_income_usdt'],
        'totalRoyaltyIncomeUsdt' => (float)$user['total_royalty_income_usdt'],
        'rank' => $user['rank'],
        'directsCount' => (int)$user['directs_count'],
        'activeDirectsCount' => (int)$user['active_directs_count'],
        'totalTeamCount' => (int)$user['total_team_count'],
        'totalTeamTurnoverUsdt' => (float)$user['total_team_turnover_usdt'],
        'strongLegVolumeUsdt' => (float)$user['total_team_turnover_usdt'] * 0.6,
        'otherLegsVolumeUsdt' => (float)$user['total_team_turnover_usdt'] * 0.4,
        'maxCappingLimitUsdt' => (float)$user['max_capping_limit_usdt'],
        'totalEarningTowardsCapUsdt' => (float)$user['total_earning_towards_cap_usdt'],
        'isRegistered' => true
    ]);

} catch (Exception $e) {
    sendResponse('error', 'Query error: ' . $e->getMessage(), null, 500);
}
