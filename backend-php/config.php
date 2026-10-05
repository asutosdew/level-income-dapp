<?php
/**
 * Morgan Treasure - Backend API Configuration & Shared Services
 * Hybrid Web3 Architecture: MariaDB / MySQL Backend + BSC Token Tracking
 */

// Avoid emitting HTTP headers if invoked from CLI (e.g. cron job)
if (php_sapi_name() !== 'cli') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CRON-KEY");
    header("Content-Type: application/json; charset=UTF-8");

    // Handle preflight OPTIONS request
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Database Credentials (MariaDB / MySQL on cPanel)
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'morgantreasure_morgantreasure');
define('DB_USER', getenv('DB_USER') ?: 'morgantreasure_root');
define('DB_PASS', getenv('DB_PASS') ?: 'Server@2050');

// BNB Smart Chain Details (Hybrid Token Display & Verification)
define('BSC_RPC_URL', getenv('BSC_RPC_URL') ?: 'https://bsc-dataseed.binance.org/');
define('BSC_CHAIN_ID', 56);
define('USDT_CONTRACT', getenv('USDT_CONTRACT') ?: '0x55d398326f99059fF775485246999027B3197955');
define('TREASURE_VAULT_CONTRACT', getenv('TREASURE_VAULT_CONTRACT') ?: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063');
define('MTG_TOKEN_CONTRACT', getenv('MTG_TOKEN_CONTRACT') ?: '0x3b892a0129bc489c441b8001e0029b9f77291a01');

// Protocol Business Rules (Exact Same Compensation Plan)
define('MAX_CAPPING_MULTIPLIER', 3.0);      // 300% maximum profit ceiling
define('WITHDRAWAL_FEE_PERCENT', 5.0);       // 5.00% liquidity fee (2.5% admin + 2.5% royalty)
define('MIN_WITHDRAWAL_USDT', 10.0);         // $10 USDT minimum withdrawal
define('MIN_DEPOSIT_USDT', 50.0);            // $50 USDT minimum deposit
define('MIN_DAILY_ROI_PERCENT', 0.50);       // 0.50% daily minimum
define('MAX_DAILY_ROI_PERCENT', 1.00);       // 1.00% daily maximum
define('TARGET_POOL_RESERVE', 3000000.0);    // $3,000,000 target reserve for 1.00% APY
define('BASE_POOL_RESERVE', 1000000.0);      // $1,000,000 base reserve for 0.50% APY
define('MTG_TOKEN_PRICE_USDT', 0.25);        // 1 MTG = $0.25 USDT
define('BNB_PRICE_USDT', 640.0);             // 1 BNB = 640 USDT

// 15-Tier Level Percentages
const LEVEL_COMMISSION_RATES = [
    1 => 10.0,
    2 => 5.0,
    3 => 3.0,
    4 => 2.0,
    5 => 1.0,
    6 => 0.5,
    7 => 0.5,
    8 => 0.5,
    9 => 0.5,
    10 => 0.5,
    11 => 0.25,
    12 => 0.25,
    13 => 0.25,
    14 => 0.25,
    15 => 0.25
];

// Direct Referrals Required to Unlock Tiers
const LEVEL_DIRECT_REQUIREMENTS = [
    1 => 1,
    2 => 2,
    3 => 3,
    4 => 4,
    5 => 5,
    6 => 6,
    7 => 7,
    8 => 8,
    9 => 9,
    10 => 10,
    11 => 11,
    12 => 12,
    13 => 13,
    14 => 14,
    15 => 15
];

// Security token for remote/web cron trigger
define('CRON_SECRET', getenv('CRON_SECRET') ?: 'MORGAN_CRON_SECRET_2026');

/**
 * MariaDB / MySQL Database Connection Helper
 */
function getDbConnection(): ?PDO {
    static $pdoInstance = null;
    if ($pdoInstance !== null) {
        return $pdoInstance;
    }

    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdoInstance = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        return $pdoInstance;
    } catch (PDOException $e) {
        // Return null for fallback mock handling if MariaDB is temporarily offline
        return null;
    }
}

/**
 * Standard Uniform JSON Response Helper
 */
function sendResponse(string $status, string $message, $data = null, int $httpCode = 200): void {
    if (php_sapi_name() !== 'cli') {
        http_response_code($httpCode);
        echo json_encode([
            'status' => $status,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('c')
        ], JSON_UNESCAPED_SLASHES);
        exit();
    } else {
        echo json_encode([
            'status' => $status,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('c')
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
        exit($status === 'success' ? 0 : 1);
    }
}

/**
 * Helper to get parsed JSON request body
 */
function getJsonPayload(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

/**
 * Helper to log all financial activities into master transactions table
 */
function logTransaction(
    PDO $pdo,
    string $walletAddress,
    string $userId,
    string $type,
    string $title,
    float $amountUsdt,
    float $feeUsdt,
    float $netAmountUsdt,
    string $status,
    string $txHash,
    string $network = 'BNB Chain',
    ?array $metadata = null
): int {
    $txId = 'tx_' . time() . '_' . substr(md5(uniqid((string)mt_rand(), true)), 0, 6);
    $metaStr = $metadata ? json_encode($metadata) : null;

    $stmt = $pdo->prepare("
        INSERT INTO transactions (
            tx_id, wallet_address, user_id, type, title, 
            amount_usdt, fee_usdt, net_amount_usdt, status, 
            tx_hash, network, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $txId,
        $walletAddress,
        $userId,
        $type,
        $title,
        $amountUsdt,
        $feeUsdt,
        $netAmountUsdt,
        $status,
        $txHash,
        $network,
        $metaStr
    ]);

    return (int)$pdo->lastInsertId();
}

/**
 * Helper to update user rank based on total staked & team volume
 */
function calculateUserRank(float $totalStaked, int $directsCount, float $teamVolume): string {
    if ($totalStaked >= 5000 && $directsCount >= 15 && $teamVolume >= 100000) {
        return 'Imperial Founder';
    } elseif ($totalStaked >= 1000 && $directsCount >= 12 && $teamVolume >= 50000) {
        return 'Crown Diamond Leader';
    } elseif ($totalStaked >= 500 && $directsCount >= 8 && $teamVolume >= 20000) {
        return 'Gold Treasure Leader';
    } elseif ($totalStaked >= 250 && $directsCount >= 5 && $teamVolume >= 10000) {
        return 'Silver Treasure Master';
    } elseif ($totalStaked >= 100 && $directsCount >= 2) {
        return 'Bronze Treasure Explorer';
    }
    return 'Treasure Explorer';
}

/**
 * Verifies on-chain transaction receipt via BNB Smart Chain RPC
 * Returns array: ['valid' => bool, 'receipt' => ?array, 'error' => ?string]
 */
function verifyBscTransactionReceipt(string $txHash): array {
    if (!preg_match('/^0x[a-fA-F0-9]{64}$/', $txHash)) {
        return ['valid' => false, 'receipt' => null, 'error' => 'Invalid transaction hash format. Must be 64-char hex.'];
    }

    $rpcEndpoints = [
        'https://bsc-dataseed.binance.org/',
        'https://bsc-dataseed1.defibit.io/',
        'https://rpc.ankr.com/bsc'
    ];

    $payload = json_encode([
        'jsonrpc' => '2.0',
        'method' => 'eth_getTransactionReceipt',
        'params' => [$txHash],
        'id' => 1
    ]);

    foreach ($rpcEndpoints as $rpcUrl) {
        $ch = curl_init($rpcUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT => 4,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_SSL_VERIFYPEER => false
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            if (isset($data['result']) && is_array($data['result'])) {
                $receipt = $data['result'];
                $status = $receipt['status'] ?? '';
                if ($status === '0x1') {
                    return ['valid' => true, 'receipt' => $receipt, 'error' => null];
                } else {
                    return ['valid' => false, 'receipt' => $receipt, 'error' => 'Transaction reverted on BNB Chain'];
                }
            }
        }
    }

    return ['valid' => false, 'receipt' => null, 'error' => 'Transaction not found or not yet mined on BNB Chain'];
}
