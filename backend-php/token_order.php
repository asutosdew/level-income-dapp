<?php
/**
 * Morgan Treasure - MTG Token Purchase / Presale Swap API
 * Records blockchain token purchase orders, updates token sale metrics, and logs in MariaDB.
 */

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Only POST requests allowed', null, 405);
}

$payload = getJsonPayload();
$wallet = strtolower(trim($payload['wallet_address'] ?? ''));
$tokensAmount = (float)($payload['tokens_amount'] ?? 0);
$paidAmount = (float)($payload['paid_amount'] ?? 0);
$paidCurrency = strtoupper(trim($payload['paid_currency'] ?? 'BNB'));
$txHash = trim($payload['tx_hash'] ?? '');

if (empty($wallet) || !preg_match('/^0x[a-f0-9]{40}$/', $wallet) || $tokensAmount <= 0 || $paidAmount <= 0) {
    sendResponse('error', 'Valid wallet address, token amount, and payment amount required', null, 422);
}

if (!in_array($paidCurrency, ['BNB', 'USDT'])) {
    sendResponse('error', 'Paid currency must be BNB or USDT', null, 422);
}

if (empty($txHash) || !preg_match('/^0x[a-fA-F0-9]{64}$/', $txHash)) {
    sendResponse('error', 'Valid 64-character on-chain transaction hash is required.', null, 422);
}

$pdo = getDbConnection();

if (!$pdo) {
    sendResponse('error', 'Database service temporarily unavailable. Please retry shortly.', null, 503);
}

// Replay protection
$chkTx = $pdo->prepare("SELECT id FROM token_orders WHERE tx_hash = ? UNION SELECT id FROM transactions WHERE tx_hash = ?");
$chkTx->execute([$txHash, $txHash]);
if ($chkTx->fetch()) {
    sendResponse('error', 'This token purchase transaction has already been processed.', null, 409);
}

// Equivalent USDT value
$usdtValue = ($paidCurrency === 'USDT') ? $paidAmount : ($paidAmount * BNB_PRICE_USDT);
$fee = ($paidCurrency === 'BNB') ? 0.0015 * BNB_PRICE_USDT : 0.40;

try {
    $pdo->beginTransaction();

    // 1. Fetch User Record (Must be registered)
    $uStmt = $pdo->prepare("SELECT id, user_id, is_registered FROM users WHERE wallet_address = ?");
    $uStmt->execute([$wallet]);
    $user = $uStmt->fetch();

    if (!$user || (int)($user['is_registered'] ?? 0) !== 1) {
        $pdo->rollBack();
        sendResponse('error', 'Wallet not registered. Please register with a sponsor ID first before purchasing MTG tokens.', null, 403);
    }

    $userId = $user['user_id'];

    // 2. Insert into token_orders table
    $insOrder = $pdo->prepare("
        INSERT INTO token_orders (
            wallet_address, user_id, token_amount, token_price_usdt, 
            paid_amount, paid_currency, tx_hash, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')
    ");
    $insOrder->execute([
        $wallet,
        $userId,
        $tokensAmount,
        MTG_TOKEN_PRICE_USDT,
        $paidAmount,
        $paidCurrency,
        $txHash
    ]);
    $orderId = $pdo->lastInsertId();

    // 3. Log in unified transactions ledger
    $txTitle = "Swap {$paidAmount} {$paidCurrency} for " . number_format($tokensAmount) . " MTG Tokens";
    logTransaction(
        $pdo,
        $wallet,
        $userId,
        'token_buy',
        $txTitle,
        $usdtValue,
        $fee,
        round($usdtValue - $fee, 4),
        'completed',
        $txHash,
        'BNB Chain',
        [
            'order_id' => $orderId,
            'token_amount' => $tokensAmount,
            'paid_amount' => $paidAmount,
            'paid_currency' => $paidCurrency,
            'token_contract' => MTG_TOKEN_CONTRACT
        ]
    );

    $pdo->commit();

    sendResponse('success', 'Token purchase order recorded successfully in MariaDB', [
        'orderId' => $orderId,
        'walletAddress' => $wallet,
        'userId' => $userId,
        'tokensAmount' => $tokensAmount,
        'tokenSymbol' => 'MTG',
        'tokenContract' => MTG_TOKEN_CONTRACT,
        'paidAmount' => $paidAmount,
        'paidCurrency' => $paidCurrency,
        'usdtValue' => round($usdtValue, 2),
        'txHash' => $txHash,
        'status' => 'completed'
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse('error', 'Token order error: ' . $e->getMessage(), null, 500);
}
