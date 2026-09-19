import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SoundService } from '../../services/sound.service';
import { DappStateService } from '../../services/dapp-state.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-dock-nav">
      <!-- Container with explicit overflow: visible to ensure center button is never cut off -->
      <div class="dock-container">
        
        <!-- Dashboard / Home -->
        <a routerLink="/dashboard" routerLinkActive="active" (click)="soundService.playTap()" class="nav-item">
          <div class="nav-icon-wrapper">
            <i class="fa-solid fa-house"></i>
          </div>
          <span class="nav-label">{{ dappState.language() === 'en' ? 'Home' : 'होम' }}</span>
        </a>

        <!-- Level Income Matrix -->
        <a routerLink="/income" routerLinkActive="active" (click)="soundService.playTap()" class="nav-item">
          <div class="nav-icon-wrapper">
            <i class="fa-solid fa-sitemap"></i>
          </div>
          <span class="nav-label">{{ dappState.language() === 'en' ? 'Levels' : 'लेवल' }}</span>
        </a>

        <!-- Floating Center Deposit USDT Action Button (Fully visible 360° circle) -->
        <a routerLink="/deposit" routerLinkActive="active-deposit" (click)="soundService.playTap()" class="nav-item-center" title="Deposit USDT / Buy MTG">
          <div class="center-btn-glow">
            <i class="fa-solid fa-vault"></i>
          </div>
          <span class="nav-label-center">{{ dappState.language() === 'en' ? 'Deposit' : 'जमा' }}</span>
        </a>

        <!-- Team & Genealogy -->
        <a routerLink="/team" routerLinkActive="active" (click)="soundService.playTap()" class="nav-item">
          <div class="nav-icon-wrapper">
            <i class="fa-solid fa-users"></i>
            <span class="nav-badge">{{ dappState.user().totalTeamCount }}</span>
          </div>
          <span class="nav-label">{{ dappState.language() === 'en' ? 'Team' : 'टीम' }}</span>
        </a>

        <!-- Withdraw & Payouts -->
        <a routerLink="/withdraw" routerLinkActive="active" (click)="soundService.playTap()" class="nav-item">
          <div class="nav-icon-wrapper">
            <i class="fa-solid fa-wallet"></i>
          </div>
          <span class="nav-label">{{ dappState.language() === 'en' ? 'Withdraw' : 'निकासी' }}</span>
        </a>

      </div>
    </nav>
  `,
  styles: [`
    .bottom-dock-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      z-index: 999;
      padding: 0 10px calc(env(safe-area-inset-bottom, 0px) + 12px);
      pointer-events: none;
      display: flex;
      justify-content: center;
      overflow: visible !important;
    }

    .dock-container {
      pointer-events: auto;
      width: 100%;
      max-width: 460px;
      height: 68px;
      background: rgba(10, 15, 26, 0.97);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: 26px;
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 0 6px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.9), 0 0 25px rgba(245, 158, 11, 0.15);
      overflow: visible !important;
      position: relative;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: #64748b;
      flex: 1;
      padding: 6px 0;
      transition: all 0.2s ease;
      position: relative;
    }

    .nav-icon-wrapper {
      position: relative;
      font-size: 1.15rem;
      margin-bottom: 3px;
      transition: transform 0.2s ease, color 0.2s ease;
    }

    .nav-label {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.2px;
      transition: color 0.2s ease;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .nav-badge {
      position: absolute;
      top: -4px;
      right: -8px;
      background: #f59e0b;
      color: #050811;
      font-size: 0.55rem;
      font-weight: 800;
      padding: 1px 4px;
      border-radius: 10px;
    }

    .nav-item.active {
      color: #fbbf24;
    }

    .nav-item.active .nav-icon-wrapper {
      transform: translateY(-2px);
      color: #fbbf24;
      text-shadow: 0 0 12px rgba(245, 158, 11, 0.6);
    }

    .nav-item.active .nav-label {
      color: #fbbf24;
      font-weight: 800;
    }

    /* Floating Center Button (Pop-out 360° circle with zero clipping) */
    .nav-item-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      flex: 1;
      position: relative;
      top: -22px;
      z-index: 30;
      overflow: visible !important;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

      &:hover {
        transform: translateY(-3px);
      }
    }

    .center-btn-glow {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FFF4CC 0%, #F59E0B 40%, #D97706 80%, #B45309 100%);
      box-shadow: 0 8px 25px rgba(245, 158, 11, 0.65), 0 0 15px rgba(245, 158, 11, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3.5px solid #080D1A;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      z-index: 35;
      overflow: visible !important;

      i {
        color: #080D1A !important;
        font-size: 1.35rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .nav-item-center:active .center-btn-glow {
      transform: scale(0.92);
    }

    .nav-label-center {
      font-size: 0.72rem;
      font-weight: 800;
      color: #fbbf24;
      margin-top: 4px;
      letter-spacing: 0.02em;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .nav-item-center.active-deposit .center-btn-glow {
      box-shadow: 0 0 30px rgba(245, 158, 11, 0.9), 0 0 15px rgba(251, 191, 36, 0.8);
      border-color: #FCD34D;
    }
  `]
})
export class BottomNavComponent {
  constructor(
    public soundService: SoundService,
    public dappState: DappStateService
  ) {}
}
