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

if (empty($txHash)) {
    $txHash = '0x' . bin2hex(random_bytes(32));
}

$pdo = getDbConnection();

// Equivalent USDT value
$usdtValue = ($paidCurrency === 'USDT') ? $paidAmount : ($paidAmount * BNB_PRICE_USDT);
$fee = ($paidCurrency === 'BNB') ? 0.0015 * BNB_PRICE_USDT : 0.40;

// Offline fallback simulation
if (!$pdo) {
    sendResponse('success', 'Token purchase recorded (Simulated Demo)', [
        'walletAddress' => $wallet,
        'tokensAmount' => $tokensAmount,
        'tokenSymbol' => 'MTG',
        'paidAmount' => $paidAmount,
        'paidCurrency' => $paidCurrency,
        'usdtValue' => round($usdtValue, 2),
        'txHash' => $txHash,
        'status' => 'completed'
    ]);
}

try {
    $pdo->beginTransaction();

    // 1. Fetch User Record
    $uStmt = $pdo->prepare("SELECT id, user_id FROM users WHERE wallet_address = ?");
    $uStmt->execute([$wallet]);
    $user = $uStmt->fetch();
    $userId = $user ? $user['user_id'] : 'MT-' . rand(10000, 99999);

    if (!$user) {
        $ins = $pdo->prepare("INSERT INTO users (wallet_address, user_id, sponsor_id) VALUES (?, ?, 'MT-10024')");
        $ins->execute([$wallet, $userId]);
    }

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
