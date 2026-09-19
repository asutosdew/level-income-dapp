<?php
/**
 * Morgan Treasure - Automated Dynamic APY / Daily ROI Cron Management Script
 * 
 * EXECUTION OPTIONS:
 * 1. Linux Crontab (Midnight UTC recommended):
 *    0 0 * * * /usr/bin/php /path/to/backend-php/cron_daily_roi.php >> /var/log/morgan_cron.log 2>&1
 * 
 * 2. Manual CLI execution:
 *    php cron_daily_roi.php [--dry-run] [--force]
 * 
 * 3. Remote Webhook / External Ping Trigger:
 *    GET https://api.morgantreasure.io/backend-php/cron_daily_roi.php?key=MORGAN_CRON_SECRET_2026
 * 
 * FEATURES:
 * - Algorithmic Dynamic APY Management (0.50% to 1.00% daily, floating with liquidity reserve).
 * - Enforces Hard 300% (3.0x) Max Profit Capping per user.
 * - Atomic MySQL transactions for failure-safe financial distribution.
 * - Idempotency guard: prevents duplicate execution on the same calendar day.
 * - Comprehensive logging in cron_logs and daily_roi_payouts tables.
 */

$startTime = microtime(true);

require_once __DIR__ . '/config.php';

$isCli = (php_sapi_name() === 'cli');

// 1. Security Authentication for Web Invocations
if (!$isCli) {
    $requestKey = $_GET['key'] ?? ($_SERVER['HTTP_X_CRON_KEY'] ?? '');
    if ($requestKey !== CRON_SECRET) {
        sendResponse('error', 'Unauthorized: Invalid Cron Security Key', null, 403);
    }
}

// 2. Parse CLI / Query flags
$dryRun = false;
$force = false;

if ($isCli) {
    global $argv;
    $dryRun = in_array('--dry-run', $argv ?? []);
    $force = in_array('--force', $argv ?? []);
} else {
    $dryRun = isset($_GET['dry_run']) && ($_GET['dry_run'] === '1' || $_GET['dry_run'] === 'true');
    $force = isset($_GET['force']) && ($_GET['force'] === '1' || $_GET['force'] === 'true');
}

$pdo = getDbConnection();

// Simulated fallback if MySQL is not yet configured locally
if (!$pdo) {
    $sampleRate = 0.84;
    $sampleUsers = 42;
    $sampleVolume = 84500.0;
    $sampleDistributed = round($sampleVolume * ($sampleRate / 100), 2);

    $simulatedResult = [
        'mode' => $dryRun ? 'dry_run (Simulated)' : 'live (Simulated - No DB connected)',
        'date' => date('Y-m-d'),
        'dynamicDailyRoiPercent' => $sampleRate,
        'annualApyPercent' => round($sampleRate * 365, 2),
        'activeStakers' => $sampleUsers,
        'totalStakedVolumeUsdt' => $sampleVolume,
        'totalRoiDistributedUsdt' => $sampleDistributed,
        'message' => 'Automated APY calculation simulated successfully. Connect MySQL to persist live payouts.'
    ];

    sendResponse('success', 'Automated APY Cron Execution Simulation', $simulatedResult);
}

try {
    // 3. Idempotency Check: Guard against duplicate run on same date
    $today = date('Y-m-d');
    if (!$force) {
        $checkStmt = $pdo->prepare("
            SELECT id, created_at, users_processed, total_payout_usdt, roi_rate_percent 
            FROM cron_logs 
            WHERE job_name = 'daily_dynamic_roi' AND DATE(created_at) = ? AND status = 'completed'
            LIMIT 1
        ");
        $checkStmt->execute([$today]);
        $alreadyRun = $checkStmt->fetch();

        if ($alreadyRun) {
            sendResponse('success', "Daily ROI already executed for date {$today}. Use --force to override.", [
                'existingExecution' => $alreadyRun,
                'forced' => false
            ]);
        }
    }

    // 4. Calculate Automated Dynamic Daily APY / ROI
    // Formula: Clamped between 0.50% and 1.00% based on liquid reserve depth ($1M to $3M)
    $latestLiquidity = 2480500.0; // Default protocol baseline
    $liqStmt = $pdo->query("SELECT total_liquidity_usdt FROM liquidity_history ORDER BY id DESC LIMIT 1");
    $liqRow = $liqStmt->fetch();
    if ($liqRow && (float)$liqRow['total_liquidity_usdt'] > 0) {
        $latestLiquidity = (float)$liqRow['total_liquidity_usdt'];
    }

    $score = min(1.0, max(0.0, ($latestLiquidity - BASE_POOL_RESERVE) / (TARGET_POOL_RESERVE - BASE_POOL_RESERVE)));
    $dynamicDailyRoi = round(MIN_DAILY_ROI_PERCENT + ((MAX_DAILY_ROI_PERCENT - MIN_DAILY_ROI_PERCENT) * $score), 2);

    // Strict clamping bounds
    if ($dynamicDailyRoi < MIN_DAILY_ROI_PERCENT) $dynamicDailyRoi = MIN_DAILY_ROI_PERCENT;
    if ($dynamicDailyRoi > MAX_DAILY_ROI_PERCENT) $dynamicDailyRoi = MAX_DAILY_ROI_PERCENT;

    $annualApy = round($dynamicDailyRoi * 365, 2);

    // 5. Query Eligible Stakers
    $userStmt = $pdo->query("
        SELECT id, wallet_address, user_id, total_staked_usdt, available_balance_usdt, 
               total_roi_income_usdt, max_capping_limit_usdt, total_earning_towards_cap_usdt
        FROM users 
        WHERE total_staked_usdt > 0 
          AND (total_earning_towards_cap_usdt < max_capping_limit_usdt OR max_capping_limit_usdt = 0)
    ");
    $stakers = $userStmt->fetchAll();

    $totalUsersProcessed = 0;
    $totalRoiDistributed = 0.0;
    $totalStakedEvaluated = 0.0;
    $cappedUsersCount = 0;
    $previewRecords = [];

    if (!$dryRun) {
        $pdo->beginTransaction();
    }

    $payoutIns = $pdo->prepare("
        INSERT INTO daily_roi_payouts (
            wallet_address, user_id, staked_amount_usdt, roi_rate_percent, 
            gross_payout_usdt, credited_payout_usdt, remaining_cap_after
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $userUpd = $pdo->prepare("
        UPDATE users 
        SET available_balance_usdt = available_balance_usdt + ?,
            total_roi_income_usdt = total_roi_income_usdt + ?,
            total_earning_towards_cap_usdt = total_earning_towards_cap_usdt + ?
        WHERE id = ?
    ");

    foreach ($stakers as $user) {
        $staked = (float)$user['total_staked_usdt'];
        $currentEarnings = (float)$user['total_earning_towards_cap_usdt'];
        $maxCap = (float)$user['max_capping_limit_usdt'];

        if ($maxCap <= 0) {
            $maxCap = $staked * MAX_CAPPING_MULTIPLIER;
        }

        $grossDailyRoi = round($staked * ($dynamicDailyRoi / 100.0), 4);
        $remainingCap = max(0.0, $maxCap - $currentEarnings);

        // Enforce 300% maximum profit cap
        $creditedRoi = min($grossDailyRoi, $remainingCap);

        if ($creditedRoi <= 0) {
            $cappedUsersCount++;
            continue;
        }

        $remainingCapAfter = max(0.0, $remainingCap - $creditedRoi);
        if ($remainingCapAfter <= 0) {
            $cappedUsersCount++;
        }

        if (!$dryRun) {
            $payoutIns->execute([
                $user['wallet_address'],
                $user['user_id'],
                $staked,
                $dynamicDailyRoi,
                $grossDailyRoi,
                $creditedRoi,
                $remainingCapAfter
            ]);

            $userUpd->execute([
                $creditedRoi,
                $creditedRoi,
                $creditedRoi,
                $user['id']
            ]);
        }

        $totalUsersProcessed++;
        $totalRoiDistributed += $creditedRoi;
        $totalStakedEvaluated += $staked;

        if ($dryRun && count($previewRecords) < 10) {
            $previewRecords[] = [
                'user_id' => $user['user_id'],
                'wallet' => substr($user['wallet_address'], 0, 6) . '...' . substr($user['wallet_address'], -4),
                'staked' => $staked,
                'rate' => $dynamicDailyRoi . '%',
                'payout' => $creditedRoi,
                'remainingCap' => $remainingCapAfter
            ];
        }
    }

    $executionDuration = round(microtime(true) - $startTime, 4);

    if (!$dryRun) {
        // Record liquidity snapshot
        $liqIns = $pdo->prepare("
            INSERT INTO liquidity_history (total_liquidity_usdt, available_reserve_usdt, utilization_rate, daily_roi_percent)
            VALUES (?, ?, 74.40, ?)
        ");
        $liqIns->execute([$latestLiquidity, round($latestLiquidity * 0.744, 2), $dynamicDailyRoi]);

        // Record master cron execution log
        $cronLog = $pdo->prepare("
            INSERT INTO cron_logs (job_name, users_processed, total_payout_usdt, roi_rate_percent, execution_seconds, status)
            VALUES ('daily_dynamic_roi', ?, ?, ?, ?, 'completed')
        ");
        $cronLog->execute([$totalUsersProcessed, $totalRoiDistributed, $dynamicDailyRoi, $executionDuration]);

        $pdo->commit();
    }

    $summary = [
        'mode' => $dryRun ? 'DRY_RUN (No DB modifications)' : 'LIVE_EXECUTION',
        'date' => $today,
        'dynamicDailyRoiPercent' => $dynamicDailyRoi,
        'annualApyPercent' => $annualApy,
        'totalPoolReserveUsdt' => $latestLiquidity,
        'activeStakersProcessed' => $totalUsersProcessed,
        'totalStakedEvaluatedUsdt' => round($totalStakedEvaluated, 2),
        'totalRoiDistributedUsdt' => round($totalRoiDistributed, 4),
        'cappedAccountsCount' => $cappedUsersCount,
        'executionTimeSeconds' => $executionDuration,
        'previewRecords' => $dryRun ? $previewRecords : null
    ];

    sendResponse('success', 'Automated Daily APY & ROI distribution completed successfully', $summary);

} catch (Exception $e) {
    if (isset($pdo) && $pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    // Log failure
    try {
        if (isset($pdo) && $pdo) {
            $failLog = $pdo->prepare("
                INSERT INTO cron_logs (job_name, users_processed, total_payout_usdt, roi_rate_percent, execution_seconds, status, error_message)
                VALUES ('daily_dynamic_roi', 0, 0, 0, 0, 'failed', ?)
            ");
            $failLog->execute([$e->getMessage()]);
        }
    } catch (Exception $ign) {}

    sendResponse('error', 'Cron failure: ' . $e->getMessage(), null, 500);
}
