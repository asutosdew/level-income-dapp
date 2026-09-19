# Morgan Treasure - PHP Backend API Suite

This directory contains the complete PHP REST API backend for **Morgan Treasure**, designed to run on Apache, Nginx, XAMPP, or cPanel.

## Endpoints Included

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `GET /liquidity.php` | GET | Real-time liquidity pool status & dynamic 0.5%–1.0% daily ROI rate |
| `POST /register.php` | POST | Register BEP-20 wallet address with Sponsor ID/referral binding |
| `GET /dashboard.php?address=0x...` | GET | User portfolio, active packages, available balances, and capping limit |
| `POST /deposit.php` | POST | Record on-chain USDT deposit and distribute 15-level commissions |
| `GET /level_income.php?address=0x...` | GET | 15-tier level income analytics and unlock tracking |
| `GET /team.php?address=0x...` | GET | Direct referrals and downline network metrics |

---

## Quick Start (Local Development)

### 1. Start the PHP Built-in Server
Open your terminal in this directory:
```bash
cd backend-php
php -S localhost:8000
```

### 2. Optional: Setup MySQL Database
1. Create a MySQL database named `morgan_treasure`.
2. Import the `schema.sql` file via phpMyAdmin or command line:
   ```bash
   mysql -u root -p morgan_treasure < schema.sql
   ```
3. Update `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` in `config.php` if needed.

> [!NOTE]
> Even if MySQL is not configured yet, the API scripts include intelligent fallback responses so the Angular DApp works seamlessly right out of the box!
