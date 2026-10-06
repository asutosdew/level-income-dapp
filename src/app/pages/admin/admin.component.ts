import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { 
  AdminService, 
  AdminOverview, 
  AdminLiquidity, 
  AdminTokenPresale, 
  AdminUserItem, 
  AdminWalletItem, 
  AdminTierStat, 
  AdminTransactionItem,
  AdminCronLog 
} from '../../services/admin.service';
import { NotificationService } from '../../services/notification.service';
import { SoundService } from '../../services/sound.service';
import { MorganTreasureLogoComponent } from '../../components/logo/morgan-treasure-logo.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MorganTreasureLogoComponent],
  template: `
    <div class="space-y-6 sm:space-y-8 animate-fade-in font-sans text-slate-200">

      <!-- ================================================================= -->
      <!-- STATE 1: ADMIN LOGIN GATE (IF NOT AUTHENTICATED)                  -->
      <!-- ================================================================= -->
      <div *ngIf="!adminService.isAdminLoggedIn()" class="max-w-md mx-auto py-12">
        <div class="glass-panel p-6 sm:p-8 rounded-3xl border-amber-500/30 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div class="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

          <div class="inline-flex p-3 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-lg shadow-amber-500/20">
            <app-morgan-treasure-logo size="md" [showWordmark]="false"></app-morgan-treasure-logo>
          </div>

          <div>
            <h1 class="text-2xl font-black text-white tracking-tight">Executive Terminal</h1>
            <p class="text-xs text-slate-400 mt-1 font-mono">
              Morgan Treasure Protocol &bull; MariaDB Master Control
            </p>
          </div>

          <form (ngSubmit)="handleAdminLogin()" class="space-y-4 text-left">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-300 font-mono flex items-center justify-between">
                <span>ADMIN MASTER PASSKEY</span>
                <span class="text-amber-400 text-[10px]">ENCRYPTED</span>
              </label>
              <div class="relative">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="adminPassword"
                  name="adminPassword"
                  placeholder="Enter Admin Password (e.g. Server@2050)"
                  required
                  class="w-full p-3.5 pl-10 pr-12 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white font-mono text-sm transition-all focus:outline-none"
                />
                <i class="fa-solid fa-key absolute left-3.5 top-4 text-slate-500 text-xs"></i>
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute right-3 top-3.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  <i [class]="showPassword() ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              [disabled]="isLoggingIn() || !adminPassword.trim()"
              class="w-full py-4 px-6 rounded-2xl btn-gold-glow font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
            >
              <span *ngIf="!isLoggingIn()" class="flex items-center gap-2">
                <i class="fa-solid fa-shield-halved"></i>
                <span>UNLOCK TERMINAL</span>
                <i class="fa-solid fa-arrow-right text-xs"></i>
              </span>
              <span *ngIf="isLoggingIn()" class="flex items-center gap-2">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Verifying Credentials...</span>
              </span>
            </button>
          </form>

          <div class="text-[11px] text-slate-500 font-mono">
            Authorized administrative access only. All actions are logged.
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- STATE 2: EXECUTIVE DASHBOARD (AUTHENTICATED)                      -->
      <!-- ================================================================= -->
      <div *ngIf="adminService.isAdminLoggedIn()" class="space-y-6">

        <!-- Executive Top Bar -->
        <div class="glass-panel p-5 sm:p-6 border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 shadow-md">
              <app-morgan-treasure-logo size="sm" [showTagline]="false"></app-morgan-treasure-logo>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-xl sm:text-2xl font-black text-white tracking-tight">Executive Management Terminal</h1>
                <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  MariaDB Live
                </span>
              </div>
              <div class="text-xs text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                <span>Database: <strong class="text-amber-400 font-mono">morgantreasure_morgantreasure</strong></span>
                <span>&bull;</span>
                <span>Protocol Yield: <strong class="text-emerald-400">{{ liquidityStats()?.currentDailyRoiPercent || 0.84 }}% Daily ROI</strong></span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              (click)="refreshAllData()"
              [disabled]="isRefreshing()"
              class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Refresh all metrics from MariaDB"
            >
              <i class="fa-solid fa-arrows-rotate" [ngClass]="isRefreshing() ? 'fa-spin' : ''"></i>
              <span>Refresh</span>
            </button>

            <button
              (click)="handleAdminLogout()"
              class="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Exit Admin Terminal"
            >
              <i class="fa-solid fa-power-off"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800 font-mono text-xs">
          <button
            (click)="activeTab.set('overview')"
            class="px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2"
            [ngClass]="activeTab() === 'overview' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'"
          >
            <i class="fa-solid fa-chart-line"></i>
            <span>Financial Overview</span>
          </button>

          <button
            (click)="activeTab.set('users')"
            class="px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2"
            [ngClass]="activeTab() === 'users' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'"
          >
            <i class="fa-solid fa-users"></i>
            <span>Investors Directory ({{ overview()?.totalUsers || 0 }})</span>
          </button>

          <button
            (click)="activeTab.set('cron')"
            class="px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2"
            [ngClass]="activeTab() === 'cron' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'"
          >
            <i class="fa-solid fa-bolt"></i>
            <span>Manual ROI Cron</span>
          </button>

          <button
            (click)="activeTab.set('wallets')"
            class="px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2"
            [ngClass]="activeTab() === 'wallets' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'"
          >
            <i class="fa-solid fa-key"></i>
            <span>Private Keys Vault</span>
          </button>

          <button
            (click)="activeTab.set('levels')"
            class="px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2"
            [ngClass]="activeTab() === 'levels' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'"
          >
            <i class="fa-solid fa-sitemap"></i>
            <span>15-Tier Matrix</span>
          </button>

          <button
            (click)="activeTab.set('transactions')"
            class="px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2"
            [ngClass]="activeTab() === 'transactions' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'"
          >
            <i class="fa-solid fa-receipt"></i>
            <span>Transactions Ledger</span>
          </button>
        </div>

        <!-- =============================================================== -->
        <!-- TAB 1: FINANCIAL OVERVIEW                                       -->
        <!-- =============================================================== -->
        <div *ngIf="activeTab() === 'overview'" class="space-y-6 animate-fade-in">
          
          <!-- Master KPI Row 1: Financial Health -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Total Staking Turnover -->
            <div class="glass-panel p-5 border-amber-500/20 space-y-2 relative overflow-hidden">
              <div class="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>TOTAL STAKING TURNOVER</span>
                <i class="fa-solid fa-vault text-amber-400 text-base"></i>
              </div>
              <div class="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                \${{ (overview()?.totalStakedUsdt || 0) | number:'1.2-2' }}
              </div>
              <div class="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Active Stakers:</span>
                <span class="text-emerald-400 font-bold font-mono">{{ overview()?.activeStakers || 0 }} Investors</span>
              </div>
            </div>

            <!-- Total Withdrawals -->
            <div class="glass-panel p-5 border-slate-800 space-y-2 relative overflow-hidden">
              <div class="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>TOTAL WITHDRAWN (5% FEE)</span>
                <i class="fa-solid fa-money-bill-transfer text-rose-400 text-base"></i>
              </div>
              <div class="text-2xl sm:text-3xl font-black text-white font-mono">
                \${{ (overview()?.totalWithdrawnUsdt || 0) | number:'1.2-2' }}
              </div>
              <div class="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Total Payouts:</span>
                <span class="text-slate-300 font-mono">BEP-20 USDT</span>
              </div>
            </div>

            <!-- Net Protocol Retention -->
            <div class="glass-panel p-5 border-emerald-500/20 space-y-2 relative overflow-hidden">
              <div class="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>NET PROTOCOL RETENTION</span>
                <i class="fa-solid fa-scale-balanced text-emerald-400 text-base"></i>
              </div>
              <div class="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                \${{ (overview()?.netRetentionUsdt || 0) | number:'1.2-2' }}
              </div>
              <div class="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Retention Rate:</span>
                <span class="text-emerald-300 font-bold font-mono">
                  {{ overview()?.totalStakedUsdt ? (((overview()?.netRetentionUsdt || 0) / (overview()?.totalStakedUsdt || 1)) * 100 | number:'1.1-1') : 100 }}%
                </span>
              </div>
            </div>

            <!-- Total Registered Members -->
            <div class="glass-panel p-5 border-slate-800 space-y-2 relative overflow-hidden">
              <div class="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>REGISTERED INVESTORS</span>
                <i class="fa-solid fa-users text-cyan-400 text-base"></i>
              </div>
              <div class="text-2xl sm:text-3xl font-black text-white font-mono">
                {{ (overview()?.totalUsers || 0) | number }}
              </div>
              <div class="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Active / Inactive:</span>
                <span class="text-cyan-300 font-mono font-bold">
                  {{ overview()?.activeStakers || 0 }} / {{ overview()?.inactiveUsers || 0 }}
                </span>
              </div>
            </div>

          </div>

          <!-- Master KPI Row 2: Commission Distribution & Reserves -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div class="text-xs text-slate-400 font-mono">15-LEVEL MATRIX COMMISSIONS</div>
              <div class="text-xl font-bold text-amber-400 font-mono">\${{ (overview()?.totalLevelCommissionsUsdt || 0) | number:'1.2-2' }}</div>
              <div class="text-[11px] text-slate-500">Distributed across 15 downline levels</div>
            </div>

            <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div class="text-xs text-slate-400 font-mono">DYNAMIC DAILY ROI DISTRIBUTED</div>
              <div class="text-xl font-bold text-emerald-400 font-mono">\${{ (overview()?.totalRoiDistributedUsdt || 0) | number:'1.2-2' }}</div>
              <div class="text-[11px] text-slate-500">Calculated between 0.50% and 1.00% APY</div>
            </div>

            <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div class="text-xs text-slate-400 font-mono">DIRECT 10% REFERRAL BONUSES</div>
              <div class="text-xl font-bold text-cyan-400 font-mono">\${{ (overview()?.totalDirectBonusesUsdt || 0) | number:'1.2-2' }}</div>
              <div class="text-[11px] text-slate-500">Paid directly on 1st level sponsor invites</div>
            </div>

            <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div class="text-xs text-slate-400 font-mono">UNCLAIMED USER WALLET BALANCES</div>
              <div class="text-xl font-bold text-amber-300 font-mono">\${{ (overview()?.unclaimedUserBalancesUsdt || 0) | number:'1.2-2' }}</div>
              <div class="text-[11px] text-slate-500">Currently resting inside user dashboard balances</div>
            </div>

          </div>

          <!-- Liquidity Pool & Token Presale Cards -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- Liquidity Reserve Health -->
            <div class="glass-panel p-6 border-slate-800 space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                  <h3 class="font-bold text-white text-base">Liquidity Pool Reserve Health</h3>
                </div>
                <span class="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                  {{ liquidityStats()?.currentDailyRoiPercent || 0.84 }}% Daily APY
                </span>
              </div>

              <div class="grid grid-cols-2 gap-4 font-mono text-xs">
                <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span class="text-slate-400">Total Pool Liquidity:</span>
                  <div class="text-lg font-bold text-white">\${{ (liquidityStats()?.totalPoolLiquidityUsdt || 0) | number:'1.0-0' }}</div>
                </div>
                <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span class="text-slate-400">Available Reserve:</span>
                  <div class="text-lg font-bold text-emerald-400">\${{ (liquidityStats()?.availableReserveUsdt || 0) | number:'1.0-0' }}</div>
                </div>
              </div>

              <div class="space-y-1.5 font-mono text-xs">
                <div class="flex items-center justify-between text-slate-400">
                  <span>Pool Optimal Reserve Utilization</span>
                  <span class="text-amber-400 font-bold">{{ liquidityStats()?.utilizationRate || 74.39 }}%</span>
                </div>
                <div class="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    class="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all"
                    [style.width.%]="liquidityStats()?.utilizationRate || 74.39"
                  ></div>
                </div>
                <div class="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Minimum Floor: 0.50% / Day</span>
                  <span>Maximum Ceiling: 1.00% / Day</span>
                </div>
              </div>
            </div>

            <!-- MTG Token Presale Status -->
            <div class="glass-panel p-6 border-slate-800 space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs font-mono">
                    MTG
                  </div>
                  <h3 class="font-bold text-white text-base">MTG Token Presale Status</h3>
                </div>
                <span class="text-xs font-mono text-amber-400 font-bold">
                  1 MTG = $0.25 USDT
                </span>
              </div>

              <div class="grid grid-cols-2 gap-4 font-mono text-xs">
                <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span class="text-slate-400">Tokens Sold:</span>
                  <div class="text-lg font-bold text-white">{{ (tokenPresale()?.tokensSold || 0) | number }} MTG</div>
                </div>
                <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span class="text-slate-400">USDT / BNB Raised:</span>
                  <div class="text-lg font-bold text-amber-300">
                    \${{ (tokenPresale()?.usdtCollected || 0) | number:'1.2-2' }} / {{ (tokenPresale()?.bnbCollected || 0) | number:'1.2-2' }} BNB
                  </div>
                </div>
              </div>

              <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span class="text-slate-400">Total Purchase Orders:</span>
                <span class="text-white font-bold">{{ tokenPresale()?.totalOrders || 0 }} Orders</span>
              </div>
            </div>

          </div>

        </div>

        <!-- =============================================================== -->
        <!-- TAB 2: INVESTORS DIRECTORY                                      -->
        <!-- =============================================================== -->
        <div *ngIf="activeTab() === 'users'" class="space-y-4 animate-fade-in">
          
          <!-- Filter & Search Toolbar -->
          <div class="glass-panel p-4 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="relative w-full sm:w-80">
              <input
                type="text"
                [(ngModel)]="userSearchQuery"
                (input)="onUserSearchChange()"
                placeholder="Search by User ID, Wallet, or Sponsor..."
                class="w-full p-2.5 pl-9 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white font-mono text-xs focus:outline-none"
              />
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-500 text-xs"></i>
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto font-mono text-xs">
              <span class="text-slate-400 text-[11px]">Filter:</span>
              <button
                (click)="setUserFilter('all')"
                class="px-2.5 py-1 rounded-lg border text-xs"
                [ngClass]="userStatusFilter === 'all' ? 'bg-amber-500 text-black border-amber-500 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'"
              >
                All ({{ totalUsersCount() }})
              </button>
              <button
                (click)="setUserFilter('active')"
                class="px-2.5 py-1 rounded-lg border text-xs"
                [ngClass]="userStatusFilter === 'active' ? 'bg-emerald-500 text-black border-emerald-500 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'"
              >
                Active
              </button>
              <button
                (click)="setUserFilter('inactive')"
                class="px-2.5 py-1 rounded-lg border text-xs"
                [ngClass]="userStatusFilter === 'inactive' ? 'bg-slate-700 text-white border-slate-700 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'"
              >
                Inactive
              </button>
            </div>
          </div>

          <!-- Users Table -->
          <div class="glass-panel rounded-2xl border-slate-800 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs font-mono">
                <thead class="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th class="p-3">User ID</th>
                    <th class="p-3">Wallet Address</th>
                    <th class="p-3">Sponsor ID</th>
                    <th class="p-3">Total Staked</th>
                    <th class="p-3">Available Bal</th>
                    <th class="p-3">Directs / Team</th>
                    <th class="p-3">Rank</th>
                    <th class="p-3">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr *ngFor="let u of usersList()" class="hover:bg-slate-900/50 transition-colors">
                    <td class="p-3 font-bold text-amber-400 whitespace-nowrap">{{ u.user_id }}</td>
                    <td class="p-3 text-slate-300 whitespace-nowrap">
                      <div class="flex items-center gap-1.5">
                        <span class="truncate max-w-[140px]">{{ u.wallet_address }}</span>
                        <button (click)="copyText(u.wallet_address)" class="text-slate-500 hover:text-amber-300 cursor-pointer" title="Copy Address">
                          <i class="fa-regular fa-copy text-[10px]"></i>
                        </button>
                      </div>
                    </td>
                    <td class="p-3 text-slate-400 whitespace-nowrap">{{ u.sponsor_id }}</td>
                    <td class="p-3 font-bold text-white whitespace-nowrap">\${{ u.total_staked_usdt | number:'1.2-2' }}</td>
                    <td class="p-3 text-emerald-400 whitespace-nowrap">\${{ u.available_balance_usdt | number:'1.2-2' }}</td>
                    <td class="p-3 whitespace-nowrap">{{ u.directs_count }} / {{ u.total_team_count }}</td>
                    <td class="p-3 text-amber-300 text-[11px] whitespace-nowrap">{{ u.rank }}</td>
                    <td class="p-3 whitespace-nowrap">
                      <span *ngIf="u.total_staked_usdt > 0 || u.is_active" class="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                        ACTIVE
                      </span>
                      <span *ngIf="u.total_staked_usdt == 0 && !u.is_active" class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                        INACTIVE
                      </span>
                    </td>
                  </tr>

                  <tr *ngIf="usersList().length === 0">
                    <td colspan="8" class="p-8 text-center text-slate-500 font-mono">
                      No investors found matching the search query.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination Bar -->
            <div class="p-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <div>
                Page {{ userCurrentPage }} of {{ userTotalPages() || 1 }} &bull; Total: {{ totalUsersCount() }} Investors
              </div>
              <div class="flex items-center gap-1.5">
                <button
                  (click)="changeUserPage(userCurrentPage - 1)"
                  [disabled]="userCurrentPage <= 1"
                  class="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  (click)="changeUserPage(userCurrentPage + 1)"
                  [disabled]="userCurrentPage >= userTotalPages()"
                  class="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- =============================================================== -->
        <!-- TAB 3: MANUAL DAILY ROI CRON                                    -->
        <!-- =============================================================== -->
        <div *ngIf="activeTab() === 'cron'" class="space-y-6 animate-fade-in max-w-4xl mx-auto">
          
          <!-- Trigger Card -->
          <div class="glass-panel p-6 sm:p-8 border-amber-500/30 space-y-5 relative overflow-hidden">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 class="text-xl font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-bolt text-amber-400"></i>
                  <span>Manual Dynamic Daily ROI Trigger</span>
                </h3>
                <p class="text-xs text-slate-400 mt-1 font-mono">
                  Calculates and credits dynamic 0.50% - 1.00% daily yields directly to all active stakers in MariaDB.
                </p>
              </div>

              <div class="flex items-center gap-2">
                <label class="flex items-center gap-2 text-xs font-mono text-slate-400 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="cronForceRun" class="rounded border-slate-700 text-amber-500" />
                  <span>Force Re-run</span>
                </label>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span class="text-slate-400">Current Dynamic APY:</span>
                <div class="text-lg font-bold text-emerald-400">{{ liquidityStats()?.currentDailyRoiPercent || 0.84 }}% / Day</div>
              </div>
              <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span class="text-slate-400">Eligible Active Stakers:</span>
                <div class="text-lg font-bold text-amber-300">{{ overview()?.activeStakers || 0 }} Users</div>
              </div>
              <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span class="text-slate-400">Last Execution:</span>
                <div class="text-xs font-bold text-white truncate">{{ lastCronLog()?.created_at || 'Never' }}</div>
              </div>
            </div>

            <!-- Trigger Button -->
            <button
              (click)="executeManualCron()"
              [disabled]="isExecutingCron()"
              class="w-full py-4 px-6 rounded-2xl btn-gold-glow font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/25 disabled:opacity-50"
            >
              <span *ngIf="!isExecutingCron()" class="flex items-center gap-2">
                <i class="fa-solid fa-play"></i>
                <span>EXECUTE DAILY ROI CRON NOW</span>
                <i class="fa-solid fa-bolt text-xs"></i>
              </span>
              <span *ngIf="isExecutingCron()" class="flex items-center gap-2">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Calculating Yields & Crediting MariaDB Accounts...</span>
              </span>
            </button>

            <!-- Execution Result Alert -->
            <div *ngIf="cronExecutionResult()" class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono space-y-1">
              <div class="font-bold flex items-center gap-2 text-emerald-400 text-sm">
                <i class="fa-solid fa-circle-check"></i> Cron Executed Successfully!
              </div>
              <div>Users Processed: <strong>{{ cronExecutionResult()?.usersProcessed }}</strong></div>
              <div>Total USDT Payout Credited: <strong>\${{ cronExecutionResult()?.totalPayoutUsdt | number:'1.2-2' }}</strong></div>
              <div>Daily Rate Applied: <strong>{{ cronExecutionResult()?.roiRatePercent }}%</strong></div>
              <div>Execution Time: <strong>{{ cronExecutionResult()?.executionSeconds }}s</strong></div>
            </div>
          </div>

          <!-- Cron Execution History Table -->
          <div class="glass-panel p-5 border-slate-800 space-y-3">
            <h4 class="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
              Recent Cron Execution Logs
            </h4>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs font-mono">
                <thead class="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th class="p-2.5">Date / Time</th>
                    <th class="p-2.5">Users Processed</th>
                    <th class="p-2.5">Total Payout</th>
                    <th class="p-2.5">Rate %</th>
                    <th class="p-2.5">Duration</th>
                    <th class="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr *ngFor="let l of cronLogsList()" class="hover:bg-slate-900/50">
                    <td class="p-2.5 text-slate-300 whitespace-nowrap">{{ l.created_at }}</td>
                    <td class="p-2.5 font-bold text-amber-400">{{ l.users_processed }}</td>
                    <td class="p-2.5 font-bold text-emerald-400">\${{ l.total_payout_usdt | number:'1.2-2' }}</td>
                    <td class="p-2.5 text-white">{{ l.roi_rate_percent }}%</td>
                    <td class="p-2.5 text-slate-400">{{ l.execution_seconds }}s</td>
                    <td class="p-2.5">
                      <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                        {{ l.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- =============================================================== -->
        <!-- TAB 4: PRIVATE KEYS & BEP-20 WALLETS VAULT                     -->
        <!-- =============================================================== -->
        <div *ngIf="activeTab() === 'wallets'" class="space-y-4 animate-fade-in">
          
          <!-- Caution Alert -->
          <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 font-mono">
            <i class="fa-solid fa-shield-halved text-amber-400 text-lg shrink-0 mt-0.5"></i>
            <div>
              <div class="font-bold text-white mb-0.5">High Security Vault &bull; User Private Keys</div>
              <div>
                This table securely exposes on-chain private keys generated for protocol members. Keys are masked by default. Click the eye icon to reveal a specific key.
              </div>
            </div>
          </div>

          <!-- Search Bar -->
          <div class="glass-panel p-4 border-slate-800 flex items-center justify-between gap-3">
            <div class="relative w-full sm:w-96">
              <input
                type="text"
                [(ngModel)]="walletSearchQuery"
                (input)="onWalletSearchChange()"
                placeholder="Search wallet by User ID or Address..."
                class="w-full p-2.5 pl-9 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white font-mono text-xs focus:outline-none"
              />
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-500 text-xs"></i>
            </div>
            <div class="text-xs font-mono text-slate-400">
              Total Keys: <strong class="text-white">{{ totalWalletsCount() }}</strong>
            </div>
          </div>

          <!-- Wallets Table -->
          <div class="glass-panel rounded-2xl border-slate-800 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs font-mono">
                <thead class="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th class="p-3">User ID</th>
                    <th class="p-3">Wallet Address (BEP-20)</th>
                    <th class="p-3">Private Key</th>
                    <th class="p-3">Network</th>
                    <th class="p-3">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr *ngFor="let w of walletsList()" class="hover:bg-slate-900/50 transition-colors">
                    <td class="p-3 font-bold text-amber-400 whitespace-nowrap">{{ w.user_id }}</td>
                    <td class="p-3 text-slate-300 whitespace-nowrap">
                      <div class="flex items-center gap-1.5">
                        <span class="truncate max-w-[150px]">{{ w.wallet_address }}</span>
                        <button (click)="copyText(w.wallet_address)" class="text-slate-500 hover:text-amber-300 cursor-pointer" title="Copy Address">
                          <i class="fa-regular fa-copy text-[10px]"></i>
                        </button>
                      </div>
                    </td>
                    <td class="p-3 whitespace-nowrap">
                      <div class="flex items-center gap-2">
                        <span *ngIf="!revealedKeys[w.id]" class="text-slate-500 tracking-widest font-mono">
                          ••••••••••••••••••••••••••••••••
                        </span>
                        <span *ngIf="revealedKeys[w.id]" class="text-emerald-400 font-mono select-all">
                          {{ w.private_key }}
                        </span>
                        <button
                          (click)="toggleKeyReveal(w.id)"
                          class="p-1 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                          [title]="revealedKeys[w.id] ? 'Hide Key' : 'Reveal Key'"
                        >
                          <i [class]="revealedKeys[w.id] ? 'fa-solid fa-eye-slash text-xs' : 'fa-solid fa-eye text-xs'"></i>
                        </button>
                      </div>
                    </td>
                    <td class="p-3 text-slate-400 text-[11px] whitespace-nowrap">{{ w.network }}</td>
                    <td class="p-3 whitespace-nowrap">
                      <button
                        (click)="copyText(w.private_key)"
                        class="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 text-[10px] font-bold cursor-pointer"
                      >
                        Copy Key
                      </button>
                    </td>
                  </tr>

                  <tr *ngIf="walletsList().length === 0">
                    <td colspan="5" class="p-8 text-center text-slate-500 font-mono">
                      No private keys found matching the query.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination Bar -->
            <div class="p-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <div>
                Page {{ walletCurrentPage }} of {{ walletTotalPages() || 1 }} &bull; Total: {{ totalWalletsCount() }} Wallets
              </div>
              <div class="flex items-center gap-1.5">
                <button
                  (click)="changeWalletPage(walletCurrentPage - 1)"
                  [disabled]="walletCurrentPage <= 1"
                  class="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  (click)="changeWalletPage(walletCurrentPage + 1)"
                  [disabled]="walletCurrentPage >= walletTotalPages()"
                  class="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- =============================================================== -->
        <!-- TAB 5: 15-TIER MLM MATRIX BREAKDOWN                             -->
        <!-- =============================================================== -->
        <div *ngIf="activeTab() === 'levels'" class="space-y-4 animate-fade-in">
          <div class="glass-panel p-5 border-slate-800 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-bold text-white text-base">15-Level Matrix Distribution Analytics</h3>
                <p class="text-xs text-slate-400 font-mono">Total MLM referral volume and commissions distributed across all 15 tiers.</p>
              </div>
              <span class="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                Total MLM: \${{ (overview()?.totalLevelCommissionsUsdt || 0) | number:'1.2-2' }}
              </span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs font-mono">
                <thead class="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th class="p-3">Level</th>
                    <th class="p-3">Commission Rate</th>
                    <th class="p-3">Total Payouts Count</th>
                    <th class="p-3">Unique Beneficiaries</th>
                    <th class="p-3">Total Commission Paid</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr *ngFor="let t of tierStatsList()" class="hover:bg-slate-900/50">
                    <td class="p-3 font-bold text-amber-400">Level {{ t.level }}</td>
                    <td class="p-3 text-white font-bold">{{ t.ratePercent }}%</td>
                    <td class="p-3 text-slate-300">{{ t.payoutCount | number }}</td>
                    <td class="p-3 text-cyan-300">{{ t.uniqueBeneficiaries | number }} Users</td>
                    <td class="p-3 font-black text-emerald-400">\${{ t.totalDistributedUsdt | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- TAB 6: TRANSACTIONS AUDIT LEDGER                                -->
        <!-- =============================================================== -->
        <div *ngIf="activeTab() === 'transactions'" class="space-y-4 animate-fade-in">
          
          <div class="glass-panel p-4 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="relative w-full sm:w-80">
              <input
                type="text"
                [(ngModel)]="txSearchQuery"
                (input)="onTxSearchChange()"
                placeholder="Search Tx by User ID, Address, or Tx Hash..."
                class="w-full p-2.5 pl-9 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white font-mono text-xs focus:outline-none"
              />
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-500 text-xs"></i>
            </div>

            <div class="flex items-center gap-2 font-mono text-xs">
              <span class="text-slate-400 text-[11px]">Type:</span>
              <select
                [(ngModel)]="txTypeFilter"
                (change)="loadTransactions()"
                class="p-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="daily_roi">Daily ROI</option>
                <option value="level_income">Level Income</option>
                <option value="direct_bonus">Direct Bonus</option>
              </select>
            </div>
          </div>

          <div class="glass-panel rounded-2xl border-slate-800 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs font-mono">
                <thead class="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th class="p-3">Type</th>
                    <th class="p-3">User ID</th>
                    <th class="p-3">Wallet</th>
                    <th class="p-3">Amount</th>
                    <th class="p-3">Tx Hash</th>
                    <th class="p-3">Timestamp</th>
                    <th class="p-3">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr *ngFor="let tx of transactionsList()" class="hover:bg-slate-900/50">
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase" [ngClass]="getTxTypeClass(tx.type)">
                        {{ tx.type }}
                      </span>
                    </td>
                    <td class="p-3 font-bold text-amber-400">{{ tx.user_id }}</td>
                    <td class="p-3 text-slate-400 truncate max-w-[120px]">{{ tx.wallet_address }}</td>
                    <td class="p-3 font-bold text-white">\${{ tx.amount_usdt | number:'1.2-2' }}</td>
                    <td class="p-3 text-cyan-400">
                      <span class="truncate max-w-[120px] inline-block align-middle">{{ tx.tx_hash }}</span>
                    </td>
                    <td class="p-3 text-slate-400 text-[11px] whitespace-nowrap">{{ tx.created_at }}</td>
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase">
                        {{ tx.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  `,
  styles: []
})
export class AdminComponent implements OnInit {
  public adminPassword = '';
  public showPassword = signal<boolean>(false);
  public isLoggingIn = signal<boolean>(false);
  public isRefreshing = signal<boolean>(false);
  public isExecutingCron = signal<boolean>(false);

  public activeTab = signal<'overview' | 'users' | 'cron' | 'wallets' | 'levels' | 'transactions'>('overview');

  // Overview data
  public overview = signal<AdminOverview | null>(null);
  public liquidityStats = signal<AdminLiquidity | null>(null);
  public tokenPresale = signal<AdminTokenPresale | null>(null);
  public lastCronLog = signal<AdminCronLog | null>(null);

  // Users Tab
  public usersList = signal<AdminUserItem[]>([]);
  public totalUsersCount = signal<number>(0);
  public userCurrentPage = 1;
  public userTotalPages = signal<number>(1);
  public userSearchQuery = '';
  public userStatusFilter = 'all';

  // Wallets & Keys Tab
  public walletsList = signal<AdminWalletItem[]>([]);
  public totalWalletsCount = signal<number>(0);
  public walletCurrentPage = 1;
  public walletTotalPages = signal<number>(1);
  public walletSearchQuery = '';
  public revealedKeys: Record<number, boolean> = {};

  // Cron Tab
  public cronForceRun = false;
  public cronExecutionResult = signal<any | null>(null);
  public cronLogsList = signal<AdminCronLog[]>([]);

  // Level Stats Tab
  public tierStatsList = signal<AdminTierStat[]>([]);

  // Transactions Tab
  public transactionsList = signal<AdminTransactionItem[]>([]);
  public txSearchQuery = '';
  public txTypeFilter = 'all';

  private userDebounce: any = null;
  private walletDebounce: any = null;
  private txDebounce: any = null;

  constructor(
    public adminService: AdminService,
    private notifications: NotificationService,
    private sounds: SoundService
  ) {}

  ngOnInit(): void {
    if (this.adminService.isAdminLoggedIn()) {
      this.refreshAllData();
    }
  }

  handleAdminLogin(): void {
    if (!this.adminPassword.trim()) return;

    this.isLoggingIn.set(true);
    this.adminService.login(this.adminPassword.trim()).subscribe(res => {
      this.isLoggingIn.set(false);
      if (res.success) {
        this.sounds.playSuccess();
        this.notifications.success('Access Granted', 'Welcome to the Morgan Treasure Executive Terminal.');
        this.refreshAllData();
      } else {
        this.sounds.playError();
        this.notifications.error('Access Denied', res.message || 'Invalid admin credentials.');
      }
    });
  }

  handleAdminLogout(): void {
    this.sounds.playTap();
    this.adminService.logout();
    this.notifications.info('Logged Out', 'Admin session terminated.');
  }

  refreshAllData(): void {
    this.isRefreshing.set(true);
    this.loadOverview();
    this.loadUsers();
    this.loadWallets();
    this.loadCronLogs();
    this.loadTierStats();
    this.loadTransactions();

    setTimeout(() => {
      this.isRefreshing.set(false);
    }, 600);
  }

  loadOverview(): void {
    this.adminService.getOverview().subscribe(data => {
      if (data) {
        this.overview.set(data.overview);
        this.liquidityStats.set(data.liquidity);
        this.tokenPresale.set(data.tokenPresale);
        this.lastCronLog.set(data.lastCron);
      }
    });
  }

  loadUsers(): void {
    this.adminService.getUsers(this.userCurrentPage, 25, this.userSearchQuery, this.userStatusFilter).subscribe(res => {
      this.usersList.set(res.users);
      this.totalUsersCount.set(res.totalCount);
      this.userTotalPages.set(res.totalPages);
    });
  }

  onUserSearchChange(): void {
    if (this.userDebounce) clearTimeout(this.userDebounce);
    this.userDebounce = setTimeout(() => {
      this.userCurrentPage = 1;
      this.loadUsers();
    }, 400);
  }

  setUserFilter(status: 'all' | 'active' | 'inactive'): void {
    this.userStatusFilter = status;
    this.userCurrentPage = 1;
    this.loadUsers();
  }

  changeUserPage(p: number): void {
    if (p < 1 || p > this.userTotalPages()) return;
    this.userCurrentPage = p;
    this.loadUsers();
  }

  loadWallets(): void {
    this.adminService.getWallets(this.walletCurrentPage, 25, this.walletSearchQuery).subscribe(res => {
      this.walletsList.set(res.wallets);
      this.totalWalletsCount.set(res.totalCount);
      this.walletTotalPages.set(res.totalPages);
    });
  }

  onWalletSearchChange(): void {
    if (this.walletDebounce) clearTimeout(this.walletDebounce);
    this.walletDebounce = setTimeout(() => {
      this.walletCurrentPage = 1;
      this.loadWallets();
    }, 400);
  }

  changeWalletPage(p: number): void {
    if (p < 1 || p > this.walletTotalPages()) return;
    this.walletCurrentPage = p;
    this.loadWallets();
  }

  toggleKeyReveal(walletId: number): void {
    this.revealedKeys[walletId] = !this.revealedKeys[walletId];
  }

  executeManualCron(): void {
    this.isExecutingCron.set(true);
    this.cronExecutionResult.set(null);

    this.adminService.triggerDailyRoiCron(this.cronForceRun).subscribe(res => {
      this.isExecutingCron.set(false);
      if (res.success) {
        this.sounds.playSuccess();
        this.notifications.success('Daily ROI Executed', res.message);
        this.cronExecutionResult.set(res.data);
        this.loadOverview();
        this.loadCronLogs();
      } else {
        this.sounds.playError();
        this.notifications.warning('Cron Notice', res.message);
      }
    });
  }

  loadCronLogs(): void {
    this.adminService.getCronLogs().subscribe(logs => {
      this.cronLogsList.set(logs);
      if (logs.length > 0) {
        this.lastCronLog.set(logs[0]);
      }
    });
  }

  loadTierStats(): void {
    this.adminService.getLevelStats().subscribe(tiers => {
      this.tierStatsList.set(tiers);
    });
  }

  loadTransactions(): void {
    this.adminService.getTransactions(1, 25, this.txTypeFilter, this.txSearchQuery).subscribe(res => {
      this.transactionsList.set(res.transactions);
    });
  }

  onTxSearchChange(): void {
    if (this.txDebounce) clearTimeout(this.txDebounce);
    this.txDebounce = setTimeout(() => {
      this.loadTransactions();
    }, 400);
  }

  getTxTypeClass(type: string): string {
    switch (type) {
      case 'deposit': return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
      case 'withdrawal': return 'bg-rose-500/15 text-rose-300 border border-rose-500/30';
      case 'daily_roi': return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
      case 'level_income': return 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30';
      case 'direct_bonus': return 'bg-purple-500/15 text-purple-300 border border-purple-500/30';
      default: return 'bg-slate-800 text-slate-300';
    }
  }

  copyText(txt: string): void {
    if (txt) {
      navigator.clipboard.writeText(txt);
      this.notifications.info('Copied', 'Content copied to clipboard.');
    }
  }
}
