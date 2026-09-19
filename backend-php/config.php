<?php
/**
 * Morgan Treasure - Backend API Configuration
 * Supports MySQL PDO, CORS, BNB Chain RPC, and Automated APY Management
 */

// Avoid emitting HTTP headers if invoked from CLI (e.g. cron job)
if (php_sapi_name() !== 'cli') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");

    // Handle preflight OPTIONS request
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Database Credentials (Configure with your MySQL credentials)
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'morgan_treasure');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

// BNB Smart Chain Details
define('BSC_RPC_URL', getenv('BSC_RPC_URL') ?: 'https://bsc-dataseed.binance.org/');
define('BSC_CHAIN_ID', 56);
define('USDT_CONTRACT', getenv('USDT_CONTRACT') ?: '0x55d398326f99059fF775485246999027B3197955');
define('TREASURE_VAULT_CONTRACT', getenv('TREASURE_VAULT_CONTRACT') ?: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063');

// Protocol Business Rules
define('MAX_CAPPING_MULTIPLIER', 3.0);      // 300% maximum profit ceiling
define('WITHDRAWAL_FEE_PERCENT', 5.0);       // 5.00% liquidity fee
define('MIN_DAILY_ROI_PERCENT', 0.50);       // 0.50% daily minimum
define('MAX_DAILY_ROI_PERCENT', 1.00);       // 1.00% daily maximum
define('TARGET_POOL_RESERVE', 3000000.0);    // $3,000,000 target reserve for 1.00% APY
define('BASE_POOL_RESERVE', 1000000.0);      // $1,000,000 base reserve for 0.50% APY

// Security token for remote/web cron trigger
define('CRON_SECRET', getenv('CRON_SECRET') ?: 'MORGAN_CRON_SECRET_2026');

// Database Connection Helper
function getDbConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        // Return null for fallback mock handling
        return null;
    }
}

// Uniform JSON Response Helper
function sendResponse($status, $message, $data = null, $httpCode = 200) {
    if (php_sapi_name() !== 'cli') {
        http_response_code($httpCode);
        echo json_encode([
            'status' => $status,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('c')
        ]);
        exit();
    } else {
        echo json_encode([
            'status' => $status,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('c')
        ], JSON_PRETTY_PRINT) . PHP_EOL;
        exit($status === 'success' ? 0 : 1);
    }
}

// Helper to get raw JSON payload
function getJsonPayload() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}
