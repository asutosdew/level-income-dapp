import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DappStateService } from '../../services/dapp-state.service';
import { Web3Service } from '../../services/web3.service';
import { SoundService } from '../../services/sound.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-smart-contract',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8 sm:space-y-10 animate-fade-in font-sans">
      
      <!-- Top Header Banner -->
      <div class="glass-panel p-6 sm:p-8 rounded-3xl border-amber-500/25 relative overflow-hidden">
        <div class="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
        <div class="absolute -left-12 -bottom-12 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div class="flex items-center gap-2.5 mb-2">
              <span class="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                AUDITED PROTOCOL
              </span>
              <span class="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                <i class="fa-solid fa-circle-check text-xs"></i> CertiK Verified
              </span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <i class="fa-solid fa-file-shield text-amber-400"></i>
              Smart Contract Architecture & Audit
            </h1>
            <p class="text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
              Autonomous, non-custodial BEP-20 smart contracts deployed on Binance Smart Chain. Investor principal is mathematically secured with 300% maximum return capping.
            </p>
          </div>

          <!-- Network Badge -->
          <div class="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl">
              <i class="fa-brands fa-ethereum"></i>
            </div>
            <div class="font-mono">
              <div class="text-xs text-slate-400 font-bold uppercase tracking-wider">Network</div>
              <div class="text-base font-black text-white">BNB Smart Chain (56)</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Responsive 2-Column Grid on Desktop -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-8">

        <!-- LEFT COLUMN: CONTRACT DETAILS & CODE (md:col-span-7) -->
        <div class="md:col-span-7 space-y-6">
          
          <!-- Hero Contract Security Card -->
          <div class="glass-panel p-6 sm:p-8 rounded-3xl border-amber-500/25 space-y-6">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-cube"></i> BEP-20 STAKING VAULT
              </span>
              <span class="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Verified 100%
              </span>
            </div>

            <div>
              <h2 class="text-xl font-black text-white">
                MorganTreasureVault.sol
              </h2>
              <p class="text-sm text-slate-300 mt-2 leading-relaxed">
                The smart contract autonomously governs daily yield calculation between 0.50% and 1.00% depending on real-time liquid reserve depth. No owner admin keys can withdraw investor funds.
              </p>
            </div>

            <!-- Contract Address Box -->
            <div class="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 font-mono text-xs">
              <div class="flex items-center justify-between text-xs text-slate-400">
                <span>VERIFIED CONTRACT ADDRESS:</span>
                <span class="text-emerald-400 font-bold">BEP-20 (BSC)</span>
              </div>
              <div class="text-amber-300 font-bold text-xs sm:text-sm truncate select-all bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                {{ web3Service.morganTreasureVault }}
              </div>
              <div class="flex items-center gap-3 pt-1">
                <button
                  (click)="copyContractAddress()"
                  class="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i class="fa-regular fa-copy"></i>
                  <span>Copy Address</span>
                </button>
                <a
                  [href]="web3Service.getExplorerUrl(web3Service.morganTreasureVault)"
                  target="_blank"
                  class="py-3 px-5 rounded-xl btn-gold-glow font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <span>View on BscScan</span>
                  <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </a>
              </div>
            </div>
          </div>

          <!-- 3 Architecture Guarantees Cards -->
          <div class="grid grid-cols-3 gap-4">
            <div class="glass-panel p-5 rounded-2xl border-slate-800 text-center">
              <div class="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg mb-3">
                <i class="fa-solid fa-lock-open"></i>
              </div>
              <div class="text-xs sm:text-sm font-black text-white">Non-Custodial</div>
              <p class="text-[11px] text-slate-400 mt-1 font-mono">100% on-chain liquidity</p>
            </div>

            <div class="glass-panel p-5 rounded-2xl border-slate-800 text-center">
              <div class="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg mb-3">
                <i class="fa-solid fa-bolt"></i>
              </div>
              <div class="text-xs sm:text-sm font-black text-white">Instant Payouts</div>
              <p class="text-[11px] text-slate-400 mt-1 font-mono">Automated 24/7 withdrawals</p>
            </div>

            <div class="glass-panel p-5 rounded-2xl border-slate-800 text-center">
              <div class="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg mb-3">
                <i class="fa-solid fa-shield-halved"></i>
              </div>
              <div class="text-xs sm:text-sm font-black text-white">300% Capping</div>
              <p class="text-[11px] text-slate-400 mt-1 font-mono">Mathematically sustainable</p>
            </div>
          </div>

          <!-- Solidity Smart Contract Source Snippet -->
          <div class="glass-panel p-6 sm:p-8 rounded-3xl border-slate-800 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5 text-sm font-bold text-white font-mono">
                <i class="fa-solid fa-code text-cyan-400"></i>
                <span>MorganTreasureVault.sol</span>
              </div>
              <span class="text-xs text-emerald-400 font-mono font-bold">Solidity ^0.8.20</span>
            </div>

            <pre class="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
<code><span class="text-slate-500">// Dynamic ROI Algorithmic Liquidity Curve</span>
<span class="text-amber-400">function</span> <span class="text-blue-400">calculateDynamicDailyRoi</span>() <span class="text-purple-400">public view returns</span> (<span class="text-emerald-400">uint256</span>) &#123;
    <span class="text-emerald-400">uint256</span> poolReserve = usdtToken.<span class="text-blue-400">balanceOf</span>(<span class="text-purple-400">address</span>(<span class="text-purple-400">this</span>));
    <span class="text-purple-400">if</span> (poolReserve &lt;= 1_000_000 * 1e18) <span class="text-purple-400">return</span> MIN_DAILY_ROI; <span class="text-slate-500">// 0.50% / day</span>
    <span class="text-purple-400">if</span> (poolReserve &gt;= 3_000_000 * 1e18) <span class="text-purple-400">return</span> MAX_DAILY_ROI; <span class="text-slate-500">// 1.00% / day</span>
    <span class="text-emerald-400">uint256</span> score = (poolReserve - 1_000_000 * 1e18) * 50 / (2_000_000 * 1e18);
    <span class="text-purple-400">return</span> MIN_DAILY_ROI + score;
&#125;</code></pre>
          </div>

        </div>

        <!-- RIGHT COLUMN: PROTOCOL SPECS & FAQ (md:col-span-5) -->
        <div class="md:col-span-5 space-y-6">

          <!-- Protocol Specs Table -->
          <div class="glass-panel p-6 sm:p-8 rounded-3xl border-slate-800 space-y-4">
            <h3 class="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2.5">
              <i class="fa-solid fa-list-check text-amber-400"></i>
              PROTOCOL SPECIFICATIONS
            </h3>

            <div class="space-y-2.5 text-xs sm:text-sm font-mono">
              <div class="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span class="text-slate-400">Network</span>
                <span class="text-white font-bold">BNB Smart Chain (BSC)</span>
              </div>
              <div class="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span class="text-slate-400">Staking Asset</span>
                <span class="text-amber-300 font-bold">Tether USD (BEP-20)</span>
              </div>
              <div class="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span class="text-slate-400">Daily ROI Yield</span>
                <span class="text-emerald-400 font-bold">0.50% – 1.00% Daily</span>
              </div>
              <div class="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span class="text-slate-400">Affiliate Matrix</span>
                <span class="text-white font-bold">15 Tiers (22% Total)</span>
              </div>
              <div class="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span class="text-slate-400">Return Capping</span>
                <span class="text-cyan-300 font-bold">300% (3.0x Maximum)</span>
              </div>
              <div class="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span class="text-slate-400">Withdrawal Fee</span>
                <span class="text-amber-300 font-bold">5% (Liquidity & Burn)</span>
              </div>
              <div class="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span class="text-slate-400">Audit Status</span>
                <span class="text-emerald-400 font-bold flex items-center gap-1.5">
                  <i class="fa-solid fa-check"></i> CertiK Passed
                </span>
              </div>
            </div>
          </div>

          <!-- FAQ Accordion -->
          <div class="glass-panel p-6 sm:p-8 rounded-3xl border-slate-800 space-y-4">
            <h3 class="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2.5">
              <i class="fa-solid fa-circle-question text-amber-400"></i>
              FREQUENTLY ASKED QUESTIONS
            </h3>

            <div class="space-y-3">
              <div
                *ngFor="let faq of faqs()"
                class="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-all"
                (click)="toggleFaq(faq.id)"
              >
                <div class="flex items-center justify-between text-xs sm:text-sm font-bold text-white gap-3">
                  <span>{{ faq.q }}</span>
                  <i
                    class="fa-solid shrink-0 transition-transform"
                    [ngClass]="expandedFaq() === faq.id ? 'fa-chevron-up text-amber-400' : 'fa-chevron-down text-slate-500'"
                  ></i>
                </div>
                <div *ngIf="expandedFaq() === faq.id" class="mt-3 pt-3 border-t border-slate-800/80 text-xs sm:text-sm text-slate-400 leading-relaxed animate-fade-in">
                  {{ faq.a }}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  `,
  styles: []
})
export class SmartContractComponent {
  public expandedFaq = signal<number | null>(1);

  public faqs = signal([
    {
      id: 1,
      q: 'How is the daily ROI (0.5% to 1.0%) calculated?',
      a: 'The Morgan Treasure smart contract monitors pool liquidity reserves. When liquidity depth is optimal, returns reach up to 1.00% daily. If liquidity is rebalanced, the algorithm adjusts smoothly down towards 0.50% daily to maintain long-term solvency.'
    },
    {
      id: 2,
      q: 'How does the 15-Tier Level Income distribute?',
      a: 'Commissions are distributed across 15 downline tiers instantly upon every new deposit (L1: 10%, L2: 5%, L3: 3%, L4: 2%, L5: 1%, L6-10: 0.5%, L11-15: 0.25%). Each direct active partner unlocks 1 level.'
    },
    {
      id: 3,
      q: 'What is the 300% Maximum Capping rule?',
      a: 'To guarantee sustainability, every package can earn up to 300% (3x) of staked capital across daily ROI and affiliate bonuses. Once 300% is reached, you simply re-stake to continue earning.'
    }
  ]);

  constructor(
    public dappState: DappStateService,
    public web3Service: Web3Service,
    private soundService: SoundService,
    private notificationService: NotificationService
  ) {}

  toggleFaq(id: number): void {
    this.soundService.playTap();
    this.expandedFaq.update(curr => curr === id ? null : id);
  }

  copyContractAddress(): void {
    navigator.clipboard.writeText(this.web3Service.morganTreasureVault);
    this.soundService.playTap();
    this.notificationService.info('Copied', 'Vault contract address copied.');
  }
}
