<?php
require_once __DIR__ . '/config.php';

$address = trim($_GET['address'] ?? '');

$levelPercentages = [
    1 => 10.0, 2 => 5.0, 3 => 3.0, 4 => 2.0, 5 => 1.0,
    6 => 0.5, 7 => 0.5, 8 => 0.5, 9 => 0.5, 10 => 0.5,
    11 => 0.25, 12 => 0.25, 13 => 0.25, 14 => 0.25, 15 => 0.25
];

$pdo = getDbConnection();

// Simulated data fallback
$levelsData = [
    ['level' => 1, 'percentage' => 10.0, 'directRequired' => 1, 'teamMembersCount' => 9, 'activeMembersCount' => 7, 'totalTurnoverUsdt' => 5200, 'earnedUsdt' => 250.00, 'isUnlocked' => true],
    ['level' => 2, 'percentage' => 5.0, 'directRequired' => 2, 'teamMembersCount' => 22, 'activeMembersCount' => 18, 'totalTurnoverUsdt' => 4400, 'earnedUsdt' => 110.00, 'isUnlocked' => true],
    ['level' => 3, 'percentage' => 3.0, 'directRequired' => 3, 'teamMembersCount' => 34, 'activeMembersCount' => 29, 'totalTurnoverUsdt' => 3800, 'earnedUsdt' => 57.00, 'isUnlocked' => true],
    ['level' => 4, 'percentage' => 2.0, 'directRequired' => 4, 'teamMembersCount' => 28, 'activeMembersCount' => 21, 'totalTurnoverUsdt' => 2900, 'earnedUsdt' => 34.80, 'isUnlocked' => true],
    ['level' => 5, 'percentage' => 1.0, 'directRequired' => 5, 'teamMembersCount' => 19, 'activeMembersCount' => 15, 'totalTurnoverUsdt' => 2100, 'earnedUsdt' => 21.00, 'isUnlocked' => true],
    ['level' => 6, 'percentage' => 0.5, 'directRequired' => 6, 'teamMembersCount' => 15, 'activeMembersCount' => 12, 'totalTurnoverUsdt' => 1800, 'earnedUsdt' => 13.50, 'isUnlocked' => true],
    ['level' => 7, 'percentage' => 0.5, 'directRequired' => 7, 'teamMembersCount' => 12, 'activeMembersCount' => 9, 'totalTurnoverUsdt' => 1500, 'earnedUsdt' => 11.25, 'isUnlocked' => true],
    ['level' => 8, 'percentage' => 0.5, 'directRequired' => 8, 'teamMembersCount' => 8, 'activeMembersCount' => 6, 'totalTurnoverUsdt' => 1200, 'earnedUsdt' => 9.00, 'isUnlocked' => false],
    ['level' => 9, 'percentage' => 0.5, 'directRequired' => 9, 'teamMembersCount' => 5, 'activeMembersCount' => 3, 'totalTurnoverUsdt' => 800, 'earnedUsdt' => 6.00, 'isUnlocked' => false],
    ['level' => 10, 'percentage' => 0.5, 'directRequired' => 10, 'teamMembersCount' => 3, 'activeMembersCount' => 2, 'totalTurnoverUsdt' => 500, 'earnedUsdt' => 4.25, 'isUnlocked' => false],
    ['level' => 11, 'percentage' => 0.25, 'directRequired' => 11, 'teamMembersCount' => 1, 'activeMembersCount' => 1, 'totalTurnoverUsdt' => 100, 'earnedUsdt' => 1.20, 'isUnlocked' => false],
    ['level' => 12, 'percentage' => 0.25, 'directRequired' => 12, 'teamMembersCount' => 0, 'activeMembersCount' => 0, 'totalTurnoverUsdt' => 0, 'earnedUsdt' => 0.00, 'isUnlocked' => false],
    ['level' => 13, 'percentage' => 0.25, 'directRequired' => 13, 'teamMembersCount' => 0, 'activeMembersCount' => 0, 'totalTurnoverUsdt' => 0, 'earnedUsdt' => 0.00, 'isUnlocked' => false],
    ['level' => 14, 'percentage' => 0.25, 'directRequired' => 14, 'teamMembersCount' => 0, 'activeMembersCount' => 0, 'totalTurnoverUsdt' => 0, 'earnedUsdt' => 0.00, 'isUnlocked' => false],
    ['level' => 15, 'percentage' => 0.25, 'directRequired' => 15, 'teamMembersCount' => 0, 'activeMembersCount' => 0, 'totalTurnoverUsdt' => 0, 'earnedUsdt' => 0.00, 'isUnlocked' => false],
];

if ($pdo && !empty($address)) {
    try {
        // Query live earnings grouped by level
        $stmt = $pdo->prepare("
            SELECT level, SUM(amount_usdt) as total_earned, COUNT(*) as tx_count 
            FROM level_income 
            WHERE beneficiary_wallet = ? 
            GROUP BY level
        ");
        $stmt->execute([$address]);
        $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        // Update levelsData with actual earnings if present
        foreach ($levelsData as &$tier) {
            $lvl = $tier['level'];
            if (isset($rows[$lvl])) {
                $tier['earnedUsdt'] = (float)$rows[$lvl];
            }
        }
    } catch (Exception $e) {
        // Fallback
    }
}

sendResponse('success', 'Level income breakdown retrieved', $levelsData);
