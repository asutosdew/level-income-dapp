import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DappStateService } from '../../services/dapp-state.service';
import { PhpApiService } from '../../services/php-api.service';
import { NotificationService } from '../../services/notification.service';
import { SoundService } from '../../services/sound.service';
import { LevelIncomeTier } from '../../models/dapp.models';

@Component({
  selector: 'app-income-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 sm:space-y-10 animate-fade-in font-sans">
      
      <!-- Top Title & Global Claim Action Strip -->
      <div class="glass-panel p-6 sm:p-8 border-amber-500/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div class="absolute -right-12 -top-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div>
          <div class="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider mb-2">
            <i class="fa-solid fa-sitemap text-sm"></i>
            15-TIER AFFILIATE GENERATION MATRIX
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            15-Level Affiliate Income
          </h1>
          <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Earn multi-tier commissions across 15 downline levels. Each direct partner you invite unlocks 1 generation level (up to 22% total matrix bonus).
          </p>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto shrink-0">
          <button
            (click)="claimAllLevelEarnings()"
            class="btn-gold-glow py-3.5 px-6 text-sm font-extrabold w-full md:w-auto flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <i class="fa-solid fa-coins"></i>
            <span>Claim Level Earnings (\${{ dappState.user().totalLevelIncomeUsdt.toFixed(2) }})</span>
          </button>
        </div>
      </div>

      <!-- Explanatory Guide Box for End Users -->
      <div class="glass-panel p-5 sm:p-6 border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-start gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-base shrink-0 mt-0.5">
            <i class="fa-solid fa-circle-info"></i>
          </div>
          <div class="space-y-1 text-xs sm:text-sm text-slate-300">
            <h3 class="font-bold text-white text-sm">How to Unlock Levels</h3>
            <p class="text-slate-400 leading-relaxed">
              Every direct partner with an active package unlocks 1 generation level. For example, with <strong class="text-white">{{ dappState.user().activeDirectsCount }} active directs</strong>, you earn from <strong class="text-emerald-400">Level 1 to Level {{ getUnlockedCount() }}</strong>.
            </p>
          </div>
        </div>

        <a routerLink="/team" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 text-xs font-bold transition-all shrink-0 cursor-pointer">
          Invite More Directs ↗
        </a>
      </div>

      <!-- 4 Responsive KPI Summary Cards (4 cols on lg, 2 on mobile) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div class="glass-panel p-5 sm:p-6 border-slate-800 space-y-1">
          <div class="text-xs font-mono text-slate-400 uppercase font-bold">TOTAL LEVEL EARNED</div>
          <div class="text-2xl sm:text-3xl font-extrabold text-white font-sans tabular-nums">
            \${{ dappState.user().totalLevelIncomeUsdt.toFixed(2) }}
          </div>
          <div class="text-xs text-emerald-400 font-mono font-semibold">
            Across All Active Tiers
          </div>
        </div>

        <div class="glass-panel p-5 sm:p-6 border-slate-800 space-y-1">
          <div class="text-xs font-mono text-slate-400 uppercase font-bold">DIRECT BONUS (10%)</div>
          <div class="text-2xl sm:text-3xl font-extrabold text-amber-300 font-sans tabular-nums">
            \${{ dappState.user().totalDirectIncomeUsdt.toFixed(2) }}
          </div>
          <div class="text-xs text-slate-400 font-mono">
            Tier 1 Instant 10%
          </div>
        </div>

        <div class="glass-panel p-5 sm:p-6 border-slate-800 space-y-1">
          <div class="text-xs font-mono text-slate-400 uppercase font-bold">UNLOCKED TIERS</div>
          <div class="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-sans tabular-nums">
            {{ getUnlockedCount() }} <span class="text-sm text-slate-500 font-normal">/ 15</span>
          </div>
          <div class="text-xs text-slate-400 font-mono">
            {{ dappState.user().activeDirectsCount }} Direct Sponsors
          </div>
        </div>

        <div class="glass-panel p-5 sm:p-6 border-slate-800 space-y-1">
          <div class="text-xs font-mono text-slate-400 uppercase font-bold">TOTAL DOWNLINE</div>
          <div class="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-sans tabular-nums">
            {{ dappState.user().totalTeamCount }} <span class="text-sm text-slate-500 font-normal">Members</span>
          </div>
          <div class="text-xs text-slate-400 font-mono">
            \${{ (dappState.user().totalTeamTurnoverUsdt / 1000).toFixed(0) }}k Volume
          </div>
        </div>

      </div>

      <!-- 15-Level Tier Breakdown Grid -->
      <div class="glass-panel p-6 sm:p-8 border-slate-800 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <h2 class="text-base sm:text-lg font-bold text-white tracking-tight">
              All 15 Downline Generation Levels
            </h2>
            <p class="text-xs text-slate-400">Review commission percentages and member counts for each generation</p>
          </div>
          <span class="text-xs font-mono text-amber-400 font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 w-fit">
            1 Direct = 1 Level Unlocked
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            *ngFor="let tier of dappState.levelTiers()"
            class="p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between gap-4"
            [ngClass]="tier.isUnlocked ? 'border-amber-500/30 bg-slate-950/80 shadow-md' : 'border-slate-800/80 bg-slate-950/40 opacity-70'"
          >
            <!-- Left: Level Badge & Percentage -->
            <div class="flex items-center gap-3.5">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm font-mono shrink-0"
                [ngClass]="tier.isUnlocked ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-900 text-slate-600'"
              >
                L{{ tier.level }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm sm:text-base font-bold text-white">Generation {{ tier.level }}</span>
                  <span
                    class="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black"
                    [ngClass]="tier.isUnlocked ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-900 text-slate-500'"
                  >
                    {{ tier.percentage }}%
                  </span>
                </div>
                <div class="text-xs text-slate-400 font-mono mt-1">
                  Req: {{ tier.directRequired }} Direct • {{ tier.activeMembersCount }} Active Members
                </div>
              </div>
            </div>

            <!-- Right: Earned & Status Badge -->
            <div class="text-right shrink-0">
              <div class="text-base font-black font-mono tabular-nums" [ngClass]="tier.earnedUsdt > 0 ? 'text-emerald-400' : 'text-slate-500'">
                \${{ tier.earnedUsdt.toFixed(2) }}
              </div>
              <div class="mt-1">
                <span
                  *ngIf="tier.isUnlocked"
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold"
                >
                  <i class="fa-solid fa-lock-open text-[10px]"></i> Unlocked
                </span>
                <span
                  *ngIf="!tier.isUnlocked"
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono"
                >
                  <i class="fa-solid fa-lock text-[10px]"></i> Locked
                </span>
              </div>
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
export class IncomeDetailComponent implements OnInit {
  public displayMode = signal<'boxes' | 'table'>('boxes');

  constructor(
    public dappState: DappStateService,
    private phpApi: PhpApiService,
    private notificationService: NotificationService,
    private soundService: SoundService
  ) {}

  ngOnInit(): void {
    this.phpApi.getLevelIncome(this.dappState.user().address).subscribe(tiers => {
      if (tiers && tiers.length > 0) {
        this.dappState.levelTiers.set(tiers);
      }
    });
  }

  getUnlockedCount(): number {
    return this.dappState.levelTiers().filter(t => t.isUnlocked).length;
  }

  claimAllLevelEarnings(): void {
    this.soundService.playReward();
    this.notificationService.success('Earnings Claimed', 'Level commissions transferred to available balance.');
  }
}
