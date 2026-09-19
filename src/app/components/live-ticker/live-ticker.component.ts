import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DappStateService } from '../../services/dapp-state.service';

@Component({
  selector: 'app-live-ticker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ticker-wrapper">
      <div class="ticker-badge">
        <span class="pulse-dot"></span>
        <span class="text-xs font-bold text-amber-300">LIVE</span>
      </div>
      <div class="ticker-viewport">
        <div class="ticker-track">
          @for (item of dappState.liveActivities(); track item.id) {
            <div class="ticker-item">
              <i class="fa-solid" [ngClass]="item.icon"></i>
              <span class="font-mono text-cyan-300">{{ item.userSnippet }}</span>
              <span class="text-slate-400">({{ item.city }}):</span>
              <span class="text-slate-200 font-medium">{{ item.text }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ticker-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 1152px;
      margin: 8px auto 0;
      padding: 6px 12px;
      background: rgba(11, 17, 32, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      overflow: hidden;
    }

    .ticker-badge {
      display: flex;
      align-items: center;
      gap: 5px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.35);
      padding: 2px 7px;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .ticker-viewport {
      flex: 1;
      overflow: hidden;
      white-space: nowrap;
      position: relative;
    }

    .ticker-track {
      display: inline-flex;
      gap: 24px;
      animation: marquee 25s linear infinite;
    }

    .ticker-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
    }

    .ticker-item i {
      color: #fbbf24;
      font-size: 0.75rem;
    }

    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  `]
})
export class LiveTickerComponent {
  constructor(public dappState: DappStateService) {}
}
