export type CurrencyType = 'USDT' | 'INR' | 'BNB';
export type LanguageType = 'en' | 'hi';
export type NetworkType = 'BNB Chain' | 'BSC Testnet' | 'Polygon' | 'Tron';

export interface LiquidityPoolStats {
  totalPoolLiquidityUsdt: number;
  availableReserveUsdt: number;
  lockedStakingUsdt: number;
  utilizationRate: number; // in percentage e.g. 74.5%
  currentDailyRoiPercent: number; // Fluctuates strictly between 0.50% and 1.00%
  minRoiPercent: number; // 0.50%
  maxRoiPercent: number; // 1.00%
  annualApyPercent: number; // e.g. 306.6%
  roiTrend24h: 'up' | 'down' | 'stable';
  sevenDayHistory: {
    day: string;
    rate: number;
    liquidity: number;
  }[];
  lastUpdated: string;
}

export interface TokenSaleStats {
  tokenName: string;
  tokenSymbol: string;
  tokenPriceUsdt: number;
  bnbPriceUsdt: number;
  tokensPerBnb: number;
  tokensSold: number;
  totalPresaleCap: number;
  progressPercent: number;
  contractAddress: string;
}

export interface InvestmentPackage {
  id: string;
  name: string;
  priceUsdt: number;
  priceInr: number;
  minDailyRoiPercent: number; // 0.5%
  maxDailyRoiPercent: number; // 1.0%
  durationDays: number;
  maxCappingMultiplier: number;
  levelUnlockCount: number;
  popularTag?: string;
  badgeColor: string;
  icon: string;
  features: string[];
}

export interface LevelIncomeTier {
  level: number;
  percentage: number;
  directRequired: number;
  teamMembersCount: number;
  activeMembersCount: number;
  totalTurnoverUsdt: number;
  earnedUsdt: number;
  isUnlocked: boolean;
}

export interface DirectReferral {
  id: string;
  walletAddress: string;
  name: string;
  packageName: string;
  stakedAmountUsdt: number;
  commissionPercent: number;
  earnedUsdt: number;
  joinedDate: string;
  status: 'active' | 'inactive';
  txHash: string;
  phoneOrTelegram?: string;
  level: number;
}

export interface RoiRecord {
  id: string;
  date: string;
  principalUsdt: number;
  dailyRatePercent: number;
  yieldEarnedUsdt: number;
  status: 'credited' | 'pending';
  txHash: string;
}

export interface RoyaltyClub {
  id: string;
  name: string;
  monthlyPoolPercent: number;
  requiredDirects: number;
  requiredTeamVolumeUsdt: number;
  currentTeamVolumeUsdt: number;
  achieved: boolean;
  rewardEstimateUsdt: number;
  icon: string;
  badgeColor: string;
}

export interface TransactionRecord {
  id: string;
  type: 'deposit' | 'withdrawal' | 'level_income' | 'direct_bonus' | 'daily_roi' | 'royalty_bonus' | 'token_buy';
  title: string;
  amountUsdt: number;
  feeUsdt: number;
  netAmountUsdt: number;
  status: 'completed' | 'processing' | 'pending' | 'failed';
  timestamp: string;
  txHash: string;
  network: string;
}

export interface UserProfile {
  address: string;
  userId: string;
  sponsorId: string;
  sponsorAddress: string;
  referralCode: string;
  activePackageId: string;
  activePackageName: string;
  totalStakedUsdt: number;
  availableBalanceUsdt: number;
  totalWithdrawnUsdt: number;
  totalLevelIncomeUsdt: number;
  totalDirectIncomeUsdt: number;
  totalRoiIncomeUsdt: number;
  totalRoyaltyIncomeUsdt: number;
  rank: string;
  directsCount: number;
  activeDirectsCount: number;
  totalTeamCount: number;
  totalTeamTurnoverUsdt: number;
  strongLegVolumeUsdt: number;
  otherLegsVolumeUsdt: number;
  maxCappingLimitUsdt: number;
  totalEarningTowardsCapUsdt: number;
  lastRoiClaimTimestamp: number;
  isRegistered: boolean;
}

export interface LiveActivityItem {
  id: string;
  type: 'join' | 'deposit' | 'level_income' | 'withdraw' | 'rank_up' | 'token_buy';
  userSnippet: string;
  city: string;
  amountUsdt: number;
  text: string;
  timeAgo: string;
  icon: string;
}
