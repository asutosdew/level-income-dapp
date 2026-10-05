import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DappStateService } from '../../services/dapp-state.service';
import { Web3Service, SupportedWallet } from '../../services/web3.service';
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
      
      <!-- Sleek Centered Gateway Card -->
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
              Morgan Treasure Gateway
            </h1>
            <p class="text-xs sm:text-sm text-slate-400 mt-1">
              Decentralized Yield Protocol &bull; <span class="text-amber-400 font-bold">BNB Chain BEP-20</span>
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

          <!-- Tab Switcher: Login vs Register -->
          <div class="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 mt-4">
            <button
              type="button"
              (click)="setMode('login')"
              class="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer"
              [ngClass]="mode() === 'login' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/25 font-black' 
                : 'text-slate-400 hover:text-white'"
            >
              <i class="fa-solid fa-right-to-bracket text-xs"></i>
              <span>LOGIN</span>
            </button>
            <button
              type="button"
              (click)="setMode('register')"
              class="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer"
              [ngClass]="mode() === 'register' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/25 font-black' 
                : 'text-slate-400 hover:text-white'"
            >
              <i class="fa-solid fa-user-plus text-xs"></i>
              <span>REGISTER</span>
            </button>
          </div>
        </div>

        <!-- Notification Banner: If unregistered user tried to login -->
        <div *ngIf="unregisteredWarning()" class="p-3.5 my-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
          <i class="fa-solid fa-triangle-exclamation text-amber-400 text-base shrink-0 mt-0.5"></i>
          <div>
            <div class="font-bold text-white mb-0.5">Unregistered Wallet</div>
            <div>{{ unregisteredWarning() }}</div>
          </div>
        </div>

        <!-- ======================= MODE 1: LOGIN ======================= -->
        <div *ngIf="mode() === 'login'" class="space-y-5 pt-6 relative z-10">
          
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
            <span>Select Connected Wallet</span>
            <span class="text-slate-500 font-normal">Registered accounts only</span>
          </div>

          <!-- Wallet Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <!-- Trust Wallet -->
            <button
              (click)="handleLoginWithWallet('TrustWallet')"
              [disabled]="isCheckingLogin()"
              class="p-4 rounded-2xl bg-slate-950/80 border transition-all flex flex-col items-center text-center group cursor-pointer hover:bg-slate-900 disabled:opacity-50"
              [ngClass]="web3Service.walletType() === 'TrustWallet' && web3Service.isConnected() ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-950/20' : 'border-slate-800 hover:border-slate-700'"
            >
              <div class="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 text-2xl mb-2 group-hover:scale-105 transition-transform">
                <i class="fa-solid fa-shield-halved"></i>
              </div>
              <div class="text-sm font-bold text-white">Trust Wallet</div>
              <div class="text-[11px] text-slate-500 font-mono mt-0.5">Mobile App</div>
            </button>

            <!-- MetaMask -->
            <button
              (click)="handleLoginWithWallet('MetaMask')"
              [disabled]="isCheckingLogin()"
              class="p-4 rounded-2xl bg-slate-950/80 border transition-all flex flex-col items-center text-center group cursor-pointer hover:bg-slate-900 disabled:opacity-50"
              [ngClass]="web3Service.walletType() === 'MetaMask' && web3Service.isConnected() ? 'border-orange-500 ring-2 ring-orange-500/40 bg-orange-950/20' : 'border-slate-800 hover:border-slate-700'"
            >
              <div class="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 text-2xl mb-2 group-hover:scale-105 transition-transform">
                <i class="fa-solid fa-shield-cat"></i>
              </div>
              <div class="text-sm font-bold text-white">MetaMask</div>
              <div class="text-[11px] text-slate-500 font-mono mt-0.5">Browser & App</div>
            </button>

            <!-- TokenPocket -->
            <button
              (click)="handleLoginWithWallet('TokenPocket')"
              [disabled]="isCheckingLogin()"
              class="p-4 rounded-2xl bg-slate-950/80 border transition-all flex flex-col items-center text-center group cursor-pointer hover:bg-slate-900 disabled:opacity-50"
              [ngClass]="web3Service.walletType() === 'TokenPocket' && web3Service.isConnected() ? 'border-cyan-400 ring-2 ring-cyan-400/40 bg-cyan-950/20' : 'border-slate-800 hover:border-slate-700'"
            >
              <div class="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-2xl mb-2 group-hover:scale-105 transition-transform">
                <i class="fa-solid fa-wallet"></i>
              </div>
              <div class="text-sm font-bold text-white">TokenPocket</div>
              <div class="text-[11px] text-slate-500 font-mono mt-0.5">DApp Wallet</div>
            </button>

            <!-- Bitget Wallet -->
            <button
              (click)="handleLoginWithWallet('Bitget')"
              [disabled]="isCheckingLogin()"
              class="p-4 rounded-2xl bg-slate-950/80 border transition-all flex flex-col items-center text-center group cursor-pointer hover:bg-slate-900 disabled:opacity-50"
              [ngClass]="web3Service.walletType() === 'Bitget' && web3Service.isConnected() ? 'border-emerald-400 ring-2 ring-emerald-400/40 bg-emerald-950/20' : 'border-slate-800 hover:border-slate-700'"
            >
              <div class="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl mb-2 group-hover:scale-105 transition-transform">
                <i class="fa-solid fa-cube"></i>
              </div>
              <div class="text-sm font-bold text-white">Bitget Wallet</div>
              <div class="text-[11px] text-slate-500 font-mono mt-0.5">Web3 App</div>
            </button>

            <!-- Binance Web3 Wallet -->
            <button
              (click)="handleLoginWithWallet('BinanceWeb3')"
              [disabled]="isCheckingLogin()"
              class="p-4 rounded-2xl bg-slate-950/80 border transition-all flex flex-col items-center text-center group cursor-pointer hover:bg-slate-900 col-span-2 sm:col-span-2 disabled:opacity-50"
              [ngClass]="web3Service.walletType() === 'BinanceWeb3' && web3Service.isConnected() ? 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-950/20' : 'border-slate-800 hover:border-slate-700'"
            >
              <div class="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl mb-2 group-hover:scale-105 transition-transform">
                <i class="fa-solid fa-coins"></i>
              </div>
              <div class="text-sm font-bold text-white">Binance Web3 Wallet</div>
              <div class="text-[11px] text-slate-500 font-mono mt-0.5">Binance App In-App Browser</div>
            </button>
          </div>

          <!-- Connected Wallet Status Pill -->
          <div *ngIf="web3Service.isConnected()" class="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5 font-mono text-xs">
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

          <!-- Checking Login Loader -->
          <div *ngIf="isCheckingLogin()" class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-center gap-3 font-mono">
            <i class="fa-solid fa-circle-notch fa-spin text-base"></i>
            <span>Checking registration status in MariaDB...</span>
          </div>

          <!-- Already Registered CTA -->
          <div *ngIf="dappState.user().isRegistered" class="space-y-3 pt-2">
            <div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <div class="font-bold flex items-center gap-2">
                <i class="fa-solid fa-circle-check"></i> Account Verified: {{ dappState.user().userId }}
              </div>
              <div class="text-slate-400 mt-1">Sponsor: {{ dappState.user().sponsorId }} &bull; Rank: {{ dappState.user().rank }}</div>
            </div>
            <button
              (click)="goToDashboard()"
              class="w-full py-4 px-6 rounded-2xl btn-gold-glow font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/25"
            >
              <i class="fa-solid fa-gauge-high"></i>
              <span>ENTER DASHBOARD</span>
              <i class="fa-solid fa-arrow-right text-xs"></i>
            </button>
          </div>

          <!-- Switch to Register Callout -->
          <div class="text-center pt-2">
            <p class="text-xs text-slate-400">
              New to Morgan Treasure?
              <button
                type="button"
                (click)="setMode('register')"
                class="text-amber-400 hover:text-amber-300 font-bold ml-1 underline cursor-pointer"
              >
                Register with Sponsor ID
              </button>
            </p>
          </div>

        </div>

        <!-- ======================= MODE 2: REGISTER ======================= -->
        <div *ngIf="mode() === 'register'" class="space-y-5 pt-6 relative z-10">
          
          <!-- Step 1: Wallet Connection Indicator -->
          <div class="space-y-2">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Step 1: Connect Wallet</span>
              <span *ngIf="web3Service.isConnected()" class="text-emerald-400 font-bold flex items-center gap-1">
                <i class="fa-solid fa-check"></i> Connected
              </span>
            </div>

            <!-- Wallet Buttons if not connected -->
            <div *ngIf="!web3Service.isConnected()" class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                (click)="connectWallet('TrustWallet')"
                class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-blue-500 transition-all flex items-center gap-2.5 cursor-pointer text-left"
              >
                <div class="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center text-sm shrink-0">
                  <i class="fa-solid fa-shield-halved"></i>
                </div>
                <div>
                  <div class="text-xs font-bold text-white leading-tight">Trust Wallet</div>
                  <div class="text-[10px] text-slate-500 font-mono">Mobile</div>
                </div>
              </button>

              <button
                (click)="connectWallet('MetaMask')"
                class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-orange-500 transition-all flex items-center gap-2.5 cursor-pointer text-left"
              >
                <div class="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center text-sm shrink-0">
                  <i class="fa-solid fa-shield-cat"></i>
                </div>
                <div>
                  <div class="text-xs font-bold text-white leading-tight">MetaMask</div>
                  <div class="text-[10px] text-slate-500 font-mono">Extension</div>
                </div>
              </button>

              <button
                (click)="connectWallet('TokenPocket')"
                class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-400 transition-all flex items-center gap-2.5 cursor-pointer text-left"
              >
                <div class="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-sm shrink-0">
                  <i class="fa-solid fa-wallet"></i>
                </div>
                <div>
                  <div class="text-xs font-bold text-white leading-tight">TokenPocket</div>
                  <div class="text-[10px] text-slate-500 font-mono">DApp App</div>
                </div>
              </button>

              <button
                (click)="connectWallet('Bitget')"
                class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-400 transition-all flex items-center gap-2.5 cursor-pointer text-left"
              >
                <div class="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-sm shrink-0">
                  <i class="fa-solid fa-cube"></i>
                </div>
                <div>
                  <div class="text-xs font-bold text-white leading-tight">Bitget Wallet</div>
                  <div class="text-[10px] text-slate-500 font-mono">Web3 App</div>
                </div>
              </button>

              <button
                (click)="connectWallet('BinanceWeb3')"
                class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-400 transition-all flex items-center gap-2.5 cursor-pointer text-left col-span-2 sm:col-span-2"
              >
                <div class="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm shrink-0">
                  <i class="fa-solid fa-coins"></i>
                </div>
                <div>
                  <div class="text-xs font-bold text-white leading-tight">Binance Web3 Wallet</div>
                  <div class="text-[10px] text-slate-500 font-mono">Binance App Browser</div>
                </div>
              </button>
            </div>

            <!-- Connected Pill -->
            <div *ngIf="web3Service.isConnected()" class="p-3 rounded-xl bg-slate-950/90 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
              <span class="text-slate-400 flex items-center gap-1.5 truncate">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span class="text-white font-bold truncate max-w-[240px]">{{ web3Service.currentAccount() }}</span>
              </span>
              <span class="text-amber-400 font-bold shrink-0 ml-2">\${{ web3Service.usdtBalance() | number:'1.2-2' }} USDT</span>
            </div>
          </div>

          <!-- Step 2: Sponsor ID Input & Live Verification -->
          <form (ngSubmit)="handleRegister()" class="space-y-4 pt-1">
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-300 font-mono">
                  STEP 2: SPONSOR REFERRAL ID <span class="text-red-400 font-black">*</span>
                </label>
                <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  Compulsory
                </span>
              </div>
              
              <div class="relative">
                <input
                  type="text"
                  [(ngModel)]="sponsorId"
                  (input)="onSponsorInputChange()"
                  (blur)="verifySponsorLive()"
                  name="sponsorId"
                  placeholder="Enter Sponsor ID (e.g. MT-10024)"
                  required
                  class="w-full p-3.5 pl-10 pr-24 rounded-xl bg-slate-950/90 border text-white font-mono text-sm transition-all focus:outline-none focus:ring-1"
                  [ngClass]="sponsorCheckStatus() === 'valid' ? 'border-emerald-500/80 focus:border-emerald-500 focus:ring-emerald-500' : (sponsorCheckStatus() === 'invalid' ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500' : 'border-slate-800 focus:border-amber-500 focus:ring-amber-500')"
                />
                <i class="fa-solid fa-user-check absolute left-3.5 top-4 text-slate-500 text-xs"></i>
                
                <!-- Quick Verify / Default Button -->
                <button
                  type="button"
                  (click)="verifySponsorLive()"
                  [disabled]="isVerifyingSponsor()"
                  class="absolute right-2 top-2 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-mono font-bold border border-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span *ngIf="!isVerifyingSponsor()">Verify</span>
                  <span *ngIf="isVerifyingSponsor()"><i class="fa-solid fa-spinner fa-spin"></i></span>
                </button>
              </div>

              <!-- Sponsor Verification Status Feedback -->
              <div *ngIf="sponsorCheckStatus() === 'valid'" class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <i class="fa-solid fa-circle-check"></i>
                  <span>Sponsor: <strong>{{ verifiedSponsorName() }}</strong></span>
                </span>
                <span class="text-emerald-300 font-bold">{{ verifiedSponsorId() }}</span>
              </div>

              <div *ngIf="sponsorCheckStatus() === 'invalid'" class="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-1.5">
                <i class="fa-solid fa-circle-xmark"></i>
                <span>{{ sponsorErrorMessage() || 'Sponsor ID not found in database. Sponsor ID is compulsory.' }}</span>
              </div>

              <p class="text-[11px] text-slate-500 font-mono">
                Must be an active investor in Morgan Treasure. If you don't have one, ask your inviter or team leader.
              </p>
            </div>

            <!-- Step 3: Optional Nickname / Telegram -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-300 font-mono">
                STEP 3: INVESTOR NICKNAME <span class="text-slate-500 font-normal">(OPTIONAL)</span>
              </label>
              <div class="relative">
                <input
                  type="text"
                  [(ngModel)]="nickname"
                  name="nickname"
                  placeholder="e.g. CryptoTrader99"
                  class="w-full p-3.5 pl-10 rounded-xl bg-slate-950/90 border border-slate-800 focus:border-amber-500 text-white text-sm transition-all focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <i class="fa-solid fa-id-badge absolute left-3.5 top-4 text-slate-500 text-xs"></i>
              </div>
            </div>

            <!-- Terms agreement -->
            <label class="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer pt-1">
              <input
                type="checkbox"
                [(ngModel)]="agreedToTerms"
                name="agreedToTerms"
                class="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span>
                I agree to the 300% maximum return limit and protocol rules on BNB Smart Chain.
              </span>
            </label>

            <!-- Complete Registration Button -->
            <button
              type="submit"
              [disabled]="isSubmitting() || !web3Service.isConnected() || sponsorCheckStatus() === 'invalid' || !sponsorId.trim() || !agreedToTerms"
              class="w-full py-4 px-6 rounded-2xl btn-gold-glow font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/25"
            >
              <span *ngIf="!isSubmitting()" class="flex items-center gap-2">
                <i class="fa-solid fa-user-plus"></i>
                <span>REGISTER & ENTER PROTOCOL</span>
                <i class="fa-solid fa-arrow-right text-xs"></i>
              </span>
              <span *ngIf="isSubmitting()" class="flex items-center gap-2">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Creating Account in MariaDB...</span>
              </span>
            </button>
          </form>

          <!-- Back to Login Link -->
          <div class="text-center pt-2">
            <p class="text-xs text-slate-400">
              Already have an account?
              <button
                type="button"
                (click)="setMode('login')"
                class="text-amber-400 hover:text-amber-300 font-bold ml-1 underline cursor-pointer"
              >
                Go to Login
              </button>
            </p>
          </div>

        </div>

      </div>

    </div>
  `,
  styles: []
})
export class ConnectRegisterComponent implements OnInit {
  public mode = signal<'login' | 'register'>('login');
  public sponsorId = '';
  public nickname = '';
  public agreedToTerms = true;
  public isSubmitting = signal<boolean>(false);
  public isCheckingLogin = signal<boolean>(false);
  public isVerifyingSponsor = signal<boolean>(false);
  public sponsorCheckStatus = signal<'idle' | 'valid' | 'invalid'>('idle');
  public verifiedSponsorName = signal<string>('');
  public verifiedSponsorId = signal<string>('');
  public sponsorErrorMessage = signal<string>('');
  public unregisteredWarning = signal<string>('');

  private debounceTimer: any = null;

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
    // Check if referral link or mode parameter was supplied
    this.route.queryParams.subscribe(params => {
      if (params['ref']) {
        this.sponsorId = params['ref'].trim().toUpperCase();
        this.mode.set('register');
        this.verifySponsorLive();
      }
      if (params['mode'] === 'register') {
        this.mode.set('register');
      } else if (params['mode'] === 'login') {
        this.mode.set('login');
      }
    });

    // If user is already registered in DB and enters here, redirect directly to dashboard
    if (this.web3Service.isConnected() && this.dappState.user().isRegistered) {
      this.router.navigate(['/dashboard']);
    }
  }

  setMode(m: 'login' | 'register'): void {
    this.soundService.playTap();
    this.mode.set(m);
    this.unregisteredWarning.set('');
  }

  async connectWallet(walletType: SupportedWallet): Promise<boolean> {
    const success = await this.web3Service.connectWallet(walletType);
    if (success) {
      this.soundService.playSuccess();
      return true;
    }
    return false;
  }

  // Handle Login: User selects wallet -> connect -> check MariaDB -> route or prompt register
  async handleLoginWithWallet(walletType: SupportedWallet): Promise<void> {
    this.unregisteredWarning.set('');
    const connected = await this.connectWallet(walletType);
    if (!connected) return;

    const address = this.web3Service.currentAccount();
    if (!address) return;

    this.isCheckingLogin.set(true);

    this.phpApi.getUserProfile(address).subscribe({
      next: (profile) => {
        this.isCheckingLogin.set(false);
        if (profile && profile.isRegistered) {
          this.dappState.syncWithBackend(address);
          this.soundService.playSuccess();
          this.notificationService.success(
            'Welcome Back!',
            `Logged in successfully as ${profile.userId || address.slice(0, 8)}`
          );
          this.router.navigate(['/dashboard']);
        } else {
          // NOT REGISTERED in MariaDB!
          this.soundService.playError();
          this.unregisteredWarning.set(
            `Wallet ${address.slice(0, 6)}...${address.slice(-4)} is not registered. Sponsor ID is compulsory to join Morgan Treasure.`
          );
          this.notificationService.warning(
            'Registration Compulsory',
            'Your wallet is not registered. Please enter a valid Sponsor ID to register.'
          );
          // Automatically switch to register tab
          this.mode.set('register');
        }
      },
      error: () => {
        this.isCheckingLogin.set(false);
        this.notificationService.error(
          'Login Error',
          'Failed to verify registration with MariaDB. Please try again.'
        );
      }
    });
  }

  // Real-time Sponsor ID Validation
  onSponsorInputChange(): void {
    this.sponsorCheckStatus.set('idle');
    this.sponsorErrorMessage.set('');

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (!this.sponsorId || !this.sponsorId.trim()) {
      return;
    }

    // Auto debounce 500ms
    this.debounceTimer = setTimeout(() => {
      this.verifySponsorLive();
    }, 500);
  }

  verifySponsorLive(): void {
    const clean = this.sponsorId.trim().toUpperCase();
    if (!clean) {
      this.sponsorCheckStatus.set('invalid');
      this.sponsorErrorMessage.set('Sponsor ID cannot be blank.');
      return;
    }

    this.isVerifyingSponsor.set(true);
    this.phpApi.verifySponsor(clean).subscribe({
      next: (res) => {
        this.isVerifyingSponsor.set(false);
        if (res && res.valid) {
          this.sponsorCheckStatus.set('valid');
          this.verifiedSponsorName.set(res.sponsor?.nickname || 'Verified Leader');
          this.verifiedSponsorId.set(res.sponsor?.userId || clean);
          this.sponsorErrorMessage.set('');
        } else {
          this.sponsorCheckStatus.set('invalid');
          this.sponsorErrorMessage.set(res?.message || 'Invalid Sponsor ID. No user found.');
        }
      },
      error: () => {
        this.isVerifyingSponsor.set(false);
        this.sponsorCheckStatus.set('invalid');
        this.sponsorErrorMessage.set('Failed to check sponsor. Please try again.');
      }
    });
  }

  async handleRegister(): Promise<void> {
    if (!this.web3Service.isConnected() || !this.web3Service.currentAccount()) {
      this.notificationService.error('Wallet Required', 'Please connect your Web3 wallet first.');
      return;
    }

    const cleanSponsor = this.sponsorId.trim().toUpperCase();
    if (!cleanSponsor) {
      this.notificationService.error('Sponsor Required', 'Sponsor ID is compulsory for registration.');
      return;
    }

    if (this.sponsorCheckStatus() === 'invalid') {
      this.notificationService.error('Invalid Sponsor', this.sponsorErrorMessage() || 'Please enter a valid Sponsor ID.');
      return;
    }

    if (!this.agreedToTerms) {
      this.notificationService.warning('Agreement Required', 'Please accept the protocol terms.');
      return;
    }

    this.isSubmitting.set(true);

    this.phpApi.register({
      wallet_address: this.web3Service.currentAccount(),
      sponsor_id: cleanSponsor,
      nickname: this.nickname.trim()
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res && res.status === 'success') {
          // Successful registration in MariaDB
          this.dappState.registerUser(res.data || { sponsorId: cleanSponsor }, this.nickname.trim());
          this.dappState.syncWithBackend();
          this.soundService.playSuccess();
          this.notificationService.success(
            'Registration Confirmed!',
            `Welcome to Morgan Treasure! Account linked to sponsor ${cleanSponsor}.`
          );
          this.router.navigate(['/dashboard']);
        } else {
          this.soundService.playError();
          this.notificationService.error(
            'Registration Failed',
            res?.message || 'Registration rejected by protocol.'
          );
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.soundService.playError();
        const msg = err?.error?.message || err?.message || 'Registration failed. Please verify Sponsor ID.';
        this.notificationService.error('Registration Error', msg);
      }
    });
  }

  goToDashboard(): void {
    this.soundService.playTap();
    this.router.navigate(['/dashboard']);
  }

  copyAddress(): void {
    if (this.web3Service.currentAccount()) {
      navigator.clipboard.writeText(this.web3Service.currentAccount());
      this.notificationService.info('Copied', 'Wallet address copied.');
    }
  }
}
