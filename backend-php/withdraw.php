<?php
/**
 * Morgan Treasure - Withdrawal Processing API
 * Deducts 5% Liquidity Retention Fee (retained in vault reserve) and updates user balance in MariaDB.
 */

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Only POST requests allowed', null, 405);
}

$payload = getJsonPayload();
$wallet = strtolower(trim($payload['wallet_address'] ?? ''));
$amountUsdt = (float)($payload['amount_usdt'] ?? 0);
$txHash = trim($payload['tx_hash'] ?? '');

// Validation
if (empty($wallet) || !preg_match('/^0x[a-f0-9]{40}$/', $wallet)) {
    sendResponse('error', 'Valid BNB Chain (BEP-20) wallet address is required', null, 422);
}

if ($amountUsdt < MIN_WITHDRAWAL_USDT) {
    sendResponse('error', 'Minimum withdrawal amount is $' . number_format(MIN_WITHDRAWAL_USDT, 2) . ' USDT', null, 422);
}

$pdo = getDbConnection();

// Fallback offline simulation
if (!$pdo) {
    $fee = round($amountUsdt * (WITHDRAWAL_FEE_PERCENT / 100.0), 4);
    $netPayout = round($amountUsdt - $fee, 4);

    sendResponse('success', 'Withdrawal processed successfully (Offline Simulation)', [
        'walletAddress' => $wallet,
        'grossAmountUsdt' => $amountUsdt,
        'feePercent' => WITHDRAWAL_FEE_PERCENT . '%',
        'liquidityFeeUsdt' => $fee,
        'netPayoutUsdt' => $netPayout,
        'txHash' => $txHash ?: '0x' . bin2hex(random_bytes(32)),
        'status' => 'confirmed'
    ]);
}

try {
    $pdo->beginTransaction();

    // 1. Fetch User Record with Row Lock
    $userStmt = $pdo->prepare("
        SELECT id, wallet_address, user_id, available_balance_usdt, total_withdrawn_usdt 
        FROM users 
        WHERE wallet_address = ? 
        FOR UPDATE
    ");
    $userStmt->execute([$wallet]);
    $user = $userStmt->fetch();

    if (!$user) {
        $pdo->rollBack();
        sendResponse('error', 'User wallet not registered in Morgan Treasure', null, 404);
    }

    $availableBalance = (float)$user['available_balance_usdt'];

    if ($amountUsdt > $availableBalance) {
        $pdo->rollBack();
        sendResponse('error', "Insufficient available balance. Available: {$availableBalance} USDT, Requested: {$amountUsdt} USDT", [
            'availableBalanceUsdt' => $availableBalance,
            'requestedAmountUsdt' => $amountUsdt
        ], 400);
    }

    // 2. Calculate 5% Liquidity Retention Fee (2.5% Admin + 2.5% Royalty) & 95% Net Payout
    $fee = round($amountUsdt * (WITHDRAWAL_FEE_PERCENT / 100.0), 4);
    $netPayout = round($amountUsdt - $fee, 4);

    if (empty($txHash)) {
        $txHash = '0x' . bin2hex(random_bytes(32)); // Record unique transaction identifier
    }

    // 3. Deduct from Available Balance & Increase Total Withdrawn
    $newBalance = round($availableBalance - $amountUsdt, 4);
    $newTotalWithdrawn = round((float)$user['total_withdrawn_usdt'] + $netPayout, 4);

    $updUser = $pdo->prepare("
        UPDATE users 
        SET available_balance_usdt = ?,
            total_withdrawn_usdt = ?
        WHERE id = ?
    ");
    $updUser->execute([$newBalance, $newTotalWithdrawn, $user['id']]);

    // 4. Record Withdrawal Transaction in withdrawals table
    $insTx = $pdo->prepare("
        INSERT INTO withdrawals (
            wallet_address, user_id, gross_amount_usdt, fee_amount_usdt, 
            net_payout_usdt, tx_hash, status, payment_method
        ) VALUES (?, ?, ?, ?, ?, ?, 'confirmed', 'BEP20_USDT')
    ");
    $insTx->execute([
        $wallet,
        $user['user_id'],
        $amountUsdt,
        $fee,
        $netPayout,
        $txHash
    ]);
    $withdrawalId = $pdo->lastInsertId();

    // 5. Log into Master Transactions Table
    $shortAddr = substr($wallet, 0, 6) . '...' . substr($wallet, -4);
    logTransaction(
        $pdo,
        $wallet,
        $user['user_id'],
        'withdrawal',
        "Withdrawal to BEP-20 Wallet ({$shortAddr})",
        $amountUsdt,
        $fee,
        $netPayout,
        'completed',
        $txHash,
        'BNB Chain',
        [
            'withdrawal_id' => $withdrawalId,
            'fee_percent' => WITHDRAWAL_FEE_PERCENT,
            'admin_fee' => round($fee / 2, 4),
            'royalty_fee' => round($fee / 2, 4)
        ]
    );

    $pdo->commit();

    sendResponse('success', 'Withdrawal completed successfully with 5% liquidity fee retained in vault', [
        'withdrawalId' => $withdrawalId,
        'walletAddress' => $wallet,
        'userId' => $user['user_id'],
        'grossAmountUsdt' => $amountUsdt,
        'feePercent' => WITHDRAWAL_FEE_PERCENT . '%',
        'liquidityFeeUsdt' => $fee,
        'netPayoutUsdt' => $netPayout,
        'remainingBalanceUsdt' => $newBalance,
        'txHash' => $txHash,
        'status' => 'confirmed'
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse('error', 'Withdrawal processing error: ' . $e->getMessage(), null, 500);
}
