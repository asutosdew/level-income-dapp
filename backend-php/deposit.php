<?php
/**
 * Morgan Treasure - Staking Deposit Processing API
 * Hybrid Web3 Backend: Records BEP-20 USDT deposit, updates 300% max capping, 
 * distributes 15-tier MLM commissions, and logs unified ledger transactions in MariaDB.
 */

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Only POST requests allowed', null, 405);
}

$payload = getJsonPayload();
$wallet = strtolower(trim($payload['wallet_address'] ?? ''));
$amountUsdt = (float)($payload['amount_usdt'] ?? 0);
$packageId = trim($payload['package_id'] ?? 'starter_50');
$txHash = trim($payload['tx_hash'] ?? '');

if (empty($wallet) || !preg_match('/^0x[a-f0-9]{40}$/', $wallet)) {
    sendResponse('error', 'Valid BNB Chain wallet address is required', null, 422);
}

if ($amountUsdt < MIN_DEPOSIT_USDT) {
    sendResponse('error', 'Minimum stake amount is $' . MIN_DEPOSIT_USDT . ' USDT', null, 422);
}

if (empty($txHash) || !preg_match('/^0x[a-fA-F0-9]{64}$/', $txHash)) {
    sendResponse('error', 'A valid on-chain blockchain transaction hash (64 hex characters) is required to stake.', null, 422);
}

$pdo = getDbConnection();

if (!$pdo) {
    sendResponse('error', 'Database service temporarily unavailable. Please retry shortly.', null, 503);
}

// 0. Replay Protection: Ensure transaction hash has never been credited before
$chkTx = $pdo->prepare("SELECT id FROM deposits WHERE tx_hash = ? UNION SELECT id FROM transactions WHERE tx_hash = ?");
$chkTx->execute([$txHash, $txHash]);
if ($chkTx->fetch()) {
    sendResponse('error', 'This blockchain transaction has already been processed and credited.', null, 409);
}

// Optional On-chain verification: check if transaction was reverted on BSC
$bscCheck = verifyBscTransactionReceipt($txHash);
if (!$bscCheck['valid'] && $bscCheck['error'] === 'Transaction reverted on BNB Chain') {
    sendResponse('error', 'This transaction was reverted/failed on BNB Chain. Staking deposit cannot be credited.', null, 400);
}

try {
    $pdo->beginTransaction();

    // 1. Fetch Depositing User (Must already be registered via Sponsor ID!)
    $uStmt = $pdo->prepare("
        SELECT id, wallet_address, user_id, sponsor_id, sponsor_address, 
               total_staked_usdt, max_capping_limit_usdt, is_active, is_registered 
        FROM users 
        WHERE wallet_address = ? 
        FOR UPDATE
    ");
    $uStmt->execute([$wallet]);
    $user = $uStmt->fetch();

    if (!$user || (int)($user['is_registered'] ?? 0) !== 1) {
        $pdo->rollBack();
        sendResponse('error', 'Wallet not registered in protocol. Please complete registration with a sponsor ID first before staking.', null, 403);
    }

    $wasActive = (int)$user['is_active'];
    $isFirstDeposit = ($wasActive === 0 && (float)$user['total_staked_usdt'] == 0);
    $newTotalStaked = (float)$user['total_staked_usdt'] + $amountUsdt;
    $newMaxCap = $newTotalStaked * MAX_CAPPING_MULTIPLIER;

    $updUser = $pdo->prepare("
        UPDATE users 
        SET total_staked_usdt = ?,
            max_capping_limit_usdt = ?,
            active_package_id = ?,
            is_active = 1
        WHERE id = ?
    ");
    $updUser->execute([$newTotalStaked, $newMaxCap, $packageId, $user['id']]);

    // If first active deposit, update direct sponsor active_directs_count
    if ($isFirstDeposit && !empty($user['sponsor_id'])) {
        $updActiveDir = $pdo->prepare("UPDATE users SET active_directs_count = active_directs_count + 1 WHERE user_id = ?");
        $updActiveDir->execute([$user['sponsor_id']]);
    }

    // 2. Fetch Package Details (if existing in packages table)
    $packageName = 'Staking Deposit ($' . number_format($amountUsdt, 2) . ')';
    $pkgStmt = $pdo->prepare("SELECT name FROM packages WHERE package_id = ?");
    $pkgStmt->execute([$packageId]);
    $pkgRow = $pkgStmt->fetch();
    if ($pkgRow) {
        $packageName = $pkgRow['name'];
        $pdo->prepare("UPDATE users SET active_package_name = ? WHERE id = ?")->execute([$packageName, $user['id']]);
    }

    // 3. Fetch current dynamic daily ROI from liquidity pool history
    $dailyRoiAtDeposit = 0.84;
    $liqStmt = $pdo->query("SELECT daily_roi_percent FROM liquidity_history ORDER BY id DESC LIMIT 1");
    $liqRow = $liqStmt->fetch();
    if ($liqRow && (float)$liqRow['daily_roi_percent'] > 0) {
        $dailyRoiAtDeposit = (float)$liqRow['daily_roi_percent'];
    }

    // 4. Insert Staking Deposit Transaction
    $insDep = $pdo->prepare("
        INSERT INTO deposits (wallet_address, user_id, package_id, package_name, amount_usdt, daily_roi_at_deposit, tx_hash, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')
    ");
    $insDep->execute([$wallet, $user['user_id'], $packageId, $packageName, $amountUsdt, $dailyRoiAtDeposit, $txHash]);
    $depositId = $pdo->lastInsertId();

    // 5. Log in Unified Master Transactions Table
    logTransaction(
        $pdo,
        $wallet,
        $user['user_id'],
        'deposit',
        "Staked in Morgan Treasure ({$packageName})",
        $amountUsdt,
        0.0000,
        $amountUsdt,
        'completed',
        $txHash,
        'BNB Chain',
        ['package_id' => $packageId, 'deposit_id' => $depositId, 'roi_rate' => $dailyRoiAtDeposit]
    );

    // 6. Multi-Level Commission Distribution (15 Tiers)
    $totalCommissionPaid = 0.0;
    $currentWallet = $wallet;

    for ($lvl = 1; $lvl <= 15; $lvl++) {
        // Find upline sponsor
        $sponsorStmt = $pdo->prepare("SELECT sponsor_address, sponsor_id FROM users WHERE wallet_address = ?");
        $sponsorStmt->execute([$currentWallet]);
        $cUser = $sponsorStmt->fetch();

        if (!$cUser || empty($cUser['sponsor_address'])) {
            break; // Reached top root genesis of the genealogy tree
        }

        $sponsorWallet = strtolower($cUser['sponsor_address']);

        // Lock sponsor record for financial balance update
        $upStmt = $pdo->prepare("
            SELECT id, wallet_address, user_id, total_staked_usdt, available_balance_usdt, 
                   active_directs_count, directs_count, total_team_turnover_usdt, 
                   max_capping_limit_usdt, total_earning_towards_cap_usdt 
            FROM users 
            WHERE wallet_address = ? 
            FOR UPDATE
        ");
        $upStmt->execute([$sponsorWallet]);
        $sponsor = $upStmt->fetch();

        if (!$sponsor) {
            break;
        }

        // Accumulate team turnover for sponsor
        $newTeamTurnover = (float)$sponsor['total_team_turnover_usdt'] + $amountUsdt;
        $updVol = $pdo->prepare("UPDATE users SET total_team_turnover_usdt = ? WHERE id = ?");
        $updVol->execute([$newTeamTurnover, $sponsor['id']]);

        // Evaluate level eligibility
        $percent = LEVEL_COMMISSION_RATES[$lvl] ?? 0.0;
        $requiredDirects = LEVEL_DIRECT_REQUIREMENTS[$lvl] ?? $lvl;
        $sponsorStaked = (float)$sponsor['total_staked_usdt'];
        $sponsorActiveDirects = (int)$sponsor['active_directs_count'];
        $sponsorTotalDirects = (int)$sponsor['directs_count'];
        $effectiveDirects = max($sponsorActiveDirects, $sponsorTotalDirects);

        $potentialCommission = round(($amountUsdt * $percent) / 100.0, 4);

        // Sponsor is eligible if staked > 0 and meets direct referral requirement
        if ($sponsorStaked > 0 && $effectiveDirects >= $requiredDirects && $potentialCommission > 0) {
            $sponsorMaxCap = (float)$sponsor['max_capping_limit_usdt'];
            if ($sponsorMaxCap <= 0) {
                $sponsorMaxCap = $sponsorStaked * MAX_CAPPING_MULTIPLIER;
            }
            $sponsorEarned = (float)$sponsor['total_earning_towards_cap_usdt'];
            $remainingCap = max(0.0, $sponsorMaxCap - $sponsorEarned);

            // Enforce hard 300% profit ceiling
            $actualCommission = min($potentialCommission, $remainingCap);

            if ($actualCommission > 0) {
                // If level 1, also credit total_direct_income_usdt
                if ($lvl === 1) {
                    $updSponsor = $pdo->prepare("
                        UPDATE users 
                        SET available_balance_usdt = available_balance_usdt + ?,
                            total_level_income_usdt = total_level_income_usdt + ?,
                            total_direct_income_usdt = total_direct_income_usdt + ?,
                            total_earning_towards_cap_usdt = total_earning_towards_cap_usdt + ?
                        WHERE id = ?
                    ");
                    $updSponsor->execute([$actualCommission, $actualCommission, $actualCommission, $actualCommission, $sponsor['id']]);
                } else {
                    $updSponsor = $pdo->prepare("
                        UPDATE users 
                        SET available_balance_usdt = available_balance_usdt + ?,
                            total_level_income_usdt = total_level_income_usdt + ?,
                            total_earning_towards_cap_usdt = total_earning_towards_cap_usdt + ?
                        WHERE id = ?
                    ");
                    $updSponsor->execute([$actualCommission, $actualCommission, $actualCommission, $sponsor['id']]);
                }

                // Log into level_income table
                $logLvl = $pdo->prepare("
                    INSERT INTO level_income (
                        beneficiary_wallet, beneficiary_user_id, from_wallet, from_user_id, 
                        level, commission_percent, amount_usdt, deposit_id, tx_hash, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'credited')
                ");
                $logLvl->execute([
                    $sponsorWallet,
                    $sponsor['user_id'],
                    $wallet,
                    $user['user_id'],
                    $lvl,
                    $percent,
                    $actualCommission,
                    $depositId,
                    $txHash
                ]);

                // Log into master transactions table for the beneficiary
                $txTitle = ($lvl === 1) 
                    ? "Direct Referral Bonus ({$user['user_id']})" 
                    : "Level {$lvl} Commission ({$user['user_id']})";
                
                logTransaction(
                    $pdo,
                    $sponsorWallet,
                    $sponsor['user_id'],
                    ($lvl === 1 ? 'direct_bonus' : 'level_income'),
                    $txTitle,
                    $actualCommission,
                    0.0000,
                    $actualCommission,
                    'completed',
                    $txHash,
                    'BNB Chain',
                    ['level' => $lvl, 'from_user' => $user['user_id'], 'deposit_amount' => $amountUsdt]
                );

                $totalCommissionPaid += $actualCommission;
            } else {
                // User capped out! Record as capped_loss for audit
                $logLvl = $pdo->prepare("
                    INSERT INTO level_income (
                        beneficiary_wallet, beneficiary_user_id, from_wallet, from_user_id, 
                        level, commission_percent, amount_usdt, deposit_id, tx_hash, status
                    ) VALUES (?, ?, ?, ?, ?, ?, 0.0000, ?, ?, 'capped_loss')
                ");
                $logLvl->execute([
                    $sponsorWallet,
                    $sponsor['user_id'],
                    $wallet,
                    $user['user_id'],
                    $lvl,
                    $percent,
                    $depositId,
                    $txHash
                ]);
            }
        }

        // Dynamically update sponsor's rank
        $updatedRank = calculateUserRank($sponsorStaked, $effectiveDirects, $newTeamTurnover);
        $pdo->prepare("UPDATE users SET rank = ? WHERE id = ?")->execute([$updatedRank, $sponsor['id']]);

        $currentWallet = $sponsorWallet;
    }

    $pdo->commit();

    sendResponse('success', 'Deposit confirmed, 300% capping updated, and 15-tier commissions distributed in MariaDB', [
        'depositId' => $depositId,
        'wallet' => $wallet,
        'userId' => $user['user_id'],
        'amountUsdt' => $amountUsdt,
        'newTotalStakedUsdt' => $newTotalStaked,
        'maxCappingLimitUsdt' => $newMaxCap,
        'dailyRoiAtDeposit' => $dailyRoiAtDeposit . '%',
        'totalCommissionsDistributedUsdt' => round($totalCommissionPaid, 4),
        'txHash' => $txHash,
        'status' => 'confirmed'
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse('error', 'Deposit processing error: ' . $e->getMessage(), null, 500);
}
