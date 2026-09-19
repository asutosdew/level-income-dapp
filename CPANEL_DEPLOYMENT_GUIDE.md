# cPanel Shared Hosting - Step-by-Step Deployment Guide
**Project:** Morgan Treasure (Web3 Staking & 15-Tier MLM DApp)

---

## 🏗️ Recommended cPanel Folder Structure

Aapke cPanel hosting me sabse aasan aur secure setup ye hota hai:

```text
/home/YOUR_CPANEL_USER/public_html/
│
├── .htaccess                 <-- (Angular SPA Routing + HTTPS + API Bypass)
├── index.html                <-- (Frontend Main File from dist/)
├── main-*.js                 <-- (Frontend Bundles)
├── styles-*.css              <-- (Frontend Styles)
├── assets/                   <-- (Logos, Icons, Fonts)
│
└── api/                      <-- (Backend PHP Scripts Folder)
    ├── config.php            <-- (Database connection & Contract Address)
    ├── cron_daily_roi.php    <-- (Automated APY Management Cron)
    ├── dashboard.php         <-- (User stats API)
    ├── deposit.php           <-- (Deposit & MLM Commission API)
    ├── withdraw.php          <-- (Withdrawal with 5% fee API)
    ├── liquidity.php         <-- (Dynamic Pool APY API)
    ├── register.php          <-- (Registration API)
    ├── team.php              <-- (Downline Tree API)
    └── level_income.php      <-- (Commission History API)
```

---

## 📌 Step 1: MySQL Database & User Banana (cPanel)

1. Apne **cPanel** dashboard me login karein.
2. **Databases** section me jakar **MySQL® Databases** par click karein.
3. **Create New Database**:
   - Naam daalein, jaise: `morgantreasure`
   - cPanel prefix milakar ye ban jayega: `username_morgantreasure`.
   - Click **Create Database**.
4. **Add New User**:
   - Username daalein, jaise: `dbuser` (full: `username_dbuser`).
   - Ek strong Password generate karein aur use copy karke rakh lein.
   - Click **Create User**.
5. **Add User to Database**:
   - User dropdown me `username_dbuser` select karein.
   - Database dropdown me `username_morgantreasure` select karein.
   - Click **Add**.
   - Checkbox **ALL PRIVILEGES** par tick karein aur **Make Changes** par click karein.

---

## 📌 Step 2: Database Tables Import Karna (phpMyAdmin)

1. cPanel dashboard par wapas aayein aur **phpMyAdmin** par click karein.
2. Left sidebar se apna database (`username_morgantreasure`) select karein.
3. Top navigation menu me **Import** tab par click karein.
4. **Choose File** par click karke apne computer se [`backend-php/schema.sql`](file:///C:/Users/Ashutush%20Dewangan/.gemini/antigravity/scratch/level-income-dapp/backend-php/schema.sql) file select karein.
5. Page ke bottom me **Import / Go** button par click kar dein.
6. ✅ Saare 8 tables (`users`, `deposits`, `daily_roi_payouts`, `withdrawals`, `cron_logs`, `liquidity_history`, etc.) ban jayenge.

---

## 📌 Step 3: Backend PHP Upload Karna (`public_html/api/`)

1. cPanel me **File Manager** open karein.
2. `public_html` folder ke andar jayein.
3. Top bar se **+ Folder** par click karein aur folder ka naam rakhein: `api`.
4. Is `api/` folder ke andar jayein.
5. Apne computer ke `backend-php/` folder se in files ko upload karein:
   - `config.php`
   - `cron_daily_roi.php`
   - `dashboard.php`
   - `deposit.php`
   - `withdraw.php`
   - `liquidity.php`
   - `register.php`
   - `team.php`
   - `level_income.php`
6. `config.php` file par right-click karke **Edit** karein:
   ```php
   // Database Details (Apne cPanel ke hisaab se)
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'username_morgantreasure');
   define('DB_USER', 'username_dbuser');
   define('DB_PASS', 'Apka_Database_Password');

   // Smart contract deploy hone ke baad uska address:
   define('TREASURE_VAULT_CONTRACT', '0xYOUR_VAULT_CONTRACT_ADDRESS');

   // Cron Secret Key
   define('CRON_SECRET', 'MorganSecretKey2026');
   ```
7. Click **Save Changes**.

---

## 📌 Step 4: Smart Contract Deploy Karna (Remix IDE)

1. Chrome browser me [https://remix.ethereum.org](https://remix.ethereum.org) open karein.
2. Contracts folder me ek file banayein: `MorganTreasureVault.sol`.
3. Isme [`contracts/MorganTreasureVault.sol`](file:///C:/Users/Ashutush%20Dewangan/.gemini/antigravity/scratch/level-income-dapp/contracts/MorganTreasureVault.sol) ka poora code copy-paste karein.
4. **Solidity Compiler** me version `0.8.20` select karein, **Enable optimization (200)** tick karein aur **Compile** karein.
5. **Deploy & Run Transactions** me Environment: **Injected Provider - MetaMask** select karein (BNB Smart Chain network).
6. Constructor arguments bharein:
   - `_stakingToken`: `0x55d398326f99059fF775485246999027B3197955` (USDT on BSC Mainnet)
   - `_genesisSponsor`: *Apna Founder Wallet Address*
   - `_treasuryReserve`: *Apna Treasury Wallet Address*
7. Click **Transact** aur MetaMask se confirm karein.
8. Deployed Contract Address ko copy karein aur step 3 ke `config.php` me paste kar dein.

---

## 📌 Step 5: Frontend Build & Upload Karna (`public_html/`)

1. Apne computer terminal me run karein:
   ```bash
   npm run build
   ```
2. Build hone ke baad `dist/level-income-dapp/browser` folder me jayein.
3. Is folder ke andar ki saari files (jaise `index.html`, saari `.js` aur `.css` files, `assets` folder) ko zip karein.
4. cPanel **File Manager** me `public_html/` root me upload karke **Extract** kar dein.
5. Project root me di gayi ready-to-use [`.htaccess`](file:///C:/Users/Ashutush%20Dewangan/.gemini/antigravity/scratch/level-income-dapp/.htaccess) file ko bhi `public_html/` me upload karein.
   *(Isse page refresh karne par 404 error nahi aayega aur mobile users ke liye site super fast load hogi).*

---

## 📌 Step 6: cPanel me Automated APY Cron Job Set Karna

Rozana raat 12:00 baje (00:00 UTC) automatic dynamic ROI calculate aur sabhi investors ko credit karne ke liye:

1. cPanel dashboard par jayein aur search bar me type karein **Cron Jobs**.
2. **Cron Email**: Apna email address daal sakte hain taaki report milti rahe.
3. **Add New Cron Job**:
   - **Common Settings**: Select karein **Once Per Day (0 0 * * *)** (Raat 12 baje).
4. **Command Box**: cPanel me shared hosting ke liye sabse reliable **curl** command ye hai:
   ```bash
   curl -s "https://yourdomain.com/api/cron_daily_roi.php?key=MorganSecretKey2026" > /dev/null 2>&1
   ```
   *(Yahan `yourdomain.com` ki jagah apna domain aur `MorganSecretKey2026` ki jagah `config.php` wali secret key likhein).*
5. Click **Add New Cron Job**.

---

## ✅ Testing Your Live Deployment

1. **Website Test**: Apne browser me `https://yourdomain.com` kholein. Mobile view aur desktop view check karein.
2. **API Test**: Browser me `https://yourdomain.com/api/liquidity.php` kholein. Ye dynamic daily ROI (0.50% - 1.00%) ka JSON response dega.
3. **Cron Test**: Browser me `https://yourdomain.com/api/cron_daily_roi.php?key=MorganSecretKey2026&dry_run=1` kholein. Ye live database ko touch kiye bina simulation preview dikhayega.
