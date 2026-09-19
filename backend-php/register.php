<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Only POST requests allowed', null, 405);
}

$payload = getJsonPayload();
$wallet = trim($payload['wallet_address'] ?? '');
$sponsorId = trim($payload['sponsor_id'] ?? 'MT-10024');
$nickname = trim($payload['nickname'] ?? '');

if (empty($wallet) || !preg_match('/^0x[a-fA-F0-9]{40}$/', $wallet)) {
    sendResponse('error', 'Valid BNB Chain (BEP-20) wallet address is required', null, 422);
}

$pdo = getDbConnection();

if (!$pdo) {
    // Graceful simulated registration response when DB is in local setup
    $simulatedUserId = 'MT-' . rand(10000, 99999);
    sendResponse('success', 'User registered in Morgan Treasure (Offline Mode)', [
        'userId' => $simulatedUserId,
        'walletAddress' => $wallet,
        'sponsorId' => $sponsorId ?: 'MT-10024',
        'referralCode' => str_replace('-', '', $simulatedUserId)
    ]);
}

try {
    // Check if user exists
    $stmt = $pdo->prepare("SELECT * FROM users WHERE wallet_address = ?");
    $stmt->execute([$wallet]);
    $existing = $stmt->fetch();

    if ($existing) {
        sendResponse('success', 'User already registered', [
            'userId' => $existing['user_id'],
            'walletAddress' => $existing['wallet_address'],
            'sponsorId' => $existing['sponsor_id'],
            'referralCode' => str_replace('-', '', $existing['user_id'])
        ]);
    }

    // Verify Sponsor exists
    $sponsorStmt = $pdo->prepare("SELECT wallet_address, user_id FROM users WHERE user_id = ?");
    $sponsorStmt->execute([$sponsorId]);
    $sponsor = $sponsorStmt->fetch();

    $sponsorAddress = $sponsor ? $sponsor['wallet_address'] : null;
    $finalSponsorId = $sponsor ? $sponsor['user_id'] : 'MT-10024';

    // Generate unique User ID
    $userId = 'MT-' . rand(10000, 99999);

    $insert = $pdo->prepare("
        INSERT INTO users (wallet_address, user_id, sponsor_id, sponsor_address, nickname, rank)
        VALUES (?, ?, ?, ?, ?, 'Treasure Explorer')
    ");
    $insert->execute([$wallet, $userId, $finalSponsorId, $sponsorAddress, $nickname ?: 'Investor ' . substr($wallet, 2, 4)]);

    // Update sponsor directs count
    if ($sponsor) {
        $upd = $pdo->prepare("UPDATE users SET directs_count = directs_count + 1, total_team_count = total_team_count + 1 WHERE user_id = ?");
        $upd->execute([$finalSponsorId]);
    }

    sendResponse('success', 'Account registered successfully on Morgan Treasure', [
        'userId' => $userId,
        'walletAddress' => $wallet,
        'sponsorId' => $finalSponsorId,
        'referralCode' => str_replace('-', '', $userId)
    ]);

} catch (Exception $e) {
    sendResponse('error', 'Registration error: ' . $e->getMessage(), null, 500);
}
