<?php
/**
 * Morgan Treasure - Dedicated Sponsor Verification API
 * Supports both GET and POST requests to verify whether a Sponsor ID exists in MariaDB.
 */

require_once __DIR__ . '/config.php';

$pdo = getDbConnection();

$checkSponsor = '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $checkSponsor = trim($_GET['check_sponsor'] ?? $_GET['sponsor_id'] ?? '');
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = getJsonPayload();
    $checkSponsor = trim($payload['sponsor_id'] ?? $payload['check_sponsor'] ?? '');
}

if (empty($checkSponsor)) {
    sendResponse('error', 'Sponsor ID parameter is required', null, 400);
}

if (!$pdo) {
    sendResponse('error', 'Database connection unavailable', null, 500);
}

$cleanSponsor = str_replace('-', '', strtoupper($checkSponsor));
$stmt = $pdo->prepare("
    SELECT user_id, nickname, wallet_address, rank, is_active 
    FROM users 
    WHERE UPPER(user_id) = ? OR UPPER(REPLACE(user_id, '-', '')) = ? OR LOWER(wallet_address) = ?
    LIMIT 1
");
$stmt->execute([strtoupper($checkSponsor), $cleanSponsor, strtolower($checkSponsor)]);
$sponsor = $stmt->fetch();

if ($sponsor) {
    sendResponse('success', 'Valid Sponsor ID', [
        'userId' => $sponsor['user_id'],
        'nickname' => $sponsor['nickname'] ?: 'Morgan Investor',
        'walletAddress' => $sponsor['wallet_address'],
        'rank' => $sponsor['rank'],
        'isActive' => (bool)$sponsor['is_active']
    ]);
} else {
    sendResponse('error', 'Sponsor ID not found in database', null, 404);
}
