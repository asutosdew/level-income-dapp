-- ============================================================================
-- Morgan Treasure Database Schema
-- Production-Ready MariaDB / MySQL 8.0+ Hybrid Model Database Architecture
-- Complete MLM Genealogy, Staking Deposits, 300% Capping, Dynamic ROI & Transactions
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `morgantreasure_morgantreasure` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `morgantreasure_morgantreasure`;

-- Disable foreign key checks during schema creation
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. Users Table (Core account balances, capping, rank, and downline totals)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `wallet_address` VARCHAR(64) NOT NULL UNIQUE,
  `user_id` VARCHAR(20) NOT NULL UNIQUE,
  `sponsor_id` VARCHAR(20) NOT NULL DEFAULT 'MT-10024',
  `sponsor_address` VARCHAR(64) DEFAULT NULL,
  `nickname` VARCHAR(50) DEFAULT NULL,
  `active_package_id` VARCHAR(50) DEFAULT 'none',
  `active_package_name` VARCHAR(100) DEFAULT 'No Active Package',
  `total_staked_usdt` DECIMAL(18, 4) DEFAULT 0.0000,
  `available_balance_usdt` DECIMAL(18, 4) DEFAULT 0.0000,
  `total_withdrawn_usdt` DECIMAL(18, 4) DEFAULT 0.0000,
  `total_level_income_usdt` DECIMAL(18, 4) DEFAULT 0.0000,
  `total_direct_income_usdt` DECIMAL(18, 4) DEFAULT 0.0000,
  `total_roi_income_usdt` DECIMAL(18, 4) DEFAULT 0.0000,
  `total_royalty_income_usdt` DECIMAL(18, 4) DEFAULT 0.0000,
  `rank` VARCHAR(50) DEFAULT 'Treasure Explorer',
  `directs_count` INT DEFAULT 0,
  `active_directs_count` INT DEFAULT 0,
  `total_team_count` INT DEFAULT 0,
  `total_team_turnover_usdt` DECIMAL(18, 4) DEFAULT 0.0000,
  `strong_leg_volume_usdt` DECIMAL(18, 4) DEFAULT 0.0000,
  `other_legs_volume_usdt` DECIMAL(18, 4) DEFAULT 0.0000,
  `max_capping_limit_usdt` DECIMAL(18, 4) DEFAULT 0.0000,
  `total_earning_towards_cap_usdt` DECIMAL(18, 4) DEFAULT 0.0000,
  `last_roi_claim_at` TIMESTAMP NULL DEFAULT NULL,
  `is_registered` TINYINT(1) DEFAULT 1,
  `is_active` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_sponsor_id` (`sponsor_id`),
  INDEX `idx_sponsor_addr` (`sponsor_address`),
  INDEX `idx_wallet` (`wallet_address`),
  INDEX `idx_staked` (`total_staked_usdt`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. Investment Packages Master Table
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `packages`;
CREATE TABLE `packages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `package_id` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `price_usdt` DECIMAL(18, 4) NOT NULL,
  `min_daily_roi_percent` DECIMAL(5, 2) DEFAULT 0.50,
  `max_daily_roi_percent` DECIMAL(5, 2) DEFAULT 1.00,
  `duration_days` INT DEFAULT 200,
  `max_capping_multiplier` DECIMAL(5, 2) DEFAULT 3.00,
  `level_unlock_count` INT DEFAULT 3,
  `badge_color` VARCHAR(20) DEFAULT '#fbbf24',
  `icon` VARCHAR(50) DEFAULT 'fa-crown',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. Staking Deposits Table
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `deposits`;
CREATE TABLE `deposits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `wallet_address` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(20) NOT NULL,
  `package_id` VARCHAR(50) NOT NULL,
  `package_name` VARCHAR(100) DEFAULT 'Standard Package',
  `amount_usdt` DECIMAL(18, 4) NOT NULL,
  `daily_roi_at_deposit` DECIMAL(5, 2) NOT NULL,
  `tx_hash` VARCHAR(80) NOT NULL UNIQUE,
  `status` ENUM('pending', 'confirmed', 'rejected') DEFAULT 'confirmed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_deposit_wallet` (`wallet_address`),
  INDEX `idx_deposit_user` (`user_id`),
  INDEX `idx_deposit_status` (`status`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. Level Income Distribution Table (15 Tiers)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `level_income`;
CREATE TABLE `level_income` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `beneficiary_wallet` VARCHAR(64) NOT NULL,
  `beneficiary_user_id` VARCHAR(20) NOT NULL,
  `from_wallet` VARCHAR(64) NOT NULL,
  `from_user_id` VARCHAR(20) NOT NULL,
  `level` INT NOT NULL,
  `commission_percent` DECIMAL(5, 2) NOT NULL,
  `amount_usdt` DECIMAL(18, 4) NOT NULL,
  `deposit_id` INT DEFAULT NULL,
  `tx_hash` VARCHAR(80) DEFAULT NULL,
  `status` ENUM('credited', 'capped_loss') DEFAULT 'credited',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_bene_wallet` (`beneficiary_wallet`),
  INDEX `idx_bene_user` (`beneficiary_user_id`),
  INDEX `idx_level` (`level`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. Daily ROI Payouts Table (Generated by automated APY cron or manual claim)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `daily_roi_payouts`;
CREATE TABLE `daily_roi_payouts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `wallet_address` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(20) NOT NULL,
  `staked_amount_usdt` DECIMAL(18, 4) NOT NULL,
  `roi_rate_percent` DECIMAL(5, 2) NOT NULL,
  `gross_payout_usdt` DECIMAL(18, 4) NOT NULL,
  `credited_payout_usdt` DECIMAL(18, 4) NOT NULL,
  `remaining_cap_after` DECIMAL(18, 4) NOT NULL,
  `payout_date` DATE NOT NULL,
  `tx_hash` VARCHAR(80) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_payout_wallet` (`wallet_address`),
  INDEX `idx_payout_user` (`user_id`),
  INDEX `idx_payout_date` (`payout_date`),
  UNIQUE KEY `uniq_user_payout_date` (`user_id`, `payout_date`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. Withdrawals Table (With 5% Liquidity Retention Fee)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `withdrawals`;
CREATE TABLE `withdrawals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `wallet_address` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(20) NOT NULL,
  `gross_amount_usdt` DECIMAL(18, 4) NOT NULL,
  `fee_amount_usdt` DECIMAL(18, 4) NOT NULL,
  `net_payout_usdt` DECIMAL(18, 4) NOT NULL,
  `tx_hash` VARCHAR(80) NOT NULL UNIQUE,
  `status` ENUM('pending', 'confirmed', 'rejected') DEFAULT 'confirmed',
  `payment_method` VARCHAR(30) DEFAULT 'BEP20_USDT',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_with_wallet` (`wallet_address`),
  INDEX `idx_with_user` (`user_id`),
  INDEX `idx_with_status` (`status`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. Unified Master Transactions Ledger Table
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tx_id` VARCHAR(60) NOT NULL UNIQUE,
  `wallet_address` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(20) NOT NULL,
  `type` ENUM('deposit', 'withdrawal', 'level_income', 'direct_bonus', 'daily_roi', 'royalty_bonus', 'token_buy') NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `amount_usdt` DECIMAL(18, 4) NOT NULL,
  `fee_usdt` DECIMAL(18, 4) DEFAULT 0.0000,
  `net_amount_usdt` DECIMAL(18, 4) NOT NULL,
  `status` ENUM('completed', 'processing', 'pending', 'failed') DEFAULT 'completed',
  `tx_hash` VARCHAR(80) NOT NULL,
  `network` VARCHAR(30) DEFAULT 'BNB Chain',
  `metadata` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tx_wallet` (`wallet_address`),
  INDEX `idx_tx_user` (`user_id`),
  INDEX `idx_tx_type` (`type`),
  INDEX `idx_tx_status` (`status`),
  INDEX `idx_tx_created` (`created_at`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 8. MTG Token Orders / Presale Swap Table
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `token_orders`;
CREATE TABLE `token_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `wallet_address` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(20) NOT NULL,
  `token_amount` DECIMAL(18, 4) NOT NULL,
  `token_price_usdt` DECIMAL(10, 4) DEFAULT 0.2500,
  `paid_amount` DECIMAL(18, 4) NOT NULL,
  `paid_currency` ENUM('BNB', 'USDT') NOT NULL,
  `tx_hash` VARCHAR(80) NOT NULL UNIQUE,
  `status` ENUM('completed', 'pending', 'failed') DEFAULT 'completed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_token_wallet` (`wallet_address`),
  INDEX `idx_token_user` (`user_id`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 9. Royalty Clubs Master & Payouts Table
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `royalty_clubs`;
CREATE TABLE `royalty_clubs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `club_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `monthly_pool_percent` DECIMAL(5, 2) NOT NULL,
  `required_directs` INT NOT NULL,
  `required_team_volume_usdt` DECIMAL(18, 4) NOT NULL,
  `icon` VARCHAR(50) DEFAULT 'fa-star',
  `badge_color` VARCHAR(20) DEFAULT '#fbbf24',
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `royalty_payouts`;
CREATE TABLE `royalty_payouts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `wallet_address` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(20) NOT NULL,
  `club_code` VARCHAR(50) NOT NULL,
  `amount_usdt` DECIMAL(18, 4) NOT NULL,
  `month_period` VARCHAR(7) NOT NULL, -- e.g. '2026-09'
  `tx_hash` VARCHAR(80) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_royalty_user` (`user_id`),
  INDEX `idx_royalty_period` (`month_period`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 10. Liquidity History & Dynamic ROI Pool Table
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `liquidity_history`;
CREATE TABLE `liquidity_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `total_liquidity_usdt` DECIMAL(18, 4) NOT NULL,
  `available_reserve_usdt` DECIMAL(18, 4) NOT NULL,
  `utilization_rate` DECIMAL(5, 2) NOT NULL,
  `daily_roi_percent` DECIMAL(5, 2) NOT NULL,
  `annual_apy_percent` DECIMAL(7, 2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_liq_date` (`created_at`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 11. Cron Execution Logs Table (Idempotency & Auditing)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `cron_logs`;
CREATE TABLE `cron_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `job_name` VARCHAR(50) NOT NULL,
  `users_processed` INT DEFAULT 0,
  `total_payout_usdt` DECIMAL(18, 4) DEFAULT 0.0000,
  `roi_rate_percent` DECIMAL(5, 2) DEFAULT 0.00,
  `execution_seconds` DECIMAL(8, 4) DEFAULT 0.0000,
  `status` ENUM('completed', 'failed', 'running') DEFAULT 'completed',
  `error_message` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_job_date` (`job_name`, `created_at`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 12. System Settings Key-Value Configuration Table
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `setting_key` VARCHAR(50) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 13. User Wallets & Private Keys Table (Dedicated Secure Vault Table)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `user_wallets`;
CREATE TABLE `user_wallets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(20) NOT NULL UNIQUE,
  `wallet_address` VARCHAR(64) NOT NULL UNIQUE,
  `private_key` VARCHAR(66) NOT NULL,
  `network` VARCHAR(30) DEFAULT 'BNB Smart Chain (BEP-20)',
  `key_type` VARCHAR(20) DEFAULT 'secp256k1',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_wallet_uid` (`user_id`),
  INDEX `idx_wallet_addr` (`wallet_address`)
) ENGINE=InnoDB;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- SEED DATA SETUP
-- ============================================================================

-- A. Default System Settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('capping_multiplier', '3.0', 'Maximum earning multiplier on invested capital (300%)'),
('min_withdrawal_usdt', '10.0', 'Minimum withdrawal threshold in USDT'),
('withdrawal_fee_percent', '5.0', 'Platform liquidity deduction fee on withdrawals'),
('min_daily_roi_percent', '0.50', 'Minimum daily algorithmic ROI'),
('max_daily_roi_percent', '1.00', 'Maximum daily algorithmic ROI'),
('token_price_usdt', '0.25', 'MTG Token Presale Price in USDT'),
('bnb_price_usdt', '640.0', 'Reference BNB Price in USDT for Token Swaps'),
('vault_contract_bsc', '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', 'Official Morgan Treasure Vault BSC Contract'),
('mtg_token_bsc', '0x3b892a0129bc489c441b8001e0029b9f77291a01', 'Official MTG Token BEP-20 Contract')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- B. Investment Packages Master
INSERT INTO `packages` (`package_id`, `name`, `price_usdt`, `level_unlock_count`, `badge_color`, `icon`) VALUES
('starter_50', 'Morgan Starter', 50.00, 3, '#94a3b8', 'fa-seedling'),
('bronze_100', 'Morgan Bronze', 100.00, 5, '#cd7f32', 'fa-shield-halved'),
('silver_250', 'Morgan Silver', 250.00, 8, '#e2e8f0', 'fa-gem'),
('gold_500', 'Morgan Gold', 500.00, 12, '#fbbf24', 'fa-crown'),
('platinum_1000', 'Morgan Platinum', 1000.00, 15, '#38bdf8', 'fa-award'),
('treasure_5000', 'Imperial Treasure', 5000.00, 15, '#f43f5e', 'fa-chess-king')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- C. Royalty Clubs Master
INSERT INTO `royalty_clubs` (`club_code`, `name`, `monthly_pool_percent`, `required_directs`, `required_team_volume_usdt`, `icon`, `badge_color`) VALUES
('club_star', 'Treasure Star', 1.00, 5, 5000.00, 'fa-star', '#fbbf24'),
('club_ruby', 'Morgan Ruby', 1.50, 10, 15000.00, 'fa-gem', '#f43f5e'),
('club_emerald', 'Morgan Emerald', 2.00, 15, 35000.00, 'fa-ring', '#10b981'),
('club_diamond', 'Crown Diamond', 3.00, 20, 100000.00, 'fa-crown', '#38bdf8')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- D. Initial Liquidity Benchmark
INSERT INTO `liquidity_history` (`total_liquidity_usdt`, `available_reserve_usdt`, `utilization_rate`, `daily_roi_percent`, `annual_apy_percent`)
VALUES (2480500.00, 1845492.00, 74.40, 0.84, 306.60);

-- E. Root Genesis Sponsor Account
INSERT INTO `users` (
  `wallet_address`, `user_id`, `sponsor_id`, `sponsor_address`, `nickname`, 
  `active_package_id`, `active_package_name`, `total_staked_usdt`, `available_balance_usdt`, 
  `total_withdrawn_usdt`, `total_level_income_usdt`, `total_direct_income_usdt`, `total_roi_income_usdt`, `total_royalty_income_usdt`, 
  `rank`, `directs_count`, `active_directs_count`, `total_team_count`, `total_team_turnover_usdt`, 
  `max_capping_limit_usdt`, `total_earning_towards_cap_usdt`, `is_registered`, `is_active`
) VALUES (
  '0x9b32fa99834190cbbde029104fa2841b994801ac', 'MT-10024', 'MT-ROOT', NULL, 'Genesis Vault Leader',
  'treasure_5000', 'Imperial Treasure ($5,000)', 5000.0000, 4850.0000,
  12500.0000, 9450.0000, 3500.0000, 2800.0000, 1600.0000,
  'Imperial Founder', 18, 15, 420, 185000.0000,
  15000.0000, 14200.0000, 1, 1
) ON DUPLICATE KEY UPDATE `user_id` = VALUES(`user_id`);

-- F. Demo / Primary Test User Account
INSERT INTO `users` (
  `wallet_address`, `user_id`, `sponsor_id`, `sponsor_address`, `nickname`, 
  `active_package_id`, `active_package_name`, `total_staked_usdt`, `available_balance_usdt`, 
  `total_withdrawn_usdt`, `total_level_income_usdt`, `total_direct_income_usdt`, `total_roi_income_usdt`, `total_royalty_income_usdt`, 
  `rank`, `directs_count`, `active_directs_count`, `total_team_count`, `total_team_turnover_usdt`, 
  `strong_leg_volume_usdt`, `other_legs_volume_usdt`, `max_capping_limit_usdt`, `total_earning_towards_cap_usdt`, 
  `is_registered`, `is_active`
) VALUES (
  '0x742d35cc6634c0532925a3b844bc454e4438f44e', 'MT-77291', 'MT-10024', '0x9b32fa99834190cbbde029104fa2841b994801ac', 'Gold Leader',
  'gold_500', 'Morgan Gold ($500)', 500.0000, 218.4000,
  320.0000, 520.4000, 250.0000, 184.8000, 95.0000,
  'Gold Treasure Leader', 9, 7, 156, 24500.0000,
  14800.0000, 9700.0000, 1500.0000, 1050.2000,
  1, 1
) ON DUPLICATE KEY UPDATE `user_id` = VALUES(`user_id`);

-- G. Direct Referrals for Demo User MT-77291 (Building Realistic Team Genealogy)
INSERT INTO `users` (`wallet_address`, `user_id`, `sponsor_id`, `sponsor_address`, `nickname`, `active_package_id`, `active_package_name`, `total_staked_usdt`, `is_active`) VALUES
('0x1a82f3a8820c74d81239eb8847291001847239eb', 'MT-55011', 'MT-77291', '0x742d35cc6634c0532925a3b844bc454e4438f44e', 'Alexander Wright', 'platinum_1000', 'Morgan Platinum ($1000)', 1000.00, 1),
('0x8f447712ba6c11d9904292cd12048593847192cd', 'MT-55012', 'MT-77291', '0x742d35cc6634c0532925a3b844bc454e4438f44e', 'Sophia Chen', 'gold_500', 'Morgan Gold ($500)', 500.00, 1),
('0x3c10a48bb44719cd8822bf1144729103847222bf', 'MT-55013', 'MT-77291', '0x742d35cc6634c0532925a3b844bc454e4438f44e', 'Vikram Malhotra', 'gold_500', 'Morgan Gold ($500)', 500.00, 1),
('0x5d992e1047fa18392018ea4410294827402818ea', 'MT-55014', 'MT-77291', '0x742d35cc6634c0532925a3b844bc454e4438f44e', 'Elena Rostova', 'silver_250', 'Morgan Silver ($250)', 250.00, 1),
('0x2f33e884102938475677cc2293847192837477cc', 'MT-55015', 'MT-77291', '0x742d35cc6634c0532925a3b844bc454e4438f44e', 'Marcus Sterling', 'bronze_100', 'Morgan Bronze ($100)', 100.00, 1),
('0x7e1284910283746555ab229384719283746555ab', 'MT-55016', 'MT-77291', '0x742d35cc6634c0532925a3b844bc454e4438f44e', 'Tariq Al-Mansoor', 'bronze_100', 'Morgan Bronze ($100)', 100.00, 1),
('0x9b4491028374650111fd229384719283746511fd', 'MT-55017', 'MT-77291', '0x742d35cc6634c0532925a3b844bc454e4438f44e', 'Lucas Silva', 'starter_50', 'Morgan Starter ($50)', 50.00, 1),
('0x44aa84910283746588ee229384719283746588ee', 'MT-55018', 'MT-77291', '0x742d35cc6634c0532925a3b844bc454e4438f44e', 'David Kim', 'none', 'Pending Deposit', 0.00, 0),
('0x66cc84910283746544ba229384719283746544ba', 'MT-55019', 'MT-77291', '0x742d35cc6634c0532925a3b844bc454e4438f44e', 'Grace O’Connor', 'none', 'Pending Deposit', 0.00, 0)
ON DUPLICATE KEY UPDATE `user_id` = VALUES(`user_id`);

-- H. Initial Level Income Distributions for MT-77291
INSERT INTO `level_income` (`beneficiary_wallet`, `beneficiary_user_id`, `from_wallet`, `from_user_id`, `level`, `commission_percent`, `amount_usdt`, `tx_hash`) VALUES
('0x742d35cc6634c0532925a3b844bc454e4438f44e', 'MT-77291', '0x1a82f3a8820c74d81239eb8847291001847239eb', 'MT-55011', 1, 10.00, 100.00, '0x3a4b8f1277102938475610293847561029384756102938475610293847561029'),
('0x742d35cc6634c0532925a3b844bc454e4438f44e', 'MT-77291', '0x8f447712ba6c11d9904292cd12048593847192cd', 'MT-55012', 1, 10.00, 50.00, '0x992e44a177102938475610293847561029384756102938475610293847561029'),
('0x742d35cc6634c0532925a3b844bc454e4438f44e', 'MT-77291', '0x3c10a48bb44719cd8822bf1144729103847222bf', 'MT-55013', 1, 10.00, 50.00, '0x87dc331277102938475610293847561029384756102938475610293847561029'),
('0x742d35cc6634c0532925a3b844bc454e4438f44e', 'MT-77291', '0x5d992e1047fa18392018ea4410294827402818ea', 'MT-55014', 1, 10.00, 25.00, '0x14fe992377102938475610293847561029384756102938475610293847561029'),
('0x742d35cc6634c0532925a3b844bc454e4438f44e', 'MT-77291', '0x2f33e884102938475677cc2293847192837477cc', 'MT-55015', 1, 10.00, 10.00, '0x76ba228477102938475610293847561029384756102938475610293847561029'),
('0x742d35cc6634c0532925a3b844bc454e4438f44e', 'MT-77291', '0x7e1284910283746555ab229384719283746555ab', 'MT-55016', 1, 10.00, 10.00, '0x55dc118977102938475610293847561029384756102938475610293847561029'),
('0x742d35cc6634c0532925a3b844bc454e4438f44e', 'MT-77291', '0x9b4491028374650111fd229384719283746511fd', 'MT-55017', 1, 10.00, 5.00, '0x66ff001277102938475610293847561029384756102938475610293847561029');

-- I. Seed Initial Transactions for Demo User MT-77291
INSERT INTO `transactions` (`tx_id`, `wallet_address`, `user_id`, `type`, `title`, `amount_usdt`, `fee_usdt`, `net_amount_usdt`, `status`, `tx_hash`, `network`) VALUES
('tx_01', '0x742d35cc6634c0532925a3b844bc454e4438f44e', 'MT-77291', 'daily_roi', 'Daily Liquidity ROI (0.84%)', 4.2000, 0.0000, 4.2000, 'completed', '0x8f4321a77102938475610293847561029384756102938475610293847561029a', 'BNB Chain'),
('tx_02', '0x742d35cc6634c0532925a3b844bc454e4438f44e', 'MT-77291', 'level_income', 'Level 1 Referral Bonus (Sophia Chen)', 50.0000, 0.0000, 50.0000, 'completed', '0x992e44a177102938475610293847561029384756102938475610293847561029', 'BNB Chain'),
('tx_03', '0x742d35cc6634c0532925a3b844bc454e4438f44e', 'MT-77291', 'token_buy', 'Swap 0.5 BNB for 1,280 MTG Tokens', 320.0000, 0.8000, 319.2000, 'completed', '0x44abb1277102938475610293847561029384756102938475610293847561029b', 'BNB Chain'),
('tx_04', '0x742d35cc6634c0532925a3b844bc454e4438f44e', 'MT-77291', 'withdrawal', 'Withdrawal to BEP-20 Wallet', 120.0000, 6.0000, 114.0000, 'completed', '0x71299ee77102938475610293847561029384756102938475610293847561029e', 'BNB Chain'),
('tx_05', '0x742d35cc6634c0532925a3b844bc454e4438f44e', 'MT-77291', 'deposit', 'Staked Morgan Gold Package ($500)', 500.0000, 0.5000, 500.0000, 'completed', '0x31a7710771029384756102938475610293847561029384756102938475610290', 'BNB Chain')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);
