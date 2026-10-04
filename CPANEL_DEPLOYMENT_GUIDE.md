# cPanel Shared Hosting - Complete Step-by-Step Deployment Guide
**Project:** Morgan Treasure (Hybrid Web3 Staking & 15-Tier MLM DApp)

---

## 🏗️ Recommended cPanel Folder Structure

Aapke cPanel hosting me sabse aasan, secure aur standard setup ye hota hai:

```text
/home/YOUR_CPANEL_USER/public_html/
│
├── .htaccess                 <-- (Angular SPA Routing + HTTPS + /api Bypass)
├── index.html                <-- (Frontend Main File from dist/)
├── main-*.js                 <-- (Frontend Bundles)
├── styles-*.css              <-- (Frontend Styles)
├── assets/                   <-- (Logos, Icons, Fonts)
│
└── api/                      <-- (Backend PHP Scripts Folder - backend-php files)
    ├── config.php            <-- (MariaDB credentials, RPC & business rules)
    ├── register.php          <-- (Investor registration & sponsor linking)
    ├── deposit.php           <-- (Deposit, 300% capping & 15-level commissions)
    ├── withdraw.php          <-- (Withdrawal with 5% fee deduction)
    ├── dashboard.php         <-- (User stats, strong leg vs other leg volume)
    ├── team.php              <-- (Direct referrals & turnover API)
    ├── level_income.php      <-- (15-generation downline & earnings breakdown)
    ├── transactions.php      <-- (Master unified transaction history)
    ├── token_order.php       <-- (MTG token presale swap API)
    ├── claim_roi.php         <-- (On-demand daily ROI claim)
    ├── royalty.php           <-- (4 Royalty leadership clubs evaluation)
    ├── liquidity.php         <-- (Dynamic 0.50% - 1.00% daily ROI oracle)
    ├── cron_daily_roi.php    <-- (Automated midnight dynamic APY cron)
    └── admin.php             <-- (Protocol health & auditing API)
```

---

## 📌 Step 1: MariaDB / MySQL Database & User Banana (cPanel)

1. Apne **cPanel** dashboard me login karein.
2. **Databases** section me jakar **MySQL® Databases** par click karein.
3. **Create New Database**:
   - Database name daalein, jaise: `morgantreasure`
   - cPanel username prefix ke sath ye ban jayega: `username_morgantreasure`.
   - Click **Create Database**.
4. **Add New User**:
   - Username daalein, jaise: `dbuser` (full: `username_dbuser`).
   - Ek strong Password generate karein aur copy karke safe jagah save karein.
   - Click **Create User**.
5. **Add User to Database**:
   - User dropdown me `username_dbuser` select karein.
   - Database dropdown me `username_morgantreasure` select karein.
   - Click **Add**.
   - **ALL PRIVILEGES** checkbox par tick karein aur **Make Changes** par click karein.

---

## 📌 Step 2: Database Tables & Seed Data Import Karna (phpMyAdmin)

1. cPanel dashboard par wapas jayein aur **phpMyAdmin** par click karein.
2. Left sidebar me apna banaya hua database (`username_morgantreasure`) select karein.
3. Top navigation menu me **Import** tab par click karein.
4. **Choose File** par click karke repository me maujood `backend-php/schema.sql` file select karein.
5. Page ke bottom me **Import / Go** button par click kar dein.
6. ✅ Saare tables (`users`, `packages`, `deposits`, `level_income`, `daily_roi_payouts`, `withdrawals`, `transactions`, `token_orders`, `royalty_clubs`, `royalty_payouts`, `liquidity_history`, `cron_logs`, `system_settings`) aur Genesis Seed Data turant create ho jayenge.

---

## 📌 Step 3: Backend PHP Upload Karna (`public_html/api/`)

1. cPanel me **File Manager** open karein.
2. `public_html` directory me jayein.
3. Top bar se **+ Folder** par click karein aur folder ka naam rakhein: `api`.
4. Is `public_html/api/` folder ke andar jayein.
5. Apne computer ke `backend-php/` folder se in sabhi files ko upload karein:
   - `config.php`
   - `register.php`
   - `deposit.php`
   - `withdraw.php`
   - `dashboard.php`
   - `team.php`
   - `level_income.php`
   - `transactions.php`
   - `token_order.php`
   - `claim_roi.php`
   - `royalty.php`
   - `liquidity.php`
   - `cron_daily_roi.php`
   - `admin.php`
6. `config.php` file par right-click karke **Edit** karein aur Step 1 wale credentials daalein:
   ```php
   // Database Credentials (MariaDB / MySQL)
   define('DB_HOST', 'localhost');
   define('DB_PORT', '3306');
   define('DB_NAME', 'username_morgantreasure');
   define('DB_USER', 'username_dbuser');
   define('DB_PASS', 'Aapka_Database_Password');

   // Cron Secret Key
   define('CRON_SECRET', 'MORGAN_CRON_SECRET_2026');
   ```
7. Click **Save Changes**.

---

## 📌 Step 4: Frontend Build & Upload Karna (`public_html/`)

1. Apne local computer terminal me project directory me run karein:
   ```bash
   npm run build
   ```
2. Build complete hone ke baad `dist/level-income-dapp/browser` folder me files generate hongi:
   - `index.html`
   - `main-*.js`
   - `styles-*.css`
   - `polyfills-*.js`
   - `assets/` ya public static files
3. In files ko select karke ek zip file (`frontend_build.zip`) banayein.
4. cPanel **File Manager** me `public_html/` root me upload karein aur **Extract** kar dein.
5. Project root me di gayi ready-to-use `.htaccess` file ko bhi `public_html/` root me upload karein.
   *(Ye file Angular SPA routes ko sahi se handle karegi, HTTPS force karegi, aur `/api/` calls ko directly PHP tak pahunchayegi).*

---

## 📌 Step 5: cPanel me Automated APY / Daily ROI Cron Job Set Karna

Rozana raat 12:00 baje (00:00 UTC) automatic dynamic ROI (0.50% - 1.00%) calculate aur stakers ko credit karne ke liye:

1. cPanel dashboard par jayein aur search bar me type karein **Cron Jobs**.
2. **Add New Cron Job**:
   - **Common Settings**: Select karein **Once Per Day (0 0 * * *)** (Midnight).
3. **Command**:
   cPanel shared hosting ke liye sabse reliable command `curl` hota hai:
   ```bash
   curl -s "https://yourdomain.com/api/cron_daily_roi.php?key=MORGAN_CRON_SECRET_2026" > /dev/null 2>&1
   ```
   *(Yahan `yourdomain.com` ki jagah apna domain aur `MORGAN_CRON_SECRET_2026` ki jagah `config.php` wali secret key likhein).*
4. Click **Add New Cron Job**.

---

## ✅ Deployment Verification & Testing

1. **Website Test**:
   - Browser me `https://yourdomain.com/` kholein.
   - Home, Stake, 15 Levels, Team aur Withdraw pages browse karein.
2. **API Verification**:
   - Browser me `https://yourdomain.com/api/liquidity.php` kholein.
   - Response me `{"status":"success","data":{...}}` dikhna chahiye.
3. **Cron Simulation Test**:
   - Browser me kholein:
     `https://yourdomain.com/api/cron_daily_roi.php?key=MORGAN_CRON_SECRET_2026&dry_run=1`
   - Ye real balances ko touch kiye bina complete distribution preview report dega.
4. **Admin Overview Test**:
   - Browser me `https://yourdomain.com/api/admin.php` kholein to platform-wide stakers count aur vault reserve status display hoga.
