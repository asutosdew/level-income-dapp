<?php
/**
 * Morgan Treasure - User Registration & Sponsor Linking API
 * Handles new investor registration, sponsor validation, upline tree linking, and direct referral counter updates.
 */

require_once __DIR__ . '/config.php';

$pdo = getDbConnection();

// 1. Live Sponsor Validation Endpoint (GET ?check_sponsor=MT-10024)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $checkSponsor = trim($_GET['check_sponsor'] ?? '');
    if (empty($checkSponsor)) {
        sendResponse('error', 'check_sponsor parameter is required', null, 400);
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
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Only GET (check_sponsor) and POST requests allowed', null, 405);
}

$payload = getJsonPayload();
$wallet = strtolower(trim($payload['wallet_address'] ?? ''));
$sponsorId = trim($payload['sponsor_id'] ?? '');
$nickname = trim($payload['nickname'] ?? '');

// 2. Validate BEP-20 Wallet Address
if (empty($wallet) || !preg_match('/^0x[a-f0-9]{40}$/', $wallet)) {
    sendResponse('error', 'Valid BNB Chain (BEP-20) wallet address is required', null, 422);
}

// 3. Strict Sponsor ID Requirement (COMPULSORY)
if (empty($sponsorId)) {
    sendResponse('error', 'Sponsor ID is mandatory for new registration. Please enter a valid Sponsor ID.', null, 422);
}

if (!$pdo) {
    sendResponse('error', 'Database connection failed. Unable to register user.', null, 500);
}

try {
    // 4. Check if wallet is already registered
    $stmt = $pdo->prepare("SELECT * FROM users WHERE wallet_address = ?");
    $stmt->execute([$wallet]);
    $existing = $stmt->fetch();

    if ($existing) {
        sendResponse('success', 'User already registered with Morgan Treasure', [
            'userId' => $existing['user_id'],
            'walletAddress' => $existing['wallet_address'],
            'sponsorId' => $existing['sponsor_id'],
            'referralCode' => str_replace('-', '', $existing['user_id']),
            'nickname' => $existing['nickname'],
            'rank' => $existing['rank'],
            'isRegistered' => true
        ]);
    }

    // 5. Verify Sponsor exists strictly in MariaDB
    $cleanSponsor = str_replace('-', '', strtoupper($sponsorId));
    $sponsorStmt = $pdo->prepare("
        SELECT wallet_address, user_id, nickname 
        FROM users 
        WHERE UPPER(user_id) = ? OR UPPER(REPLACE(user_id, '-', '')) = ? OR LOWER(wallet_address) = ?
        LIMIT 1
    ");
    $sponsorStmt->execute([strtoupper($sponsorId), $cleanSponsor, strtolower($sponsorId)]);
    $sponsor = $sponsorStmt->fetch();

    if (!$sponsor) {
        sendResponse('error', 'Invalid Sponsor ID. No user found with ID "' . htmlspecialchars($sponsorId) . '". Sponsor ID is compulsory.', null, 422);
    }

    // Prevent self-referral
    if (strtolower($sponsor['wallet_address']) === $wallet) {
        sendResponse('error', 'You cannot use your own wallet address as sponsor.', null, 422);
    }

    $finalSponsorId = $sponsor['user_id'];
    $sponsorAddress = $sponsor['wallet_address'];

    // 6. Generate unique random User ID (e.g. MT-77291)
    do {
        $userId = 'MT-' . rand(10000, 99999);
        $checkId = $pdo->prepare("SELECT id FROM users WHERE user_id = ?");
        $checkId->execute([$userId]);
    } while ($checkId->fetch());

    $displayName = $nickname ?: 'Investor ' . substr($wallet, 2, 4);

    $pdo->beginTransaction();

    // 7. Insert new user into MariaDB
    $insert = $pdo->prepare("
        INSERT INTO users (
            wallet_address, user_id, sponsor_id, sponsor_address, 
            nickname, rank, is_registered, is_active
        ) VALUES (?, ?, ?, ?, ?, 'Treasure Explorer', 1, 0)
    ");
    $insert->execute([$wallet, $userId, $finalSponsorId, $sponsorAddress, $displayName]);

    // 8. Update direct sponsor statistics
    $updSponsor = $pdo->prepare("
        UPDATE users 
        SET directs_count = directs_count + 1, 
            total_team_count = total_team_count + 1 
        WHERE user_id = ?
    ");
    $updSponsor->execute([$finalSponsorId]);

    // Accumulate upline total team count up to 15 levels
    $currSponsorAddr = $sponsor['wallet_address'];
    for ($depth = 2; $depth <= 15; $depth++) {
        $upQuery = $pdo->prepare("SELECT sponsor_address FROM users WHERE wallet_address = ?");
        $upQuery->execute([$currSponsorAddr]);
        $upRow = $upQuery->fetch();
        if (!$upRow || empty($upRow['sponsor_address'])) {
            break;
        }
        $currSponsorAddr = $upRow['sponsor_address'];
        $updTeam = $pdo->prepare("UPDATE users SET total_team_count = total_team_count + 1 WHERE wallet_address = ?");
        $updTeam->execute([$currSponsorAddr]);
    }

    $pdo->commit();

    sendResponse('success', 'Account registered successfully on Morgan Treasure', [
        'userId' => $userId,
        'walletAddress' => $wallet,
        'sponsorId' => $finalSponsorId,
        'sponsorAddress' => $sponsorAddress,
        'nickname' => $displayName,
        'referralCode' => str_replace('-', '', $userId),
        'isRegistered' => true
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse('error', 'Registration error: ' . $e->getMessage(), null, 500);
}
