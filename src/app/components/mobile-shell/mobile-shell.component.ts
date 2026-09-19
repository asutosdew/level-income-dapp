import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { LiveTickerComponent } from '../live-ticker/live-ticker.component';
import { ToastComponent } from '../toast/toast.component';
import { Web3Service } from '../../services/web3.service';
import { DappStateService } from '../../services/dapp-state.service';

@Component({
  selector: 'app-mobile-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    HeaderComponent,
    BottomNavComponent,
    LiveTickerComponent,
    ToastComponent
  ],
  template: `
    <!-- Web3 DApp Master Shell (Fluid Responsive for Desktop & Mobile In-App Wallet Browsers) -->
    <div class="min-h-screen w-full flex flex-col bg-[#05070f] relative selection:bg-amber-500 selection:text-black">
      
      <!-- Top Sticky Web3 Header -->
      <app-header></app-header>

      <!-- Live Blockchain Activity Ticker -->
      <app-live-ticker></app-live-ticker>

      <!-- Main Content Container with Generous Margins & Breathing Room -->
      <main class="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 pb-32 md:pb-16 space-y-8 sm:space-y-10">
        <router-outlet></router-outlet>

        <!-- On-Chain Security & Protocol Audit Footer Strip -->
        <footer class="mt-14 pt-8 border-t border-slate-800/80 space-y-4">
          <div class="glass-panel p-5 sm:p-7 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-5">
            
            <!-- Protocol Badges -->
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <span class="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm">
                <i class="fa-solid fa-shield-halved text-[11px]"></i> CertiK Audited
              </span>
              <span class="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm">
                <i class="fa-solid fa-cube text-[11px]"></i> BNB Smart Chain (56)
              </span>
              <span class="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm">
                <i class="fa-solid fa-lock text-[11px]"></i> Non-Custodial
              </span>
            </div>

            <!-- Staking Contract Address Pill -->
            <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono max-w-md w-full md:w-auto justify-between">
              <span class="text-slate-400 text-[11px]">Vault:</span>
              <span class="text-amber-300 font-bold truncate mx-2">{{ web3Service.morganTreasureVault }}</span>
              <a [href]="web3Service.getExplorerUrl(web3Service.morganTreasureVault)" target="_blank" class="text-cyan-400 hover:text-cyan-300 transition-colors shrink-0" title="View on BscScan">
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
              </a>
            </div>

          </div>

          <!-- Copyright & Rules Bar -->
          <div class="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-2 text-center sm:text-left px-1">
            <div class="flex items-center gap-2 text-slate-400">
              <span class="text-amber-400 font-bold">0.5% – 1.0% Daily ROI</span>
              <span>•</span>
              <span>300% Capping</span>
              <span>•</span>
              <span>15 Level Matrix</span>
            </div>
            <div>
              © 2026 Morgan Treasure Protocol. All rights reserved.
            </div>
          </div>
        </footer>
      </main>

      <!-- Bottom Dock Bar (Mobile Web3 In-App Wallet Experience, hidden on desktop) -->
      <div class="block md:hidden">
        <app-bottom-nav></app-bottom-nav>
      </div>

      <!-- Global Toast Notifications Overlay -->
      <app-toast></app-toast>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
    }
  `]
})
export class MobileShellComponent {
  constructor(
    public web3Service: Web3Service,
    public dappState: DappStateService
  ) {}
}
