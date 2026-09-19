import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DappStateService } from '../../services/dapp-state.service';
import { Web3Service } from '../../services/web3.service';
import { SoundService } from '../../services/sound.service';
import { NotificationService } from '../../services/notification.service';
import { NetworkType } from '../../models/dapp.models';
import { MorganTreasureLogoComponent } from '../logo/morgan-treasure-logo.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MorganTreasureLogoComponent],
  template: `
    <header class="w-full sticky top-0 z-40 bg-[#070b16]/95 backdrop-blur-xl border-b border-slate-800/90 shadow-lg shadow-black/40">
      <div class="max-w-6xl mx-auto px-3 sm:px-6">
        
        <!-- ============================================== -->
        <!-- ROW 1: BRAND LOGO + NAV TABS + GLOBAL CONTROLS -->
        <!-- ============================================== -->
        <div class="py-2.5 sm:py-3 flex items-center justify-between gap-3 border-b md:border-b-0 border-slate-800/70">
          
          <!-- Left: Brand Logo with Full Wordmark (MORGAN TREASURE) -->
          <a routerLink="/dashboard" class="flex items-center gap-2 group shrink-0 cursor-pointer">
            <app-morgan-treasure-logo size="sm" [showTagline]="false"></app-morgan-treasure-logo>
          </a>

          <!-- Center: Desktop Navigation Tabs (Hidden on Mobile) -->
          <nav class="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800/80 font-sans text-xs">
            <a
              routerLink="/dashboard"
              routerLinkActive="bg-amber-500/15 text-amber-300 font-bold border-amber-500/30"
              class="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white font-medium transition-all border border-transparent flex items-center gap-1.5 cursor-pointer"
            >
              <i class="fa-solid fa-house text-[11px]"></i>
              <span>Home</span>
            </a>

            <a
              routerLink="/deposit"
              routerLinkActive="bg-amber-500/15 text-amber-300 font-bold border-amber-500/30"
              class="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white font-medium transition-all border border-transparent flex items-center gap-1.5 cursor-pointer"
            >
              <i class="fa-solid fa-vault text-[11px]"></i>
              <span>Stake</span>
            </a>

            <a
              routerLink="/income"
              routerLinkActive="bg-amber-500/15 text-amber-300 font-bold border-amber-500/30"
              class="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white font-medium transition-all border border-transparent flex items-center gap-1.5 cursor-pointer"
            >
              <i class="fa-solid fa-sitemap text-[11px]"></i>
              <span>15 Levels</span>
            </a>

            <a
              routerLink="/team"
              routerLinkActive="bg-amber-500/15 text-amber-300 font-bold border-amber-500/30"
              class="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white font-medium transition-all border border-transparent flex items-center gap-1.5 cursor-pointer"
            >
              <i class="fa-solid fa-users text-[11px]"></i>
              <span>Team</span>
            </a>

            <a
              routerLink="/withdraw"
              routerLinkActive="bg-amber-500/15 text-amber-300 font-bold border-amber-500/30"
              class="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white font-medium transition-all border border-transparent flex items-center gap-1.5 cursor-pointer"
            >
              <i class="fa-solid fa-wallet text-[11px]"></i>
              <span>Withdraw</span>
            </a>
          </nav>

          <!-- Right: Network Indicator + Currency + Language + Desktop Web3 Controls -->
          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            <!-- BSC Network Indicator -->
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono font-bold text-amber-300">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>BSC 56</span>
            </div>

            <!-- Currency Switcher ($ USD / ₹ INR) -->
            <button
              (click)="dappState.toggleCurrency()"
              class="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-amber-400 font-mono transition-colors cursor-pointer"
              title="Toggle Currency"
            >
              {{ dappState.currency() === 'USDT' ? '$ USD' : '₹ INR' }}
            </button>

            <!-- Language Switcher -->
            <button
              (click)="dappState.toggleLanguage()"
              class="px-2 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-cyan-400 font-mono transition-colors cursor-pointer"
              title="Change Language"
            >
              {{ dappState.language() === 'en' ? 'EN' : 'HI' }}
            </button>

            <!-- Desktop Web3 Wallet Button (Hidden on mobile, mobile has Row 2) -->
            <div class="hidden md:flex items-center gap-2">
              <button
                *ngIf="!web3Service.isConnected()"
                (click)="openConnectModal()"
                class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 transition-all"
              >
                <i class="fa-solid fa-wallet text-xs"></i>
                <span>Connect</span>
              </button>

              <div *ngIf="web3Service.isConnected()" class="flex items-center gap-2">
                <button
                  (click)="toggleWalletModal()"
                  class="px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Click to view wallet details"
                >
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{{ web3Service.formatAddress(web3Service.currentAccount()) }}</span>
                  <i class="fa-solid fa-chevron-down text-[9px] text-slate-400 ml-0.5"></i>
                </button>

                <button
                  (click)="disconnectWallet()"
                  class="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  title="Disconnect Wallet"
                >
                  <i class="fa-solid fa-power-off text-rose-400 text-xs"></i>
                  <span class="text-[11px]">Disconnect</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- ============================================== -->
        <!-- ROW 2: DEDICATED WEB3 WALLET & DISCONNECT BAR   -->
        <!-- (Visible on Mobile & Small Screens)           -->
        <!-- ============================================== -->
        <div class="md:hidden py-2 flex items-center justify-between gap-2">
          
          <!-- STATE A: WALLET CONNECTED -->
          <ng-container *ngIf="web3Service.isConnected()">
            <!-- Connected Address Pill -->
            <button
              (click)="toggleWalletModal()"
              class="flex-1 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-emerald-500/40 hover:border-emerald-300 text-emerald-300 font-mono text-xs font-bold transition-all shadow-sm cursor-pointer min-w-0"
              title="Click to view wallet details"
            >
              <div class="flex items-center gap-2 truncate">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <span class="text-white font-bold truncate">{{ web3Service.formatAddress(web3Service.currentAccount()) }}</span>
              </div>
              <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono shrink-0">
                {{ web3Service.walletType() }}
              </span>
            </button>

            <!-- Action Controls: Copy & Disconnect -->
            <div class="flex items-center gap-1.5 shrink-0">
              <!-- Quick Copy Button -->
              <button
                (click)="copyAddress()"
                class="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="Copy Address"
              >
                <i class="fa-regular fa-copy text-xs"></i>
                <span class="text-[11px]">Copy</span>
              </button>

              <!-- Dedicated Disconnect Button (Prominent Red / Rose) -->
              <button
                (click)="disconnectWallet()"
                class="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                title="Disconnect Wallet"
              >
                <i class="fa-solid fa-power-off text-rose-400 text-xs"></i>
                <span class="text-[11px]">Disconnect</span>
              </button>
            </div>
          </ng-container>

          <!-- STATE B: WALLET DISCONNECTED -->
          <ng-container *ngIf="!web3Service.isConnected()">
            <button
              (click)="openConnectModal()"
              class="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs font-mono flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 cursor-pointer transition-all"
            >
              <i class="fa-solid fa-wallet text-xs"></i>
              <span>CONNECT WEB3 WALLET</span>
            </button>

            <button
              (click)="selectWallet('Demo')"
              class="py-2 px-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
              title="Test with Demo Mode"
            >
              <i class="fa-solid fa-wand-magic-sparkles text-xs text-emerald-400"></i>
              <span>Demo</span>
            </button>
          </ng-container>

        </div>

      </div>
    </header>

    <!-- ============================================== -->
    <!-- WALLET DETAILS & DISCONNECT MODAL              -->
    <!-- ============================================== -->
    <div
      *ngIf="showWalletModal()"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      (click)="showWalletModal.set(false)"
    >
      <div
        class="w-full max-w-sm glass-panel p-6 rounded-3xl border-slate-700 shadow-2xl space-y-5"
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 class="text-sm font-bold text-white font-mono">CONNECTED WALLET</h3>
          </div>
          <button
            (click)="showWalletModal.set(false)"
            class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Wallet Provider & Network -->
        <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-base">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <div class="text-xs font-bold text-white">{{ web3Service.walletType() }}</div>
              <div class="text-[10px] text-emerald-400 font-mono">BNB Smart Chain (56)</div>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold">
            Active
          </span>
        </div>

        <!-- Full Address Box with Copy -->
        <div class="space-y-1.5">
          <div class="text-[11px] font-mono text-slate-400 font-bold uppercase">WALLET ADDRESS</div>
          <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 font-mono text-xs">
            <span class="text-white truncate">{{ web3Service.currentAccount() }}</span>
            <button
              (click)="copyAddress()"
              class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-bold transition-colors cursor-pointer shrink-0"
            >
              <i class="fa-regular fa-copy mr-1"></i>Copy
            </button>
          </div>
        </div>

        <!-- Balance Display -->
        <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <span class="text-slate-400">USDT Balance:</span>
          <span class="text-amber-300 font-black tabular-nums text-sm">\${{ web3Service.usdtBalance() | number:'1.2-2' }}</span>
        </div>

        <!-- Modal Actions: BscScan & Disconnect -->
        <div class="space-y-2 pt-2">
          <a
            [href]="'https://bscscan.com/address/' + web3Service.currentAccount()"
            target="_blank"
            class="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View on BscScan</span>
            <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
          </a>

          <button
            (click)="disconnectWallet()"
            class="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/25"
          >
            <i class="fa-solid fa-power-off"></i>
            <span>DISCONNECT WALLET</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- QUICK CONNECT WALLET MODAL                     -->
    <!-- ============================================== -->
    <div
      *ngIf="showConnectModal()"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      (click)="showConnectModal.set(false)"
    >
      <div
        class="w-full max-w-sm glass-panel p-6 rounded-3xl border-slate-700 shadow-2xl space-y-4"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-wallet text-amber-400"></i>
            <h3 class="text-sm font-bold text-white font-mono">CONNECT WEB3 WALLET</h3>
          </div>
          <button
            (click)="showConnectModal.set(false)"
            class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <p class="text-xs text-slate-300">
          Select your BEP-20 wallet on Binance Smart Chain:
        </p>

        <div class="space-y-2.5">
          <!-- Trust Wallet -->
          <button
            (click)="selectWallet('TrustWallet')"
            class="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-900 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 text-lg group-hover:scale-105 transition-transform">
                <i class="fa-solid fa-shield-halved"></i>
              </div>
              <div class="text-left">
                <div class="text-xs font-bold text-white">Trust Wallet</div>
                <div class="text-[10px] text-slate-400 font-mono">Mobile In-App Browser</div>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-slate-600 text-xs group-hover:text-amber-400 transition-colors"></i>
          </button>

          <!-- MetaMask -->
          <button
            (click)="selectWallet('MetaMask')"
            class="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-orange-500/60 hover:bg-slate-900 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 text-lg group-hover:scale-105 transition-transform">
                <i class="fa-solid fa-shield-cat"></i>
              </div>
              <div class="text-left">
                <div class="text-xs font-bold text-white">MetaMask</div>
                <div class="text-[10px] text-slate-400 font-mono">Browser Extension & App</div>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-slate-600 text-xs group-hover:text-amber-400 transition-colors"></i>
          </button>

          <!-- Binance Web3 -->
          <button
            (click)="selectWallet('BinanceWeb3')"
            class="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-900 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg group-hover:scale-105 transition-transform">
                <i class="fa-solid fa-coins"></i>
              </div>
              <div class="text-left">
                <div class="text-xs font-bold text-white">Binance Web3 Wallet</div>
                <div class="text-[10px] text-slate-400 font-mono">Binance Official App</div>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-slate-600 text-xs group-hover:text-amber-400 transition-colors"></i>
          </button>

          <!-- Instant Demo Mode -->
          <button
            (click)="selectWallet('Demo')"
            class="w-full p-3.5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/40 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-lg group-hover:scale-105 transition-transform">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
              </div>
              <div class="text-left">
                <div class="text-xs font-bold text-emerald-300">Instant Demo Session</div>
                <div class="text-[10px] text-slate-400 font-mono">Test with 2,500 USDT</div>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-slate-600 text-xs group-hover:text-emerald-400 transition-colors"></i>
          </button>
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
export class HeaderComponent {
  public showWalletModal = signal<boolean>(false);
  public showConnectModal = signal<boolean>(false);

  constructor(
    public dappState: DappStateService,
    public web3Service: Web3Service,
    public soundService: SoundService,
    private notificationService: NotificationService
  ) {}

  openConnectModal(): void {
    this.soundService.playTap();
    this.showConnectModal.set(true);
  }

  toggleWalletModal(): void {
    this.soundService.playTap();
    this.showWalletModal.update(curr => !curr);
  }

  async selectWallet(type: 'MetaMask' | 'TrustWallet' | 'BinanceWeb3' | 'Demo'): Promise<void> {
    await this.web3Service.connectWallet(type);
    this.showConnectModal.set(false);
  }

  disconnectWallet(): void {
    this.web3Service.disconnect();
    this.showWalletModal.set(false);
  }

  copyAddress(): void {
    navigator.clipboard.writeText(this.web3Service.currentAccount());
    this.soundService.playTap();
    this.notificationService.info('Copied', 'Wallet address copied to clipboard.');
  }
}

