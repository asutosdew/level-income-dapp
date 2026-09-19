import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DappStateService } from '../../services/dapp-state.service';
import { Web3Service } from '../../services/web3.service';
import { PhpApiService } from '../../services/php-api.service';
import { NotificationService } from '../../services/notification.service';
import { SoundService } from '../../services/sound.service';
import { MorganTreasureLogoComponent } from '../../components/logo/morgan-treasure-logo.component';

@Component({
  selector: 'app-connect-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MorganTreasureLogoComponent],
  template: `
    <div class="max-w-xl mx-auto py-4 sm:py-8 space-y-6 animate-fade-in font-sans">
      
      <!-- Sleek Centered Wallet Connect & Register Card -->
      <div class="glass-panel p-6 sm:p-8 rounded-3xl border-slate-800 shadow-2xl relative overflow-hidden">
        <div class="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
        <div class="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

        <!-- Top Emblem & Title -->
        <div class="text-center space-y-3 pb-6 border-b border-slate-800 relative z-10">
          <div class="inline-flex p-3 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <app-morgan-treasure-logo size="md" [showWordmark]="false"></app-morgan-treasure-logo>
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Connect Web3 Wallet
            </h1>
            <p class="text-xs sm:text-sm text-slate-400 mt-1">
              Select your BEP-20 wallet to enter <span class="text-amber-400 font-bold">Morgan Treasure</span>
            </p>
          </div>
          
          <div class="flex items-center justify-center gap-2 pt-1">
            <span class="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              BNB Chain (56)
            </span>
            <span class="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono font-bold">
              0.5% – 1% Daily ROI
            </span>
          </div>
        </div>

        <!-- Wallet Selection Options -->
        <div class="space-y-4 pt-6 relative z-10">
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            {{ web3Service.isConnected() ? 'Selected Wallet' : '1. Choose Web3 Wallet' }}
          </div>

          <div class="grid grid-cols-2 gap-3">
            <!-- Trust Wallet -->
            <button
              (click)="connectWallet('TrustWallet')"
              class="p-4 rounded-2xl bg-slate-950/80 border transition-all flex flex-col items-center text-center group cursor-pointer hover:bg-slate-900"
              [ngClass]="web3Service.walletType() === 'TrustWallet' ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-950/20' : 'border-slate-800 hover:border-slate-700'"
            >
              <div class="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 text-2xl mb-2 group-hover:scale-105 transition-transform">
                <i class="fa-solid fa-shield-halved"></i>
              </div>
              <div class="text-sm font-bold text-white">Trust Wallet</div>
              <div class="text-[11px] text-slate-500 font-mono mt-0.5">Mobile App</div>
            </button>

            <!-- MetaMask -->
            <button
              (click)="connectWallet('MetaMask')"
              class="p-4 rounded-2xl bg-slate-950/80 border transition-all flex flex-col items-center text-center group cursor-pointer hover:bg-slate-900"
              [ngClass]="web3Service.walletType() === 'MetaMask' ? 'border-orange-500 ring-2 ring-orange-500/40 bg-orange-950/20' : 'border-slate-800 hover:border-slate-700'"
            >
              <div class="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 text-2xl mb-2 group-hover:scale-105 transition-transform">
                <i class="fa-solid fa-shield-cat"></i>
              </div>
              <div class="text-sm font-bold text-white">MetaMask</div>
              <div class="text-[11px] text-slate-500 font-mono mt-0.5">Browser & App</div>
            </button>

            <!-- Binance Web3 Wallet -->
            <button
              (click)="connectWallet('BinanceWeb3')"
              class="p-4 rounded-2xl bg-slate-950/80 border transition-all flex flex-col items-center text-center group cursor-pointer hover:bg-slate-900"
              [ngClass]="web3Service.walletType() === 'BinanceWeb3' ? 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-950/20' : 'border-slate-800 hover:border-slate-700'"
            >
              <div class="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl mb-2 group-hover:scale-105 transition-transform">
                <i class="fa-solid fa-coins"></i>
              </div>
              <div class="text-sm font-bold text-white">Binance Web3</div>
              <div class="text-[11px] text-slate-500 font-mono mt-0.5">Binance App</div>
            </button>

            <!-- Instant Demo Mode -->
            <button
              (click)="connectWallet('Demo')"
              class="p-4 rounded-2xl bg-slate-950/80 border transition-all flex flex-col items-center text-center group cursor-pointer hover:bg-slate-900"
              [ngClass]="web3Service.walletType() === 'Demo' ? 'border-emerald-400 ring-2 ring-emerald-400/40 bg-emerald-950/20' : 'border-slate-800 hover:border-slate-700'"
            >
              <div class="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl mb-2 group-hover:scale-105 transition-transform">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
              </div>
              <div class="text-sm font-bold text-emerald-300">Instant Demo</div>
              <div class="text-[11px] text-slate-400 font-mono mt-0.5">2,500 USDT</div>
            </button>
          </div>

          <!-- Connected Status Pill -->
          <div *ngIf="web3Service.isConnected()" class="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-2.5 font-mono text-xs">
            <div class="flex items-center justify-between text-slate-400">
              <span class="font-bold flex items-center gap-2 text-emerald-400">
                <i class="fa-solid fa-circle-check"></i> Connected BEP-20
              </span>
              <span class="text-amber-400 font-bold uppercase">{{ web3Service.walletType() }}</span>
            </div>
            <div class="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span class="font-bold text-white text-xs truncate max-w-[280px]">{{ web3Service.currentAccount() }}</span>
              <button
                (click)="copyAddress()"
                class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition-colors shrink-0 cursor-pointer"
              >
                Copy
              </button>
            </div>
            <div class="flex items-center justify-between text-slate-400 pt-1">
              <span>USDT Balance:</span>
              <span class="text-amber-300 font-black tabular-nums text-sm">\${{ web3Service.usdtBalance() | number:'1.2-2' }}</span>
            </div>
          </div>

          <!-- Registration Form (Sponsor ID) -->
          <form (ngSubmit)="handleRegister()" class="space-y-4 pt-2">
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-300 font-mono">
                  SPONSOR REFERRAL ID
                </label>
                <span class="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <i class="fa-solid fa-check-double text-[10px]"></i> Verified Sponsor
                </span>
              </div>
              <div class="relative">
                <input
                  type="text"
                  [(ngModel)]="sponsorId"
                  name="sponsorId"
                  placeholder="e.g. MT-10024"
                  required
                  class="w-full p-3.5 pl-10 pr-24 rounded-xl bg-slate-950/90 border border-slate-800 focus:border-amber-500 text-white font-mono text-sm transition-all focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <i class="fa-solid fa-users absolute left-3.5 top-4 text-slate-500 text-xs"></i>
                <button
                  type="button"
                  (click)="sponsorId = 'MT-10024'"
                  class="absolute right-2 top-2 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-mono font-bold border border-slate-800 transition-colors cursor-pointer"
                >
                  Default
                </button>
              </div>
              <p class="text-[11px] text-slate-400">
                You are joining under sponsor <strong class="text-amber-300">{{ sponsorId }}</strong>.
              </p>
            </div>

            <!-- Optional Nickname -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-300 font-mono">
                TELEGRAM ALIAS / NICKNAME <span class="text-slate-500 font-normal">(OPTIONAL)</span>
              </label>
              <div class="relative">
                <input
                  type="text"
                  [(ngModel)]="nickname"
                  name="nickname"
                  placeholder="e.g. CryptoKing"
                  class="w-full p-3.5 pl-10 rounded-xl bg-slate-950/90 border border-slate-800 focus:border-amber-500 text-white text-sm transition-all focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <i class="fa-solid fa-tag absolute left-3.5 top-4 text-slate-500 text-xs"></i>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="isSubmitting()"
              class="w-full py-4 px-6 rounded-2xl btn-gold-glow font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/25"
            >
              <span *ngIf="!isSubmitting()" class="flex items-center gap-2">
                <i class="fa-solid fa-bolt"></i>
                <span>ENTER MORGAN TREASURE</span>
                <i class="fa-solid fa-arrow-right text-xs"></i>
              </span>
              <span *ngIf="isSubmitting()" class="flex items-center gap-2">
                <i class="fa-solid fa-spinner fa-spin"></i> Connecting...
              </span>
            </button>
          </form>

          <!-- Direct Dashboard Link -->
          <div class="text-center pt-2">
            <a routerLink="/dashboard" class="text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5">
              <span>Skip to Dashboard</span>
              <i class="fa-solid fa-arrow-right text-[10px]"></i>
            </a>
          </div>

        </div>

      </div>

    </div>
  `,
  styles: []
})
export class ConnectRegisterComponent implements OnInit {
  public activeTab = signal<'connect' | 'register'>('connect');
  public sponsorId = 'MT-10024';
  public nickname = '';
  public agreedToTerms = true;
  public isSubmitting = signal<boolean>(false);

  constructor(
    public dappState: DappStateService,
    public web3Service: Web3Service,
    private phpApi: PhpApiService,
    private notificationService: NotificationService,
    private soundService: SoundService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['ref']) {
        this.sponsorId = params['ref'];
        this.activeTab.set('register');
        this.notificationService.info('Referral Applied', `Sponsor ${this.sponsorId} detected from invite link.`);
      }
    });
  }

  async connectWallet(walletType: 'MetaMask' | 'TrustWallet' | 'BinanceWeb3' | 'Demo'): Promise<void> {
    const success = await this.web3Service.connectWallet(walletType as any);
    if (success) {
      this.soundService.playSuccess();
    }
  }

  copyAddress(): void {
    navigator.clipboard.writeText(this.web3Service.currentAccount());
    this.notificationService.info('Copied', 'Wallet address copied.');
  }

  async handleRegister(): Promise<void> {
    if (!this.agreedToTerms) {
      this.notificationService.warning('Agreement Required', 'Please accept the dynamic ROI terms.');
      return;
    }

    this.isSubmitting.set(true);

    this.phpApi.register({
      wallet_address: this.web3Service.currentAccount(),
      sponsor_id: this.sponsorId,
      nickname: this.nickname
    }).subscribe({
      next: () => {
        this.dappState.registerUser(this.sponsorId, this.nickname);
        this.isSubmitting.set(false);
        this.notificationService.success('Registration Complete', 'Welcome to Morgan Treasure!');
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.dappState.registerUser(this.sponsorId, this.nickname);
        this.isSubmitting.set(false);
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
