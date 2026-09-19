import { Injectable, signal, computed, effect } from '@angular/core';
import {
  CurrencyType,
  LanguageType,
  InvestmentPackage,
  LevelIncomeTier,
  DirectReferral,
  RoiRecord,
  RoyaltyClub,
  TransactionRecord,
  UserProfile,
  LiveActivityItem,
  LiquidityPoolStats,
  TokenSaleStats
} from '../models/dapp.models';
import { NotificationService } from './notification.service';
import { SoundService } from './sound.service';
import { Web3Service } from './web3.service';

const STORAGE_KEY = 'morgantreasure_dapp_v1';
const INR_CONVERSION_RATE = 90; // 1 USDT = 90 INR
const BNB_CONVERSION_RATE = 640; // 1 BNB = 640 USDT

@Injectable({
  providedIn: 'root'
})
export class DappStateService {
  // Currency & Localization
  public currency = signal<CurrencyType>('USDT');
  public language = signal<LanguageType>('en');
  public inrRate = INR_CONVERSION_RATE;
  public bnbRate = BNB_CONVERSION_RATE;

  // Countdown timer for next ROI cycle (seconds)
  public roiCountdown = signal<number>(43200); // 12 hours remaining

  // Real-time Liquidity Pool & Dynamic 0.5% - 1.0% Daily ROI
  public liquidityPool = signal<LiquidityPoolStats>({
    totalPoolLiquidityUsdt: 2480500,
    availableReserveUsdt: 1845200,
    lockedStakingUsdt: 635300,
    utilizationRate: 74.39, // % of optimal reserve
    currentDailyRoiPercent: 0.84, // Fluctuates between 0.50% and 1.00%
    minRoiPercent: 0.50,
    maxRoiPercent: 1.00,
    annualApyPercent: 306.6, // 0.84% * 365
    roiTrend24h: 'up',
    sevenDayHistory: [
      { day: 'Mon', rate: 0.72, liquidity: 2150000 },
      { day: 'Tue', rate: 0.78, liquidity: 2280000 },
      { day: 'Wed', rate: 0.81, liquidity: 2350000 },
      { day: 'Thu', rate: 0.75, liquidity: 2210000 },
      { day: 'Fri', rate: 0.80, liquidity: 2390000 },
      { day: 'Sat', rate: 0.86, liquidity: 2520000 },
      { day: 'Today', rate: 0.84, liquidity: 2480500 }
    ],
    lastUpdated: 'Just now (BNB Chain Oracle)'
  });

  // Native MTG (Morgan Treasure Token) Presale / Swap Data
  public tokenSale = signal<TokenSaleStats>({
    tokenName: 'Morgan Treasure Token',
    tokenSymbol: 'MTG',
    tokenPriceUsdt: 0.25,
    bnbPriceUsdt: 640.0,
    tokensPerBnb: 2560,
    tokensSold: 1420500,
    totalPresaleCap: 5000000,
    progressPercent: 28.41,
    contractAddress: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
  });

  // Core User Profile (Morgan Treasure Investor)
  public user = signal<UserProfile>({
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    userId: 'MT-77291',
    sponsorId: 'MT-10024',
    sponsorAddress: '0x9b32fa99834190cbbde029104fa2841b994801ac',
    referralCode: 'MT77291',
    activePackageId: 'gold_500',
    activePackageName: 'Morgan Gold ($500)',
    totalStakedUsdt: 500,
    availableBalanceUsdt: 218.40,
    totalWithdrawnUsdt: 320.00,
    totalLevelIncomeUsdt: 520.40,
    totalDirectIncomeUsdt: 250.00,
    totalRoiIncomeUsdt: 184.80,
    totalRoyaltyIncomeUsdt: 95.00,
    rank: 'Gold Treasure Leader',
    directsCount: 9,
    activeDirectsCount: 7,
    totalTeamCount: 156,
    totalTeamTurnoverUsdt: 24500,
    strongLegVolumeUsdt: 14800,
    otherLegsVolumeUsdt: 9700,
    maxCappingLimitUsdt: 1500, // 300% of $500
    totalEarningTowardsCapUsdt: 1050.20,
    lastRoiClaimTimestamp: Date.now() - 3600000 * 8,
    isRegistered: true
  });

  // Investment Packages
  public packages = signal<InvestmentPackage[]>([
    {
      id: 'starter_50',
      name: 'Morgan Starter',
      priceUsdt: 50,
      priceInr: 4500,
      minDailyRoiPercent: 0.5,
      maxDailyRoiPercent: 1.0,
      durationDays: 200,
      maxCappingMultiplier: 3.0,
      levelUnlockCount: 3,
      badgeColor: '#94a3b8',
      icon: 'fa-seedling',
      features: ['Dynamic 0.5% - 1% Daily ROI', 'Unlock 3 Levels', '300% Maximum Capping', 'Direct 10% Referral Bonus']
    },
    {
      id: 'bronze_100',
      name: 'Morgan Bronze',
      priceUsdt: 100,
      priceInr: 9000,
      minDailyRoiPercent: 0.5,
      maxDailyRoiPercent: 1.0,
      durationDays: 200,
      maxCappingMultiplier: 3.0,
      levelUnlockCount: 5,
      badgeColor: '#cd7f32',
      icon: 'fa-shield-halved',
      features: ['Dynamic 0.5% - 1% Daily ROI', 'Unlock 5 Levels', '300% Maximum Capping', 'Direct 10% Bonus', '24/7 Fast Support']
    },
    {
      id: 'silver_250',
      name: 'Morgan Silver',
      priceUsdt: 250,
      priceInr: 22500,
      minDailyRoiPercent: 0.5,
      maxDailyRoiPercent: 1.0,
      durationDays: 200,
      maxCappingMultiplier: 3.0,
      levelUnlockCount: 8,
      badgeColor: '#e2e8f0',
      icon: 'fa-gem',
      features: ['Dynamic 0.5% - 1% Daily ROI', 'Unlock 8 Levels', '300% Maximum Capping', 'Priority Liquidity Allocation']
    },
    {
      id: 'gold_500',
      name: 'Morgan Gold',
      priceUsdt: 500,
      priceInr: 45000,
      minDailyRoiPercent: 0.5,
      maxDailyRoiPercent: 1.0,
      durationDays: 200,
      maxCappingMultiplier: 3.0,
      levelUnlockCount: 12,
      popularTag: 'MOST POPULAR',
      badgeColor: '#fbbf24',
      icon: 'fa-crown',
      features: ['Dynamic 0.5% - 1% Daily ROI', 'Unlock 12 Levels', '300% Maximum Capping', 'Monthly Global Pool Eligibility']
    },
    {
      id: 'platinum_1000',
      name: 'Morgan Platinum',
      priceUsdt: 1000,
      priceInr: 90000,
      minDailyRoiPercent: 0.5,
      maxDailyRoiPercent: 1.0,
      durationDays: 200,
      maxCappingMultiplier: 3.0,
      levelUnlockCount: 15,
      badgeColor: '#38bdf8',
      icon: 'fa-award',
      features: ['Dynamic 0.5% - 1% Daily ROI', 'Unlock All 15 Levels', '300% Maximum Capping', 'Royalty Club Membership', 'VIP Node Rewards']
    },
    {
      id: 'treasure_5000',
      name: 'Imperial Treasure',
      priceUsdt: 5000,
      priceInr: 450000,
      minDailyRoiPercent: 0.5,
      maxDailyRoiPercent: 1.0,
      durationDays: 200,
      maxCappingMultiplier: 3.0,
      levelUnlockCount: 15,
      popularTag: 'VIP ELITE',
      badgeColor: '#f43f5e',
      icon: 'fa-chess-king',
      features: ['Dynamic 0.5% - 1% Daily ROI', 'Unlock All 15 Levels', 'VIP Yield Boost (+0.1%)', 'Max Capping $15,000', 'Governance Voting Rights']
    }
  ]);

  // Level Income Structure (Levels 1 to 15)
  public levelTiers = signal<LevelIncomeTier[]>([
    { level: 1, percentage: 10.0, directRequired: 1, teamMembersCount: 9, activeMembersCount: 7, totalTurnoverUsdt: 5200, earnedUsdt: 250.00, isUnlocked: true },
    { level: 2, percentage: 5.0, directRequired: 2, teamMembersCount: 22, activeMembersCount: 18, totalTurnoverUsdt: 4400, earnedUsdt: 110.00, isUnlocked: true },
    { level: 3, percentage: 3.0, directRequired: 3, teamMembersCount: 34, activeMembersCount: 29, totalTurnoverUsdt: 3800, earnedUsdt: 57.00, isUnlocked: true },
    { level: 4, percentage: 2.0, directRequired: 4, teamMembersCount: 28, activeMembersCount: 21, totalTurnoverUsdt: 2900, earnedUsdt: 34.80, isUnlocked: true },
    { level: 5, percentage: 1.0, directRequired: 5, teamMembersCount: 19, activeMembersCount: 15, totalTurnoverUsdt: 2100, earnedUsdt: 21.00, isUnlocked: true },
    { level: 6, percentage: 0.5, directRequired: 6, teamMembersCount: 15, activeMembersCount: 12, totalTurnoverUsdt: 1800, earnedUsdt: 13.50, isUnlocked: true },
    { level: 7, percentage: 0.5, directRequired: 7, teamMembersCount: 12, activeMembersCount: 9, totalTurnoverUsdt: 1500, earnedUsdt: 11.25, isUnlocked: true },
    { level: 8, percentage: 0.5, directRequired: 8, teamMembersCount: 8, activeMembersCount: 6, totalTurnoverUsdt: 1200, earnedUsdt: 9.00, isUnlocked: false },
    { level: 9, percentage: 0.5, directRequired: 9, teamMembersCount: 5, activeMembersCount: 3, totalTurnoverUsdt: 800, earnedUsdt: 6.00, isUnlocked: false },
    { level: 10, percentage: 0.5, directRequired: 10, teamMembersCount: 3, activeMembersCount: 2, totalTurnoverUsdt: 500, earnedUsdt: 4.25, isUnlocked: false },
    { level: 11, percentage: 0.25, directRequired: 11, teamMembersCount: 1, activeMembersCount: 1, totalTurnoverUsdt: 100, earnedUsdt: 1.20, isUnlocked: false },
    { level: 12, percentage: 0.25, directRequired: 12, teamMembersCount: 0, activeMembersCount: 0, totalTurnoverUsdt: 0, earnedUsdt: 0, isUnlocked: false },
    { level: 13, percentage: 0.25, directRequired: 13, teamMembersCount: 0, activeMembersCount: 0, totalTurnoverUsdt: 0, earnedUsdt: 0, isUnlocked: false },
    { level: 14, percentage: 0.25, directRequired: 14, teamMembersCount: 0, activeMembersCount: 0, totalTurnoverUsdt: 0, earnedUsdt: 0, isUnlocked: false },
    { level: 15, percentage: 0.25, directRequired: 15, teamMembersCount: 0, activeMembersCount: 0, totalTurnoverUsdt: 0, earnedUsdt: 0, isUnlocked: false }
  ]);

  // Direct Referrals List
  public directs = signal<DirectReferral[]>([
    { id: '1', walletAddress: '0x1A82...39eB', name: 'Alexander Wright', packageName: 'Morgan Platinum ($1000)', stakedAmountUsdt: 1000, commissionPercent: 10, earnedUsdt: 100.00, joinedDate: '2026-08-14', status: 'active', txHash: '0x3a4b...8f12', phoneOrTelegram: '@alex_wright', level: 1 },
    { id: '2', walletAddress: '0x8F44...92cD', name: 'Sophia Chen', packageName: 'Morgan Gold ($500)', stakedAmountUsdt: 500, commissionPercent: 10, earnedUsdt: 50.00, joinedDate: '2026-08-18', status: 'active', txHash: '0x992e...44a1', phoneOrTelegram: '@sophiacrypto', level: 1 },
    { id: '3', walletAddress: '0x3C10...22bF', name: 'Vikram Malhotra', packageName: 'Morgan Gold ($500)', stakedAmountUsdt: 500, commissionPercent: 10, earnedUsdt: 50.00, joinedDate: '2026-08-22', status: 'active', txHash: '0x87dc...3312', phoneOrTelegram: '+91 98*** 42100', level: 1 },
    { id: '4', walletAddress: '0x5D99...18eA', name: 'Elena Rostova', packageName: 'Morgan Silver ($250)', stakedAmountUsdt: 250, commissionPercent: 10, earnedUsdt: 25.00, joinedDate: '2026-08-28', status: 'active', txHash: '0x14fe...9923', phoneOrTelegram: '@elena_defitrader', level: 1 },
    { id: '5', walletAddress: '0x2F33...77cC', name: 'Marcus Sterling', packageName: 'Morgan Bronze ($100)', stakedAmountUsdt: 100, commissionPercent: 10, earnedUsdt: 10.00, joinedDate: '2026-09-01', status: 'active', txHash: '0x76ba...2284', phoneOrTelegram: '@msterling', level: 1 },
    { id: '6', walletAddress: '0x7E12...55aB', name: 'Tariq Al-Mansoor', packageName: 'Morgan Bronze ($100)', stakedAmountUsdt: 100, commissionPercent: 10, earnedUsdt: 10.00, joinedDate: '2026-09-02', status: 'active', txHash: '0x55dc...1189', phoneOrTelegram: '@tariq_dubai', level: 1 },
    { id: '7', walletAddress: '0x9B44...11fD', name: 'Lucas Silva', packageName: 'Morgan Starter ($50)', stakedAmountUsdt: 50, commissionPercent: 10, earnedUsdt: 5.00, joinedDate: '2026-09-03', status: 'active', txHash: '0x66ff...0012', phoneOrTelegram: '@lucassilva', level: 1 },
    { id: '8', walletAddress: '0x44AA...88eE', name: 'David Kim', packageName: 'Pending Deposit', stakedAmountUsdt: 0, commissionPercent: 10, earnedUsdt: 0, joinedDate: '2026-09-04', status: 'inactive', txHash: '', phoneOrTelegram: '@davidkim_seoul', level: 1 },
    { id: '9', walletAddress: '0x66CC...44bA', name: 'Grace O’Connor', packageName: 'Pending Deposit', stakedAmountUsdt: 0, commissionPercent: 10, earnedUsdt: 0, joinedDate: '2026-09-04', status: 'inactive', txHash: '', phoneOrTelegram: '@grace_dublin', level: 1 }
  ]);

  // Royalty Clubs
  public royaltyClubs = signal<RoyaltyClub[]>([
    { id: 'club_star', name: 'Treasure Star', monthlyPoolPercent: 1.0, requiredDirects: 5, requiredTeamVolumeUsdt: 5000, currentTeamVolumeUsdt: 24500, achieved: true, rewardEstimateUsdt: 45.00, icon: 'fa-star', badgeColor: '#fbbf24' },
    { id: 'club_ruby', name: 'Morgan Ruby', monthlyPoolPercent: 1.5, requiredDirects: 10, requiredTeamVolumeUsdt: 15000, currentTeamVolumeUsdt: 24500, achieved: false, rewardEstimateUsdt: 110.00, icon: 'fa-gem', badgeColor: '#f43f5e' },
    { id: 'club_emerald', name: 'Morgan Emerald', monthlyPoolPercent: 2.0, requiredDirects: 15, requiredTeamVolumeUsdt: 35000, currentTeamVolumeUsdt: 24500, achieved: false, rewardEstimateUsdt: 280.00, icon: 'fa-ring', badgeColor: '#10b981' },
    { id: 'club_diamond', name: 'Crown Diamond', monthlyPoolPercent: 3.0, requiredDirects: 20, requiredTeamVolumeUsdt: 100000, currentTeamVolumeUsdt: 24500, achieved: false, rewardEstimateUsdt: 850.00, icon: 'fa-crown', badgeColor: '#38bdf8' }
  ]);

  // Recent Transactions
  public transactions = signal<TransactionRecord[]>([
    { id: 'tx_01', type: 'daily_roi', title: 'Daily Liquidity ROI (0.84%)', amountUsdt: 4.20, feeUsdt: 0, netAmountUsdt: 4.20, status: 'completed', timestamp: 'Today, 06:00 AM', txHash: '0x8f4...321a', network: 'BNB Chain' },
    { id: 'tx_02', type: 'level_income', title: 'Level 1 Referral Bonus (Sophia Chen)', amountUsdt: 50.00, feeUsdt: 0, netAmountUsdt: 50.00, status: 'completed', timestamp: 'Yesterday, 04:15 PM', txHash: '0x992...44a1', network: 'BNB Chain' },
    { id: 'tx_03', type: 'token_buy', title: 'Swap 0.5 BNB for 1,280 MTG Tokens', amountUsdt: 320.00, feeUsdt: 0.8, netAmountUsdt: 319.20, status: 'completed', timestamp: '2 Sep 2026', txHash: '0x44a...bb12', network: 'BNB Chain' },
    { id: 'tx_04', type: 'withdrawal', title: 'Withdrawal to BEP-20 Wallet', amountUsdt: 120.00, feeUsdt: 6.00, netAmountUsdt: 114.00, status: 'completed', timestamp: '30 Aug 2026', txHash: '0x712...99ee', network: 'BNB Chain' },
    { id: 'tx_05', type: 'deposit', title: 'Staked Morgan Gold Package ($500)', amountUsdt: 500.00, feeUsdt: 0.5, netAmountUsdt: 500.00, status: 'completed', timestamp: '10 Aug 2026', txHash: '0x31a...7710', network: 'BNB Chain' }
  ]);

  // Live Live Activities Ticker
  public liveActivities = signal<LiveActivityItem[]>([
    { id: '1', type: 'deposit', userSnippet: '0x8F44...92cD', city: 'London', amountUsdt: 1000, text: 'staked Morgan Platinum ($1,000)', timeAgo: '2m ago', icon: 'fa-arrow-down-long' },
    { id: '2', type: 'token_buy', userSnippet: '0x3C10...22bF', city: 'Dubai', amountUsdt: 500, text: 'bought 2,000 MTG Tokens', timeAgo: '4m ago', icon: 'fa-coins' },
    { id: '3', type: 'level_income', userSnippet: '0x9B44...11fD', city: 'Singapore', amountUsdt: 125, text: 'earned Level 2 Commission', timeAgo: '7m ago', icon: 'fa-layer-group' },
    { id: '4', type: 'join', userSnippet: '0x2F33...77cC', city: 'Mumbai', amountUsdt: 50, text: 'registered with Sponsor MT-77291', timeAgo: '11m ago', icon: 'fa-user-plus' },
    { id: '5', type: 'withdraw', userSnippet: '0x5D99...18eA', city: 'Berlin', amountUsdt: 340, text: 'withdrew ROI to BEP-20 wallet', timeAgo: '15m ago', icon: 'fa-wallet' }
  ]);

  // Computed Values
  public totalEarningsUsdt = computed(() => {
    const u = this.user();
    return u.totalLevelIncomeUsdt + u.totalDirectIncomeUsdt + u.totalRoiIncomeUsdt + u.totalRoyaltyIncomeUsdt;
  });

  public cappingPercentage = computed(() => {
    const u = this.user();
    if (!u.maxCappingLimitUsdt || u.maxCappingLimitUsdt === 0) return 0;
    const pct = (u.totalEarningTowardsCapUsdt / u.maxCappingLimitUsdt) * 100;
    return Math.min(100, Math.round(pct * 10) / 10);
  });

  public remainingCappingLimitUsdt = computed(() => {
    const u = this.user();
    return Math.max(0, u.maxCappingLimitUsdt - u.totalEarningTowardsCapUsdt);
  });

  constructor(
    private notificationService: NotificationService,
    private soundService: SoundService,
    private web3Service: Web3Service
  ) {
    this.loadState();
    this.startCountdownTimer();
    this.startLiquiditySimulation();

    // Auto-save on state change
    effect(() => {
      this.saveState();
    });
  }

  // Format amount based on selected currency
  formatCurrency(amountUsdt: number): string {
    const curr = this.currency();
    if (curr === 'INR') {
      const inrValue = amountUsdt * this.inrRate;
      return '₹' + inrValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (curr === 'BNB') {
      const bnbValue = amountUsdt / this.bnbRate;
      return bnbValue.toFixed(4) + ' BNB';
    }
    return '$' + amountUsdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatAmount(amountUsdt: number): string {
    return this.formatCurrency(amountUsdt);
  }

  toggleCurrency(): void {
    this.soundService.playTap();
    if (this.currency() === 'USDT') {
      this.currency.set('INR');
      this.notificationService.info('Currency Changed', 'Displaying all values in Indian Rupee (₹ INR)');
    } else if (this.currency() === 'INR') {
      this.currency.set('BNB');
      this.notificationService.info('Currency Changed', 'Displaying all values in Binance Coin (BNB)');
    } else {
      this.currency.set('USDT');
      this.notificationService.info('Currency Changed', 'Displaying all values in Tether (USDT BEP-20)');
    }
  }

  toggleLanguage(): void {
    this.soundService.playTap();
    if (this.language() === 'en') {
      this.language.set('hi');
      this.notificationService.info('भाषा बदली गई', 'अब ऐप हिंदी में प्रदर्शित हो रहा है');
    } else {
      this.language.set('en');
      this.notificationService.info('Language Changed', 'App is now displaying in English');
    }
  }

  // Start Real-time Liquidity & Dynamic Daily ROI Fluctuation Ticker
  private startLiquiditySimulation(): void {
    setInterval(() => {
      const current = this.liquidityPool();
      // Slight dynamic jitter representing pool liquidity influx/outflux
      const deltaPercent = (Math.random() - 0.49) * 0.02; // Small natural swing
      let newRoi = Math.round((current.currentDailyRoiPercent + deltaPercent) * 100) / 100;
      
      // Bound strictly within 0.50% and 1.00% daily ROI
      if (newRoi < 0.50) newRoi = 0.50;
      if (newRoi > 1.00) newRoi = 1.00;

      const deltaLiquidity = Math.floor((Math.random() - 0.48) * 1500);
      const newLiquidity = Math.max(1500000, current.totalPoolLiquidityUsdt + deltaLiquidity);
      const trend = newRoi > current.currentDailyRoiPercent ? 'up' : (newRoi < current.currentDailyRoiPercent ? 'down' : 'stable');

      this.liquidityPool.set({
        ...current,
        currentDailyRoiPercent: newRoi,
        totalPoolLiquidityUsdt: newLiquidity,
        availableReserveUsdt: Math.round(newLiquidity * 0.744),
        annualApyPercent: Math.round(newRoi * 365 * 10) / 10,
        roiTrend24h: trend,
        lastUpdated: 'Live BNB Chain Oracle'
      });
    }, 15000); // Ticks every 15 seconds
  }

  // Deposit USDT BEP-20
  depositUsdt(amountUsdt: number, packageName = 'Custom Stake'): boolean {
    this.soundService.playTap();
    const currentUser = this.user();

    const newStaked = currentUser.totalStakedUsdt + amountUsdt;
    const newCapping = newStaked * 3.0; // 300% capping rule

    const txHash = this.web3Service.generateTxHash();

    this.user.set({
      ...currentUser,
      activePackageName: packageName,
      totalStakedUsdt: newStaked,
      maxCappingLimitUsdt: newCapping
    });

    // Record transaction
    const newTx: TransactionRecord = {
      id: 'tx_' + Date.now(),
      type: 'deposit',
      title: `Staked in Morgan Treasure (${packageName})`,
      amountUsdt: amountUsdt,
      feeUsdt: 0.3,
      netAmountUsdt: amountUsdt,
      status: 'completed',
      timestamp: 'Just now',
      txHash: txHash,
      network: 'BNB Chain'
    };

    this.transactions.update(txs => [newTx, ...txs]);
    this.soundService.playSuccess();
    this.notificationService.success(
      'Deposit Successful!',
      `Staked $${amountUsdt} USDT. Your daily ROI (0.5% - 1.0%) will begin accruing immediately.`
    );
    return true;
  }

  // Buy Morgan Treasure Token (MTG)
  buyMtgTokens(amountPay: number, payMethod: 'USDT' | 'BNB'): boolean {
    this.soundService.playTap();
    const tokenInfo = this.tokenSale();
    let tokensToReceive = 0;
    let usdtValue = 0;

    if (payMethod === 'USDT') {
      tokensToReceive = amountPay / tokenInfo.tokenPriceUsdt;
      usdtValue = amountPay;
    } else {
      tokensToReceive = amountPay * tokenInfo.tokensPerBnb;
      usdtValue = amountPay * tokenInfo.bnbPriceUsdt;
    }

    const txHash = this.web3Service.generateTxHash();

    // Update Presale Sold
    this.tokenSale.update(curr => {
      const newSold = curr.tokensSold + tokensToReceive;
      const progress = Math.min(100, Math.round((newSold / curr.totalPresaleCap) * 10000) / 100);
      return {
        ...curr,
        tokensSold: newSold,
        progressPercent: progress
      };
    });

    // Add transaction
    const newTx: TransactionRecord = {
      id: 'tx_' + Date.now(),
      type: 'token_buy',
      title: `Purchased ${tokensToReceive.toLocaleString()} MTG Tokens`,
      amountUsdt: usdtValue,
      feeUsdt: payMethod === 'BNB' ? 0.0015 : 0.4,
      netAmountUsdt: usdtValue,
      status: 'completed',
      timestamp: 'Just now',
      txHash: txHash,
      network: 'BNB Chain'
    };

    this.transactions.update(txs => [newTx, ...txs]);
    this.soundService.playSuccess();
    this.notificationService.success(
      'Tokens Purchased!',
      `Successfully received ${tokensToReceive.toLocaleString()} MTG tokens to your BEP-20 wallet.`
    );
    return true;
  }

  // Register User with Sponsor ID
  registerUser(sponsorId: string, customNickname?: string): boolean {
    this.soundService.playTap();
    const currentUser = this.user();
    const cleanSponsor = sponsorId ? sponsorId.trim() : 'MT-10024';

    this.user.set({
      ...currentUser,
      sponsorId: cleanSponsor,
      userId: 'MT-' + Math.floor(10000 + Math.random() * 90000),
      isRegistered: true,
      rank: 'Morgan Bronze Explorer'
    });

    this.soundService.playSuccess();
    this.notificationService.success(
      'Registration Confirmed!',
      `Welcome to Morgan Treasure. Your account is linked to Sponsor ${cleanSponsor}.`
    );
    return true;
  }

  // Claim Daily Staking ROI
  claimDailyRoi(): void {
    this.soundService.playTap();
    const currentUser = this.user();
    const currentRate = this.liquidityPool().currentDailyRoiPercent;
    const dailyReward = Math.round(((currentUser.totalStakedUsdt * currentRate) / 100) * 100) / 100;

    if (dailyReward <= 0) {
      this.notificationService.error('No Active Stake', 'Deposit USDT into Morgan Treasure to begin earning daily ROI.');
      return;
    }

    const newCapEarning = currentUser.totalEarningTowardsCapUsdt + dailyReward;
    if (newCapEarning > currentUser.maxCappingLimitUsdt) {
      this.notificationService.warning('Capping Reached', 'You have hit the 300% maximum return limit. Please re-stake to continue.');
      return;
    }

    this.user.set({
      ...currentUser,
      availableBalanceUsdt: currentUser.availableBalanceUsdt + dailyReward,
      totalRoiIncomeUsdt: currentUser.totalRoiIncomeUsdt + dailyReward,
      totalEarningTowardsCapUsdt: newCapEarning,
      lastRoiClaimTimestamp: Date.now()
    });

    // Reset 24h countdown
    this.roiCountdown.set(86400);

    const newTx: TransactionRecord = {
      id: 'tx_' + Date.now(),
      type: 'daily_roi',
      title: `Claimed Daily ROI (${currentRate}% Liquidity Rate)`,
      amountUsdt: dailyReward,
      feeUsdt: 0,
      netAmountUsdt: dailyReward,
      status: 'completed',
      timestamp: 'Just now',
      txHash: this.web3Service.generateTxHash(),
      network: 'BNB Chain'
    };

    this.transactions.update(txs => [newTx, ...txs]);
    this.soundService.playReward();
    this.notificationService.success('ROI Claimed!', `+$${dailyReward.toFixed(2)} USDT added to available balance.`);
  }

  // Withdraw Funds
  withdrawFunds(amountUsdt: number, receivingAddress: string): { success: boolean; txHash: string } {
    this.soundService.playTap();
    const currentUser = this.user();

    if (amountUsdt > currentUser.availableBalanceUsdt) {
      this.notificationService.error('Insufficient Balance', 'Requested withdrawal exceeds available balance.');
      return { success: false, txHash: '' };
    }

    const fee = amountUsdt * 0.05; // 5% platform liquidity fee
    const net = amountUsdt - fee;
    const txHash = this.web3Service.generateTxHash();

    this.user.set({
      ...currentUser,
      availableBalanceUsdt: currentUser.availableBalanceUsdt - amountUsdt,
      totalWithdrawnUsdt: currentUser.totalWithdrawnUsdt + net
    });

    const newTx: TransactionRecord = {
      id: 'tx_' + Date.now(),
      type: 'withdrawal',
      title: `Withdrawal to ${receivingAddress.substring(0, 6)}...${receivingAddress.substring(receivingAddress.length - 4)}`,
      amountUsdt: amountUsdt,
      feeUsdt: fee,
      netAmountUsdt: net,
      status: 'completed',
      timestamp: 'Just now',
      txHash: txHash,
      network: 'BNB Chain'
    };

    this.transactions.update(txs => [newTx, ...txs]);
    this.soundService.playSuccess();
    this.notificationService.success('Withdrawal Processed', `Sent $${net.toFixed(2)} USDT (BEP-20) to your wallet.`);
    return { success: true, txHash };
  }

  private startCountdownTimer(): void {
    setInterval(() => {
      this.roiCountdown.update(current => (current > 0 ? current - 1 : 86400));
    }, 1000);
  }

  private saveState(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const data = {
          user: this.user(),
          currency: this.currency(),
          language: this.language(),
          transactions: this.transactions(),
          tokenSale: this.tokenSale()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.warn('Storage save failed:', err);
      }
    }
  }

  private loadState(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.user) this.user.set(data.user);
          if (data.currency) this.currency.set(data.currency);
          if (data.language) this.language.set(data.language);
          if (data.transactions) this.transactions.set(data.transactions);
          if (data.tokenSale) this.tokenSale.set(data.tokenSale);
        }
      } catch (err) {
        console.warn('Storage load fallback:', err);
      }
    }
  }
}
