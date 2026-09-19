import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DappStateService } from '../../services/dapp-state.service';
import { Web3Service } from '../../services/web3.service';
import { PhpApiService } from '../../services/php-api.service';
import { NotificationService } from '../../services/notification.service';
import { SoundService } from '../../services/sound.service';

@Component({
  selector: 'app-deposit-fund',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 sm:space-y-10 animate-fade-in font-sans">
      
      <!-- Top Title & Live Yield Header Banner -->
      <div class="glass-panel p-6 sm:p-8 border-amber-500/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div class="absolute -right-12 -top-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div>
          <div class="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider mb-2">
            <i class="fa-solid fa-vault text-sm"></i>
            BEP-20 ON-CHAIN STAKING
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Start Staking USDT
          </h1>
          <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Deposit Tether (USDT) on BNB Smart Chain to earn automated daily profits of <span class="text-amber-300 font-bold">0.50% to 1.00%</span> with guaranteed <span class="text-emerald-400 font-bold">300% maximum return cap</span>.
          </p>
        </div>

        <div class="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 text-left md:text-right shrink-0">
          <div class="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">Today's Profit Rate</div>
          <div class="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-sans tabular-nums mt-0.5">
            +{{ dappState.liquidityPool().currentDailyRoiPercent }}% / Day
          </div>
          <div class="text-xs text-amber-400 font-mono mt-0.5">
            ≈ {{ (dappState.liquidityPool().currentDailyRoiPercent * 30).toFixed(1) }}% Monthly Average
          </div>
        </div>
      </div>

      <!-- Mode Selector Tabs -->
      <div class="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 max-w-lg">
        <button
          (click)="activeTab.set('deposit')"
          class="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          [ngClass]="activeTab() === 'deposit' ? 'btn-gold-glow text-black font-extrabold shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white'"
        >
          <i class="fa-solid fa-hand-holding-dollar"></i>
          <span>1. Stake USDT (0.5%–1% ROI)</span>
        </button>
        <button
          (click)="activeTab.set('buy_token')"
          class="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          [ngClass]="activeTab() === 'buy_token' ? 'btn-gold-glow text-black font-extrabold shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white'"
        >
          <i class="fa-solid fa-coins"></i>
          <span>2. Buy MTG ($0.25)</span>
        </button>
      </div>

      <!-- ================================================================= -->
      <!-- TAB 1: STAKE USDT (RESPONSIVE 2-COL ON DESKTOP, STACKED ON MOBILE) -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab() === 'deposit'" class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 animate-fade-in items-start">
        
        <!-- COL 1: PACKAGE SELECTOR & STAKING FORM (7 cols on lg) -->
        <div class="lg:col-span-7 glass-panel p-6 sm:p-8 border-amber-500/25 space-y-6">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-layer-group text-amber-400"></i>
                Step 1: Choose Your Staking Package
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">Select a pre-set plan or enter any amount ($50 minimum)</p>
            </div>
            <span class="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              300% Cap
            </span>
          </div>

          <!-- Preset Package Grid (3 columns on sm+, 2 on mobile) -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              *ngFor="let pkg of dappState.packages()"
              (click)="selectPackage(pkg.priceUsdt, pkg.name)"
              type="button"
              class="p-4 sm:p-5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer"
              [ngClass]="selectedAmount === pkg.priceUsdt ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400' : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'"
            >
              <div *ngIf="pkg.popularTag" class="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-500 text-black font-extrabold text-[9px] px-2.5 py-0.5 rounded-bl font-mono">
                {{ pkg.popularTag }}
              </div>
              <div class="flex items-center gap-2 mb-2">
                <i class="fa-solid text-base" [ngClass]="pkg.icon" [style.color]="pkg.badgeColor"></i>
                <span class="text-xs font-bold text-slate-300 truncate">{{ pkg.name }}</span>
              </div>
              <div class="text-2xl font-black text-white tabular-nums">
                \${{ pkg.priceUsdt }}
              </div>
              <div class="text-xs text-emerald-400 font-mono mt-1 font-semibold">
                Unlocks L1–{{ pkg.levelUnlockCount }}
              </div>
            </button>
          </div>

          <!-- Custom Amount Box -->
          <div class="space-y-2 pt-2">
            <div class="flex items-center justify-between text-xs font-mono">
              <label class="text-slate-300 font-bold uppercase">Or Enter Custom USDT Stake:</label>
              <span class="text-amber-400 font-semibold">Minimum: $50 USDT</span>
            </div>
            <div class="relative">
              <div class="absolute left-4 top-3.5 text-slate-500 font-mono font-bold text-xl">$</div>
              <input
                type="number"
                [(ngModel)]="selectedAmount"
                min="50"
                step="50"
                placeholder="500.00"
                class="w-full py-4 pl-10 pr-32 rounded-2xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white font-sans text-xl sm:text-2xl font-black transition-all tabular-nums outline-none"
              />
              <div class="absolute right-3 top-3">
                <span class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 font-mono text-xs font-bold">
                  USDT (BEP-20)
                </span>
              </div>
            </div>
          </div>

          <!-- 2-Step Approval & Staking Execution -->
          <div class="space-y-4 pt-2">
            <div *ngIf="!isApproved()" class="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
                  <i class="fa-solid fa-key"></i> STEP 1: APPROVE USDT ALLOWANCE
                </div>
                <div class="text-xs text-slate-400 mt-0.5">One-time smart contract permission for your wallet</div>
              </div>
              <button
                (click)="handleApprove()"
                [disabled]="isApproving()"
                class="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs font-mono transition-colors shrink-0 cursor-pointer shadow-md"
              >
                <span *ngIf="!isApproving()">Approve USDT</span>
                <span *ngIf="isApproving()"><i class="fa-solid fa-spinner fa-spin"></i> Approving</span>
              </button>
            </div>

            <button
              (click)="handleDeposit()"
              [disabled]="isDepositing() || selectedAmount < 50"
              class="w-full py-4 px-6 rounded-2xl btn-gold-glow font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide cursor-pointer"
            >
              <span *ngIf="!isDepositing()" class="flex items-center gap-2">
                <i class="fa-solid fa-bolt"></i>
                CONFIRM & STAKE \${{ selectedAmount }} USDT NOW
              </span>
              <span *ngIf="isDepositing()" class="flex items-center gap-2">
                <i class="fa-solid fa-circle-notch fa-spin"></i> Broadcasting to BNB Chain...
              </span>
            </button>
          </div>
        </div>

        <!-- COL 2: REAL-TIME YIELD PROJECTION & 300% CEILING (5 cols on lg) -->
        <div class="lg:col-span-5 glass-panel p-6 sm:p-8 border-amber-500/25 space-y-6">
          <div>
            <h3 class="text-base sm:text-lg font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <i class="fa-solid fa-chart-pie text-amber-400"></i>
              Estimated Return Breakdown
            </h3>
            <p class="text-xs text-slate-400 mt-1">Based on today's active pool rate of {{ currentRoiRate() }}% per day</p>

            <!-- Projected Metrics Cards -->
            <div class="space-y-4 mt-4">
              <div class="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800">
                <div class="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                  <span>DAILY ESTIMATED RETURN</span>
                  <span class="text-emerald-400 font-bold">+{{ currentRoiRate() }}% / day</span>
                </div>
                <div class="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                  \${{ calculateDailyReturn().toFixed(2) }} <span class="text-xs font-mono text-slate-400">USDT / day</span>
                </div>
                <div class="text-xs text-slate-400 font-mono mt-1">
                  ≈ ₹{{ (calculateDailyReturn() * dappState.inrRate).toFixed(0) }} INR credited daily
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div class="text-xs font-mono text-slate-400 mb-1">WEEKLY (7 DAYS)</div>
                  <div class="text-lg sm:text-xl font-bold text-amber-300 font-mono tabular-nums">
                    \${{ (calculateDailyReturn() * 7).toFixed(2) }}
                  </div>
                </div>
                <div class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div class="text-xs font-mono text-slate-400 mb-1">MONTHLY (30 DAYS)</div>
                  <div class="text-lg sm:text-xl font-bold text-emerald-400 font-mono tabular-nums">
                    \${{ (calculateDailyReturn() * 30).toFixed(2) }}
                  </div>
                </div>
              </div>

              <!-- 300% Cap Highlight Card -->
              <div class="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 to-slate-950 border border-amber-500/35 space-y-1.5">
                <div class="flex items-center justify-between text-xs text-amber-300 font-mono font-bold">
                  <span>300% MAXIMUM CEILING</span>
                  <span>3.0x CAPITAL RETURN</span>
                </div>
                <div class="text-2xl sm:text-3xl font-extrabold text-amber-400 tabular-nums">
                  \${{ (selectedAmount * 3).toFixed(2) }} USDT
                </div>
                <p class="text-xs text-slate-300 leading-relaxed pt-1">
                  You can earn up to \$<strong>{{ (selectedAmount * 3).toFixed(2) }}</strong> across daily ROI and 15-tier affiliate commissions before re-investing.
                </p>
              </div>
            </div>

            <!-- Guarantee Badges -->
            <div class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-xs text-slate-300 space-y-2 mt-4">
              <div class="flex items-center gap-2 text-emerald-400 font-semibold">
                <i class="fa-solid fa-shield-check"></i> 100% Non-Custodial Smart Contract
              </div>
              <div class="flex items-center gap-2 text-slate-400">
                <i class="fa-solid fa-clock"></i> Daily ROI automatically credited every 24 hours
              </div>
            </div>

          </div>
        </div>

      </div>


      <!-- ================================================================= -->
      <!-- TAB 2: BUY MTG TOKEN SWAP                                         -->
      <!-- ================================================================= -->
      <div *ngIf="activeTab() === 'buy_token'" class="max-w-xl mx-auto glass-panel p-5 sm:p-7 border-amber-500/25 space-y-5 animate-fade-in">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black font-extrabold text-lg shadow-md shadow-amber-500/20 font-mono">
              MTG
            </div>
            <div>
              <h2 class="text-lg font-extrabold text-white">
                Buy MTG Token
              </h2>
              <div class="text-xs text-slate-400 font-mono">
                <span class="text-amber-400 font-bold">1 MTG = $0.25 USDT</span> • BEP-20
              </div>
            </div>
          </div>

          <div class="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold text-right">
            <div>+0.1% BONUS</div>
            <div class="text-[10px] text-emerald-400">AUTO-STAKE</div>
          </div>
        </div>

        <!-- Presale Progress -->
        <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div class="flex items-center justify-between text-xs font-mono">
            <span class="text-slate-400">PRESALE ROUND 1 ALLOCATION</span>
            <span class="text-amber-400 font-bold">{{ dappState.tokenSale().progressPercent }}% ALLOCATED</span>
          </div>
          <div class="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              class="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
              [style.width.%]="dappState.tokenSale().progressPercent"
            ></div>
          </div>
          <div class="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>{{ dappState.tokenSale().tokensSold.toLocaleString() }} MTG Sold</span>
            <span>Target: {{ (dappState.tokenSale().totalPresaleCap / 1000).toFixed(0) }}k MTG</span>
          </div>
        </div>

        <!-- Swap Input Box -->
        <div class="space-y-3">
          <div>
            <div class="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
              <span>YOU PAY</span>
              <span class="text-slate-300">Bal: {{ payMethod === 'BNB' ? web3Service.bnbBalance() : web3Service.usdtBalance() }}</span>
            </div>
            <div class="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
              <input
                type="number"
                [(ngModel)]="payAmount"
                min="0.01"
                step="0.05"
                class="bg-transparent border-none text-white font-mono text-xl font-bold p-1.5 w-full focus:outline-none"
                placeholder="0.0"
              />
              <div class="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800 shrink-0">
                <button
                  type="button"
                  (click)="payMethod = 'BNB'"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all"
                  [ngClass]="payMethod === 'BNB' ? 'bg-amber-500 text-black font-extrabold' : 'text-slate-400 hover:text-white'"
                >
                  BNB
                </button>
                <button
                  type="button"
                  (click)="payMethod = 'USDT'"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all"
                  [ngClass]="payMethod === 'USDT' ? 'bg-emerald-500 text-black font-extrabold' : 'text-slate-400 hover:text-white'"
                >
                  USDT
                </button>
              </div>
            </div>
          </div>

          <!-- Arrow -->
          <div class="flex justify-center -my-1">
            <div class="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 text-xs">
              <i class="fa-solid fa-arrow-down"></i>
            </div>
          </div>

          <!-- You Receive -->
          <div>
            <div class="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
              <span>YOU RECEIVE (ESTIMATED)</span>
              <span class="text-emerald-400">Slippage 0.5%</span>
            </div>
            <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div class="text-2xl font-extrabold text-amber-300 font-mono">
                {{ calculateMtgTokensToReceive().toLocaleString() }}
              </div>
              <div class="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold font-mono">
                MTG
              </div>
            </div>
          </div>
        </div>

        <!-- Auto-Stake Option -->
        <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
          <input
            type="checkbox"
            [(ngModel)]="autoStake"
            id="autoStake"
            class="mt-0.5 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
          />
          <label for="autoStake" class="text-xs text-slate-300 cursor-pointer leading-normal">
            <strong class="text-amber-300">Auto-Stake MTG:</strong> Lock purchased tokens directly to immediately start accruing dynamic 0.5% – 1.0% daily ROI.
          </label>
        </div>

        <!-- Swap Button -->
        <button
          (click)="handleBuyTokens()"
          [disabled]="isBuyingTokens() || payAmount <= 0"
          class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-base shadow-xl shadow-amber-500/25 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide font-sans"
        >
          <span *ngIf="!isBuyingTokens()">
            SWAP {{ payAmount }} {{ payMethod }} FOR {{ calculateMtgTokensToReceive().toLocaleString() }} MTG
          </span>
          <span *ngIf="isBuyingTokens()" class="flex items-center gap-2">
            <i class="fa-solid fa-circle-notch fa-spin"></i> Swapping on BNB Chain...
          </span>
        </button>
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
export class DepositFundComponent {
  public activeTab = signal<'deposit' | 'buy_token'>('deposit');
  public selectedAmount = 500;
  public selectedPackageName = 'Morgan Gold ($500)';
  public simulatedRate = 0.84;
  public isApproved = signal<boolean>(true);
  public isApproving = signal<boolean>(false);
  public isDepositing = signal<boolean>(false);
  public showManualTransfer = signal<boolean>(false);

  // Buy MTG Token State
  public payMethod: 'BNB' | 'USDT' = 'BNB';
  public payAmount = 0.5;
  public autoStake = true;
  public isBuyingTokens = signal<boolean>(false);

  constructor(
    public dappState: DappStateService,
    public web3Service: Web3Service,
    private phpApi: PhpApiService,
    private notificationService: NotificationService,
    private soundService: SoundService
  ) {}

  currentRoiRate(): number {
    return this.dappState.liquidityPool().currentDailyRoiPercent;
  }

  selectPackage(amount: number, name: string): void {
    this.soundService.playTap();
    this.selectedAmount = amount;
    this.selectedPackageName = name;
  }

  calculateDailyReturn(): number {
    return (this.selectedAmount * this.currentRoiRate()) / 100;
  }

  calculateMtgTokensToReceive(): number {
    if (this.payMethod === 'USDT') {
      return Math.floor(this.payAmount / this.dappState.tokenSale().tokenPriceUsdt);
    }
    return Math.floor(this.payAmount * this.dappState.tokenSale().tokensPerBnb);
  }

  async handleApprove(): Promise<void> {
    this.isApproving.set(true);
    const res = await this.web3Service.approveUsdt(this.selectedAmount);
    this.isApproving.set(false);
    if (res.success) {
      this.isApproved.set(true);
    }
  }

  async handleDeposit(): Promise<void> {
    if (this.selectedAmount < 50) {
      this.notificationService.error('Minimum Deposit', 'Minimum stake amount is $50 USDT.');
      return;
    }

    this.isDepositing.set(true);

    const contractRes = await this.web3Service.executeDepositContract(
      this.selectedAmount,
      this.dappState.user().sponsorAddress
    );

    if (contractRes.success) {
      this.phpApi.recordDeposit({
        wallet_address: this.web3Service.currentAccount(),
        amount_usdt: this.selectedAmount,
        package_id: 'custom_' + this.selectedAmount,
        tx_hash: contractRes.txHash
      }).subscribe();

      this.dappState.depositUsdt(this.selectedAmount, this.selectedPackageName);
      this.isDepositing.set(false);
    }
  }

  async handleBuyTokens(): Promise<void> {
    if (this.payAmount <= 0) return;

    this.isBuyingTokens.set(true);
    const swapRes = await this.web3Service.executeTokenSwap(this.payAmount, this.payMethod);

    if (swapRes.success) {
      const tokensCount = this.calculateMtgTokensToReceive();

      this.phpApi.recordTokenPurchase({
        wallet_address: this.web3Service.currentAccount(),
        tokens_amount: tokensCount,
        paid_amount: this.payAmount,
        paid_currency: this.payMethod,
        tx_hash: swapRes.txHash
      }).subscribe();

      this.dappState.buyMtgTokens(this.payAmount, this.payMethod);
      this.isBuyingTokens.set(false);

      if (this.autoStake) {
        this.notificationService.success('Auto-Staked!', 'Your MTG tokens were auto-staked in the liquidity pool.');
      }
    }
  }

  copyVaultAddress(): void {
    navigator.clipboard.writeText(this.web3Service.morganTreasureVault);
    this.notificationService.info('Copied', 'Morgan Treasure vault contract copied.');
  }
}
