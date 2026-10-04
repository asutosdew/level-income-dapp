<?php
/**
 * Morgan Treasure - Unified Transactions Ledger API
 * Returns all user transactions (Deposits, Withdrawals, ROI, Level Income, Token Purchases) from MariaDB.
 */

require_once __DIR__ . '/config.php';

$address = strtolower(trim($_GET['address'] ?? ''));
$typeFilter = trim($_GET['type'] ?? 'all');
$limit = min(100, max(1, (int)($_GET['limit'] ?? 50)));

$pdo = getDbConnection();

// Fallback simulated transactions if MariaDB is unavailable
if (!$pdo || empty($address)) {
    $fallbackTxs = [
        ['id' => 'tx_01', 'type' => 'daily_roi', 'title' => 'Daily Liquidity ROI (0.84%)', 'amountUsdt' => 4.20, 'feeUsdt' => 0, 'netAmountUsdt' => 4.20, 'status' => 'completed', 'timestamp' => 'Today, 06:00 AM', 'txHash' => '0x8f4...321a', 'network' => 'BNB Chain'],
        ['id' => 'tx_02', 'type' => 'level_income', 'title' => 'Level 1 Referral Bonus (Sophia Chen)', 'amountUsdt' => 50.00, 'feeUsdt' => 0, 'netAmountUsdt' => 50.00, 'status' => 'completed', 'timestamp' => 'Yesterday, 04:15 PM', 'txHash' => '0x992...44a1', 'network' => 'BNB Chain'],
        ['id' => 'tx_03', 'type' => 'token_buy', 'title' => 'Swap 0.5 BNB for 1,280 MTG Tokens', 'amountUsdt' => 320.00, 'feeUsdt' => 0.8, 'netAmountUsdt' => 319.20, 'status' => 'completed', 'timestamp' => '2 Sep 2026', 'txHash' => '0x44a...bb12', 'network' => 'BNB Chain'],
        ['id' => 'tx_04', 'type' => 'withdrawal', 'title' => 'Withdrawal to BEP-20 Wallet', 'amountUsdt' => 120.00, 'feeUsdt' => 6.00, 'netAmountUsdt' => 114.00, 'status' => 'completed', 'timestamp' => '30 Aug 2026', 'txHash' => '0x712...99ee', 'network' => 'BNB Chain'],
        ['id' => 'tx_05', 'type' => 'deposit', 'title' => 'Staked Morgan Gold Package ($500)', 'amountUsdt' => 500.00, 'feeUsdt' => 0.5, 'netAmountUsdt' => 500.00, 'status' => 'completed', 'timestamp' => '10 Aug 2026', 'txHash' => '0x31a...7710', 'network' => 'BNB Chain']
    ];
    sendResponse('success', 'Transactions retrieved (Simulated)', $fallbackTxs);
}

try {
    $sql = "SELECT * FROM transactions WHERE wallet_address = ?";
    $params = [$address];

    if ($typeFilter !== 'all') {
        $sql .= " AND type = ?";
        $params[] = $typeFilter;
    }

    $sql .= " ORDER BY id DESC LIMIT " . (int)$limit;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $transactions = [];
    foreach ($rows as $r) {
        $txTime = strtotime($r['created_at']);
        $diff = time() - $txTime;

        if ($diff < 120) {
            $formattedTime = 'Just now';
        } elseif ($diff < 3600) {
            $formattedTime = floor($diff / 60) . 'm ago';
        } elseif ($diff < 86400) {
            $formattedTime = date('h:i A', $txTime);
        } else {
            $formattedTime = date('d M Y, h:i A', $txTime);
        }

        $shortHash = substr($r['tx_hash'], 0, 7) . '...' . substr($r['tx_hash'], -4);

        $transactions[] = [
            'id' => $r['tx_id'],
            'type' => $r['type'],
            'title' => $r['title'],
            'amountUsdt' => (float)$r['amount_usdt'],
            'feeUsdt' => (float)$r['fee_usdt'],
            'netAmountUsdt' => (float)$r['net_amount_usdt'],
            'status' => $r['status'],
            'timestamp' => $formattedTime,
            'txHash' => $shortHash,
            'rawTxHash' => $r['tx_hash'],
            'network' => $r['network'],
            'createdAt' => $r['created_at']
        ];
    }

    sendResponse('success', 'Transactions loaded successfully from MariaDB', $transactions);

} catch (Exception $e) {
    sendResponse('error', 'Transactions query error: ' . $e->getMessage(), null, 500);
}
