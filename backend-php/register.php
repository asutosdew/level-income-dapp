<?php
/**
 * Morgan Treasure - User Registration & Sponsor Linking API
 * Handles new investor registration, upline tree linking, and direct referral counter updates.
 */

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Only POST requests allowed', null, 405);
}

$payload = getJsonPayload();
$wallet = strtolower(trim($payload['wallet_address'] ?? ''));
$sponsorId = strtoupper(trim($payload['sponsor_id'] ?? 'MT-10024'));
$nickname = trim($payload['nickname'] ?? '');

if (empty($wallet) || !preg_match('/^0x[a-f0-9]{40}$/', $wallet)) {
    sendResponse('error', 'Valid BNB Chain (BEP-20) wallet address is required', null, 422);
}

$pdo = getDbConnection();

// Offline fallback simulation
if (!$pdo) {
    $simulatedUserId = 'MT-' . rand(10000, 99999);
    sendResponse('success', 'User registered in Morgan Treasure (Offline Demo Mode)', [
        'userId' => $simulatedUserId,
        'walletAddress' => $wallet,
        'sponsorId' => $sponsorId ?: 'MT-10024',
        'referralCode' => str_replace('-', '', $simulatedUserId),
        'isRegistered' => true
    ]);
}

try {
    // 1. Check if user already exists
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

    // 2. Verify Sponsor exists in MariaDB
    $sponsorStmt = $pdo->prepare("SELECT wallet_address, user_id, nickname FROM users WHERE user_id = ?");
    $sponsorStmt->execute([$sponsorId]);
    $sponsor = $sponsorStmt->fetch();

    if (!$sponsor) {
        // Fallback to Genesis Root Sponsor
        $sponsorStmt->execute(['MT-10024']);
        $sponsor = $sponsorStmt->fetch();
    }

    $finalSponsorId = $sponsor ? $sponsor['user_id'] : 'MT-10024';
    $sponsorAddress = $sponsor ? $sponsor['wallet_address'] : null;

    // 3. Generate unique random User ID (e.g. MT-77291)
    do {
        $userId = 'MT-' . rand(10000, 99999);
        $checkId = $pdo->prepare("SELECT id FROM users WHERE user_id = ?");
        $checkId->execute([$userId]);
    } while ($checkId->fetch());

    $displayName = $nickname ?: 'Investor ' . substr($wallet, 2, 4);

    $pdo->beginTransaction();

    // 4. Insert new user into MariaDB
    $insert = $pdo->prepare("
        INSERT INTO users (
            wallet_address, user_id, sponsor_id, sponsor_address, 
            nickname, rank, is_registered, is_active
        ) VALUES (?, ?, ?, ?, ?, 'Treasure Explorer', 1, 0)
    ");
    $insert->execute([$wallet, $userId, $finalSponsorId, $sponsorAddress, $displayName]);

    // 5. Update direct sponsor statistics
    if ($sponsor) {
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
