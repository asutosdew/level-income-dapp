# Morgan Treasure Protocol - Production Deployment & Architecture Guide

This comprehensive guide details how to deploy, configure, and automate the **Morgan Treasure** Web3 MLM & Staking Protocol, featuring production-ready Solidity smart contracts and an automated dynamic APY management PHP backend.

---

## 1. Protocol Architecture & Mathematical Specifications

| Parameter | Specification | Description |
| :--- | :--- | :--- |
| **Blockchain** | BNB Smart Chain (BSC) | Fast block times (~3s) and low transaction fees |
| **Token Standard** | BEP-20 USDT | BSC Mainnet: `0x55d398326f99059fF775485246999027B3197955` |
| **Dynamic Daily ROI** | **0.50% to 1.00% Daily** | Algorithmic floating yield based on vault liquid reserves |
| **Annual Percentage Yield (APY)**| **182.5% to 365.0% APR** | Continuous per-second block-timestamp reward accrual |
| **Max Earning Ceiling** | **300% (3.0x) Cap** | Hard ceiling on total earnings (ROI + Commissions) on active principal |
| **15-Tier Downline MLM** | **22.75% Total** | Instant affiliate commissions distributed across 15 upline tiers |
| **Withdrawal Liquidity Fee** | **5.00%** | Retained in vault reserve to boost pool depth and sustain dynamic yield |

### 15-Tier MLM Commission Breakdown & Unlock Matrix

| Level | Commission Rate | BPS | Direct Referrals Required to Unlock |
| :--- | :--- | :--- | :--- |
| **Level 1** | **10.00%** | 1000 | 1 Active Direct |
| **Level 2** | **5.00%** | 500 | 1 Active Direct |
| **Level 3** | **3.00%** | 300 | 2 Active Directs |
| **Level 4** | **2.00%** | 200 | 2 Active Directs |
| **Level 5** | **1.00%** | 100 | 2 Active Directs |
| **Level 6 – 10** | **0.50% each** | 50 each (250 BPS) | 3 Active Directs |
| **Level 11 – 15** | **0.25% each** | 25 each (125 BPS) | 5 Active Directs |
| **Total Allocation** | **22.75%** | **2275 BPS** | — |

---

## 2. Solidity Smart Contract Deployment (Hybrid Web3 Architecture)

### Contracts Suite:
1. `contracts/MTGToken.sol`:
   - Official BEP-20 Morgan Treasure Utility & Presale Token on BNB Chain.
   - Name: **Morgan Treasure**, Symbol: **MTG**, Decimals: **18**, Supply: **100,000,000 MTG**.
   - Presale Price: **$0.25 USDT**.
   - Supports minting/burning by authorized Hot-Wallet / PHP API operator.
2. `contracts/MorganTreasureVault.sol`:
   - Hybrid Non-Custodial USDT Staking & Treasury Vault.
   - Emits indexed Web3 events (`Staked`, `Deposited`, `Withdrawn`, `PayoutDisbursed`).
   - Automated Hot-Wallet Batch & Single Disbursement (`disbursePayout`, `disburseBatchPayouts`) for instant 24/7 withdrawals.
   - Dynamic APY curve (0.50% - 1.00% daily based on $1M - $3M vault reserve).
   - Gas-optimized: Offloads heavy 15-tier MLM recursive loops to MariaDB + PHP API for minimal BSC gas fees.
3. `contracts/MockUSDT.sol`:
   - Turnkey mock BEP-20 token for local, Hardhat, or BSC Testnet environments.

### Deployment via Remix IDE:
1. Open [https://remix.ethereum.org](https://remix.ethereum.org).

#### Step A: Deploy MTG Token (`contracts/MTGToken.sol`)
1. Create `MTGToken.sol` in Remix and paste `contracts/MTGToken.sol`.
2. Compile with Solidity `0.8.20` (Enable optimization: 200 runs).
3. In **Deploy & Run Transactions** (Injected Provider - MetaMask on BNB Chain):
   - Constructor args:
     - `initialHolder`: Founder / Treasury address (e.g. `0x9b32fa99834190cbbde029104fa2841b994801ac`)
     - `initialOperator`: Backend Hot-Wallet address (for automated API minting / disbursements)
   - Click **Deploy** and save the deployed `MTGToken` address.

#### Step B: Deploy Hybrid Vault (`contracts/MorganTreasureVault.sol`)
1. Create `MorganTreasureVault.sol` in Remix and paste `contracts/MorganTreasureVault.sol`.
2. Compile with Solidity `0.8.20` (Enable optimization: 200 runs).
3. In **Deploy & Run Transactions**:
   - Constructor args:
     - `_stakingToken`: `0x55d398326f99059fF775485246999027B3197955` (USDT on BSC Mainnet). For testnet, deploy `MockUSDT.sol` first and pass its address.
     - `_genesisSponsor`: Root founder wallet address (`0x9b32fa99834190cbbde029104fa2841b994801ac`).
     - `_treasuryReserve`: Protocol treasury cold wallet address.
     - `_initialOperator`: Backend Hot-Wallet address (authorized for PHP API payout disbursements).
   - Click **Transact** and confirm in MetaMask.
4. Save the deployed Vault address.

### BscScan 1-Click Verification:
1. Go to [https://bscscan.com](https://bscscan.com) (or [https://testnet.bscscan.com](https://testnet.bscscan.com)).
2. Navigate to your deployed contract address and click **Contract** > **Verify and Publish**.
3. Settings:
   - Compiler Type: **Solidity (Single file)**
   - Compiler Version: `v0.8.20`
   - Open Source License Type: **MIT License (MIT)**
4. Paste the respective `.sol` file content and click **Verify and Publish**.

---

## 3. Database Setup (MySQL / MariaDB)

1. Open your terminal or phpMyAdmin.
2. Create the database and import `schema.sql`:
   ```bash
   mysql -u morgantreasure_root -p -e "CREATE DATABASE IF NOT EXISTS morgantreasure_morgantreasure CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u morgantreasure_root -p morgantreasure_morgantreasure < backend-php/schema.sql
   mysql -u morgantreasure_root -p morgantreasure_morgantreasure < backend-php/seed_1000_users.sql
   ```
3. Schema Tables Included:
   - `users`: Core account profiles, staked principal, earnings towards 300% cap, and downline metrics.
   - `user_wallets`: Secure private key storage for all investor wallets.
   - `deposits`: Complete history of all staking packages.
   - `level_income`: 15-tier commission distribution logs.
   - `daily_roi_payouts`: Daily dynamic APY payouts credited by the cron engine.
   - `withdrawals`: Audit ledger of gross withdrawals, 5% liquidity retention fees, and net payouts.
   - `transactions`: Master unified transactions ledger.
   - `cron_logs`: Execution logs, duration, status, and idempotency protection.
   - `liquidity_history`: Time-series pool reserve depth and utilization rate.
   - `token_orders`: MTG token purchase history.

---

## 4. Backend PHP Configuration

Configured in `backend-php/config.php`:

```php
// Database Credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'morgantreasure_morgantreasure');
define('DB_USER', 'morgantreasure_root');
define('DB_PASS', 'Server@2050');

// Smart Contract Addresses
define('TREASURE_VAULT_CONTRACT', '0xYOUR_DEPLOYED_VAULT_ADDRESS');
define('USDT_CONTRACT', '0x55d398326f99059fF775485246999027B3197955');

// Cron Security Secret Key
define('CRON_SECRET', 'YOUR_HIGH_ENTROPY_SECRET_KEY_2026');
```

---

## 5. Automated Daily APY Cron Management

The automated APY management script (`backend-php/cron_daily_roi.php`) automatically:
1. Calculates the daily dynamic ROI (0.50% – 1.00%) floating with pool liquidity.
2. Selects all active stakers.
3. Checks each user's remaining ceiling under the **300% profit cap**.
4. Credits available balance and records transparent payout receipts inside an atomic MySQL transaction.
5. Guarantees **idempotency** (will not run twice on the same calendar day unless `--force` is specified).

### Option A: Linux Crontab (Automated Midnight UTC)
Edit crontab on your Linux server:
```bash
crontab -e
```
Add the following entry to execute every day at 00:00 UTC:
```cron
0 0 * * * /usr/bin/php /var/www/html/backend-php/cron_daily_roi.php >> /var/log/morgan_cron.log 2>&1
```

### Option B: Cloud Ping / External Webhook (e.g. EasyCron / Cron-Job.org / Cloudflare Worker)
Set up a daily scheduled HTTP GET request:
```http
GET https://api.yourdomain.com/backend-php/cron_daily_roi.php?key=YOUR_HIGH_ENTROPY_SECRET_KEY_2026
```

### Option C: Manual CLI Execution & Testing
```bash
# Dry run mode (previews calculation without altering database)
php backend-php/cron_daily_roi.php --dry-run

# Live execution
php backend-php/cron_daily_roi.php

# Force re-execution if already run today
php backend-php/cron_daily_roi.php --force
```

---

## 6. Web Server Configuration

### Nginx Virtual Host (`/etc/nginx/sites-available/morgan-api.conf`):
```nginx
server {
    listen 80;
    server_name api.morgantreasure.io;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.morgantreasure.io;

    ssl_certificate /etc/letsencrypt/live/api.morgantreasure.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.morgantreasure.io/privkey.pem;

    root /var/www/html/backend-php;
    index dashboard.php index.php;

    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Access-Control-Allow-Origin "*" always;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Deny access to sensitive files
    location ~ /\.(ht|git|env) {
        deny all;
    }
}
```

### Apache `.htaccess`:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>

<FilesMatch "schema\.sql|DEPLOYMENT\.md">
    Order allow,deny
    Deny from all
</FilesMatch>
```

---

## 7. Security Verification Checklist

- [x] **Solidity Compiler**: Verified clean compilation with `solc 0.8.20+` with 0 errors.
- [x] **Reentrancy Protection**: `ReentrancyGuard` implemented on all `deposit()`, `withdraw()`, and `withdrawAll()` methods.
- [x] **Capping Guard**: Hard mathematical 300% ceiling enforced on both on-chain smart contract and PHP cron distribution.
- [x] **SafeERC20**: Safe low-level transfer wrappers prevent silent token transfer failures.
- [x] **Cron Idempotency**: `cron_daily_roi.php` prevents accidental double-crediting on the same day.
- [x] **5% Liquidity Retention**: 5% fee retained in contract vault to reinforce reserve pool depth.
- [x] **Affiliate Direct Unlock Check**: Sponsors cannot unlock deeper downline tiers without satisfying active direct referral requirements.
