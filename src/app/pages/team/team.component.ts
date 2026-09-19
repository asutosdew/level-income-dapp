import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DappStateService } from '../../services/dapp-state.service';
import { PhpApiService } from '../../services/php-api.service';
import { NotificationService } from '../../services/notification.service';
import { SoundService } from '../../services/sound.service';
import { DirectReferral } from '../../models/dapp.models';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 sm:space-y-10 animate-fade-in font-sans">
      
      <!-- Top Title & Sponsor Header Box -->
      <div class="glass-panel p-6 sm:p-8 border-amber-500/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div class="absolute -right-12 -top-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div>
          <div class="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider mb-2">
            <i class="fa-solid fa-users text-sm"></i>
            SYNDICATE GLOBAL NETWORK
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Team & Referral Network
          </h1>
          <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Track your direct referrals, organizational volume, and 15-tier downline structure.
          </p>
        </div>

        <div class="px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs sm:text-sm font-mono text-slate-300 shrink-0">
          Upline Sponsor: <span class="text-amber-400 font-bold">{{ dappState.user().sponsorId }}</span>
        </div>
      </div>

      <!-- Viral Referral Link Box -->
      <div class="glass-panel-gold p-6 sm:p-8 border-amber-500/30 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold w-fit">
            <i class="fa-solid fa-share-nodes"></i> EARN 10% INSTANT DIRECT COMMISSION
          </span>
          <span class="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
            <i class="fa-solid fa-bolt"></i> Instant 24/7 Credit
          </span>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch gap-3">
          <input
            type="text"
            [value]="getReferralLink()"
            readonly
            class="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-xs sm:text-sm font-mono text-amber-300 focus:outline-none truncate select-all"
          />
          <button
            (click)="copyReferralLink()"
            class="btn-gold-glow py-3.5 px-6 text-xs sm:text-sm font-extrabold font-mono transition-all whitespace-nowrap cursor-pointer shadow-lg shadow-amber-500/20"
          >
            COPY LINK
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 font-mono text-xs">
          <a
            [href]="getWhatsappShareUrl()"
            target="_blank"
            class="py-3 px-4 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <i class="fa-brands fa-whatsapp text-lg"></i> WhatsApp Share
          </a>
          <a
            [href]="getTelegramShareUrl()"
            target="_blank"
            class="py-3 px-4 rounded-xl bg-sky-600/15 hover:bg-sky-600/25 border border-sky-500/30 text-sky-400 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <i class="fa-brands fa-telegram text-lg"></i> Telegram Share
          </a>
          <button
            (click)="showQrModal.set(true)"
            class="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <i class="fa-solid fa-qrcode text-amber-400 text-base"></i> Show QR Code
          </button>
        </div>
      </div>

      <!-- 4 Network KPI Summary Cards (4 cols on lg, 2 on mobile) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div class="glass-panel p-5 sm:p-6 border-slate-800 space-y-1">
          <div class="text-xs font-mono text-slate-400 uppercase font-bold">TOTAL DOWNLINE</div>
          <div class="text-2xl sm:text-3xl font-extrabold text-white font-sans tabular-nums">
            {{ dappState.user().totalTeamCount }}
          </div>
          <div class="text-xs text-emerald-400 font-mono">Across 15 Generations</div>
        </div>

        <div class="glass-panel p-5 sm:p-6 border-slate-800 space-y-1">
          <div class="text-xs font-mono text-slate-400 uppercase font-bold">DIRECT SPONSORS</div>
          <div class="text-2xl sm:text-3xl font-extrabold text-amber-300 font-sans tabular-nums">
            {{ dappState.user().directsCount }}
          </div>
          <div class="text-xs text-emerald-400 font-mono">{{ dappState.user().activeDirectsCount }} Active Stakers</div>
        </div>

        <div class="glass-panel p-5 sm:p-6 border-slate-800 space-y-1">
          <div class="text-xs font-mono text-slate-400 uppercase font-bold">STRONG LEG VOLUME</div>
          <div class="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-sans tabular-nums">
            \${{ (dappState.user().strongLegVolumeUsdt / 1000).toFixed(0) }}k
          </div>
          <div class="text-xs text-slate-400 font-mono">60% Primary Branch</div>
        </div>

        <div class="glass-panel p-5 sm:p-6 border-slate-800 space-y-1">
          <div class="text-xs font-mono text-slate-400 uppercase font-bold">OTHER LEGS VOLUME</div>
          <div class="text-2xl sm:text-3xl font-extrabold text-purple-400 font-sans tabular-nums">
            \${{ (dappState.user().otherLegsVolumeUsdt / 1000).toFixed(0) }}k
          </div>
          <div class="text-xs text-slate-400 font-mono">40% Secondary Branches</div>
        </div>

      </div>

      <!-- View Mode Tabs -->
      <div class="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 max-w-sm">
        <button
          (click)="viewMode.set('table')"
          class="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          [ngClass]="viewMode() === 'table' ? 'bg-amber-500 text-black font-extrabold shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <i class="fa-solid fa-list-check"></i>
          <span>Directs ({{ dappState.directs().length }})</span>
        </button>
        <button
          (click)="viewMode.set('genealogy')"
          class="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          [ngClass]="viewMode() === 'genealogy' ? 'bg-amber-500 text-black font-extrabold shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <i class="fa-solid fa-network-wired"></i>
          <span>Genealogy Tree</span>
        </button>
      </div>

      <!-- VIEW A: DIRECT PARTNER CARDS & SEARCH -->
      <div *ngIf="viewMode() === 'table'" class="glass-panel p-6 sm:p-8 border-slate-800 space-y-5 animate-fade-in">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h2 class="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Directly Sponsored Partners
          </h2>
          <!-- Search Input -->
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search partner name or address..."
            class="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 font-mono w-full sm:w-72"
          />
        </div>

        <!-- Direct Partners Grid (2 cols on md+, 1 on mobile) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            *ngFor="let m of filteredDirects()"
            class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3 shadow-sm hover:border-slate-700 transition-colors"
          >
            <!-- Left: Avatar & Info -->
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm font-extrabold border border-amber-500/30 shrink-0 font-mono">
                {{ m.name.charAt(0) }}
              </div>
              <div class="min-w-0">
                <div class="text-xs sm:text-sm font-bold text-white truncate">{{ m.name }}</div>
                <div class="text-[11px] text-slate-500 font-mono truncate">{{ m.walletAddress }}</div>
                <div class="text-xs text-amber-300 font-mono mt-0.5">{{ m.packageName }}</div>
              </div>
            </div>

            <!-- Right: Staked & Bonus -->
            <div class="text-right shrink-0">
              <div class="text-xs sm:text-sm font-extrabold text-white tabular-nums font-mono">
                \${{ m.stakedAmountUsdt }} USDT
              </div>
              <div class="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                +\${{ m.earnedUsdt.toFixed(2) }} (10%)
              </div>
              <div class="mt-1">
                <span
                  *ngIf="m.status === 'active'"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono"
                >
                  <i class="fa-solid fa-circle text-[5px]"></i> ACTIVE
                </span>
                <span
                  *ngIf="m.status === 'inactive'"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 text-[10px] font-mono"
                >
                  INACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW B: VISUAL GENEALOGY TREE -->
      <div *ngIf="viewMode() === 'genealogy'" class="glass-panel p-5 sm:p-7 border-slate-800 space-y-5 animate-fade-in text-center">
        <h2 class="text-sm font-bold text-white flex items-center justify-center gap-2 font-mono uppercase tracking-wider">
          <i class="fa-solid fa-network-wired text-amber-400"></i>
          Genealogy Network Tree
        </h2>

        <!-- Root Node -->
        <div class="flex flex-col items-center">
          <div class="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black text-center shadow-xl shadow-amber-500/20 border border-amber-300 w-full max-w-sm">
            <div class="text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-900">YOU (ROOT VAULT)</div>
            <div class="text-base font-extrabold mt-0.5">{{ dappState.user().userId }}</div>
            <div class="text-xs font-mono font-bold mt-0.5">\${{ dappState.user().totalStakedUsdt }} USDT Staked</div>
          </div>

          <div class="w-0.5 h-8 bg-amber-500/50 my-1"></div>

          <div class="text-xs font-mono font-bold text-amber-400 px-4 py-1 rounded-full bg-slate-950 border border-slate-800 mb-4">
            Direct Lineage ({{ dappState.directs().length }} Direct Partners)
          </div>

          <!-- Downline Nodes Grid (3 cols on md+, 2 on mobile) -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-3xl">
            <div
              *ngFor="let d of dappState.directs()"
              class="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-all text-center group"
            >
              <div class="w-8 h-8 mx-auto rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 text-xs font-bold mb-1.5">
                L1
              </div>
              <div class="text-xs sm:text-sm font-bold text-white truncate">{{ d.name }}</div>
              <div class="text-xs font-mono text-emerald-400 font-bold mt-1">\${{ d.stakedAmountUsdt }} USDT</div>
              <div class="text-[10px] text-slate-400 font-mono">{{ d.packageName }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- QR Code Modal -->
      <div *ngIf="showQrModal()" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="glass-panel max-w-xs w-full p-6 border-amber-500/40 text-center relative animate-fade-in">
          <button
            (click)="showQrModal.set(false)"
            class="absolute right-4 top-4 text-slate-400 hover:text-white"
          >
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
          <h3 class="text-sm font-bold text-white mb-4 uppercase font-mono">INVITATION QR CODE</h3>
          <div class="bg-white p-3 rounded-2xl w-44 h-44 mx-auto flex items-center justify-center shadow-2xl">
            <img
              [src]="'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + getReferralLink()"
              alt="QR Code"
              class="w-full h-full"
            />
          </div>
          <p class="text-xs text-slate-400 mt-3 font-mono">Scan to register under {{ dappState.user().userId }}</p>
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
export class TeamComponent implements OnInit {
  public viewMode = signal<'table' | 'genealogy'>('table');
  public searchQuery = '';
  public showQrModal = signal<boolean>(false);

  constructor(
    public dappState: DappStateService,
    private phpApi: PhpApiService,
    private notificationService: NotificationService,
    private soundService: SoundService
  ) {}

  ngOnInit(): void {
    this.phpApi.getTeam(this.dappState.user().address).subscribe(teamData => {
      if (teamData && teamData.directs && teamData.directs.length > 0) {
        this.dappState.directs.set(teamData.directs);
      }
    });
  }

  getReferralLink(): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://morgantreasure.io';
    return `${origin}/connect?ref=${this.dappState.user().referralCode || this.dappState.user().userId}`;
  }

  copyReferralLink(): void {
    this.soundService.playTap();
    navigator.clipboard.writeText(this.getReferralLink());
    this.notificationService.success('Link Copied!', 'Invite link copied to clipboard.');
  }

  getWhatsappShareUrl(): string {
    const text = encodeURIComponent(`Join Morgan Treasure Web3 Investment Plan! Earn dynamic 0.5% - 1% daily ROI on BNB Chain. Join with my link: ${this.getReferralLink()}`);
    return `https://api.whatsapp.com/send?text=${text}`;
  }

  getTelegramShareUrl(): string {
    const text = encodeURIComponent(`Join Morgan Treasure Web3 Investment Plan! Earn dynamic 0.5% - 1% daily ROI on BNB Chain.`);
    const url = encodeURIComponent(this.getReferralLink());
    return `https://t.me/share/url?url=${url}&text=${text}`;
  }

  filteredDirects(): DirectReferral[] {
    if (!this.searchQuery) return this.dappState.directs();
    const q = this.searchQuery.toLowerCase();
    return this.dappState.directs().filter(d => 
      d.name.toLowerCase().includes(q) || d.walletAddress.toLowerCase().includes(q)
    );
  }
}
