import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DappStateService } from '../../services/dapp-state.service';
import { Web3Service } from '../../services/web3.service';
import { SoundService } from '../../services/sound.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-withdraw-option',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 sm:space-y-10 animate-fade-in font-sans">
      
      <!-- Top Title & Available Balance Box -->
      <div class="glass-panel-emerald p-6 sm:p-8 border-emerald-500/30 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div class="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono text-emerald-400 font-extrabold tracking-wider mb-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            INSTANT BEP-20 ON-CHAIN PAYOUT
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Withdraw Your Profits
          </h1>
          <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Withdraw your daily staking ROI and 15-tier downline commissions directly to your connected Web3 address.
          </p>
        </div>

        <div class="p-5 sm:p-6 rounded-2xl bg-slate-950/90 border border-emerald-500/30 text-left md:text-right shrink-0">
          <div class="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Available To Withdraw</div>
          <div class="text-3xl sm:text-4xl font-black text-emerald-300 font-sans tracking-tight tabular-nums mt-0.5">
            \${{ dappState.user().availableBalanceUsdt.toFixed(2) }}
            <span class="text-sm font-bold text-emerald-400">USDT</span>
          </div>
          <div class="text-xs font-bold text-amber-300 font-mono mt-0.5">
            ≈ ₹{{ (dappState.user().availableBalanceUsdt * dappState.inrRate).toFixed(0) }} INR Available
          </div>
        </div>
      </div>

      <!-- Main Responsive Grid (2 columns on lg, 1 on mobile) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        <!-- Left: Withdrawal Form (7 cols on lg) -->
        <div class="lg:col-span-7 glass-panel p-6 sm:p-8 border-slate-800 space-y-6">
          <div class="pb-3 border-b border-slate-800">
            <h2 class="text-base sm:text-lg font-bold text-white tracking-tight">
              Create Withdrawal Request
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Enter the USDT amount you want to transfer to your wallet ($10 minimum)</p>
          </div>

          <!-- Amount Input -->
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs font-mono">
              <label class="text-slate-300 font-bold uppercase">ENTER AMOUNT (USDT):</label>
              <span class="text-amber-400 font-semibold">Minimum: $10.00 USDT</span>
            </div>

            <div class="relative">
              <div class="absolute left-4 top-3.5 text-slate-500 font-mono font-bold text-xl">$</div>
              <input
                type="number"
                [(ngModel)]="withdrawAmount"
                placeholder="0.00"
                class="w-full py-4 pl-10 pr-24 rounded-2xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white font-sans text-xl sm:text-2xl font-black transition-all tabular-nums outline-none"
                (ngModelChange)="onAmountChange()"
              />
              <button
                (click)="setMaxAmount()"
                class="absolute right-3 top-3 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black font-mono text-xs hover:bg-emerald-500/25 transition-colors cursor-pointer"
              >
                MAX
              </button>
            </div>
          </div>

          <!-- Quick Percentage Chips -->
          <div class="grid grid-cols-4 gap-2.5">
            <button (click)="setPercent(0.25)" class="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs font-mono transition-colors cursor-pointer text-center">25%</button>
            <button (click)="setPercent(0.50)" class="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs font-mono transition-colors cursor-pointer text-center">50%</button>
            <button (click)="setPercent(0.75)" class="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs font-mono transition-colors cursor-pointer text-center">75%</button>
            <button (click)="setPercent(1.00)" class="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs font-mono transition-colors cursor-pointer text-center">100%</button>
          </div>

          <!-- Destination Wallet Box -->
          <div class="space-y-1.5">
            <label class="text-xs font-mono text-slate-300 font-bold block uppercase">
              Receiving Address (BNB Smart Chain BEP-20):
            </label>
            <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs">
              <span class="text-cyan-300 font-bold truncate mr-2">{{ receivingAddress() }}</span>
              <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs shrink-0 font-bold">ACTIVE</span>
            </div>
          </div>

          <!-- Action Button -->
          <button
            (click)="handleWithdrawal()"
            [disabled]="isProcessing() || withdrawAmount < 10 || withdrawAmount > dappState.user().availableBalanceUsdt"
            class="w-full py-4 px-6 rounded-2xl btn-emerald-glow font-black text-sm sm:text-base shadow-xl shadow-emerald-500/20 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide cursor-pointer"
          >
            <span *ngIf="!isProcessing()" class="flex items-center gap-2">
              <i class="fa-solid fa-arrow-down-to-bracket"></i>
              CONFIRM INSTANT WITHDRAWAL (\${{ calculatedNetAmount().toFixed(2) }} USDT)
            </span>
            <span *ngIf="isProcessing()" class="flex items-center gap-2">
              <i class="fa-solid fa-spinner fa-spin"></i> Broadcasting to BNB Chain...
            </span>
          </button>
        </div>

        <!-- Right: Fee Deduction Breakdown & History (5 cols on lg) -->
        <div class="lg:col-span-5 space-y-6">
          
          <!-- Fee Deduction Card -->
          <div class="glass-panel p-6 sm:p-7 border-slate-800 space-y-4 text-xs sm:text-sm">
            <div class="font-bold text-white uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center justify-between">
              <span class="text-sm">Transparent Payout Breakdown</span>
              <span class="text-emerald-400 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                5% Flat Fee
              </span>
            </div>

            <div class="space-y-2.5 text-xs">
              <div class="flex justify-between text-slate-300">
                <span>Requested Amount:</span>
                <span class="text-white font-mono font-bold text-sm">\${{ (withdrawAmount || 0).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Platform Infrastructure (2.5%):</span>
                <span class="text-rose-400 font-mono">-\${{ (calculatedFeeAdmin()).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Pool Liquidity Reserve (2.5%):</span>
                <span class="text-amber-400 font-mono">-\${{ (calculatedFeeRoyalty()).toFixed(2) }}</span>
              </div>
            </div>

            <div class="flex justify-between items-center text-white font-bold pt-3 border-t border-slate-800">
              <span class="text-xs sm:text-sm">Net Transferred to Wallet:</span>
              <span class="text-emerald-300 font-sans text-xl sm:text-2xl font-black tabular-nums">
                \${{ calculatedNetAmount().toFixed(2) }} <span class="text-xs font-mono text-emerald-400 font-bold">USDT</span>
              </span>
            </div>

            <p class="text-[11px] text-slate-400 leading-relaxed pt-1">
              95% of every withdrawal is automatically credited directly to your connected BEP-20 address within seconds.
            </p>
          </div>

          <!-- Past Withdrawal History -->
          <div class="glass-panel p-6 sm:p-7 border-slate-800 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-clock-rotate-left text-amber-400"></i>
                Recent Withdrawals
              </h3>
              <span class="text-xs font-mono text-cyan-400">BscScan Verified</span>
            </div>

            <div *ngIf="withdrawalTransactions().length > 0" class="divide-y divide-slate-800/80 font-mono text-xs max-h-56 overflow-y-auto">
              <div *ngFor="let tx of withdrawalTransactions()" class="py-3 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xs shrink-0">
                    <i class="fa-solid fa-check"></i>
                  </div>
                  <div>
                    <div class="font-bold text-white font-sans text-xs">Completed Payout (95%)</div>
                    <div class="text-[11px] text-slate-400">{{ tx.timestamp }} • Fee: \${{ tx.feeUsdt.toFixed(2) }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-black text-emerald-400 font-sans text-xs tabular-nums">
                    +\${{ tx.netAmountUsdt.toFixed(2) }} USDT
                  </div>
                  <a [href]="web3Service.getExplorerUrl(tx.txHash)" target="_blank" class="text-[10px] text-cyan-400 hover:underline">
                    BscScan ↗
                  </a>
                </div>
              </div>
            </div>

            <div *ngIf="withdrawalTransactions().length === 0" class="text-center py-6 text-slate-500 text-xs">
              <i class="fa-solid fa-inbox text-2xl mb-1 text-slate-600 block"></i>
              No withdrawal transactions yet.
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

    .pct-box {
      padding: 8px 4px;
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      font-size: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: rgba(16, 185, 129, 0.5);
        color: #34d399;
        background: rgba(16, 185, 129, 0.1);
      }
    }
  `]
})
export class WithdrawOptionComponent {
  public withdrawAmount = 0;
  public isProcessing = signal<boolean>(false);

  public receivingAddress = computed(() => {
    return this.web3Service.currentAccount();
  });

  public calculatedFeeAdmin = computed(() => {
    return (this.withdrawAmount * 0.025);
  });

  public calculatedFeeRoyalty = computed(() => {
    return (this.withdrawAmount * 0.025);
  });

  public calculatedNetAmount = computed(() => {
    const totalFee = this.calculatedFeeAdmin() + this.calculatedFeeRoyalty();
    return Math.max(0, this.withdrawAmount - totalFee);
  });

  public withdrawalTransactions = computed(() => {
    return this.dappState.transactions().filter(tx => tx.type === 'withdrawal');
  });

  constructor(
    public dappState: DappStateService,
    public web3Service: Web3Service,
    public soundService: SoundService,
    private notificationService: NotificationService
  ) {}

  onAmountChange(): void {
    if (this.withdrawAmount < 0) this.withdrawAmount = 0;
  }

  setMaxAmount(): void {
    this.soundService.playTap();
    this.withdrawAmount = Math.floor(this.dappState.user().availableBalanceUsdt * 100) / 100;
  }

  setPercent(pct: number): void {
    this.soundService.playTap();
    this.withdrawAmount = Math.floor((this.dappState.user().availableBalanceUsdt * pct) * 100) / 100;
  }

  async handleWithdrawal(): Promise<void> {
    if (this.withdrawAmount < 10) {
      this.notificationService.error('Minimum Amount', 'Minimum withdrawal amount is $10.00 USDT.');
      return;
    }

    if (this.withdrawAmount > this.dappState.user().availableBalanceUsdt) {
      this.notificationService.error('Insufficient Balance', 'Requested withdrawal exceeds available balance.');
      return;
    }

    this.isProcessing.set(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const res = this.dappState.withdrawFunds(this.withdrawAmount, this.receivingAddress());
    this.isProcessing.set(false);

    if (res.success) {
      this.withdrawAmount = 0;
    }
  }
}
