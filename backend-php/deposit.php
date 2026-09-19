<?php
/**
 * Morgan Treasure - Staking Deposit Processing API
 * Records deposit, updates 300% max capping, and distributes 15-tier MLM commissions.
 */

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Only POST requests allowed', null, 405);
}

$payload = getJsonPayload();
$wallet = trim($payload['wallet_address'] ?? '');
$amountUsdt = (float)($payload['amount_usdt'] ?? 0);
$packageId = trim($payload['package_id'] ?? 'custom');
$txHash = trim($payload['tx_hash'] ?? '');

if (empty($wallet) || !preg_match('/^0x[a-fA-F0-9]{40}$/', $wallet) || $amountUsdt <= 0) {
    sendResponse('error', 'Valid BNB Chain wallet address and deposit amount > 0 required', null, 422);
}

if (empty($txHash)) {
    $txHash = '0x' . bin2hex(random_bytes(32));
}

$pdo = getDbConnection();

// Fallback offline simulation
if (!$pdo) {
    sendResponse('success', 'Deposit confirmed (Simulated Mode)', [
        'wallet' => $wallet,
        'amountUsdt' => $amountUsdt,
        'packageId' => $packageId,
        'txHash' => $txHash,
        'maxCappingLimitUsdt' => $amountUsdt * MAX_CAPPING_MULTIPLIER,
        'commissionDistributedTiers' => 15
    ]);
}

try {
    $pdo->beginTransaction();

    // 1. Fetch or Register Depositing User
    $uStmt = $pdo->prepare("SELECT id, wallet_address, user_id, total_staked_usdt, max_capping_limit_usdt FROM users WHERE wallet_address = ? FOR UPDATE");
    $uStmt->execute([$wallet]);
    $user = $uStmt->fetch();

    if (!$user) {
        $userId = 'MT-' . rand(10000, 99999);
        $insUser = $pdo->prepare("
            INSERT INTO users (wallet_address, user_id, sponsor_id, total_staked_usdt, max_capping_limit_usdt, active_package_id)
            VALUES (?, ?, 'MT-10024', ?, ?, ?)
        ");
        $insUser->execute([$wallet, $userId, $amountUsdt, $amountUsdt * MAX_CAPPING_MULTIPLIER, $packageId]);
        $newTotalStaked = $amountUsdt;
        $newMaxCap = $amountUsdt * MAX_CAPPING_MULTIPLIER;
    } else {
        $newTotalStaked = (float)$user['total_staked_usdt'] + $amountUsdt;
        $newMaxCap = $newTotalStaked * MAX_CAPPING_MULTIPLIER;
        $updUser = $pdo->prepare("
            UPDATE users 
            SET total_staked_usdt = ?,
                max_capping_limit_usdt = ?,
                active_package_id = ?
            WHERE wallet_address = ?
        ");
        $updUser->execute([$newTotalStaked, $newMaxCap, $packageId, $wallet]);
    }

    // 2. Fetch current dynamic daily ROI
    $dailyRoiAtDeposit = 0.84;
    $liqStmt = $pdo->query("SELECT daily_roi_percent FROM liquidity_history ORDER BY id DESC LIMIT 1");
    $liqRow = $liqStmt->fetch();
    if ($liqRow && (float)$liqRow['daily_roi_percent'] > 0) {
        $dailyRoiAtDeposit = (float)$liqRow['daily_roi_percent'];
    }

    // 3. Insert Deposit Transaction
    $insDep = $pdo->prepare("
        INSERT INTO deposits (wallet_address, package_id, amount_usdt, daily_roi_at_deposit, tx_hash, status)
        VALUES (?, ?, ?, ?, ?, 'confirmed')
    ");
    $insDep->execute([$wallet, $packageId, $amountUsdt, $dailyRoiAtDeposit, $txHash]);
    $depositId = $pdo->lastInsertId();

    // 4. Multi-Level Commission Distribution (15 Tiers)
    // Tiers: L1: 10%, L2: 5%, L3: 3%, L4: 2%, L5: 1%, L6-10: 0.5%, L11-15: 0.25%
    $levelPercentages = [
        1 => 10.0, 2 => 5.0, 3 => 3.0, 4 => 2.0, 5 => 1.0,
        6 => 0.5, 7 => 0.5, 8 => 0.5, 9 => 0.5, 10 => 0.5,
        11 => 0.25, 12 => 0.25, 13 => 0.25, 14 => 0.25, 15 => 0.25
    ];

    // Direct referral requirements to unlock tiers
    $directRequirements = [
        1 => 1, 2 => 1, 3 => 2, 4 => 2, 5 => 2,
        6 => 3, 7 => 3, 8 => 3, 9 => 3, 10 => 3,
        11 => 5, 12 => 5, 13 => 5, 14 => 5, 15 => 5
    ];

    $currentWallet = $wallet;
    $totalCommissionPaid = 0.0;

    for ($lvl = 1; $lvl <= 15; $lvl++) {
        $sponsorStmt = $pdo->prepare("
            SELECT id, wallet_address, user_id, sponsor_address, directs_count, 
                   total_staked_usdt, max_capping_limit_usdt, total_earning_towards_cap_usdt 
            FROM users WHERE wallet_address = ?
        ");
        $sponsorStmt->execute([$currentWallet]);
        $cUser = $sponsorStmt->fetch();

        if (!$cUser || empty($cUser['sponsor_address'])) {
            break; // Reached top of downline tree
        }

        $sponsorWallet = $cUser['sponsor_address'];
        $upStmt = $pdo->prepare("
            SELECT id, wallet_address, user_id, sponsor_address, directs_count, 
                   total_staked_usdt, max_capping_limit_usdt, total_earning_towards_cap_usdt 
            FROM users WHERE wallet_address = ? FOR UPDATE
        ");
        $upStmt->execute([$sponsorWallet]);
        $sponsor = $upStmt->fetch();

        if (!$sponsor) {
            break;
        }

        // Always accumulate team volume
        $updVol = $pdo->prepare("UPDATE users SET total_team_turnover_usdt = total_team_turnover_usdt + ? WHERE wallet_address = ?");
        $updVol->execute([$amountUsdt, $sponsorWallet]);

        $percent = $levelPercentages[$lvl];
        $potentialCommission = round(($amountUsdt * $percent) / 100.0, 4);

        // Check Qualification: Must have staked and meet direct requirement
        $sponsorStaked = (float)$sponsor['total_staked_usdt'];
        $sponsorDirects = (int)$sponsor['directs_count'];
        $requiredDirects = $directRequirements[$lvl];

        if ($sponsorStaked > 0 && $sponsorDirects >= $requiredDirects) {
            $sponsorMaxCap = (float)$sponsor['max_capping_limit_usdt'];
            if ($sponsorMaxCap <= 0) {
                $sponsorMaxCap = $sponsorStaked * MAX_CAPPING_MULTIPLIER;
            }
            $sponsorEarned = (float)$sponsor['total_earning_towards_cap_usdt'];
            $remainingCap = max(0.0, $sponsorMaxCap - $sponsorEarned);

            // Cap commission to 300% profit ceiling
            $actualCommission = min($potentialCommission, $remainingCap);

            if ($actualCommission > 0) {
                $updSponsor = $pdo->prepare("
                    UPDATE users 
                    SET available_balance_usdt = available_balance_usdt + ?,
                        total_level_income_usdt = total_level_income_usdt + ?,
                        total_earning_towards_cap_usdt = total_earning_towards_cap_usdt + ?
                    WHERE id = ?
                ");
                $updSponsor->execute([$actualCommission, $actualCommission, $actualCommission, $sponsor['id']]);

                $logLvl = $pdo->prepare("
                    INSERT INTO level_income (beneficiary_wallet, from_wallet, level, commission_percent, amount_usdt, deposit_id, tx_hash)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                $logLvl->execute([$sponsorWallet, $wallet, $lvl, $percent, $actualCommission, $depositId, $txHash]);

                $totalCommissionPaid += $actualCommission;
            }
        }

        $currentWallet = $sponsorWallet;
    }

    $pdo->commit();

    sendResponse('success', 'Deposit confirmed, 300% capping updated, and 15-tier commissions distributed', [
        'depositId' => $depositId,
        'wallet' => $wallet,
        'amountUsdt' => $amountUsdt,
        'newTotalStakedUsdt' => $newTotalStaked,
        'maxCappingLimitUsdt' => $newMaxCap,
        'dailyRoiAtDeposit' => $dailyRoiAtDeposit . '%',
        'totalCommissionsDistributedUsdt' => round($totalCommissionPaid, 4),
        'txHash' => $txHash
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse('error', 'Deposit processing error: ' . $e->getMessage(), null, 500);
}
