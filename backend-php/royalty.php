<?php
/**
 * Morgan Treasure - Royalty Clubs & Leadership Pool API
 * Evaluates investor qualifications and returns club status from MariaDB.
 */

require_once __DIR__ . '/config.php';

$address = strtolower(trim($_GET['address'] ?? ''));

$pdo = getDbConnection();

// Baseline club rules
$clubsMaster = [
    [
        'id' => 'club_star',
        'name' => 'Treasure Star',
        'monthlyPoolPercent' => 1.0,
        'requiredDirects' => 5,
        'requiredTeamVolumeUsdt' => 5000,
        'icon' => 'fa-star',
        'badgeColor' => '#fbbf24',
        'baseRewardEstimate' => 45.00
    ],
    [
        'id' => 'club_ruby',
        'name' => 'Morgan Ruby',
        'monthlyPoolPercent' => 1.5,
        'requiredDirects' => 10,
        'requiredTeamVolumeUsdt' => 15000,
        'icon' => 'fa-gem',
        'badgeColor' => '#f43f5e',
        'baseRewardEstimate' => 110.00
    ],
    [
        'id' => 'club_emerald',
        'name' => 'Morgan Emerald',
        'monthlyPoolPercent' => 2.0,
        'requiredDirects' => 15,
        'requiredTeamVolumeUsdt' => 35000,
        'icon' => 'fa-ring',
        'badgeColor' => '#10b981',
        'baseRewardEstimate' => 280.00
    ],
    [
        'id' => 'club_diamond',
        'name' => 'Crown Diamond',
        'monthlyPoolPercent' => 3.0,
        'requiredDirects' => 20,
        'requiredTeamVolumeUsdt' => 100000,
        'icon' => 'fa-crown',
        'badgeColor' => '#38bdf8',
        'baseRewardEstimate' => 850.00
    ]
];

// Offline simulation fallback
if (!$pdo || empty($address)) {
    $simulatedResponse = [];
    foreach ($clubsMaster as $c) {
        $simulatedResponse[] = [
            'id' => $c['id'],
            'name' => $c['name'],
            'monthlyPoolPercent' => $c['monthlyPoolPercent'],
            'requiredDirects' => $c['requiredDirects'],
            'requiredTeamVolumeUsdt' => $c['requiredTeamVolumeUsdt'],
            'currentTeamVolumeUsdt' => 24500,
            'achieved' => ($c['id'] === 'club_star'),
            'rewardEstimateUsdt' => $c['baseRewardEstimate'],
            'icon' => $c['icon'],
            'badgeColor' => $c['badgeColor']
        ];
    }
    sendResponse('success', 'Royalty clubs status retrieved (Simulated)', $simulatedResponse);
}

try {
    $stmt = $pdo->prepare("SELECT directs_count, active_directs_count, total_team_turnover_usdt FROM users WHERE wallet_address = ?");
    $stmt->execute([$address]);
    $user = $stmt->fetch();

    $userDirects = $user ? max((int)$user['directs_count'], (int)$user['active_directs_count']) : 0;
    $teamVolume = $user ? (float)$user['total_team_turnover_usdt'] : 0.0;

    $clubsResult = [];
    foreach ($clubsMaster as $club) {
        $isAchieved = ($userDirects >= $club['requiredDirects'] && $teamVolume >= $club['requiredTeamVolumeUsdt']);

        $clubsResult[] = [
            'id' => $club['id'],
            'name' => $club['name'],
            'monthlyPoolPercent' => $club['monthlyPoolPercent'],
            'requiredDirects' => $club['requiredDirects'],
            'requiredTeamVolumeUsdt' => $club['requiredTeamVolumeUsdt'],
            'currentTeamVolumeUsdt' => $teamVolume,
            'achieved' => $isAchieved,
            'rewardEstimateUsdt' => $isAchieved ? $club['baseRewardEstimate'] : 0.00,
            'icon' => $club['icon'],
            'badgeColor' => $club['badgeColor']
        ];
    }

    sendResponse('success', 'Royalty clubs status retrieved from MariaDB', $clubsResult);

} catch (Exception $e) {
    sendResponse('error', 'Royalty query error: ' . $e->getMessage(), null, 500);
}
