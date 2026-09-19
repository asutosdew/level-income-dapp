import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DappStateService } from '../../services/dapp-state.service';
import { Web3Service } from '../../services/web3.service';
import { NotificationService } from '../../services/notification.service';
import { SoundService } from '../../services/sound.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-8 sm:space-y-10 animate-fade-in font-sans">
      
      <!-- ================================================================= -->
      <!-- TOP WELCOME & QUICK ACTION BAR                                    -->
      <!-- ================================================================= -->
      <div class="glass-panel p-6 sm:p-8 border-amber-500/25 relative overflow-hidden">
        <!-- Ambient Radial Orbs -->
        <div class="absolute -right-12 -top-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div class="flex flex-wrap items-center gap-2.5 mb-2">
              <span class="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5">
                <i class="fa-solid fa-crown text-amber-400"></i>
                {{ dappState.user().rank }}
              </span>
              <span class="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Today's Yield: {{ dappState.liquidityPool().currentDailyRoiPercent }}% / Day
              </span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, Investor <span class="text-amber-400">{{ dappState.user().userId }}</span>
            </h1>

            <!-- Connected Wallet Profile Strip with Direct Disconnect Link -->
            <div class="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-800/80 font-mono text-xs">
              <span class="text-slate-400 flex items-center gap-1.5">
                <i class="fa-solid fa-wallet text-amber-400"></i>
                <span>Wallet:</span>
              </span>
              
              <!-- If Connected -->
              <ng-container *ngIf="web3Service.isConnected()">
                <span class="text-emerald-400 font-bold bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  {{ web3Service.formatAddress(web3Service.currentAccount()) }}
                </span>
                <span class="text-slate-600">•</span>
                <button
                  (click)="web3Service.disconnect()"
                  class="text-rose-400 hover:text-rose-300 font-bold underline transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  <i class="fa-solid fa-power-off text-[10px]"></i>
                  <span>Disconnect</span>
                </button>
              </ng-container>

              <!-- If Disconnected -->
              <ng-container *ngIf="!web3Service.isConnected()">
                <span class="text-rose-400 font-bold">Not Connected</span>
                <span class="text-slate-600">•</span>
                <button
                  (click)="web3Service.connectWallet('TrustWallet')"
                  class="text-amber-400 hover:text-amber-300 font-bold underline transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  <i class="fa-solid fa-bolt text-[10px]"></i>
                  <span>Connect Wallet</span>
                </button>
              </ng-container>
            </div>
          </div>

          <!-- Fast Action CTA Buttons -->
          <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <a
              routerLink="/deposit"
              class="btn-gold-glow flex-1 md:flex-initial py-3.5 px-6 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/25"
            >
              <i class="fa-solid fa-plus text-xs"></i>
              <span>Deposit / Invest</span>
            </a>
            <a
              routerLink="/withdraw"
              class="btn-emerald-glow flex-1 md:flex-initial py-3.5 px-6 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25"
            >
              <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
              <span>Withdraw Funds</span>
            </a>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- SECTION 1: THE 3 ESSENTIAL FINANCIAL CARDS                        -->
      <!-- ================================================================= -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg sm:text-xl font-bold text-white tracking-tight">
              Financial Summary
            </h2>
            <p class="text-xs sm:text-sm text-slate-400">
              Live overview of your active deposit, withdrawable profits, and 3X profit ceiling.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- Card 1: Total Staked Investment -->
          <div class="glass-panel-gold p-6 sm:p-7 flex flex-col justify-between space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <i class="fa-solid fa-vault"></i> MY ACTIVE INVESTMENT
              </span>
              <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">
                {{ dappState.user().activePackageName }}
              </span>
            </div>

            <div>
              <div class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums">
                \${{ dappState.user().totalStakedUsdt.toFixed(2) }}
                <span class="text-sm font-bold text-amber-400 font-mono">USDT</span>
              </div>
              <div class="text-xs text-slate-400 font-mono mt-1">
                ≈ ₹{{ (dappState.user().totalStakedUsdt * dappState.inrRate).toLocaleString() }} INR
              </div>
            </div>

            <div class="pt-3 border-t border-slate-800/80 text-xs text-slate-300 flex items-center justify-between">
              <span>Current Daily ROI:</span>
              <strong class="text-emerald-400 font-mono font-bold">+{{ dappState.liquidityPool().currentDailyRoiPercent }}% / day</strong>
            </div>
          </div>

          <!-- Card 2: Available to Withdraw (With Action Button) -->
          <div class="glass-panel-emerald p-6 sm:p-7 flex flex-col justify-between space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <i class="fa-solid fa-wallet"></i> AVAILABLE TO WITHDRAW
              </span>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live
              </span>
            </div>

            <div>
              <div class="text-3xl sm:text-4xl font-extrabold text-emerald-300 tracking-tight tabular-nums">
                \${{ dappState.user().availableBalanceUsdt.toFixed(2) }}
                <span class="text-sm font-bold text-emerald-400 font-mono">USDT</span>
              </div>
              <div class="text-xs text-slate-400 font-mono mt-1">
                ≈ ₹{{ (dappState.user().availableBalanceUsdt * dappState.inrRate).toFixed(0) }} INR
              </div>
            </div>

            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span class="text-xs text-slate-300">5% flat network fee</span>
              <a
                routerLink="/withdraw"
                class="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-md"
              >
                <span>Withdraw Now</span>
                <i class="fa-solid fa-arrow-right text-[10px]"></i>
              </a>
            </div>
          </div>

          <!-- Card 3: 3X Maximum Profit Capping -->
          <div class="glass-panel p-6 sm:p-7 border-slate-800 flex flex-col justify-between space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <i class="fa-solid fa-shield-halved"></i> 3X PROFIT CAP LIMIT
              </span>
              <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-mono font-bold">
                {{ dappState.cappingPercentage() }}% Reached
              </span>
            </div>

            <div class="space-y-2">
              <div class="flex items-baseline justify-between text-xs font-mono">
                <span class="text-slate-400">Total Earned:</span>
                <span class="text-white font-bold tabular-nums">
                  \${{ dappState.user().totalEarningTowardsCapUsdt.toFixed(2) }} / \${{ dappState.user().maxCappingLimitUsdt.toFixed(2) }}
                </span>
              </div>

              <!-- Progress Bar -->
              <div class="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 p-0.5">
                <div
                  class="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                  [style.width.%]="dappState.cappingPercentage()"
                ></div>
              </div>

              <div class="text-[11px] text-slate-400 leading-tight">
                Remaining allowance: <strong class="text-amber-300">\${{ (dappState.user().maxCappingLimitUsdt - dappState.user().totalEarningTowardsCapUsdt).toFixed(2) }} USDT</strong>. Once 300% is reached, you re-stake to continue earning.
              </div>
            </div>

            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Multiplier:</span>
              <strong class="text-white font-mono">3.0x Max Limit</strong>
            </div>
          </div>

        </div>
      </div>

      <!-- ================================================================= -->
      <!-- SECTION 2: PROFIT CALCULATOR & 3-STEP BEGINNER GUIDE               -->
      <!-- ================================================================= -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

        <!-- Interactive Profit Simulator (7 cols) -->
        <div class="lg:col-span-7 glass-panel p-6 sm:p-8 border-slate-800 space-y-6">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-calculator"></i> PROFIT CALCULATOR
              </span>
              <span class="text-xs font-mono text-emerald-400 font-bold">
                {{ dappState.liquidityPool().currentDailyRoiPercent }}% Daily Rate
              </span>
            </div>
            <h3 class="text-xl font-bold text-white tracking-tight">
              Estimate Your Earnings Before Investing
            </h3>
            <p class="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Drag the slider to preview your daily, monthly, and 300% maximum capped returns.
            </p>
          </div>

          <!-- Slider Container with Generous Padding -->
          <div class="p-5 sm:p-6 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs sm:text-sm font-mono text-slate-400 font-semibold">Choose Deposit Amount:</span>
              <span class="text-2xl sm:text-3xl font-black text-amber-300 tabular-nums">
                \${{ simulatedAmount }} <span class="text-sm font-bold text-slate-400">USDT</span>
              </span>
            </div>

            <!-- Slider Element -->
            <input
              type="range"
              min="50"
              max="10000"
              step="50"
              [(ngModel)]="simulatedAmount"
              class="dapp-slider w-full cursor-pointer"
            />

            <!-- Preset Quick Selection Chips -->
            <div class="grid grid-cols-5 gap-2 pt-1">
              <button
                *ngFor="let amt of [100, 500, 1000, 2500, 5000]"
                (click)="setSimulatedAmount(amt)"
                class="py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer text-center"
                [ngClass]="simulatedAmount === amt 
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' 
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'"
              >
                \${{ amt >= 1000 ? (amt / 1000) + 'k' : amt }}
              </button>
            </div>
          </div>

          <!-- Forecast Result Tiles Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div class="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div class="text-[11px] font-mono text-slate-400 uppercase font-bold">DAILY RETURN</div>
              <div class="text-lg sm:text-xl font-extrabold text-emerald-400 tabular-nums">
                +\${{ getDailySimulated().toFixed(2) }}
              </div>
              <div class="text-[11px] text-slate-500 font-mono">≈ ₹{{ (getDailySimulated() * dappState.inrRate).toFixed(0) }} INR / day</div>
            </div>

            <div class="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div class="text-[11px] font-mono text-slate-400 uppercase font-bold">MONTHLY (30D)</div>
              <div class="text-lg sm:text-xl font-extrabold text-cyan-400 tabular-nums">
                +\${{ (getDailySimulated() * 30).toFixed(2) }}
              </div>
              <div class="text-[11px] text-slate-500 font-mono">≈ {{ (dappState.liquidityPool().currentDailyRoiPercent * 30).toFixed(1) }}% total</div>
            </div>

            <div class="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
              <div class="text-[11px] font-mono text-amber-400 uppercase font-bold">300% MAX CEILING</div>
              <div class="text-lg sm:text-xl font-extrabold text-white tabular-nums">
                \${{ (simulatedAmount * 3).toFixed(2) }}
              </div>
              <div class="text-[11px] text-slate-500 font-mono">3.0x Return Limit</div>
            </div>
          </div>

          <!-- Action Button inside Simulator -->
          <a
            routerLink="/deposit"
            class="w-full py-4 px-6 rounded-2xl btn-gold-glow font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <span>Invest \${{ simulatedAmount }} USDT Now</span>
            <i class="fa-solid fa-arrow-right text-xs"></i>
          </a>
        </div>

        <!-- How It Works 3-Step Beginner Guide (5 cols) -->
        <div class="lg:col-span-5 glass-panel p-6 sm:p-8 border-slate-800 space-y-6">
          <div>
            <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-lightbulb"></i> SIMPLE GUIDE
            </span>
            <h3 class="text-xl font-bold text-white tracking-tight mt-1">
              How Morgan Treasure Works
            </h3>
            <p class="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              3 simple steps to grow your wealth with decentralized BNB Smart Chain smart contracts:
            </p>
          </div>

          <div class="space-y-4">
            <!-- Step 1 -->
            <div class="flex items-start gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-extrabold text-base shrink-0">
                1
              </div>
              <div>
                <h4 class="text-sm font-bold text-white">Deposit USDT (BEP-20)</h4>
                <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Start with minimum \$50. Your principal is non-custodial and safely governed on-chain.
                </p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="flex items-start gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold text-base shrink-0">
                2
              </div>
              <div>
                <h4 class="text-sm font-bold text-white">Earn Daily ROI Automatically</h4>
                <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Get 0.50% to 1.00% daily returns credited every 24 hours directly into your withdrawable balance.
                </p>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="flex items-start gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div class="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-extrabold text-base shrink-0">
                3
              </div>
              <div>
                <h4 class="text-sm font-bold text-white">Share & Unlock 15 Levels</h4>
                <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Earn 10% instant direct commission plus up to 15 downline generation bonuses from your team.
                </p>
              </div>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
            <span class="text-emerald-300 font-semibold flex items-center gap-1.5">
              <i class="fa-solid fa-circle-check"></i> Instant 24/7 Withdrawals
            </span>
            <a routerLink="/contract" class="text-amber-400 hover:underline font-bold">
              Audit Info ↗
            </a>
          </div>
        </div>

      </div>

      <!-- ================================================================= -->
      <!-- SECTION 3: EARNINGS BREAKDOWN (3 TILES)                           -->
      <!-- ================================================================= -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg sm:text-xl font-bold text-white tracking-tight">
              Income Streams Breakdown
            </h2>
            <p class="text-xs sm:text-sm text-slate-400">
              Detailed breakdown of earnings from daily staking, 15-tier downline, and direct sponsors.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- Income Stream 1: Daily Staking ROI -->
          <div class="glass-panel p-6 sm:p-7 border-slate-800 flex flex-col justify-between space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <i class="fa-solid fa-chart-line"></i> DAILY STAKING PROFIT
              </span>
              <span class="text-xs font-mono text-slate-400">Next: {{ formatCountdown(dappState.roiCountdown()) }}</span>
            </div>

            <div>
              <div class="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                \${{ dappState.user().totalRoiIncomeUsdt.toFixed(2) }}
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Passive returns credited daily at {{ dappState.liquidityPool().currentDailyRoiPercent }}% rate.
              </p>
            </div>

            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span class="text-slate-400">Auto-credited daily</span>
              <button
                (click)="dappState.claimDailyRoi()"
                class="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold transition-colors cursor-pointer"
              >
                Claim ROI ↗
              </button>
            </div>
          </div>

          <!-- Income Stream 2: 15-Level Downline Affiliate Matrix -->
          <div class="glass-panel p-6 sm:p-7 border-slate-800 flex flex-col justify-between space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <i class="fa-solid fa-sitemap"></i> 15-LEVEL MATRIX INCOME
              </span>
              <span class="text-xs font-mono text-cyan-300">{{ dappState.user().totalTeamCount }} Partners</span>
            </div>

            <div>
              <div class="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                \${{ dappState.user().totalLevelIncomeUsdt.toFixed(2) }}
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Generational commissions from 15 downline levels.
              </p>
            </div>

            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span class="text-slate-400">Up to 22% total matrix</span>
              <a routerLink="/income" class="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer">
                View 15 Levels ↗
              </a>
            </div>
          </div>

          <!-- Income Stream 3: Direct Sponsor Bonus (10%) -->
          <div class="glass-panel p-6 sm:p-7 border-slate-800 flex flex-col justify-between space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <i class="fa-solid fa-users"></i> DIRECT SPONSOR (10%)
              </span>
              <span class="text-xs font-mono text-emerald-300">{{ dappState.user().activeDirectsCount }} Directs</span>
            </div>

            <div>
              <div class="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                \${{ dappState.user().totalDirectIncomeUsdt.toFixed(2) }}
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Instant 10% commission on every direct partner deposit.
              </p>
            </div>

            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span class="text-slate-400">10% Instant credit</span>
              <a routerLink="/team" class="text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer">
                View Direct Team ↗
              </a>
            </div>
          </div>

        </div>
      </div>

      <!-- ================================================================= -->
      <!-- SECTION 4: 1-TAP REFERRAL INVITATION CARD                         -->
      <!-- ================================================================= -->
      <div class="glass-panel p-6 sm:p-8 border-amber-500/25 relative overflow-hidden">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div class="space-y-2 max-w-xl">
            <span class="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 w-fit">
              <i class="fa-solid fa-share-nodes"></i>
              SHARE & GROW YOUR TEAM
            </span>
            <h3 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Invite Friends to Earn 10% Direct + 15 Levels
            </h3>
            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every partner you refer unlocks deeper tiers in the 15-level compensation matrix. Share your link directly via WhatsApp, Telegram, or copy the link below.
            </p>
          </div>

          <!-- Sharing Actions Container -->
          <div class="w-full md:w-auto space-y-3 min-w-[320px]">
            <!-- Copy Link Box -->
            <div class="flex items-center gap-2">
              <input
                type="text"
                [value]="getReferralLink()"
                readonly
                class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-amber-300 focus:outline-none truncate select-all"
              />
              <button
                (click)="copyReferralLink()"
                class="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-colors shrink-0 shadow-md cursor-pointer"
              >
                Copy Link
              </button>
            </div>

            <!-- Social Share Buttons -->
            <div class="grid grid-cols-2 gap-3">
              <a
                [href]="getWhatsappShareUrl()"
                target="_blank"
                class="py-3 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <i class="fa-brands fa-whatsapp text-lg"></i>
                <span>WhatsApp</span>
              </a>

              <a
                [href]="getTelegramShareUrl()"
                target="_blank"
                class="py-3 px-4 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <i class="fa-brands fa-telegram text-lg"></i>
                <span>Telegram</span>
              </a>
            </div>

            <div class="text-[11px] font-mono text-slate-500 text-center">
              Your Referral ID: <strong class="text-white">{{ dappState.user().referralCode || dappState.user().userId }}</strong>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class DashboardComponent {
  public simulatedAmount = 1000;

  constructor(
    public dappState: DappStateService,
    public web3Service: Web3Service,
    private notificationService: NotificationService,
    private soundService: SoundService
  ) {}

  setSimulatedAmount(amt: number): void {
    this.soundService.playTap();
    this.simulatedAmount = amt;
  }

  getDailySimulated(): number {
    const rate = this.dappState.liquidityPool().currentDailyRoiPercent / 100;
    return this.simulatedAmount * rate;
  }

  getReferralLink(): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://morgantreasure.io';
    return `${origin}/connect?ref=${this.dappState.user().referralCode || this.dappState.user().userId}`;
  }

  copyReferralLink(): void {
    this.soundService.playTap();
    navigator.clipboard.writeText(this.getReferralLink());
    this.notificationService.success('Copied!', 'Referral invite link copied to clipboard.');
  }

  getWhatsappShareUrl(): string {
    const text = encodeURIComponent(`Join Morgan Treasure Web3 Investment Plan! Earn dynamic 0.5% - 1% daily ROI on BNB Chain. Join here: ${this.getReferralLink()}`);
    return `https://api.whatsapp.com/send?text=${text}`;
  }

  getTelegramShareUrl(): string {
    const text = encodeURIComponent(`Join Morgan Treasure Web3 Investment Plan! Earn dynamic 0.5% - 1% daily ROI on BNB Chain.`);
    const url = encodeURIComponent(this.getReferralLink());
    return `https://t.me/share/url?url=${url}&text=${text}`;
  }

  formatCountdown(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  }
}
