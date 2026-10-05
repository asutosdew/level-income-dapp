# Morgan Treasure - Hybrid Web3 Architecture & MariaDB PHP API Suite

This directory contains the production-ready **PHP REST API & MariaDB Backend** for the **Morgan Treasure** Hybrid Web3 Investment Platform.

---

## 🏛️ Hybrid Model Architecture Overview

In this Hybrid model:
1. **Blockchain Layer (BNB Smart Chain / BSC)**:
   - MTG Token (BEP-20) and USDT contracts live on BSC.
   - Users connect via MetaMask, TrustWallet, or Binance Web3.
   - Wallet addresses serve as immutable cryptographic user IDs.
   - Token balances and transaction hashes are verifiable on BscScan.
2. **Database & API Layer (MariaDB / MySQL + PHP 8.x)**:
   - **All Team & Genealogy**: Multi-level sponsor tree, downline generations (Levels 1 to 15), direct referrals.
   - **All Investments**: Staking packages ($50 Starter to $5,000 Imperial Treasure or custom), daily ROI rate at deposit, transaction hashes.
   - **All Returns & Earnings**:
     - Dynamic Daily ROI (0.50% to 1.00% daily, floating with liquidity reserve depth).
     - 15-Tier MLM Level Income (10%, 5%, 3%, 2%, 1%, 0.5% × 5, 0.25% × 5).
     - Direct Referral Bonus (10%).
     - Strict 300% (3.0x) Max Profit Capping Enforcement.
     - 4 Royalty Leadership Clubs (Treasure Star, Morgan Ruby, Morgan Emerald, Crown Diamond).
   - **All Transactions**: Master audit ledger (`transactions` table) tracking deposits, withdrawals, daily ROI payouts, level commissions, and token purchases.
   - **Withdrawals**: Deducts 5% liquidity retention fee (2.5% admin + 2.5% royalty pool) and processes net payouts.

---

## 📋 Complete API Endpoints Suite

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `GET /liquidity.php` | GET | Real-time liquidity pool reserve, 0.50%–1.00% dynamic daily ROI rate, and 7-day history |
| `POST /register.php` | POST | Register BEP-20 wallet address with Sponsor ID binding and genealogy hierarchy |
| `GET /dashboard.php?address=0x...` | GET | User portfolio, balances, 300% capping status, strong leg vs other legs volume |
| `POST /deposit.php` | POST | Record BEP-20 USDT deposit, update 300% capping limit, distribute 15-tier MLM commissions |
| `GET /level_income.php?address=0x...` | GET | 15-generation downline counts, active stakers, turnovers, and unlock criteria |
| `GET /team.php?address=0x...` | GET | Direct referrals (Level 1) with active package, stake, commission, and joined date |
| `GET /transactions.php?address=0x...` | GET | Unified master ledger history (Deposits, Withdrawals, ROI, Commissions, Token Buys) |
| `POST /withdraw.php` | POST | Process USDT withdrawal with 5% liquidity retention fee and balance deduction |
| `POST /token_order.php` | POST | Record MTG Token Presale Swap (paid via BNB or USDT) and update metrics |
| `POST /claim_roi.php` | POST | On-demand dynamic daily staking ROI claim with 300% capping enforcement |
| `GET /royalty.php?address=0x...` | GET | Evaluate user qualification for 4 Royalty Leadership Clubs and rewards |
| `GET /admin.php` | GET | Platform-wide metrics, total stakers, vault reserve health, and audit trail |
| `GET /cron_daily_roi.php` | GET/CLI | Automated midnight dynamic APY/ROI engine with idempotency protection |

---

## 🗄️ Database Setup (MariaDB / MySQL)

### 1. Database Setup & Import
Database details configured on your server:
- **Database Name**: `morgantreasure_morgantreasure`
- **Username**: `morgantreasure_root`
- **Password**: `Server@2050`

Import command via terminal or phpMyAdmin:
```bash
mysql -u morgantreasure_root -p morgantreasure_morgantreasure < schema.sql
mysql -u morgantreasure_root -p morgantreasure_morgantreasure < seed_1000_users.sql
```

### 2. Live Credentials in `config.php`
`config.php` is pre-configured with:
```php
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'morgantreasure_morgantreasure');
define('DB_USER', getenv('DB_USER') ?: 'morgantreasure_root');
define('DB_PASS', getenv('DB_PASS') ?: 'Server@2050');
```

---

## ⏱️ Automated Dynamic ROI Cron Job

To run the automated daily APY distribution automatically at midnight UTC:

### Linux Crontab:
```bash
0 0 * * * /usr/bin/php /path/to/backend-php/cron_daily_roi.php >> /var/log/morgan_cron.log 2>&1
```

### Remote Webhook Trigger (e.g. cPanel Cron or Cron-Job.org):
```
GET https://your-domain.com/backend-php/cron_daily_roi.php?key=MORGAN_CRON_SECRET_2026
```
